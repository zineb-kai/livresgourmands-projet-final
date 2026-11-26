const express = require("express");
const router = express.Router();

const listesController = require("../controllers/listesController");
const { verifierToken } = require("../middleware/authMiddleware");

// Consulter les listes cadeaux de l'utilisateur connecté (déclaré AVANT /:code)
router.get("/mes-listes", verifierToken, listesController.getMesListes);

// Créer une nouvelle liste cadeau
router.post("/", verifierToken, listesController.creerListe);

// Modifier le nom d'une liste cadeau (propriétaire uniquement)
router.put("/:id", verifierToken, listesController.modifierListe);

// Supprimer une liste cadeau (propriétaire uniquement)
router.delete("/:id", verifierToken, listesController.supprimerListe);

// Ajouter un ouvrage à une liste cadeau (propriétaire uniquement)
router.post("/:id/articles", verifierToken, listesController.ajouterArticle);

// Retirer un ouvrage d'une liste cadeau (propriétaire uniquement)
router.delete(
    "/:id/articles/:ouvrage_id",
    verifierToken,
    listesController.supprimerArticle
);

// Offrir / acheter un ouvrage d'une liste cadeau (parcours Ami)
router.post("/:id/acheter", verifierToken, listesController.acheterArticle);

// Consulter une liste partagée via son code personnel (parcours Ami — public)
router.get("/:code", listesController.getListeParCode);

module.exports = router;
