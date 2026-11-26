const db = require("../config/db");

// Afficher les ouvrages disponibles (ou tous les ouvrages si inclureRupture = true)
exports.getOuvrages = async (inclureRupture = false) => {
    const conditionStock = inclureRupture ? "" : "WHERE o.stock > 0";

    const [ouvrages] = await db.query(
        `SELECT o.*, c.nom AS categorie_nom
         FROM ouvrages o
         LEFT JOIN categories c ON c.id = o.categorie_id
         ${conditionStock}
         ORDER BY o.titre`
    );

    return ouvrages;
};

// Récupérer un ouvrage par son identifiant avec le nom de sa catégorie
exports.getOuvrageById = async (id) => {
    const [ouvrages] = await db.query(
        `SELECT o.*, c.nom AS categorie_nom
         FROM ouvrages o
         LEFT JOIN categories c ON c.id = o.categorie_id
         WHERE o.id = ?`,
        [id]
    );

    return ouvrages[0] || null;
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