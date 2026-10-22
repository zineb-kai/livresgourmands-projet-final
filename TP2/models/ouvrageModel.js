
const db = require("../config/db");

// Afficher les ouvrages disponibles
exports.getOuvrages = async () => {
    const [ouvrages] = await db.query(
        `SELECT * FROM ouvrages
         WHERE stock > 0
         ORDER BY titre`
    );

    return ouvrages;
};

// Ajouter un ouvrage
exports.ajouterOuvrage = async (ouvrage) => {
    const {
        titre,
        auteur,
        isbn,
        description,
        prix,
        stock,
        categorie_id
    } = ouvrage;

    const [resultat] = await db.query(
        `INSERT INTO ouvrages
        (titre, auteur, isbn, description, prix, stock, categorie_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            titre,
            auteur,
            isbn || null,
            description || null,
            Number(prix),
            Number(stock),
            categorie_id || null
        ]
    );

    return resultat.insertId;
};

// Modifier un ouvrage
exports.modifierOuvrage = async (id, ouvrage) => {
    const {
        titre,
        auteur,
        isbn,
        description,
        prix,
        stock,
        categorie_id
    } = ouvrage;

    const [resultat] = await db.query(
        `UPDATE ouvrages
         SET titre = ?, auteur = ?, isbn = ?, description = ?,
             prix = ?, stock = ?, categorie_id = ?
         WHERE id = ?`,
        [
            titre,
            auteur,
            isbn || null,
            description || null,
            Number(prix),
            Number(stock),
            categorie_id || null,
            id
        ]
    );

    return resultat.affectedRows;
};

// Supprimer un ouvrage
exports.supprimerOuvrage = async (id) => {
    const [resultat] = await db.query(
        "DELETE FROM ouvrages WHERE id = ?",
        [id]
    );

    return resultat.affectedRows;
};
