
exports.verifierRole = (...rolesAutorises) => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({
                message: "Authentification requise"
            });
        }

        if (!rolesAutorises.includes(req.utilisateur.role)) {
            return res.status(403).json({
                message: "Accès interdit"
            });
        }

        next();
    };
};
