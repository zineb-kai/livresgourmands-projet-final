
const db = require("../config/db");

// Afficher les categories
exports.getCategories = async () => {
    const [categories] = await db.query(
        "SELECT * FROM categories ORDER BY nom"
    );

    return categories;
};

// Ajouter une categorie
exports.ajouterCategorie = async (nom, description) => {
    const [resultat] = await db.query(
        "INSERT INTO categories (nom, description) VALUES (?, ?)",
        [nom, description || null]
    );

    return resultat.insertId;
};

// Verifier si une categorie existe
exports.getCategorieParId = async (id) => {
    const [categories] = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [id]
    );

    return categories.length > 0;
};

// Modifier une categorie
exports.modifierCategorie = async (id, nom, description) => {
    const [resultat] = await db.query(
        "UPDATE categories SET nom = ?, description = ? WHERE id = ?",
        [nom, description || null, id]
    );

    return resultat.affectedRows;
};

// Supprimer une categorie
exports.supprimerCategorie = async (id) => {
    const [resultat] = await db.query(
        "DELETE FROM categories WHERE id = ?",
        [id]
    );

    return resultat.affectedRows;
};
