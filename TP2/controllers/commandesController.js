
const db = require("../config/db");

// Afficher l'historique des commandes
exports.getCommandes = async (req, res) => {
    try {
        const [commandes] = await db.query(
            `SELECT id, client_id, date, total, statut,
                    adresse_livraison, mode_livraison, mode_paiement
             FROM commandes
             WHERE client_id = ?
             ORDER BY date DESC`,
            [req.utilisateur.id]
        );

        res.json(commandes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
    }
};

// Afficher une commande et ses articles
exports.getCommande = async (req, res) => {
    try {
        const [commandes] = await db.query(
            `SELECT * FROM commandes WHERE id = ? AND client_id = ?`,
            [req.params.id, req.utilisateur.id]
        );

        if (commandes.length === 0) {
            return res.status(404).json({ message: "Commande introuvable" });
        }

        const [articles] = await db.query(
            `SELECT ci.ouvrage_id, o.titre, ci.quantite, ci.prix_unitaire
             FROM commande_items ci
             JOIN ouvrages o ON o.id = ci.ouvrage_id
             WHERE ci.commande_id = ?`,
            [req.params.id]
        );

        res.json({ commande: commandes[0], articles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération de la commande" });
    }
};

// Créer une commande depuis le panier
exports.creerCommande = async (req, res) => {
    const connexion = await db.getConnection();

    try {
        const clientId = req.utilisateur.id;
        const {
            adresse_livraison,
            mode_livraison,
            mode_paiement
        } = req.body;

        if (!adresse_livraison || !mode_livraison || !mode_paiement) {
            return res.status(400).json({
                message: "L'adresse, le mode de livraison et le mode de paiement sont obligatoires"
            });
        }

        await connexion.beginTransaction();

        const [paniers] = await connexion.query(
            "SELECT id FROM panier WHERE client_id = ? AND actif = 1 LIMIT 1 FOR UPDATE",
            [clientId]
        );

        if (paniers.length === 0) {
            await connexion.rollback();
            return res.status(400).json({ message: "Aucun panier actif" });
        }

        const panierId = paniers[0].id;

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

        let total = 0;

        for (const article of articles) {
            if (article.quantite > article.stock) {
                await connexion.rollback();
                return res.status(400).json({
                    message: `Stock insuffisant pour : ${article.titre}`
                });
            }

            total += Number(article.prix) * article.quantite;
        }

        const [resultatCommande] = await connexion.query(
            `INSERT INTO commandes
                (client_id, total, statut, adresse_livraison, mode_livraison, mode_paiement)
             VALUES (?, ?, 'en_cours', ?, ?, ?)`,
            [clientId, total.toFixed(2), adresse_livraison, mode_livraison, mode_paiement]
        );

        const commandeId = resultatCommande.insertId;

        for (const article of articles) {
            await connexion.query(
                `INSERT INTO commande_items
                    (commande_id, ouvrage_id, quantite, prix_unitaire)
                 VALUES (?, ?, ?, ?)`,
                [commandeId, article.ouvrage_id, article.quantite, article.prix]
            );

            await connexion.query(
                "UPDATE ouvrages SET stock = stock - ? WHERE id = ?",
                [article.quantite, article.ouvrage_id]
            );
        }

        await connexion.query(
            "DELETE FROM panier_items WHERE panier_id = ?",
            [panierId]
        );

        await connexion.commit();

        res.status(201).json({
            message: "Commande créée avec succès",
            commande_id: commandeId,
            total: Number(total.toFixed(2))
        });
    } catch (error) {
        await connexion.rollback();
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création de la commande" });
    } finally {
        connexion.release();
    }
};

// Modifier le statut d'une commande (administrateur)
exports.modifierStatut = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsAutorises = ["en_cours", "payee", "annulee", "expediee"];

        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({ message: "Statut invalide" });
        }

        const [resultat] = await db.query(
            "UPDATE commandes SET statut = ? WHERE id = ?",
            [statut, req.params.id]
        );

        if (resultat.affectedRows === 0) {
            return res.status(404).json({ message: "Commande introuvable" });
        }

        res.json({ message: "Statut de la commande modifié avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la modification du statut" });
    }
};
