
const express = require("express");
const router = express.Router();

const ouvragesController = require("../controllers/ouvragesController");
const { verifierToken } = require("../middleware/authMiddleware");
const { verifierRole } = require("../middleware/verifierRole");

// Consulter les ouvrages : utilisateurs connectés
router.get("/", verifierToken, ouvragesController.getOuvrages);

// Ajouter un ouvrage : éditeur ou administrateur
router.post("/", verifierToken, verifierRole("editeur", "administrateur"), ouvragesController.ajouterOuvrage);

// Modifier un ouvrage : éditeur ou administrateur
router.put("/:id", verifierToken, verifierRole("editeur", "administrateur"), ouvragesController.modifierOuvrage);

// Supprimer un ouvrage : administrateur seulement
router.delete("/:id", verifierToken, verifierRole("administrateur"), ouvragesController.supprimerOuvrage);

module.exports = router;
