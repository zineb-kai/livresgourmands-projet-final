const express = require("express");
const router = express.Router();

const commandesController = require("../controllers/commandesController");
const { verifierToken } = require("../middleware/authMiddleware");
const { verifierRole } = require("../middleware/verifierRole");

// Historique des commandes
router.get(
    "/",
    verifierToken,
    commandesController.getCommandes
);

// Détails d'une commande
router.get(
    "/:id",
    verifierToken,
    commandesController.getCommande
);

// Créer une commande
router.post(
    "/",
    verifierToken,
    commandesController.creerCommande
);

// Modifier le statut d'une commande (administrateur)
router.put(
    "/:id",
    verifierToken,
    verifierRole("administrateur"),
    commandesController.modifierStatut
);

module.exports = router;