const express = require("express");
const router = express.Router();

const commandesController = require("../controllers/commandesController");
const { verifierToken } = require("../middleware/authMiddleware");
const { verifierRole } = require("../middleware/verifierRole");

// Consulter toutes les commandes (administrateur uniquement — déclaré avant /:id)
router.get(
    "/admin/toutes",
    verifierToken,
    verifierRole("administrateur"),
    commandesController.getToutesCommandes
);

// Historique des commandes du client connecté
router.get(
    "/",
    verifierToken,
    commandesController.getCommandes
);

// Détails d'une commande (propriétaire ou administrateur)
router.get(
    "/:id",
    verifierToken,
    commandesController.getCommande
);

// Créer une commande depuis le panier actif
router.post(
    "/",
    verifierToken,
    commandesController.creerCommande
);

// Payer une commande en attente (environnement de test simulé)
router.post(
    "/:id/payer",
    verifierToken,
    commandesController.payerCommande
);

// Modifier le statut d'une commande (administrateur)
router.put(
    "/:id",
    verifierToken,
    verifierRole("administrateur"),
    commandesController.modifierStatut
);

module.exports = router;
