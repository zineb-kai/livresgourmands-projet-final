
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middleware/authMiddleware");

// Recuperer les avis d'un ouvrage
router.get("/ouvrage/:ouvrage_id", async (req, res) => {
    try {
        const [avis] = await db.query(
            `SELECT a.*, u.nom
             FROM avis a
             JOIN users u ON u.id = a.client_id
             WHERE a.ouvrage_id = ?
             ORDER BY a.id DESC`,
            [req.params.ouvrage_id]
        );

        res.json(avis);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la recuperation des avis"
        });
    }
});

// Ajouter un avis
router.post("/", verifierToken, async (req, res) => {
    try {
        const { ouvrage_id, note, commentaire } = req.body;

        if (
            !ouvrage_id ||
            !Number.isInteger(Number(note)) ||
            Number(note) < 1 ||
            Number(note) > 5
        ) {
            return res.status(400).json({
                message: "L'ouvrage et une note entre 1 et 5 sont obligatoires"
            });
        }

        const [achats] = await db.query(
            `SELECT ci.id
             FROM commandes c
             JOIN commande_items ci ON ci.commande_id = c.id
             WHERE c.client_id = ?
             AND ci.ouvrage_id = ?
             AND c.statut IN ('payee', 'expediee')
             LIMIT 1`,
            [req.utilisateur.id, ouvrage_id]
        );

        if (achats.length === 0) {
            return res.status(403).json({
                message: "Vous devez avoir achete cet ouvrage pour laisser un avis"
            });
        }

        const [resultat] = await db.query(
            `INSERT INTO avis (client_id, ouvrage_id, note, commentaire)
             VALUES (?, ?, ?, ?)`,
            [
                req.utilisateur.id,
                ouvrage_id,
                Number(note),
                commentaire || null
            ]
        );

        res.status(201).json({
            message: "Avis ajoute avec succes",
            id: resultat.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de l'ajout de l'avis"
        });
    }
});

module.exports = router;
