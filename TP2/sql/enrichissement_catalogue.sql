-- =====================================================================
-- Script d'enrichissement du catalogue — LivresGourmands.net
-- Ajoute 4 nouvelles catégories (6 au total) et 24 ouvrages vérifiables
-- sans doublons et SANS supprimer ni modifier les données existantes.
--
-- IMPORTANT : Script séparé à exécuter uniquement après validation.
-- =====================================================================

USE livresgourmands_db;

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. Catégories (complément sans doublon + description si absente)
-- ---------------------------------------------------------------------
UPDATE categories
SET description = 'Classiques intemporels et grands récits littéraires francophones et internationaux.'
WHERE nom = 'Romans' AND (description IS NULL OR description = '');

UPDATE categories
SET description = 'Développement web, architecture logicielle, bonnes pratiques et programmation moderne.'
WHERE nom = 'Informatique' AND (description IS NULL OR description = '');

INSERT INTO categories (nom, description)
SELECT 'Cuisine et gastronomie', 'Techniques culinaires, pâtisserie française, terroirs et livres de chefs.'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nom = 'Cuisine et gastronomie');

INSERT INTO categories (nom, description)
SELECT 'Développement personnel', 'Habitudes positives, concentration, communication et équilibre au quotidien.'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nom = 'Développement personnel');

INSERT INTO categories (nom, description)
SELECT 'Jeunesse', 'Contes illustrés, récits d''aventure et lectures incontournables pour jeunes lecteurs.'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nom = 'Jeunesse');

INSERT INTO categories (nom, description)
SELECT 'Culture et découverte', 'Histoire, sciences humaines, voyages et grands regards sur le monde.'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE nom = 'Culture et découverte');

-- ---------------------------------------------------------------------
-- 2. Ouvrages — 24 références réelles réparties dans les 6 catégories
--    (insertion idempotente basée sur l'ISBN unique)
-- ---------------------------------------------------------------------

-- === Catégorie : Romans (4 ouvrages) ===
INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'L''Étranger',
    'Albert Camus',
    '978-2-07-036002-4',
    'Un récit sobre et marquant sur l''absurde et le regard porté sur la société, à travers le destin de Meursault à Alger.',
    14.95,
    14,
    c.id
FROM categories c
WHERE c.nom = 'Romans'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-07-036002-4');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Les Misérables',
    'Victor Hugo',
    '978-2-253-09633-7',
    'Grande fresque sociale et humaine du XIXe siècle suivant la quête de rédemption de Jean Valjean dans un Paris bouleversé.',
    22.50,
    9,
    c.id
FROM categories c
WHERE c.nom = 'Romans'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-253-09633-7');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Le Comte de Monte-Cristo',
    'Alexandre Dumas',
    '978-2-07-040537-4',
    'Injustement emprisonné, Edmond Dantès prépare durant des années une vengeance minutieuse dans un roman d''aventure captivant.',
    24.90,
    11,
    c.id
FROM categories c
WHERE c.nom = 'Romans'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-07-040537-4');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Bonheur d''occasion',
    'Gabrielle Roy',
    '978-2-89052-575-7',
    'Chef-d''œuvre de la littérature québécoise dépeignant avec sensibilité la vie quotidienne d''une famille du quartier Saint-Henri à Montréal.',
    18.95,
    8,
    c.id
FROM categories c
WHERE c.nom = 'Romans'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-89052-575-7');

-- === Catégorie : Informatique (4 ouvrages) ===
INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Clean Code : Guide de développement logiciel',
    'Robert C. Martin',
    '978-0-13-235088-4',
    'Référence incontournable sur l''écriture d''un code clair, lisible, maintenable et structuré à l''aide d''exemples concrets.',
    46.99,
    7,
    c.id
FROM categories c
WHERE c.nom = 'Informatique'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-0-13-235088-4');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'The Pragmatic Programmer',
    'David Thomas & Andrew Hunt',
    '978-0-13-595705-9',
    'Conseils pratiques, méthodes d''organisation et réflexes d''ingénierie pour concevoir des logiciels fiables et évolutifs.',
    49.95,
    6,
    c.id
FROM categories c
WHERE c.nom = 'Informatique'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-0-13-595705-9');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Eloquent JavaScript',
    'Marijn Haverbeke',
    '978-1-7185-0410-3',
    'Exploration progressive de JavaScript moderne, du langage de base jusqu''au développement côté navigateur et Node.js.',
    39.50,
    10,
    c.id
FROM categories c
WHERE c.nom = 'Informatique'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-1-7185-0410-3');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Designing Data-Intensive Applications',
    'Martin Kleppmann',
    '978-1-4493-7332-0',
    'Analyse approfondie des architectures de données modernes, bases relationnelles, réplication, transactions et systèmes distribués.',
    54.99,
    0,
    c.id
FROM categories c
WHERE c.nom = 'Informatique'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-1-4493-7332-0');

-- === Catégorie : Cuisine et gastronomie (4 ouvrages) ===
INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Le Guide Culinaire',
    'Auguste Escoffier',
    '978-2-08-200803-7',
    'Ouvrage fondateur de la gastronomie française regroupant les bases essentielles des sauces, cuissons et préparations classiques.',
    38.95,
    12,
    c.id
FROM categories c
WHERE c.nom = 'Cuisine et gastronomie'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-08-200803-7');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Pâtisserie : L''ultime référence',
    'Christophe Felder',
    '978-2-7324-4212-9',
    'Plus de deux cents recettes illustrées pas à pas pour réussir pâtes, crèmes, tartes, entremets et viennoiseries maison.',
    44.95,
    9,
    c.id
FROM categories c
WHERE c.nom = 'Cuisine et gastronomie'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-7324-4212-9');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Sel, Gras, Acide, Chaleur',
    'Samin Nosrat',
    '978-1-4767-5383-6',
    'Une approche claire et pédagogique des quatre piliers qui transforment chaque plat du quotidien en cuisine savoureuse.',
    36.50,
    15,
    c.id
FROM categories c
WHERE c.nom = 'Cuisine et gastronomie'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-1-4767-5383-6');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'On Va Déguster la France',
    'François-Régis Gaudry',
    '978-2-501-11672-5',
    'Encyclopédie gourmande mêlant recettes régionales, anecdotes historiques, produits du terroir et savoir-faire artisans.',
    49.00,
    5,
    c.id
FROM categories c
WHERE c.nom = 'Cuisine et gastronomie'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-501-11672-5');

-- === Catégorie : Développement personnel (4 ouvrages) ===
INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Un rien peut tout changer (Atomic Habits)',
    'James Clear',
    '978-2-03-596331-4',
    'Méthode concrète fondée sur de petits ajustements quotidiens pour bâtir des habitudes durables et progresser régulièrement.',
    26.95,
    16,
    c.id
FROM categories c
WHERE c.nom = 'Développement personnel'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-03-596331-4');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Les 7 habitudes de ceux qui réalisent tout ce qu''ils entreprennent',
    'Stephen R. Covey',
    '978-2-290-05917-3',
    'Principes d''efficacité personnelle et relationnelle pour clarifier ses priorités et agir de manière proactive.',
    24.95,
    11,
    c.id
FROM categories c
WHERE c.nom = 'Développement personnel'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-290-05917-3');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Deep Work : Retrouver la concentration',
    'Cal Newport',
    '978-2-226-39962-5',
    'Stratégies pratiques pour limiter les distractions numériques et consacrer un temps de qualité au travail approfondi.',
    27.50,
    8,
    c.id
FROM categories c
WHERE c.nom = 'Développement personnel'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-226-39962-5');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Les Quatre Accords toltèques',
    'Don Miguel Ruiz',
    '978-2-88353-190-1',
    'Quatre règles simples de sagesse pratique pour cultiver une communication apaisée et gagner en liberté intérieure.',
    19.95,
    13,
    c.id
FROM categories c
WHERE c.nom = 'Développement personnel'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-88353-190-1');

-- === Catégorie : Jeunesse (4 ouvrages) ===
INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Le Petit Prince',
    'Antoine de Saint-Exupéry',
    '978-2-07-061275-8',
    'Conte poétique et philosophique célébrant l''amitié, la curiosité et l''importance de voir avec le cœur.',
    13.95,
    20,
    c.id
FROM categories c
WHERE c.nom = 'Jeunesse'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-07-061275-8');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Harry Potter à l''école des sorciers',
    'J. K. Rowling',
    '978-2-07-058462-8',
    'Premier tome d''une aventure magique où un jeune garçon découvre son entrée à l''école de sorcellerie Poudlard.',
    17.95,
    18,
    c.id
FROM categories c
WHERE c.nom = 'Jeunesse'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-07-058462-8');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Matilda',
    'Roald Dahl',
    '978-2-07-065025-5',
    'Portrait malicieux d''une fillette passionnée de lecture qui fait preuve d''ingéniosité face aux injustices des adultes.',
    14.50,
    12,
    c.id
FROM categories c
WHERE c.nom = 'Jeunesse'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-07-065025-5');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Les Aventures de Tintin : Le Secret de La Licorne',
    'Hergé',
    '978-2-203-00110-7',
    'Une maquette de navire ancien entraîne Tintin et le capitaine Haddock sur la piste d''un trésor familial disparu.',
    19.95,
    0,
    c.id
FROM categories c
WHERE c.nom = 'Jeunesse'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-203-00110-7');

-- === Catégorie : Culture et découverte (4 ouvrages) ===
INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Sapiens : Une brève histoire de l''humanité',
    'Yuval Noah Harari',
    '978-2-226-25701-7',
    'Synthèse accessible retraçant les grandes révolutions cognitives, agricoles et scientifiques qui ont façonné nos sociétés.',
    29.95,
    10,
    c.id
FROM categories c
WHERE c.nom = 'Culture et découverte'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-226-25701-7');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Une brève histoire du temps',
    'Stephen Hawking',
    '978-2-08-145209-1',
    'Voyage vulgarisé au cœur de la cosmologie moderne, des trous noirs aux origines de l''univers.',
    18.50,
    9,
    c.id
FROM categories c
WHERE c.nom = 'Culture et découverte'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-08-145209-1');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'L''Usage du monde',
    'Nicolas Bouvier',
    '978-2-228-89401-2',
    'Récit de voyage classique de la Yougoslavie jusqu''aux portes de l''Asie, célébrant la rencontre, l''écoute et la découverte.',
    16.95,
    7,
    c.id
FROM categories c
WHERE c.nom = 'Culture et découverte'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-2-228-89401-2');

INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
SELECT
    'Histoire de l''art',
    'Ernst H. Gombrich',
    '978-0-7148-9207-8',
    'Panorama clair et illustré des grands courants artistiques, de l''Antiquité jusqu''à la création contemporaine.',
    42.00,
    6,
    c.id
FROM categories c
WHERE c.nom = 'Culture et découverte'
  AND NOT EXISTS (SELECT 1 FROM ouvrages WHERE isbn = '978-0-7148-9207-8');

COMMIT;
