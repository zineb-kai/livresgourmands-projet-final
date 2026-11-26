const bcrypt = require("bcrypt");
const db = require("../config/db");

const ROLES_AUTORISES = ["client", "editeur", "gestionnaire", "administrateur"];
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Afficher le profil et les statistiques personnelles de l'utilisateur connecté
// (ne retourne JAMAIS password_hash)
exports.getProfil = async (req, res) => {
    try {
        const userId = req.utilisateur.id;

        const [users] = await db.query(
            `SELECT id, nom, email, role, actif, created_at
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable"
            });
        }

        // Récupérer les statistiques personnelles en lecture seule
        const [[statsCommandes]] = await db.query(
            `SELECT COUNT(*) AS nb_commandes,
                    COALESCE(SUM(CASE WHEN statut IN ('payee', 'expediee') THEN total ELSE 0 END), 0) AS total_depense
             FROM commandes
             WHERE client_id = ?`,
            [userId]
        );

        const [[statsListes]] = await db.query(
            "SELECT COUNT(*) AS nb_listes FROM listes_cadeaux WHERE proprietaire_id = ?",
            [userId]
        );

        const [[statsAvis]] = await db.query(
            "SELECT COUNT(*) AS nb_avis FROM avis WHERE client_id = ?",
            [userId]
        );

        res.status(200).json({
            ...users[0],
            statistiques: {
                nb_commandes: Number(statsCommandes.nb_commandes || 0),
                total_depense: Number(statsCommandes.total_depense || 0),
                nb_listes: Number(statsListes.nb_listes || 0),
                nb_avis: Number(statsAvis.nb_avis || 0)
            }
        });
    } catch (error) {
        console.error("Erreur profil :", error);
        res.status(500).json({
            message: "Erreur lors de la récupération du profil"
        });
    }
};

// Modifier les informations d'un utilisateur
// Sécurité : propriétaire (nom/email uniquement) ou administrateur (nom/email/role/actif)
exports.modifierUtilisateur = async (req, res) => {
    try {
        const cibleId = Number(req.params.id);
        const demandeurId = Number(req.utilisateur.id);
        const estProprietaire = cibleId === demandeurId;
        const estAdmin = req.utilisateur.role === "administrateur";

        if (!Number.isInteger(cibleId) || cibleId <= 0) {
            return res.status(400).json({
                message: "Identifiant d'utilisateur invalide"
            });
        }

        // Interdire à un utilisateur de modifier un autre compte
        if (!estProprietaire && !estAdmin) {
            return res.status(403).json({
                message: "Accès interdit : vous ne pouvez modifier que votre propre profil"
            });
        }

        const { nom, email, role, actif } = req.body;

        // Interdire à un non-administrateur (et à un utilisateur sur lui-même) de modifier son rôle ou son statut
        if (!estAdmin && (role !== undefined || actif !== undefined)) {
            return res.status(403).json({
                message: "Vous n'êtes pas autorisé à modifier le rôle ou le statut du compte"
            });
        }

        if (estAdmin && estProprietaire && role !== undefined && role !== req.utilisateur.role) {
            return res.status(403).json({
                message: "Un administrateur ne peut pas modifier son propre rôle"
            });
        }

        if (estAdmin && estProprietaire && actif !== undefined && Number(actif) === 0) {
            return res.status(400).json({
                message: "Vous ne pouvez pas désactiver votre propre compte administrateur"
            });
        }

        const nomNettoye = typeof nom === "string" ? nom.trim() : "";
        const emailNettoye = typeof email === "string" ? email.trim() : "";

        if (nomNettoye.length < 2) {
            return res.status(400).json({
                message: "Le nom doit contenir au moins 2 caractères"
            });
        }

        if (!REGEX_EMAIL.test(emailNettoye)) {
            return res.status(400).json({
                message: "L'adresse email est invalide"
            });
        }

        // Si un administrateur modifie un autre utilisateur, il peut aussi ajuster role et actif
        if (estAdmin && !estProprietaire && (role !== undefined || actif !== undefined)) {
            const [existants] = await db.query(
                "SELECT id, role, actif FROM users WHERE id = ?",
                [cibleId]
            );

            if (existants.length === 0) {
                return res.status(404).json({ message: "Utilisateur introuvable" });
            }

            const nouveauRole = role !== undefined ? role : existants[0].role;
            const nouvelActif =
                actif !== undefined ? (actif ? 1 : 0) : existants[0].actif;

            if (!ROLES_AUTORISES.includes(nouveauRole)) {
                return res.status(400).json({ message: "Rôle invalide" });
            }

            await db.query(
                "UPDATE users SET nom = ?, email = ?, role = ?, actif = ? WHERE id = ?",
                [nomNettoye, emailNettoye, nouveauRole, nouvelActif, cibleId]
            );
        } else {
            const [resultat] = await db.query(
                "UPDATE users SET nom = ?, email = ? WHERE id = ?",
                [nomNettoye, emailNettoye, cibleId]
            );

            if (resultat.affectedRows === 0) {
                return res.status(404).json({
                    message: "Utilisateur introuvable"
                });
            }
        }

        const [majUsers] = await db.query(
            "SELECT id, nom, email, role, actif, created_at FROM users WHERE id = ?",
            [cibleId]
        );

        res.json({
            message: "Informations mises à jour avec succès",
            utilisateur: majUsers[0]
        });
    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Cette adresse email est déjà utilisée par un autre compte"
            });
        }

        res.status(500).json({
            message: "Erreur lors de la modification de l'utilisateur"
        });
    }
};

// Modifier de façon sécurisée le mot de passe de l'utilisateur connecté
exports.modifierMotDePasse = async (req, res) => {
    try {
        const { ancienMotDePasse, nouveauMotDePasse } = req.body || {};

        if (!ancienMotDePasse || !nouveauMotDePasse) {
            return res.status(400).json({
                message: "L'ancien et le nouveau mot de passe sont obligatoires"
            });
        }

        if (String(nouveauMotDePasse).length < 6) {
            return res.status(400).json({
                message: "Le nouveau mot de passe doit contenir au moins 6 caractères"
            });
        }

        if (ancienMotDePasse === nouveauMotDePasse) {
            return res.status(400).json({
                message: "Le nouveau mot de passe doit être différent de l'ancien"
            });
        }

        const [users] = await db.query(
            "SELECT id, password_hash FROM users WHERE id = ?",
            [req.utilisateur.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        const ancienValide = await bcrypt.compare(
            ancienMotDePasse,
            users[0].password_hash
        );

        if (!ancienValide) {
            return res.status(400).json({
                message: "L'ancien mot de passe est incorrect"
            });
        }

        const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 10);

        await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [
            nouveauHash,
            req.utilisateur.id
        ]);

        res.json({
            message: "Mot de passe modifié avec succès"
        });
    } catch (error) {
        console.error("Erreur changement mot de passe :", error);
        res.status(500).json({
            message: "Erreur lors de la modification du mot de passe"
        });
    }
};

// Lister tous les utilisateurs (réservé à l'administrateur uniquement — sans password_hash)
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

// Consulter un utilisateur par son ID (propriétaire ou administrateur uniquement — sans password_hash)
exports.getUtilisateurParId = async (req, res) => {
    try {
        const cibleId = Number(req.params.id);

        if (!Number.isInteger(cibleId) || cibleId <= 0) {
            return res.status(400).json({ message: "Identifiant invalide" });
        }

        if (
            cibleId !== Number(req.utilisateur.id) &&
            req.utilisateur.role !== "administrateur"
        ) {
            return res.status(403).json({
                message: "Accès interdit : vous ne pouvez pas consulter ce compte"
            });
        }

        const [users] = await db.query(
            "SELECT id, nom, email, role, actif, created_at FROM users WHERE id = ?",
            [cibleId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération de l'utilisateur"
        });
    }
};
