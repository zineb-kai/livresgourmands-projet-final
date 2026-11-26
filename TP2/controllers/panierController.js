const db = require("../config/db");

// Récupérer ou créer le panier actif d'un client
async function obtenirOuCreerPanierActif(clientId) {
    const [paniers] = await db.query(
        "SELECT id FROM panier WHERE client_id = ? AND actif = 1 LIMIT 1",
        [clientId]
    );

    if (paniers.length > 0) {
        return paniers[0].id;
    }

    const [nouveauPanier] = await db.query(
        "INSERT INTO panier (client_id, actif) VALUES (?, 1)",
        [clientId]
    );

    return nouveauPanier.insertId;
}

// Afficher le panier de l'utilisateur connecté (sans ligne vide quand le panier est vide)
exports.getPanier = async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT
                p.id AS panier_id,
                pi.id AS item_id,
                o.id AS ouvrage_id,
                o.titre,
                o.auteur,
                o.stock,
                o.categorie_id,
                c.nom AS categorie_nom,
                o.prix AS prix,
                pi.quantite,
                (o.prix * pi.quantite) AS sous_total
             FROM panier p
             INNER JOIN panier_items pi ON p.id = pi.panier_id
             INNER JOIN ouvrages o ON pi.ouvrage_id = o.id
             LEFT JOIN categories c ON c.id = o.categorie_id
             WHERE p.client_id = ? AND p.actif = 1
             ORDER BY pi.id`,
            [req.utilisateur.id]
        );

        res.status(200).json(items);
    } catch (error) {
        console.error("Erreur panier :", error);
        res.status(500).json({
            message: "Erreur lors de la récupération du panier"
        });
    }
};

// Ajouter un ouvrage au panier
exports.ajouterAuPanier = async (req, res) => {
    try {
        const { ouvrage_id, quantite } = req.body;
        const clientId = req.utilisateur.id;
        const qte = Number(quantite);

        if (!ouvrage_id || !Number.isInteger(qte) || qte < 1) {
            return res.status(400).json({
                message: "ouvrage_id et une quantité positive sont obligatoires"
            });
        }

        const [ouvrages] = await db.query(
            "SELECT id, titre, prix, stock FROM ouvrages WHERE id = ?",
            [ouvrage_id]
        );

        if (ouvrages.length === 0) {
            return res.status(404).json({
                message: "Ouvrage introuvable"
            });
        }

        if (ouvrages[0].stock < qte) {
            return res.status(400).json({
                message: `Stock insuffisant (${ouvrages[0].stock} exemplaire(s) disponible(s))`
            });
        }

        const panierId = await obtenirOuCreerPanierActif(clientId);

        const [items] = await db.query(
            "SELECT id, quantite FROM panier_items WHERE panier_id = ? AND ouvrage_id = ?",
            [panierId, ouvrage_id]
        );

        if (items.length > 0) {
            const nouvelleQte = items[0].quantite + qte;

            if (nouvelleQte > ouvrages[0].stock) {
                return res.status(400).json({
                    message: `Stock insuffisant : maximum ${ouvrages[0].stock} exemplaire(s) disponible(s)`
                });
            }

            await db.query(
                "UPDATE panier_items SET quantite = ?, prix_unitaire = ? WHERE id = ?",
                [nouvelleQte, ouvrages[0].prix, items[0].id]
            );
        } else {
            await db.query(
                `INSERT INTO panier_items
                    (panier_id, ouvrage_id, quantite, prix_unitaire)
                 VALUES (?, ?, ?, ?)`,
                [panierId, ouvrage_id, qte, ouvrages[0].prix]
            );
        }

        res.status(201).json({
            message: "Ouvrage ajouté au panier"
        });
    } catch (error) {
        console.error("Erreur ajout panier :", error);
        res.status(500).json({
            message: "Erreur lors de l'ajout au panier"
        });
    }
};

// Modifier la quantité d'un ouvrage dans le panier
exports.modifierQuantite = async (req, res) => {
    try {
        const ouvrageId = Number(req.params.ouvrage_id);
        const qte = Number(req.body.quantite);
        const clientId = req.utilisateur.id;

        if (!Number.isInteger(ouvrageId) || ouvrageId <= 0) {
            return res.status(400).json({
                message: "Identifiant d'ouvrage invalide"
            });
        }

        if (!Number.isInteger(qte) || qte < 1) {
            return res.status(400).json({
                message: "La quantité doit être un entier positif"
            });
        }

        const [ouvrages] = await db.query(
            "SELECT id, prix, stock FROM ouvrages WHERE id = ?",
            [ouvrageId]
        );

        if (ouvrages.length === 0) {
            return res.status(404).json({
                message: "Ouvrage introuvable"
            });
        }

        if (qte > ouvrages[0].stock) {
            return res.status(400).json({
                message: `Stock insuffisant : maximum ${ouvrages[0].stock} exemplaire(s) disponible(s)`
            });
        }

        const [paniers] = await db.query(
            "SELECT id FROM panier WHERE client_id = ? AND actif = 1 LIMIT 1",
            [clientId]
        );

        if (paniers.length === 0) {
            return res.status(404).json({
                message: "Aucun panier actif trouvé"
            });
        }

        const [resultat] = await db.query(
            `UPDATE panier_items
             SET quantite = ?, prix_unitaire = ?
             WHERE panier_id = ? AND ouvrage_id = ?`,
            [qte, ouvrages[0].prix, paniers[0].id, ouvrageId]
        );

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Cet ouvrage n'est pas dans votre panier"
            });
        }

        res.json({
            message: "Quantité mise à jour avec succès"
        });
    } catch (error) {
        console.error("Erreur modification panier :", error);
        res.status(500).json({
            message: "Erreur lors de la modification de la quantité"
        });
    }
};

// Supprimer un ouvrage du panier
exports.supprimerArticle = async (req, res) => {
    try {
        const ouvrageId = Number(req.params.ouvrage_id);
        const clientId = req.utilisateur.id;

        if (!Number.isInteger(ouvrageId) || ouvrageId <= 0) {
            return res.status(400).json({
                message: "Identifiant d'ouvrage invalide"
            });
        }

        const [paniers] = await db.query(
            "SELECT id FROM panier WHERE client_id = ? AND actif = 1 LIMIT 1",
            [clientId]
        );

        if (paniers.length === 0) {
            return res.json({ message: "Article supprimé du panier" });
        }

        await db.query(
            "DELETE FROM panier_items WHERE panier_id = ? AND ouvrage_id = ?",
            [paniers[0].id, ouvrageId]
        );

        res.json({
            message: "Ouvrage retiré du panier"
        });
    } catch (error) {
        console.error("Erreur suppression article panier :", error);
        res.status(500).json({
            message: "Erreur lors de la suppression de l'article"
        });
    }
};

// Vider entièrement le panier actif de l'utilisateur connecté
exports.viderPanier = async (req, res) => {
    try {
        const clientId = req.utilisateur.id;

        const [paniers] = await db.query(
            "SELECT id FROM panier WHERE client_id = ? AND actif = 1 LIMIT 1",
            [clientId]
        );

        if (paniers.length > 0) {
            await db.query(
                "DELETE FROM panier_items WHERE panier_id = ?",
                [paniers[0].id]
            );
        }

        res.json({
            message: "Panier vidé avec succès"
        });
    } catch (error) {
        console.error("Erreur vidage panier :", error);
        res.status(500).json({
            message: "Erreur lors du vidage du panier"
        });
    }
};
