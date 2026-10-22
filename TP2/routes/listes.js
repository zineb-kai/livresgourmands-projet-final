
const express = require("express");
const router = express.Router();

const listesController = require("../controllers/listesController");
const { verifierToken } = require("../middleware/authMiddleware");

router.post("/", verifierToken, listesController.creerListe);

router.get("/:code", listesController.getListeParCode);

router.post(
    "/:id/articles",
    verifierToken,
    listesController.ajouterArticle
);

router.post(
    "/:id/acheter",
    verifierToken,
    listesController.acheterArticle
);

module.exports = router;
