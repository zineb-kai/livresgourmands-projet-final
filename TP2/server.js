
require("dotenv").config();

const express = require("express");
const app = express();
const db = require("./config/db");

const usersRoutes = require("./routes/users");
const categoriesRoutes = require("./routes/categories");
const authRoutes = require("./routes/auth");
const ouvragesRoutes = require("./routes/ouvrages");
const panierRoutes = require("./routes/panier");
const commandesRoutes = require("./routes/commandes");
const listesRoutes = require("./routes/listes");
const avisRoutes = require("./routes/avis");
const commentairesRoutes = require("./routes/commentaires");

const authMiddleware = require("./middleware/authMiddleware");

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Bienvenue sur l'API livresgourmands.net" });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS resultat");
        res.json({
            message: "Connexion MySQL réussie",
            resultat: rows[0].resultat
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur de connexion à la base de données"
        });
    }
});

app.use("/api/auth", authRoutes);

app.get("/api/profil", authMiddleware.verifierToken, (req, res) => {
    res.json({
        message: "Accès autorisé",
        utilisateur: req.utilisateur
    });
});

app.use("/api/users", usersRoutes);
app.use("/api/ouvrages", ouvragesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/panier", panierRoutes);
app.use("/api/commandes", commandesRoutes);
app.use("/api/listes", listesRoutes);
app.use("/api/avis", avisRoutes);
app.use("/api/commentaires", commentairesRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Route introuvable" });
});

app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: "Erreur interne du serveur" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
