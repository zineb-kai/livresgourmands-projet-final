
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middleware/authMiddleware");
const { verifierRole } = require("../middleware/verifierRole");

// Afficher les commentaires validés d'un ouvrage
router.get("/ouvrage/:ouvrage_id", async (req, res) => {
    try {
        const [commentaires] = await db.query(
            `SELECT c.*, u.nom
             FROM commentaires c
             JOIN users u ON u.id = c.client_id
             WHERE c.ouvrage_id = ? AND c.valide = 1
             ORDER BY c.id DESC`,
            [req.params.ouvrage_id]
        );

        res.json(commentaires);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération des commentaires"
        });
    }
});

// Ajouter un commentaire en attente de validation
router.post("/", verifierToken, async (req, res) => {
    try {
        const { ouvrage_id, contenu } = req.body;

        if (!ouvrage_id || !contenu || !contenu.trim()) {
            return res.status(400).json({
                message: "L'ouvrage et le contenu sont obligatoires"
            });
        }

        const [resultat] = await db.query(
            `INSERT INTO commentaires
             (client_id, ouvrage_id, contenu, valide)
             VALUES (?, ?, ?, 0)`,
            [req.utilisateur.id, ouvrage_id, contenu.trim()]
        );

        res.status(201).json({
            message: "Commentaire ajouté en attente de validation",
            id: resultat.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de l'ajout du commentaire"
        });
    }
});

// Valider ou refuser un commentaire
router.put("/:id/validation", verifierToken,
    verifierRole("editeur", "administrateur"),
    async (req, res) => {
        try {
            const { valide } = req.body;

            if (typeof valide !== "boolean") {
                return res.status(400).json({
                    message: "valide doit être true ou false"
                });
            }

            const [resultat] = await db.query(
                "UPDATE commentaires SET valide = ? WHERE id = ?",
                [valide ? 1 : 0, req.params.id]
            );

            if (resultat.affectedRows === 0) {
                return res.status(404).json({
                    message: "Commentaire introuvable"
                });
            }

            res.json({
                message: valide
                    ? "Commentaire validé"
                    : "Commentaire refusé"
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Erreur lors de la validation du commentaire"
            });
        }
    }
);

module.exports = router;
