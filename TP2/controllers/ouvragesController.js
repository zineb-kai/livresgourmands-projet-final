const ouvrageModel = require("../models/ouvrageModel");

// Afficher les ouvrages (inclut les ruptures de stock si ?tous=true)
exports.getOuvrages = async (req, res) => {
    try {
        const inclureRupture = req.query.tous === "true";
        const ouvrages = await ouvrageModel.getOuvrages(inclureRupture);
        res.json(ouvrages);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la récupération des ouvrages"
        });
    }
};

// Récupérer un ouvrage par son identifiant
exports.getOuvrageById = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier la validité de l'identifiant
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        // Rechercher l'ouvrage dans MySQL
        const ouvrage = await ouvrageModel.getOuvrageById(id);

        // Vérifier si l'ouvrage existe
        if (!ouvrage) {
            return res.status(404).json({
                message: "Ouvrage introuvable"
            });
        }

        // Retourner les informations de l'ouvrage
        res.status(200).json(ouvrage);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Erreur lors de la récupération de l'ouvrage"
        });
    }
};

// Ajouter un ouvrage
exports.ajouterOuvrage = async (req, res) => {
    try {
        const {
            titre,
            auteur,
            prix,
            stock
        } = req.body;

        if (!titre || !auteur || prix === undefined || stock === undefined) {
            return res.status(400).json({
                message: "Le titre, l'auteur, le prix et le stock sont obligatoires"
            });
        }

        if (
            !Number.isFinite(Number(prix)) ||
            Number(prix) < 0 ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: "Le prix ou le stock est invalide"
            });
        }

        const id = await ouvrageModel.ajouterOuvrage(req.body);

        res.status(201).json({
            message: "Ouvrage ajouté avec succès",
            id
        });
    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Cet ISBN existe déjà"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                message: "La catégorie indiquée n'existe pas"
            });
        }

        res.status(500).json({
            message: "Erreur lors de l'ajout de l'ouvrage"
        });
    }
};

// Modifier un ouvrage
exports.modifierOuvrage = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            titre,
            auteur,
            prix,
            stock
        } = req.body;

        if (!titre || !auteur || prix === undefined || stock === undefined) {
            return res.status(400).json({
                message: "Le titre, l'auteur, le prix et le stock sont obligatoires"
            });
        }

        if (
            !Number.isFinite(Number(prix)) ||
            Number(prix) < 0 ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: "Le prix ou le stock est invalide"
            });
        }

        const lignes = await ouvrageModel.modifierOuvrage(id, req.body);

        if (lignes === 0) {
            return res.status(404).json({
                message: "Ouvrage introuvable"
            });
        }

        res.json({
            message: "Ouvrage modifié avec succès"
        });
    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Cet ISBN existe déjà"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                message: "La catégorie indiquée n'existe pas"
            });
        }

        res.status(500).json({
            message: "Erreur lors de la modification de l'ouvrage"
        });
    }
};

// Supprimer un ouvrage
exports.supprimerOuvrage = async (req, res) => {
    try {
        const { id } = req.params;

        const lignes = await ouvrageModel.supprimerOuvrage(id);

        if (lignes === 0) {
            return res.status(404).json({
                message: "Ouvrage introuvable"
            });
        }

        res.json({
            message: "Ouvrage supprimé avec succès"
        });
    } catch (error) {
        console.error(error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                message: "Impossible de supprimer cet ouvrage, car il est utilisé dans une commande, un panier, une liste ou un avis"
            });
        }

        res.status(500).json({
            message: "Erreur lors de la suppression de l'ouvrage"
        });
    }
};