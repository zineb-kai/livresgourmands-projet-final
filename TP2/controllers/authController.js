
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// Inscription d'un utilisateur
exports.register = [
    body("nom")
        .trim()
        .notEmpty()
        .withMessage("Le nom est obligatoire"),

    body("email")
        .trim()
        .isEmail()
        .withMessage("L'adresse email est invalide"),

    body("motDePasse")
        .isLength({ min: 6 })
        .withMessage("Le mot de passe doit contenir au moins 6 caractères"),

    async (req, res, next) => {
        const erreurs = validationResult(req);

        if (!erreurs.isEmpty()) {
            return res.status(400).json({
                erreurs: erreurs.array()
            });
        }

        const { nom, email, motDePasse } = req.body;

        try {
            const [utilisateurs] = await db.query(
                "SELECT id FROM users WHERE email = ?",
                [email]
            );

            if (utilisateurs.length > 0) {
                return res.status(409).json({
                    message: "Cette adresse email est déjà utilisée"
                });
            }

            const passwordHash = await bcrypt.hash(motDePasse, 10);

            const [resultat] = await db.query(
                `INSERT INTO users (nom, email, password_hash)
                 VALUES (?, ?, ?)`,
                [nom, email, passwordHash]
            );

            res.status(201).json({
                message: "Inscription réussie",
                id: resultat.insertId,
                nom,
                email
            });
        } catch (erreur) {
            next(erreur);
        }
    }
];

// Connexion d'un utilisateur
exports.login = async (req, res, next) => {
    const { email } = req.body || {};
    const motDePasse = req.body?.password ?? req.body?.motDePasse;

    if (!email || !motDePasse) {
        return res.status(400).json({
            message: "Email et mot de passe obligatoires"
        });
    }

    try {
        const [utilisateurs] = await db.query(
            "SELECT * FROM users WHERE email = ? AND actif = TRUE",
            [email]
        );

        if (utilisateurs.length === 0) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect"
            });
        }

        const utilisateur = utilisateurs[0];

        const motDePasseCorrect = await bcrypt.compare(
            motDePasse,
            utilisateur.password_hash
        );

        if (!motDePasseCorrect) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect"
            });
        }

        const token = jwt.sign(
            {
                id: utilisateur.id,
                role: utilisateur.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            message: "Connexion réussie",
            token,
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                email: utilisateur.email,
                role: utilisateur.role
            }
        });
    } catch (erreur) {
        next(erreur);
    }
};
