const express = require("express");
const router = express.Router();

const usersController = require("../controllers/usersController");
const { verifierToken } = require("../middleware/authMiddleware");
const { verifierRole } = require("../middleware/verifierRole");

// Consulter son propre profil (utilisateur connecté)
router.get("/me", verifierToken, usersController.getProfil);

// Modifier son propre mot de passe (déclaré AVANT /:id)
router.put(
    "/me/mot-de-passe",
    verifierToken,
    usersController.modifierMotDePasse
);

// Lister tous les utilisateurs (réservé à l'administrateur uniquement)
router.get(
    "/",
    verifierToken,
    verifierRole("administrateur"),
    usersController.getUtilisateurs
);

// Consulter un utilisateur précis (propriétaire ou administrateur)
router.get("/:id", verifierToken, usersController.getUtilisateurParId);

// Modifier un utilisateur (propriétaire pour nom/email, ou administrateur)
router.put("/:id", verifierToken, usersController.modifierUtilisateur);

module.exports = router;
