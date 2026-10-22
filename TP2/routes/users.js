
const express = require("express");
const router = express.Router();

const usersController = require("../controllers/usersController");
const { verifierToken } = require("../middleware/authMiddleware");

router.get("/me", verifierToken, usersController.getProfil);
router.put("/:id", verifierToken, usersController.modifierUtilisateur);
router.get("/", verifierToken, usersController.getUtilisateurs);
module.exports = router;
