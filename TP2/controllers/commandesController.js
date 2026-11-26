const crypto = require("crypto");
const db = require("../config/db");

// Grille officielle des frais de livraison (vérifiée côté serveur)
const FRAIS_LIVRAISON = {
    Lent: 0,
    Rapide: 4.99,
    "24h chrono": 9.99,
    standard: 0
};

// Calculer les frais de livraison de manière sécurisée côté serveur
function obtenirFraisLivraison(modeLivraison) {
    if (Object.prototype.hasOwnProperty.call(FRAIS_LIVRAISON, modeLivraison)) {
        return FRAIS_LIVRAISON[modeLivraison];
    }
    return null;
}

// Afficher l'historique des commandes du client connecté uniquement
exports.getCommandes = async (req, res) => {
    try {
        const [commandes] = await db.query(
            `SELECT id, client_id, date, total, statut,
                    adresse_livraison, mode_livraison, mode_paiement,
                    payment_provider_id
             FROM commandes
             WHERE client_id = ?
             ORDER BY date DESC, id DESC`,
            [req.utilisateur.id]
        );

        res.json(commandes);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération des commandes"
        });
    }
};

// Afficher toutes les commandes (réservé à l'administrateur pour le Dashboard)
exports.getToutesCommandes = async (req, res) => {
    try {
        const [commandes] = await db.query(
            `SELECT c.id, c.client_id, u.nom AS client_nom, u.email AS client_email,
                    c.date, c.total, c.statut, c.adresse_livraison,
                    c.mode_livraison, c.mode_paiement, c.payment_provider_id
             FROM commandes c
             JOIN users u ON u.id = c.client_id
             ORDER BY c.date DESC, c.id DESC`
        );

        res.json(commandes);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération de toutes les commandes"
        });
    }
};

// Afficher une commande et ses articles (protégé : propriétaire ou administrateur uniquement)
exports.getCommande = async (req, res) => {
    try {
        const commandeId = Number(req.params.id);

        if (!Number.isInteger(commandeId) || commandeId <= 0) {
            return res.status(400).json({ message: "Identifiant de commande invalide" });
        }

        const estAdmin = req.utilisateur.role === "administrateur";
        const [commandes] = estAdmin
            ? await db.query(
                  `SELECT c.*, u.nom AS client_nom, u.email AS client_email
                   FROM commandes c
                   JOIN users u ON u.id = c.client_id
                   WHERE c.id = ?`,
                  [commandeId]
              )
            : await db.query(
                  `SELECT * FROM commandes WHERE id = ? AND client_id = ?`,
                  [commandeId, req.utilisateur.id]
              );

        if (commandes.length === 0) {
            return res.status(404).json({
                message: "Commande introuvable ou accès non autorisé"
            });
        }

        const [articles] = await db.query(
            `SELECT ci.ouvrage_id, o.titre, o.auteur, ci.quantite, ci.prix_unitaire,
                    (ci.quantite * ci.prix_unitaire) AS sous_total
             FROM commande_items ci
             JOIN ouvrages o ON o.id = ci.ouvrage_id
             WHERE ci.commande_id = ?`,
            [commandeId]
        );

        const [paiements] = await db.query(
            `SELECT id, methode, transaction_id, statut, montant, date_paiement
             FROM payments
             WHERE commande_id = ?
             ORDER BY id DESC`,
            [commandeId]
        );

        res.json({
            commande: commandes[0],
            articles,
            paiements
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération de la commande"
        });
    }
};

// Créer une commande depuis le panier actif dans une transaction MySQL atomique
// Supporte le paiement simulé en environnement de test (aucune transaction réelle)
exports.creerCommande = async (req, res) => {
    const connexion = await db.getConnection();

    try {
        const clientId = req.utilisateur.id;
        const {
            adresse_livraison,
            mode_livraison,
            mode_paiement,
            payer_maintenant = true,
            simuler_echec_paiement = false
        } = req.body;

        if (!adresse_livraison || !adresse_livraison.trim() || !mode_livraison || !mode_paiement) {
            return res.status(400).json({
                message: "L'adresse, le mode de livraison et le mode de paiement sont obligatoires"
            });
        }

        const fraisLivraison = obtenirFraisLivraison(mode_livraison);
        if (fraisLivraison === null) {
            return res.status(400).json({
                message: "Mode de livraison invalide (Lent, Rapide ou 24h chrono)"
            });
        }

        await connexion.beginTransaction();

        // Verrouiller le panier actif pour empêcher toute commande en double concurrente
        const [paniers] = await connexion.query(
            "SELECT id FROM panier WHERE client_id = ? AND actif = 1 LIMIT 1 FOR UPDATE",
            [clientId]
        );

        if (paniers.length === 0) {
            await connexion.rollback();
            return res.status(400).json({ message: "Aucun panier actif" });
        }

        const panierId = paniers[0].id;

        // Verrouiller les ouvrages concernés et lire les prix et stocks réels côté serveur
        const [articles] = await connexion.query(
            `SELECT pi.ouvrage_id, pi.quantite, o.prix, o.stock, o.titre
             FROM panier_items pi
             JOIN ouvrages o ON o.id = pi.ouvrage_id
             WHERE pi.panier_id = ?
             FOR UPDATE`,
            [panierId]
        );

        if (articles.length === 0) {
            await connexion.rollback();
            return res.status(400).json({ message: "Le panier est vide" });
        }

        let sousTotal = 0;

        for (const article of articles) {
            if (article.quantite > article.stock) {
                await connexion.rollback();
                return res.status(400).json({
                    message: `Stock insuffisant pour : ${article.titre} (${article.stock} disponible(s))`
                });
            }

            sousTotal += Number(article.prix) * Number(article.quantite);
        }

        const totalFinal = Number((sousTotal + fraisLivraison).toFixed(2));

        // Simulation d'échec de paiement (environnement de test) :
        // on annule la transaction, le stock n'est pas débité et le panier reste intact
        if (payer_maintenant && simuler_echec_paiement) {
            await connexion.rollback();
            return res.status(402).json({
                message:
                    "Paiement refusé en environnement de test (simulation). Votre panier a été conservé et aucune commande n'a été débitée."
            });
        }

        const referencePaiement = payer_maintenant
            ? `TEST-${crypto.randomBytes(5).toString("hex").toUpperCase()}`
            : null;
        const statutInitial = payer_maintenant ? "payee" : "en_cours";

        // 1. Créer la commande
        const [resultatCommande] = await connexion.query(
            `INSERT INTO commandes
                (client_id, total, statut, adresse_livraison, mode_livraison, mode_paiement, payment_provider_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                clientId,
                totalFinal.toFixed(2),
                statutInitial,
                adresse_livraison.trim(),
                mode_livraison,
                mode_paiement,
                referencePaiement
            ]
        );

        const commandeId = resultatCommande.insertId;

        // 2. Insérer les lignes de commande et décrémenter le stock de façon sécurisée
        for (const article of articles) {
            await connexion.query(
                `INSERT INTO commande_items
                    (commande_id, ouvrage_id, quantite, prix_unitaire)
                 VALUES (?, ?, ?, ?)`,
                [commandeId, article.ouvrage_id, article.quantite, article.prix]
            );

            const [majStock] = await connexion.query(
                "UPDATE ouvrages SET stock = stock - ? WHERE id = ? AND stock >= ?",
                [article.quantite, article.ouvrage_id, article.quantite]
            );

            if (majStock.affectedRows === 0) {
                await connexion.rollback();
                return res.status(400).json({
                    message: `Stock insuffisant lors de la validation pour : ${article.titre}`
                });
            }
        }

        // 3. Enregistrer le paiement simulé dans la table payments (colonnes réelles)
        if (payer_maintenant) {
            const methodeCourte = String(mode_paiement).slice(0, 50);
            await connexion.query(
                `INSERT INTO payments
                    (commande_id, montant, methode, statut, transaction_id)
                 VALUES (?, ?, ?, 'reussi', ?)`,
                [
                    commandeId,
                    totalFinal.toFixed(2),
                    methodeCourte,
                    referencePaiement
                ]
            );
        }

        // 4. Vider le panier uniquement après réussite complète de la commande
        await connexion.query(
            "DELETE FROM panier_items WHERE panier_id = ?",
            [panierId]
        );

        await connexion.commit();

        res.status(201).json({
            message: payer_maintenant
                ? "Commande confirmée et payée avec succès (mode test)"
                : "Commande créée avec succès",
            commande_id: commandeId,
            sous_total: Number(sousTotal.toFixed(2)),
            frais_livraison: Number(fraisLivraison.toFixed(2)),
            total: totalFinal,
            statut: statutInitial,
            payment_provider_id: referencePaiement
        });
    } catch (error) {
        await connexion.rollback();
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la création de la commande"
        });
    } finally {
        connexion.release();
    }
};

// Payer une commande existante en statut 'en_cours' (environnement de test simulé)
// Empêche tout double paiement via verrouillage transactionnel
exports.payerCommande = async (req, res) => {
    const connexion = await db.getConnection();

    try {
        const commandeId = Number(req.params.id);
        const { mode_paiement, simuler_echec = false } = req.body || {};

        if (!Number.isInteger(commandeId) || commandeId <= 0) {
            return res.status(400).json({ message: "Identifiant de commande invalide" });
        }

        await connexion.beginTransaction();

        const [commandes] = await connexion.query(
            "SELECT * FROM commandes WHERE id = ? AND client_id = ? FOR UPDATE",
            [commandeId, req.utilisateur.id]
        );

        if (commandes.length === 0) {
            await connexion.rollback();
            return res.status(404).json({
                message: "Commande introuvable ou accès non autorisé"
            });
        }

        const commande = commandes[0];

        if (commande.statut === "payee" || commande.statut === "expediee") {
            await connexion.rollback();
            return res.status(409).json({
                message: "Cette commande a déjà été payée."
            });
        }

        if (commande.statut === "annulee") {
            await connexion.rollback();
            return res.status(400).json({
                message: "Impossible de payer une commande annulée."
            });
        }

        const [paiementsReussis] = await connexion.query(
            "SELECT id FROM payments WHERE commande_id = ? AND statut = 'reussi' LIMIT 1",
            [commandeId]
        );

        if (paiementsReussis.length > 0) {
            await connexion.rollback();
            return res.status(409).json({
                message: "Un paiement réussi existe déjà pour cette commande."
            });
        }

        const methodeCourte = String(
            mode_paiement || commande.mode_paiement || "Carte bancaire (test)"
        ).slice(0, 50);
        const referencePaiement = `TEST-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

        if (simuler_echec) {
            await connexion.query(
                `INSERT INTO payments
                    (commande_id, montant, methode, statut, transaction_id)
                 VALUES (?, ?, ?, 'echoue', ?)`,
                [commandeId, commande.total, methodeCourte, referencePaiement]
            );
            await connexion.commit();
            return res.status(402).json({
                message: "Paiement refusé en environnement de test. La commande reste en attente de règlement.",
                reference: referencePaiement
            });
        }

        await connexion.query(
            `INSERT INTO payments
                (commande_id, montant, methode, statut, transaction_id)
             VALUES (?, ?, ?, 'reussi', ?)`,
            [commandeId, commande.total, methodeCourte, referencePaiement]
        );

        await connexion.query(
            `UPDATE commandes
             SET statut = 'payee',
                 mode_paiement = ?,
                 payment_provider_id = ?
             WHERE id = ?`,
            [mode_paiement || commande.mode_paiement, referencePaiement, commandeId]
        );

        await connexion.commit();

        res.json({
            message: "Paiement confirmé avec succès (mode test)",
            commande_id: commandeId,
            statut: "payee",
            payment_provider_id: referencePaiement
        });
    } catch (error) {
        await connexion.rollback();
        console.error(error);
        res.status(500).json({
            message: "Erreur lors du traitement du paiement simulé"
        });
    } finally {
        connexion.release();
    }
};

// Transitions métier autorisées entre les statuts de commande
// (une commande expédiée ou annulée ne peut plus revenir en arrière)
const TRANSITIONS_STATUTS_AUTORISEES = {
    en_cours: ["payee", "annulee"],
    payee: ["expediee", "annulee"],
    expediee: [],
    annulee: []
};

// Modifier le statut d'une commande (administrateur uniquement, avec contrôle des transitions métier)
exports.modifierStatut = async (req, res) => {
    try {
        const commandeId = Number(req.params.id);
        const { statut } = req.body;
        const statutsAutorises = ["en_cours", "payee", "annulee", "expediee"];

        if (!Number.isInteger(commandeId) || commandeId <= 0) {
            return res.status(400).json({ message: "Identifiant de commande invalide" });
        }

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({ message: "Statut invalide" });
        }

        const [commandes] = await db.query(
            "SELECT id, statut FROM commandes WHERE id = ?",
            [commandeId]
        );

        if (commandes.length === 0) {
            return res.status(404).json({ message: "Commande introuvable" });
        }

        const statutActuel = commandes[0].statut;

        // Si le statut est inchangé, retourner un succès sans modification
        if (statutActuel === statut) {
            return res.json({
                message: "Le statut de la commande est déjà à jour",
                statut: statutActuel
            });
        }

        // Vérifier que la transition demandée respecte les règles métier
        const ciblesAutorisees = TRANSITIONS_STATUTS_AUTORISEES[statutActuel] || [];
        if (!ciblesAutorisees.includes(statut)) {
            return res.status(400).json({
                message: `Transition de statut non autorisée : impossible de passer de « ${statutActuel} » à « ${statut} ».`
            });
        }

        await db.query(
            "UPDATE commandes SET statut = ? WHERE id = ?",
            [statut, commandeId]
        );

        res.json({
            message: "Statut de la commande modifié avec succès",
            ancien_statut: statutActuel,
            statut
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la modification du statut"
        });
    }
};
