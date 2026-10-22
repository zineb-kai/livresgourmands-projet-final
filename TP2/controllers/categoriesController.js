
const categorieModel = require("../models/categorieModel");

// Afficher les categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await categorieModel.getCategories();
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la recuperation des categories"
        });
    }
};

// Ajouter une categorie
exports.ajouterCategorie = async (req, res) => {
    try {
        const { nom, description } = req.body;

        if (!nom || !nom.trim()) {
            return res.status(400).json({
                message: "Le nom est obligatoire"
            });
        }

        const id = await categorieModel.ajouterCategorie(
            nom.trim(),
            description
        );

        res.status(201).json({
            message: "Categorie ajoutee avec succes",
            id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de l'ajout de la categorie"
        });
    }
};

// Modifier une categorie
exports.modifierCategorie = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description } = req.body;

        if (!nom || !nom.trim()) {
            return res.status(400).json({
                message: "Le nom est obligatoire"
            });
        }

        const existe = await categorieModel.getCategorieParId(id);

        if (!existe) {
            return res.status(404).json({
                message: "Categorie introuvable"
            });
        }

        await categorieModel.modifierCategorie(
            id,
            nom.trim(),
            description
        );

        res.json({
            message: "Categorie modifiee avec succes"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur lors de la modification de la categorie"
        });
    }
};

// Supprimer une categorie
exports.supprimerCategorie = async (req, res) => {
    try {
        const { id } = req.params;
        const lignes = await categorieModel.supprimerCategorie(id);

        if (lignes === 0) {
            return res.status(404).json({
                message: "Categorie introuvable"
            });
        }

        res.json({
            message: "Categorie supprimee avec succes"
        });
    } catch (error) {
        console.error(error);

        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.code === "ER_ROW_IS_REFERENCED"
        ) {
            return res.status(409).json({
                message: "Impossible de supprimer cette categorie car elle est utilisee par des ouvrages"
            });
        }

        res.status(500).json({
            message: "Erreur lors de la suppression de la categorie"
        });
    }
};
