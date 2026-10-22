
const db = require("../config/db");

// Afficher le panier de l'utilisateur connecté
exports.getPanier = async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT
                p.id AS panier_id,
                pi.id AS item_id,
                o.id AS ouvrage_id,
                o.titre,
                pi.prix_unitaire AS prix,
                pi.quantite,
                (pi.prix_unitaire * pi.quantite) AS sous_total
             FROM panier p
             LEFT JOIN panier_items pi ON p.id = pi.panier_id
             LEFT JOIN ouvrages o ON pi.ouvrage_id = o.id
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
            "SELECT id, prix, stock FROM ouvrages WHERE id = ?",
            [ouvrage_id]
        );

        if (ouvrages.length === 0) {
            return res.status(404).json({
                message: "Ouvrage introuvable"
            });
        }

        if (ouvrages[0].stock < qte) {
            return res.status(400).json({
                message: "Stock insuffisant"
            });
        }

        const [paniers] = await db.query(
            "SELECT id FROM panier WHERE client_id = ? AND actif = 1 LIMIT 1",
            [clientId]
        );

        let panierId;

        if (paniers.length === 0) {
            const [nouveauPanier] = await db.query(
                "INSERT INTO panier (client_id, actif) VALUES (?, 1)",
                [clientId]
            );
            panierId = nouveauPanier.insertId;
        } else {
            panierId = paniers[0].id;
        }

        const [items] = await db.query(
            "SELECT id, quantite FROM panier_items WHERE panier_id = ? AND ouvrage_id = ?",
            [panierId, ouvrage_id]
        );

        if (items.length > 0) {
            const nouvelleQte = items[0].quantite + qte;

            if (nouvelleQte > ouvrages[0].stock) {
                return res.status(400).json({
                    message: "Stock insuffisant pour cette quantité"
                });
            }

            await db.query(
                "UPDATE panier_items SET quantite = ? WHERE id = ?",
                [nouvelleQte, items[0].id]
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
