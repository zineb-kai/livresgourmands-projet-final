const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middleware/authMiddleware");

// Récupérer les avis d'un ouvrage avec le nom de l'auteur
router.get("/ouvrage/:ouvrage_id", async (req, res) => {
    try {
        const ouvrageId = Number(req.params.ouvrage_id);

        if (!Number.isInteger(ouvrageId) || ouvrageId <= 0) {
            return res.status(400).json({
                message: "Identifiant d'ouvrage invalide"
            });
        }

        const [avis] = await db.query(
            `SELECT a.id, a.client_id, a.ouvrage_id, a.note, a.commentaire, a.date, u.nom
             FROM avis a
             JOIN users u ON u.id = a.client_id
             WHERE a.ouvrage_id = ?
             ORDER BY a.date DESC, a.id DESC`,
            [ouvrageId]
        );

        res.json(avis);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération des avis"
        });
    }
});

// Ajouter un avis (réservé aux clients connectés ayant acheté l'ouvrage — pas de doublon)
router.post("/", verifierToken, async (req, res) => {
    try {
        const { ouvrage_id, note, commentaire } = req.body;
        const ouvrageId = Number(ouvrage_id);
        const noteNum = Number(note);

        if (
            !Number.isInteger(ouvrageId) ||
            ouvrageId <= 0 ||
            !Number.isInteger(noteNum) ||
            noteNum < 1 ||
            noteNum > 5
        ) {
            return res.status(400).json({
                message: "L'ouvrage et une note entière entre 1 et 5 sont obligatoires"
            });
        }

        // Vérifier que le client a bien acheté l'ouvrage (commande payée ou expédiée)
        const [achats] = await db.query(
            `SELECT ci.id
             FROM commandes c
             JOIN commande_items ci ON ci.commande_id = c.id
             WHERE c.client_id = ?
             AND ci.ouvrage_id = ?
             AND c.statut IN ('payee', 'expediee')
             LIMIT 1`,
            [req.utilisateur.id, ouvrageId]
        );

        if (achats.length === 0) {
            return res.status(403).json({
                message: "Vous devez avoir acheté cet ouvrage pour laisser un avis"
            });
        }

        // Empêcher les avis en double d'un même client sur un même ouvrage
        const [existants] = await db.query(
            "SELECT id FROM avis WHERE client_id = ? AND ouvrage_id = ? LIMIT 1",
            [req.utilisateur.id, ouvrageId]
        );

        if (existants.length > 0) {
            return res.status(409).json({
                message: "Vous avez déjà publié un avis pour cet ouvrage"
            });
        }

        const texteNettoye =
            typeof commentaire === "string" && commentaire.trim()
                ? commentaire.trim().slice(0, 1000)
                : null;

        const [resultat] = await db.query(
            `INSERT INTO avis (client_id, ouvrage_id, note, commentaire)
             VALUES (?, ?, ?, ?)`,
            [req.utilisateur.id, ouvrageId, noteNum, texteNettoye]
        );

        res.status(201).json({
            message: "Avis publié avec succès",
            id: resultat.insertId
        });
    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Vous avez déjà publié un avis pour cet ouvrage"
            });
        }

        res.status(500).json({
            message: "Erreur lors de l'ajout de l'avis"
        });
    }
});

// Modifier son propre avis (propriétaire uniquement)
router.put("/:id", verifierToken, async (req, res) => {
    try {
        const avisId = Number(req.params.id);
        const noteNum = Number(req.body.note);
        const { commentaire } = req.body;

        if (!Number.isInteger(avisId) || avisId <= 0) {
            return res.status(400).json({ message: "Identifiant d'avis invalide" });
        }

        if (!Number.isInteger(noteNum) || noteNum < 1 || noteNum > 5) {
            return res.status(400).json({
                message: "La note doit être un entier compris entre 1 et 5"
            });
        }

        const texteNettoye =
            typeof commentaire === "string" && commentaire.trim()
                ? commentaire.trim().slice(0, 1000)
                : null;

        const [resultat] = await db.query(
            `UPDATE avis
             SET note = ?, commentaire = ?
             WHERE id = ? AND client_id = ?`,
            [noteNum, texteNettoye, avisId, req.utilisateur.id]
        );

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Avis introuvable ou modification non autorisée"
            });
        }

        res.json({ message: "Votre avis a été mis à jour avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la modification de l'avis"
        });
    }
});

// Supprimer son propre avis (ou suppression par un administrateur)
router.delete("/:id", verifierToken, async (req, res) => {
    try {
        const avisId = Number(req.params.id);

        if (!Number.isInteger(avisId) || avisId <= 0) {
            return res.status(400).json({ message: "Identifiant d'avis invalide" });
        }

        const estAdmin = req.utilisateur.role === "administrateur";
        const [resultat] = estAdmin
            ? await db.query("DELETE FROM avis WHERE id = ?", [avisId])
            : await db.query(
                  "DELETE FROM avis WHERE id = ? AND client_id = ?",
                  [avisId, req.utilisateur.id]
              );

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Avis introuvable ou suppression non autorisée"
            });
        }

        res.json({ message: "Avis supprimé avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la suppression de l'avis"
        });
    }
});

module.exports = router;
