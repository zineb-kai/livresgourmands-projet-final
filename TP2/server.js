require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const db = require("./config/db");

// Importation des routes
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

// Autoriser la communication avec le frontend React
app.use(cors({
    origin: "http://localhost:5173"
}));

// Permettre la réception des données JSON
app.use(express.json());

// Route d'accueil de l'API
app.get("/", (req, res) => {
    res.json({ message: "Bienvenue sur l'API livresgourmands.net" });
});

// Vérification de la connexion à MySQL
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

// Routes d'authentification
app.use("/api/auth", authRoutes);

// Route protégée du profil
app.get("/api/profil", authMiddleware.verifierToken, (req, res) => {
    res.json({
        message: "Accès autorisé",
        utilisateur: req.utilisateur
    });
});

// Routes de l'application
app.use("/api/users", usersRoutes);
app.use("/api/ouvrages", ouvragesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/panier", panierRoutes);
app.use("/api/commandes", commandesRoutes);
app.use("/api/listes", listesRoutes);
app.use("/api/avis", avisRoutes);
app.use("/api/commentaires", commentairesRoutes);

// Gestion des routes inexistantes
app.use((req, res) => {
    res.status(404).json({ message: "Route introuvable" });
});

// Gestion des erreurs du serveur
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: "Erreur interne du serveur" });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});