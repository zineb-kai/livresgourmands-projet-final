const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middleware/authMiddleware");
const { verifierRole } = require("../middleware/verifierRole");

// Lister tous les commentaires pour la modération (éditeur ou administrateur uniquement)
router.get(
    "/",
    verifierToken,
    verifierRole("editeur", "administrateur"),
    async (req, res) => {
        try {
            const { statut, ouvrage_id } = req.query;
            const conditions = [];
            const params = [];

            if (statut === "en_attente") {
                conditions.push("c.valide = 0");
            } else if (statut === "valides") {
                conditions.push("c.valide = 1");
            }

            if (ouvrage_id && Number.isInteger(Number(ouvrage_id))) {
                conditions.push("c.ouvrage_id = ?");
                params.push(Number(ouvrage_id));
            }

            const clauseWhere =
                conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

            const [commentaires] = await db.query(
                `SELECT c.id, c.client_id, c.ouvrage_id, c.contenu, c.valide,
                        c.date_soumission, c.date_validation, c.valide_par,
                        u.nom AS auteur_nom, o.titre AS ouvrage_titre
                 FROM commentaires c
                 JOIN users u ON u.id = c.client_id
                 JOIN ouvrages o ON o.id = c.ouvrage_id
                 ${clauseWhere}
                 ORDER BY c.valide ASC, c.date_soumission DESC, c.id DESC`,
                params
            );

            res.json(commentaires);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Erreur lors de la récupération des commentaires à modérer"
            });
        }
    }
);

// Afficher les commentaires validés d'un ouvrage (public)
router.get("/ouvrage/:ouvrage_id", async (req, res) => {
    try {
        const ouvrageId = Number(req.params.ouvrage_id);

        if (!Number.isInteger(ouvrageId) || ouvrageId <= 0) {
            return res.status(400).json({
                message: "Identifiant d'ouvrage invalide"
            });
        }

        const [commentaires] = await db.query(
            `SELECT c.id, c.client_id, c.ouvrage_id, c.contenu, c.valide,
                    c.date_soumission, c.date_validation, u.nom
             FROM commentaires c
             JOIN users u ON u.id = c.client_id
             WHERE c.ouvrage_id = ? AND c.valide = 1
             ORDER BY c.date_soumission DESC, c.id DESC`,
            [ouvrageId]
        );

        res.json(commentaires);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération des commentaires"
        });
    }
});

// Ajouter un commentaire en attente de validation (utilisateur connecté)
router.post("/", verifierToken, async (req, res) => {
    try {
        const { ouvrage_id, contenu } = req.body;
        const ouvrageId = Number(ouvrage_id);
        const texte = typeof contenu === "string" ? contenu.trim() : "";

        if (!Number.isInteger(ouvrageId) || ouvrageId <= 0 || texte.length < 3) {
            return res.status(400).json({
                message: "L'ouvrage et un commentaire d'au moins 3 caractères sont obligatoires"
            });
        }

        const [ouvrages] = await db.query(
            "SELECT id FROM ouvrages WHERE id = ?",
            [ouvrageId]
        );

        if (ouvrages.length === 0) {
            return res.status(404).json({ message: "Ouvrage introuvable" });
        }

        const [resultat] = await db.query(
            `INSERT INTO commentaires
             (client_id, ouvrage_id, contenu, valide)
             VALUES (?, ?, ?, 0)`,
            [req.utilisateur.id, ouvrageId, texte.slice(0, 1000)]
        );

        res.status(201).json({
            message:
                "Commentaire soumis avec succès. Il sera affiché après validation par un éditeur ou un administrateur.",
            id: resultat.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de l'ajout du commentaire"
        });
    }
});

// Valider ou refuser un commentaire (éditeur ou administrateur uniquement)
router.put(
    "/:id/validation",
    verifierToken,
    verifierRole("editeur", "administrateur"),
    async (req, res) => {
        try {
            const commentaireId = Number(req.params.id);
            const { valide } = req.body;

            if (!Number.isInteger(commentaireId) || commentaireId <= 0) {
                return res.status(400).json({
                    message: "Identifiant de commentaire invalide"
                });
            }

            if (typeof valide !== "boolean") {
                return res.status(400).json({
                    message: "valide doit être true ou false"
                });
            }

            const [resultat] = await db.query(
                `UPDATE commentaires
                 SET valide = ?,
                     date_validation = NOW(),
                     valide_par = ?
                 WHERE id = ?`,
                [valide ? 1 : 0, req.utilisateur.id, commentaireId]
            );

            if (resultat.affectedRows === 0) {
                return res.status(404).json({
                    message: "Commentaire introuvable"
                });
            }

            res.json({
                message: valide
                    ? "Commentaire validé et publié avec succès"
                    : "Commentaire masqué / refusé"
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Erreur lors de la validation du commentaire"
            });
        }
    }
);

// Supprimer un commentaire (éditeur ou administrateur uniquement)
router.delete(
    "/:id",
    verifierToken,
    verifierRole("editeur", "administrateur"),
    async (req, res) => {
        try {
            const commentaireId = Number(req.params.id);

            if (!Number.isInteger(commentaireId) || commentaireId <= 0) {
                return res.status(400).json({
                    message: "Identifiant de commentaire invalide"
                });
            }

            const [resultat] = await db.query(
                "DELETE FROM commentaires WHERE id = ?",
                [commentaireId]
            );

            if (resultat.affectedRows === 0) {
                return res.status(404).json({
                    message: "Commentaire introuvable"
                });
            }

            res.json({ message: "Commentaire supprimé avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Erreur lors de la suppression du commentaire"
            });
        }
    }
);

module.exports = router;
