# Livres Gourmands API

## 1. Présentation du projet

Livres Gourmands API est une API REST développée avec Node.js, Express et MySQL. Elle permet de gérer une librairie en ligne : les utilisateurs, les catégories, les ouvrages, les paniers, les commandes, les listes de cadeaux, les avis et les commentaires.

## 2. Technologies utilisées

- Node.js
- Express.js
- MySQL
- MySQL2
- dotenv
- bcrypt
- JSON Web Token (JWT)
- Postman

## 3. Installation du projet

Cloner le dépôt GitHub :

```bash
git clone URL_DU_DEPOT
cd livresgourmands-api
```

Installer les dépendances :

```bash
npm install
```

## 4. Configuration

Créer un fichier `.env` à la racine du projet et configurer les variables suivantes avec les paramètres de votre environnement :

```env
PORT=3000
DB_HOST=localhost
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=livresgourmands
```

Ne jamais publier le fichier `.env` sur GitHub.

## 5. Démarrage du serveur

Lancer l'API en mode développement :

```bash
npm run dev
```

Le serveur démarre sur :

`http://localhost:3000`

## 6. Principales routes de l'API

| Méthode | Route                                   | Description                    |
| ------- | --------------------------------------- | ------------------------------ |
| POST    | `/api/auth/register`                    | Créer un compte                |
| POST    | `/api/auth/login`                       | Se connecter                   |
| GET     | `/api/users`                            | Consulter les utilisateurs     |
| GET     | `/api/users/me`                         | Consulter son profil           |
| PUT     | `/api/users/:id`                        | Modifier un utilisateur        |
| GET     | `/api/categories`                       | Consulter les catégories       |
| POST    | `/api/categories`                       | Ajouter une catégorie          |
| PUT     | `/api/categories/:id`                   | Modifier une catégorie         |
| DELETE  | `/api/categories/:id`                   | Supprimer une catégorie        |
| GET     | `/api/ouvrages`                         | Consulter les ouvrages         |
| POST    | `/api/ouvrages`                         | Ajouter un ouvrage             |
| PUT     | `/api/ouvrages/:id`                     | Modifier un ouvrage            |
| DELETE  | `/api/ouvrages/:id`                     | Supprimer un ouvrage           |
| GET     | `/api/panier`                           | Consulter son panier           |
| POST    | `/api/panier/items`                     | Ajouter un article au panier   |
| GET     | `/api/commandes`                        | Consulter les commandes        |
| POST    | `/api/commandes`                        | Créer une commande             |
| GET     | `/api/listes/:code`                     | Consulter une liste de cadeaux |
| GET     | `/api/avis/ouvrage/:ouvrage_id`         | Consulter les avis             |
| GET     | `/api/commentaires/ouvrage/:ouvrage_id` | Consulter les commentaires     |

Les routes protégées nécessitent un jeton JWT lorsque l'authentification est exigée. Les permissions dépendent du rôle de l'utilisateur.

## 7. Base de données

La base de données utilisée est `livresgourmands`. Les scripts SQL du dossier `sql` servent à documenter la structure et à préparer des données de test.

**Attention :** vérifier que `schema.sql` décrit toutes les tables du projet avant de l'utiliser pour recréer la base de données.

## 8. Tests

Les routes ont été testées avec Postman. Les tests couvrent notamment les catégories, les ouvrages, les utilisateurs, le panier, les commandes, les avis et les commentaires.

## 9. Sécurité

- Les mots de passe sont enregistrés sous forme de hachage.
- L'authentification utilise des jetons JWT.
- Certaines opérations sont réservées aux utilisateurs ayant les rôles autorisés.
- Les informations confidentielles doivent rester dans le fichier `.env`.

## 10. Limites et améliorations possibles

- Compléter les tests automatisés.
- Documenter toutes les routes avec leurs paramètres et leurs réponses.
- Vérifier les validations des données reçues.
- Compléter et vérifier les scripts SQL avant toute nouvelle installation.
