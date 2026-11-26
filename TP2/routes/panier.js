const express = require("express");
const router = express.Router();

const panierController = require("../controllers/panierController");
const { verifierToken } = require("../middleware/authMiddleware");

// Consulter le panier de l'utilisateur connecté
router.get("/", verifierToken, panierController.getPanier);

// Ajouter un ouvrage au panier
router.post("/items", verifierToken, panierController.ajouterAuPanier);

// Modifier la quantité d'un ouvrage dans le panier
router.put("/items/:ouvrage_id", verifierToken, panierController.modifierQuantite);

// Supprimer un ouvrage du panier
router.delete("/items/:ouvrage_id", verifierToken, panierController.supprimerArticle);

// Vider entièrement le panier
router.delete("/", verifierToken, panierController.viderPanier);

module.exports = router;
