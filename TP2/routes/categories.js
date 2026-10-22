
const express = require("express");
const router = express.Router();

const categoriesController = require("../controllers/categoriesController");
const authMiddleware = require("../middleware/authMiddleware");
const roles = require("../middleware/verifierRole");

const verifierToken = authMiddleware.verifierToken || authMiddleware;
const verifierRole = roles.verifierRole || roles;

router.get("/", categoriesController.getCategories);

router.post(
    "/",
    verifierToken,
    verifierRole("administrateur"),
    categoriesController.ajouterCategorie
);

router.put(
    "/:id",
    verifierToken,
    verifierRole("administrateur"),
    categoriesController.modifierCategorie
);

router.delete(
    "/:id",
    verifierToken,
    verifierRole("administrateur"),
    categoriesController.supprimerCategorie
);

module.exports = router;
