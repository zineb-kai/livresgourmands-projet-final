
CREATE DATABASE IF NOT EXISTS livresgourmands
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE livresgourmands;

-- 1. Utilisateurs
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('client','editeur','gestionnaire','administrateur')
        NOT NULL DEFAULT 'client',
    actif TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Ouvrages
CREATE TABLE ouvrages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    auteur VARCHAR(150) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    description TEXT,
    prix DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    categorie_id INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ouvrages_titre (titre),
    INDEX idx_ouvrages_categorie_stock (categorie_id, stock),
    FOREIGN KEY (categorie_id) REFERENCES categories(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Panier
CREATE TABLE panier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    actif TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    INDEX (client_id),
    FOREIGN KEY (client_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Articles du panier
CREATE TABLE panier_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    panier_id INT NOT NULL,
    ouvrage_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(10,2) NOT NULL,
    UNIQUE KEY unique_panier_ouvrage (panier_id, ouvrage_id),
    INDEX (ouvrage_id),
    FOREIGN KEY (panier_id) REFERENCES panier(id)
        ON DELETE CASCADE,
    FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Commandes
CREATE TABLE commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    statut ENUM('en_cours','payee','annulee','expediee')
        NOT NULL DEFAULT 'en_cours',
    adresse_livraison TEXT NOT NULL,
    mode_livraison VARCHAR(100),
    mode_paiement VARCHAR(50),
    payment_provider_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_commandes_client_date (client_id, date),
    FOREIGN KEY (client_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Articles des commandes
CREATE TABLE commande_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    ouvrage_id INT NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire DECIMAL(10,2) NOT NULL,
    INDEX (commande_id),
    INDEX (ouvrage_id),
    FOREIGN KEY (commande_id) REFERENCES commandes(id)
        ON DELETE CASCADE,
    FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Listes de cadeaux
CREATE TABLE listes_cadeaux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    proprietaire_id INT NOT NULL,
    code_partage VARCHAR(100) NOT NULL UNIQUE,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (proprietaire_id),
    FOREIGN KEY (proprietaire_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Articles des listes de cadeaux
CREATE TABLE liste_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    liste_id INT NOT NULL,
    ouvrage_id INT NOT NULL,
    quantite_souhaitee INT NOT NULL DEFAULT 1,
    UNIQUE KEY unique_liste_ouvrage (liste_id, ouvrage_id),
    INDEX (ouvrage_id),
    FOREIGN KEY (liste_id) REFERENCES listes_cadeaux(id)
        ON DELETE CASCADE,
    FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Avis
CREATE TABLE avis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    ouvrage_id INT NOT NULL,
    note INT NOT NULL,
    commentaire TEXT DEFAULT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_avis_client_ouvrage (client_id, ouvrage_id),
    INDEX (ouvrage_id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Commentaires
CREATE TABLE commentaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    ouvrage_id INT NOT NULL,
    contenu TEXT NOT NULL,
    valide TINYINT(1) NOT NULL DEFAULT 0,
    date_soumission TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_validation DATETIME DEFAULT NULL,
    valide_par INT DEFAULT NULL,
    INDEX (client_id),
    INDEX (ouvrage_id),
    INDEX (valide_par),
    INDEX idx_commentaires_validation (valide),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id),
    FOREIGN KEY (valide_par) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Paiements
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(255) DEFAULT NULL,
    statut VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (commande_id),
    FOREIGN KEY (commande_id) REFERENCES commandes(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
