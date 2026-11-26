const crypto = require("crypto");
const db = require("../config/db");

// Grille des frais de livraison (identique à commandesController)
const FRAIS_LIVRAISON = {
    Lent: 0,
    Rapide: 4.99,
    "24h chrono": 9.99,
    standard: 0
};

// Consulter toutes les listes cadeaux de l'utilisateur connecté (avec leurs ouvrages)
exports.getMesListes = async (req, res) => {
    try {
        const [listes] = await db.query(
            `SELECT id, nom, proprietaire_id, code_partage, date_creation
             FROM listes_cadeaux
             WHERE proprietaire_id = ?
             ORDER BY date_creation DESC, id DESC`,
            [req.utilisateur.id]
        );

        if (listes.length === 0) {
            return res.json([]);
        }

        const listeIds = listes.map((l) => l.id);
        const [articles] = await db.query(
            `SELECT li.id, li.liste_id, li.ouvrage_id, li.quantite_souhaitee,
                    o.titre, o.auteur, o.prix, o.stock, o.categorie_id,
                    c.nom AS categorie_nom
             FROM liste_items li
             JOIN ouvrages o ON o.id = li.ouvrage_id
             LEFT JOIN categories c ON c.id = o.categorie_id
             WHERE li.liste_id IN (?)
             ORDER BY li.id DESC`,
            [listeIds]
        );

        const resultat = listes.map((liste) => ({
            ...liste,
            articles: articles.filter((art) => art.liste_id === liste.id)
        }));

        res.json(resultat);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération de vos listes cadeaux"
        });
    }
};

// Créer une liste cadeau (génère un code de partage aléatoire sécurisé)
exports.creerListe = async (req, res) => {
    try {
        const { nom } = req.body;

        if (!nom || !nom.trim()) {
            return res.status(400).json({
                message: "Le nom de la liste est obligatoire"
            });
        }

        const code = crypto.randomBytes(8).toString("hex");

        const [resultat] = await db.query(
            `INSERT INTO listes_cadeaux
             (nom, proprietaire_id, code_partage)
             VALUES (?, ?, ?)`,
            [nom.trim(), req.utilisateur.id, code]
        );

        res.status(201).json({
            message: "Liste cadeau créée avec succès",
            id: resultat.insertId,
            nom: nom.trim(),
            code_partage: code
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la création de la liste"
        });
    }
};

// Modifier le nom d'une liste cadeau (réservé au propriétaire uniquement)
exports.modifierListe = async (req, res) => {
    try {
        const listeId = Number(req.params.id);
        const { nom } = req.body;

        if (!Number.isInteger(listeId) || listeId <= 0) {
            return res.status(400).json({ message: "Identifiant de liste invalide" });
        }

        if (!nom || !nom.trim()) {
            return res.status(400).json({
                message: "Le nouveau nom de la liste est obligatoire"
            });
        }

        const [resultat] = await db.query(
            `UPDATE listes_cadeaux
             SET nom = ?
             WHERE id = ? AND proprietaire_id = ?`,
            [nom.trim(), listeId, req.utilisateur.id]
        );

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Liste introuvable ou modification non autorisée"
            });
        }

        res.json({
            message: "Liste cadeau modifiée avec succès",
            nom: nom.trim()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la modification de la liste"
        });
    }
};

// Supprimer une liste cadeau (réservé au propriétaire uniquement)
exports.supprimerListe = async (req, res) => {
    try {
        const listeId = Number(req.params.id);

        if (!Number.isInteger(listeId) || listeId <= 0) {
            return res.status(400).json({ message: "Identifiant de liste invalide" });
        }

        const [resultat] = await db.query(
            `DELETE FROM listes_cadeaux
             WHERE id = ? AND proprietaire_id = ?`,
            [listeId, req.utilisateur.id]
        );

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Liste introuvable ou suppression non autorisée"
            });
        }

        res.json({
            message: "Liste cadeau supprimée avec succès"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la suppression de la liste"
        });
    }
};

// Consulter une liste par son code de partage (parcours Ami — aucune donnée privée exposée)
exports.getListeParCode = async (req, res) => {
    try {
        const code = String(req.params.code || "").trim();

        if (!code) {
            return res.status(400).json({
                message: "Le code de partage est obligatoire"
            });
        }

        const [listes] = await db.query(
            `SELECT lc.id, lc.nom, lc.code_partage, lc.date_creation,
                    u.nom AS proprietaire_nom
             FROM listes_cadeaux lc
             JOIN users u ON u.id = lc.proprietaire_id
             WHERE lc.code_partage = ?`,
            [code]
        );

        if (listes.length === 0) {
            return res.status(404).json({
                message: "Liste cadeau introuvable. Vérifiez le code de partage."
            });
        }

        const [articles] = await db.query(
            `SELECT li.id, li.liste_id, li.ouvrage_id,
                    li.quantite_souhaitee, o.titre, o.auteur, o.prix,
                    o.stock, o.categorie_id, c.nom AS categorie_nom
             FROM liste_items li
             JOIN ouvrages o ON o.id = li.ouvrage_id
             LEFT JOIN categories c ON c.id = o.categorie_id
             WHERE li.liste_id = ?
             ORDER BY li.id DESC`,
            [listes[0].id]
        );

        res.json({
            liste: listes[0],
            articles
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération de la liste"
        });
    }
};

// Ajouter un ouvrage à une liste cadeau (réservé au propriétaire uniquement)
exports.ajouterArticle = async (req, res) => {
    try {
        const listeId = Number(req.params.id);
        const { ouvrage_id, quantite_souhaitee = 1 } = req.body;
        const quantite = Number(quantite_souhaitee);

        if (!ouvrage_id || !Number.isInteger(quantite) || quantite < 1) {
            return res.status(400).json({
                message: "Un ouvrage et une quantité positive sont obligatoires"
            });
        }

        const [listes] = await db.query(
            `SELECT id FROM listes_cadeaux
             WHERE id = ? AND proprietaire_id = ?`,
            [listeId, req.utilisateur.id]
        );

        if (listes.length === 0) {
            return res.status(404).json({
                message: "Liste introuvable ou vous n'en êtes pas propriétaire"
            });
        }

        const [ouvrages] = await db.query(
            "SELECT id FROM ouvrages WHERE id = ?",
            [ouvrage_id]
        );

        if (ouvrages.length === 0) {
            return res.status(404).json({
                message: "Ouvrage introuvable"
            });
        }

        await db.query(
            `INSERT INTO liste_items
             (liste_id, ouvrage_id, quantite_souhaitee)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             quantite_souhaitee = VALUES(quantite_souhaitee)`,
            [listeId, ouvrage_id, quantite]
        );

        res.status(201).json({
            message: "Ouvrage ajouté à la liste cadeau"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de l'ajout de l'ouvrage"
        });
    }
};

// Retirer un ouvrage d'une liste cadeau (réservé au propriétaire uniquement)
exports.supprimerArticle = async (req, res) => {
    try {
        const listeId = Number(req.params.id);
        const ouvrageId = Number(req.params.ouvrage_id);

        if (
            !Number.isInteger(listeId) ||
            listeId <= 0 ||
            !Number.isInteger(ouvrageId) ||
            ouvrageId <= 0
        ) {
            return res.status(400).json({
                message: "Identifiants invalides"
            });
        }

        const [listes] = await db.query(
            `SELECT id FROM listes_cadeaux
             WHERE id = ? AND proprietaire_id = ?`,
            [listeId, req.utilisateur.id]
        );

        if (listes.length === 0) {
            return res.status(404).json({
                message: "Liste introuvable ou modification non autorisée"
            });
        }

        const [resultat] = await db.query(
            "DELETE FROM liste_items WHERE liste_id = ? AND ouvrage_id = ?",
            [listeId, ouvrageId]
        );

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Cet ouvrage ne figure pas dans cette liste"
            });
        }

        res.json({
            message: "Ouvrage retiré de la liste cadeau"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors du retrait de l'ouvrage"
        });
    }
};

// Offrir / acheter un ouvrage d'une liste cadeau (parcours Ami — transaction MySQL + paiement simulé test)
exports.acheterArticle = async (req, res) => {
    const connexion = await db.getConnection();

    try {
        const {
            ouvrage_id,
            quantite,
            adresse_livraison = "Livraison cadeau (à préciser)",
            mode_livraison = "Lent",
            mode_paiement = "Carte bancaire (Visa / Mastercard)"
        } = req.body;
        const qte = Number(quantite);

        if (!ouvrage_id || !Number.isInteger(qte) || qte < 1) {
            return res.status(400).json({
                message: "Un ouvrage et une quantité positive sont obligatoires"
            });
        }

        const fraisLivraison = Object.prototype.hasOwnProperty.call(
            FRAIS_LIVRAISON,
            mode_livraison
        )
            ? FRAIS_LIVRAISON[mode_livraison]
            : 0;

        await connexion.beginTransaction();

        const [listes] = await connexion.query(
            "SELECT id, nom FROM listes_cadeaux WHERE id = ?",
            [req.params.id]
        );

        if (listes.length === 0) {
            await connexion.rollback();
            return res.status(404).json({
                message: "Liste cadeau introuvable"
            });
        }

        const [articles] = await connexion.query(
            `SELECT o.id, o.titre, o.prix, o.stock, li.id AS liste_item_id, li.quantite_souhaitee
             FROM liste_items li
             JOIN ouvrages o ON o.id = li.ouvrage_id
             WHERE li.liste_id = ? AND li.ouvrage_id = ?
             FOR UPDATE`,
            [req.params.id, ouvrage_id]
        );

        if (articles.length === 0) {
            await connexion.rollback();
            return res.status(404).json({
                message: "Cet ouvrage ne figure pas dans la liste"
            });
        }

        if (qte > articles[0].stock) {
            await connexion.rollback();
            return res.status(400).json({
                message: `Stock insuffisant (${articles[0].stock} exemplaire(s) disponible(s))`
            });
        }

        const prix = Number(articles[0].prix);
        const total = Number((prix * qte + fraisLivraison).toFixed(2));
        const referencePaiement = `TEST-GIFT-${crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase()}`;

        const [commande] = await connexion.query(
            `INSERT INTO commandes
             (client_id, total, statut, adresse_livraison,
              mode_livraison, mode_paiement, payment_provider_id)
             VALUES (?, ?, 'payee', ?, ?, ?, ?)`,
            [
                req.utilisateur.id,
                total.toFixed(2),
                String(adresse_livraison).trim() || "Livraison cadeau",
                mode_livraison,
                mode_paiement,
                referencePaiement
            ]
        );

        await connexion.query(
            `INSERT INTO commande_items
             (commande_id, ouvrage_id, quantite, prix_unitaire)
             VALUES (?, ?, ?, ?)`,
            [commande.insertId, ouvrage_id, qte, prix]
        );

        const [majStock] = await connexion.query(
            "UPDATE ouvrages SET stock = stock - ? WHERE id = ? AND stock >= ?",
            [qte, ouvrage_id, qte]
        );

        if (majStock.affectedRows === 0) {
            await connexion.rollback();
            return res.status(400).json({
                message: "Stock insuffisant au moment de la validation"
            });
        }

        // Enregistrer le paiement simulé (test) dans la table payments
        await connexion.query(
            `INSERT INTO payments
             (commande_id, montant, methode, statut, transaction_id)
             VALUES (?, ?, ?, 'reussi', ?)`,
            [
                commande.insertId,
                total.toFixed(2),
                String(mode_paiement).slice(0, 50),
                referencePaiement
            ]
        );

        // Mettre à jour ou retirer l'article offert de la liste pour éviter les cadeaux en double
        if (qte >= articles[0].quantite_souhaitee) {
            await connexion.query("DELETE FROM liste_items WHERE id = ?", [
                articles[0].liste_item_id
            ]);
        } else {
            await connexion.query(
                "UPDATE liste_items SET quantite_souhaitee = quantite_souhaitee - ? WHERE id = ?",
                [qte, articles[0].liste_item_id]
            );
        }

        await connexion.commit();

        res.status(201).json({
            message: `Cadeau offert avec succès pour la liste « ${listes[0].nom} » (mode test)`,
            commande_id: commande.insertId,
            total,
            payment_provider_id: referencePaiement
        });
    } catch (error) {
        await connexion.rollback();
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de l'achat de l'article"
        });
    } finally {
        connexion.release();
    }
};
