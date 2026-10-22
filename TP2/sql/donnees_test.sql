
USE livresgourmands;

-- Ajouter les categories de test si elles n'existent pas
INSERT INTO categories (nom)
SELECT 'Romans'
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE nom = 'Romans'
);

INSERT INTO categories (nom)
SELECT 'Informatique'
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE nom = 'Informatique'
);

-- Ajouter un ouvrage de test
INSERT INTO ouvrages (titre, auteur, description, prix, stock, categorie_id)
SELECT
    'Le livre de test',
    'Auteur Test',
    'Ouvrage pour tester l API',
    19.99,
    10,
    c.id
FROM categories c
WHERE c.nom = 'Romans'
AND NOT EXISTS (
    SELECT 1 FROM ouvrages WHERE titre = 'Le livre de test'
);

-- Ajouter un deuxieme ouvrage de test
INSERT INTO ouvrages (titre, auteur, description, prix, stock, categorie_id)
SELECT
    'Initiation a l informatique',
    'Auteur Test',
    'Ouvrage pour tester les filtres et les categories',
    24.99,
    5,
    c.id
FROM categories c
WHERE c.nom = 'Informatique'
AND NOT EXISTS (
    SELECT 1 FROM ouvrages
    WHERE titre = 'Initiation a l informatique'
);
