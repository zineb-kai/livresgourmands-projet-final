# Rapport du projet — Livres Gourmands API

## 1. Présentation

Le projet Livres Gourmands API consiste à développer une API REST pour gérer une librairie en ligne. Le projet utilise Node.js, Express et MySQL. Il permet de gérer les utilisateurs, les catégories, les ouvrages, les paniers, les commandes, les listes de cadeaux, les avis et les commentaires.

## 2. Base de données et normalisation

La base de données `livresgourmands` est organisée en tables liées entre elles. Par exemple, chaque ouvrage peut être associé à une catégorie, chaque commande appartient à un client et les articles commandés sont enregistrés dans une table séparée.

Les clés primaires identifient les enregistrements et les clés étrangères relient les tables. Cette organisation réduit la répétition des informations et aide à maintenir la cohérence des données.

## 3. Règles métier et sécurité

L'API utilise des contrôleurs pour traiter les requêtes et des modèles pour séparer les accès à la base de données pour les ouvrages et les catégories. L'authentification utilise des jetons JWT et les mots de passe sont hachés avec bcrypt.

Les opérations de gestion des catégories et des ouvrages ont été testées avec Postman. Les routes d'avis et de commentaires ont également été vérifiées pour la consultation. D'autres tests sont nécessaires pour confirmer tous les scénarios métier, notamment la gestion du stock, les permissions et la validation des commentaires.

## 4. Limites et améliorations

La documentation complète des routes et les tests de tous les cas d'erreur restent à finaliser. Il serait utile d'ajouter des tests automatisés, de vérifier toutes les transactions liées aux commandes et de documenter précisément les permissions de chaque rôle.

## Conclusion

Ce projet m'a permis de mettre en pratique le développement d'une API REST, l'utilisation d'une base de données relationnelle et les mécanismes d'authentification. Il m'a aussi permis de comprendre l'importance d'une bonne organisation du code et des tests pour rendre une application plus fiable.
