
const jwt = require("jsonwebtoken");

// Vérifier le token JWT
exports.verifierToken = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            message: "Token manquant. Vous devez vous connecter."
        });
    }

    const token = authorization.split(" ")[1];

    try {
        const utilisateur = jwt.verify(token, process.env.JWT_SECRET);

        req.utilisateur = utilisateur;

        next();
    } catch (erreur) {
        return res.status(401).json({
            message: "Token invalide ou expiré"
        });
    }
};
