
const db = require("../config/db");

// Afficher le profil de l'utilisateur connecté
exports.getProfil = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, nom, email, role, actif, created_at FROM users WHERE id = ?",
            [req.utilisateur.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        console.error("Erreur profil :", error);
        res.status(500).json({
            message: "Erreur lors de la récupération du profil"
        });
    }
};
// Modifier un utilisateur
exports.modifierUtilisateur = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, email } = req.body;

        if (!nom || !email) {
            return res.status(400).json({
                message: "Le nom et l'email sont obligatoires"
            });
        }

        const [resultat] = await db.query(
            "UPDATE users SET nom = ?, email = ? WHERE id = ?",
            [nom, email, id]
        );

        if (resultat.affectedRows === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        res.json({
            message: "Utilisateur modifié avec succès"
        });
    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Cet email est déjà utilisé"
            });
        }

        res.status(500).json({
            message: "Erreur lors de la modification de l'utilisateur"
        });
    }
};

exports.getUtilisateurs = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, nom, email, role, actif, created_at FROM users ORDER BY id"
        );

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération des utilisateurs"
        });
    }
};
