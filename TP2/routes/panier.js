
const express = require("express");
const router = express.Router();

const panierController = require("../controllers/panierController");
const { verifierToken } = require("../middleware/authMiddleware");

router.get("/", verifierToken, panierController.getPanier);
router.post("/items", verifierToken, panierController.ajouterAuPanier);

module.exports = router;
