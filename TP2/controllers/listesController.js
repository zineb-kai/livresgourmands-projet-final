
const db = require("../config/db");
const crypto = require("crypto");

// Créer une liste cadeau
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
            code_partage: code
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la création de la liste"
        });
    }
};

// Consulter une liste par son code de partage
exports.getListeParCode = async (req, res) => {
    try {
        const [listes] = await db.query(
            `SELECT id, nom, proprietaire_id, code_partage, date_creation
             FROM listes_cadeaux
             WHERE code_partage = ?`,
            [req.params.code]
        );

        if (listes.length === 0) {
            return res.status(404).json({
                message: "Liste cadeau introuvable"
            });
        }

        const [articles] = await db.query(
            `SELECT li.id, li.liste_id, li.ouvrage_id,
                    li.quantite_souhaitee, o.titre, o.prix
             FROM liste_items li
             JOIN ouvrages o ON o.id = li.ouvrage_id
             WHERE li.liste_id = ?`,
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

// Ajouter un ouvrage à une liste cadeau
exports.ajouterArticle = async (req, res) => {
    try {
        const listeId = req.params.id;
        const { ouvrage_id, quantite_souhaitee } = req.body;
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

// Acheter un ouvrage d'une liste cadeau
exports.acheterArticle = async (req, res) => {
    const connexion = await db.getConnection();

    try {
        const { ouvrage_id, quantite } = req.body;
        const qte = Number(quantite);

        if (!ouvrage_id || !Number.isInteger(qte) || qte < 1) {
            return res.status(400).json({
                message: "Un ouvrage et une quantité positive sont obligatoires"
            });
        }

        await connexion.beginTransaction();

        const [listes] = await connexion.query(
            "SELECT id FROM listes_cadeaux WHERE id = ?",
            [req.params.id]
        );

        if (listes.length === 0) {
            await connexion.rollback();
            return res.status(404).json({
                message: "Liste cadeau introuvable"
            });
        }

        const [articles] = await connexion.query(
            `SELECT o.id, o.prix, o.stock, li.quantite_souhaitee
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
                message: "Stock insuffisant"
            });
        }

        const prix = Number(articles[0].prix);
        const total = prix * qte;

        const [commande] = await connexion.query(
            `INSERT INTO commandes
             (client_id, total, statut, adresse_livraison,
              mode_livraison, mode_paiement)
             VALUES (?, ?, 'en_cours', ?, ?, ?)`,
            [
                req.utilisateur.id,
                total.toFixed(2),
                "À préciser",
                "standard",
                "à préciser"
            ]
        );

        await connexion.query(
            `INSERT INTO commande_items
             (commande_id, ouvrage_id, quantite, prix_unitaire)
             VALUES (?, ?, ?, ?)`,
            [commande.insertId, ouvrage_id, qte, prix]
        );

        await connexion.query(
            "UPDATE ouvrages SET stock = stock - ? WHERE id = ?",
            [qte, ouvrage_id]
        );

        await connexion.commit();

        res.status(201).json({
            message: "Achat effectué avec succès",
            commande_id: commande.insertId,
            total: Number(total.toFixed(2))
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
