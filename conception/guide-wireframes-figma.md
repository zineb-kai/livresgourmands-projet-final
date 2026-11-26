# Plan détaillé des Wireframes Figma — LivresGourmands.net

Ce guide décrit précisément l’ensemble des **wireframes basse fidélité** à assembler dans **Figma** pour les deux formats exigés par la grille d’évaluation (**Desktop `1440 × 900 px`** et **Mobile `390 × 844 px`**).

> **Note importante :** Les fichiers SVG de base prêts à importer dans Figma (par simple glisser-déposer sur le canevas) sont fournis dans le dossier `conception/svg-figma/`. Le fichier Figma final et son lien de partage public restent à finaliser manuellement dans l’outil Figma avant le dépôt sur Léa.

---

## 1. Grille et conventions globales Figma

- **Format Desktop :** Frame `1440 × 900 px` (hauteur extensible selon la page), grille `12 colonnes`, marges `80 px`, gouttière `24 px`.
- **Format Mobile :** Frame `390 × 844 px`, grille `4 colonnes`, marges `16 px`, gouttière `12 px`.
- **Style Wireframe (basse fidélité) :** Niveaux de gris (`#FFFFFF`, `#F2F2F2`, `#D9D9D9`, `#8C8C8C`, `#333333`) afin de valider la structure et la hiérarchie fonctionnelle avant l’application de la charte graphique.
- **Composants réutilisables (Components Figma) :**
  1. `Header / Navbar` (Desktop : logo gauche, liens centre, compte/panier droite ; Mobile : logo + menu hamburger).
  2. `Footer` (Desktop : 3 colonnes + barre copyright ; Mobile : 3 blocs empilés verticalement).
  3. `Carte Ouvrage` (Zone couverture, badges stock/catégorie, titre, auteur, extrait 2 lignes, prix, boutons `Voir les détails` + `Ajouter au panier`).
  4. `Sélecteur Quantité` (Bouton `−`, champ nombre, bouton `+`).

---

## 2. Spécification détaillée page par page (Desktop & Mobile)

### Page 1 — Accueil (`/`)
- **SVG fourni :** `conception/svg-figma/wireframe-accueil-desktop.svg` & `wireframe-accueil-mobile.svg`
- **Desktop (`1440 × 1800`) :**
  - **En-tête fixe (`72 px`) :** Logo `LivresGourmands.net` à gauche ; liens `Accueil`, `Catalogue`, `Catégories`, `Liste d'un ami`, `Panier [0]` ; boutons `Connexion` / `Inscription` (ou menu compte + `Déconnexion`).
  - **Zone Carrousel (`380 px`) :** 3 bannières défilantes avec flèches gauche/droite (`6 %`), indicateurs 3 points, titre H1, sous-titre et 2 boutons CTA (`Découvrir le catalogue`, `Explorer les catégories`).
  - **Barre Recherche & Filtres rapides (`120 px`) :** Colonne gauche (6 col) champ recherche + bouton `Rechercher` ; colonne droite (6 col) boutons pilules `Toutes (26)` + 6 catégories.
  - **Sélection de la librairie :** Titre H2 + lien `Voir tout le catalogue`, grille 4 colonnes de `Carte Ouvrage`.
  - **Explorer par catégorie :** Grille 3 colonnes de 6 cartes catégorie (`Nom`, `Compteur`, `Description`, bouton `Parcourir le rayon`).
  - **Nouveautés :** Grille 4 colonnes des derniers ajouts.
  - **Bloc Listes cadeaux & Parcours Ami :** 2 colonnes (6 col présentation + boutons `Créer une liste` / `Accès Ami` ; 6 col champ `Code personnel` + bouton `Ouvrir`).
  - **Avantages librairie :** 4 colonnes (icône + titre + texte court).
  - **Pied de page.**
- **Mobile (`390 × 2600`) :** Empilement vertical 1 colonne, menu hamburger, cartes en pleine largeur (`100 %`), boutons empilés.
- **Interactions :** Changement de slide carrousel, filtrage instantané par pilule catégorie, redirection `/catalogue?q=...`, accès direct `/listes/partage/:code`.

### Page 2 — Catalogue (`/catalogue`)
- **Desktop (`1440 × 1200`) / Mobile (`390 × 1600`) :**
  - En-tête centré (`Notre catalogue` + sous-titre).
  - Panneau filtres : champ recherche (8 col) + liste déroulante `Toutes les catégories` (4 col) — empilés sur mobile.
  - Compteur (`26 ouvrage(s) trouvé(s)`).
  - Grille responsive (`4 col` XL, `3 col` LG, `2 col` SM, `1 col` Mobile) de `Carte Ouvrage` avec badge vert `En stock (X)` ou rouge `Rupture de stock`.
- **Interactions :** Filtrage temps réel (titre, auteur, ISBN), synchronisation URL `?categorie=&q=`, clic couverture/détails → `/ouvrages/:id`, ajout rapide au panier.

### Page 3 — Catégories (`/categories`)
- **Desktop (`1440 × 950`) / Mobile (`390 × 1500`) :**
  - Titre H1 centré (`Nos catégories`).
  - Grille `3 × 2` (desktop) / `1 × 6` (mobile) de cartes avec bandeau illustré (`130 px`), titre catégorie, badge compteur, description et bouton `Voir les ouvrages`.
- **Interactions :** Clic sur `Voir les ouvrages` → redirection `/catalogue?categorie=<id>`.

### Page 4 — Fiche produit (`/ouvrages/:id`)
- **SVG fourni :** `conception/svg-figma/wireframe-fiche-produit-desktop.svg`
- **Desktop (`1440 × 1350`) / Mobile (`390 × 1850`) :**
  - Fil d’Ariane (`Accueil / Catalogue / Titre`) + bouton `Retour au catalogue` à droite.
  - Bloc principal 2 colonnes :
    - Gauche (4 col) : Grande couverture (`min-height 410 px`).
    - Droite (8 col) : Badges catégorie/stock, Titre H1, Auteur, Note moyenne (étoiles), Prix, Description, Encadré caractéristiques (`ISBN`, `Catégorie`, `Disponibilité`), Zone d’action (`Sélecteur Quantité`, bouton principal `Ajouter au panier` désactivé si stock = 0, bouton secondaire `Ajouter à une liste cadeau`).
  - Bloc inférieur 2 colonnes (empilé sur mobile) :
    - Colonne gauche : `Avis des lecteurs (N)` + badge moyenne + formulaire étoiles 1–5 (acheteurs vérifiés) + liste des avis (`Modifier`/`Supprimer` sur son avis).
    - Colonne droite : `Commentaires (N)` + formulaire commentaire (soumis à modération) + liste des commentaires validés.
- **Interactions :** Modification quantité bornée au stock, ajout panier + alerte avec lien `/panier`, ouverture modale liste cadeau, publication/édition/suppression d’avis, soumission de commentaire.

### Page 5 — Panier dynamique (`/panier`)
- **SVG fourni :** `conception/svg-figma/wireframe-panier-desktop.svg`
- **Desktop (`1440 × 900`) / Mobile (`390 × 1200`) :**
  - En-tête : `Mon panier` + compteur à gauche ; boutons `Continuer mes achats` et `Vider le panier` à droite.
  - 2 colonnes (8 col / 4 col sur desktop ; empilé sur mobile) :
    - Gauche : Liste des lignes d’articles (miniature couverture, titre, auteur, prix unitaire, badge stock, sélecteur quantité plafonné au stock, sous-total, bouton `Supprimer`).
    - Droite : Carte `Récapitulatif` (`Articles`, `Livraison`, `Total estimé`, bandeau statut de synchronisation, bouton CTA `Valider la commande` ou `Se connecter pour commander`).
- **Interactions :** Recalcul instantané des sous-totaux/total, blocage au stock max, confirmation avant vidage, redirection `/commandes` ou `/login`.

### Page 6 — Commandes & Paiement simulé (`/commandes`)
- **Desktop (`1440 × 1250`) / Mobile (`390 × 1700`) :**
  - Bloc `Finaliser ma commande` (si panier non vide) :
    - Gauche (7 col) : Champ `Adresse de livraison`, 3 radios `Mode de livraison` (`Lent` Gratuit, `Rapide` `+4,99 $`, `24h chrono` `+9,99 $`), 2 radios `Mode de règlement` (`Carte bancaire test`, `PayPal Sandbox test`), encadré mode test avec switch simulation d’échec, bouton `Confirmer et payer (test)`.
    - Droite (5 col) : `Résumé de votre panier` + frais de livraison + montant total.
  - Bandeau vert de confirmation après paiement réussi (n° commande, réf. `TEST-...`, total).
  - Tableau responsive `Mes commandes` (`N°`, `Date`, `Livraison`, `Paiement`, `Statut`, `Total`, bouton `Détails`) + modale détails avec reçu de paiement.

### Page 7 — Mes listes cadeaux (`/listes`) & Liste partagée Ami (`/listes/partage/:code`)
- **SVG fourni :** `conception/svg-figma/wireframe-liste-ami-mobile.svg`
- **Mes listes (`/listes`) :** 2 blocs supérieurs (`Créer une nouvelle liste` 7 col / `Consulter la liste d'un ami` 5 col), puis cartes de listes avec boutons `Renommer`, `Aperçu Ami`, `Supprimer`, champ `Lien de partage` + bouton `Copier le lien` + code, grille d’articles avec bouton `Retirer`.
- **Liste partagée Ami (`/listes/partage/:code`) :** Bandeau saisie code personnel, en-tête public (`Nom de la liste`, `Préparée par <Prénom Nom>` — sans e-mail), grille de cartes ouvrages avec `Offrir cet ouvrage (test)` (modale achat cadeau) et `Ajouter à mon panier`.

### Page 8 — Profil utilisateur (`/profil`), Connexion (`/login`) et Inscription (`/register`)
- **Connexion / Inscription :** Carte centrée (`max 480 px`), logo `LivresGourmands.net`, champs labellisés, bouton pleine largeur, lien croisé entre connexion et inscription.
- **Profil (`/profil`) :** Bandeau identité (avatar initiale, nom, email, badge rôle) + 4 cartes de statistiques personnelles ; 2 formulaires côte à côte (`Informations personnelles` avec rôle en lecture seule / `Modifier mon mot de passe`) ; 2 blocs aperçus (`Dernières commandes` / `Mes listes cadeaux`).

### Page 9 — Tableau de bord Administrateur & Éditeur (`/dashboard`)
- **SVG fourni :** `conception/svg-figma/wireframe-dashboard-desktop.svg`
- **Desktop (`1440 × 950`) / Mobile (`390 × 1400`) :**
  - En-tête : Titre selon le rôle (`Administration` ou `Espace Éditeur`), badge rôle, bouton `Actualiser les données`.
  - Menu latéral gauche (2–3 col sur desktop, barre pilules horizontale sur mobile) : `Vue d'ensemble`, `Ouvrages`, `Commentaires` (et pour `administrateur` uniquement : `Catégories`, `Commandes`, `Utilisateurs`).
  - Zone principale (9–10 col) : 6 cartes KPI réelles (`Ouvrages`, `Catégories`, `Commentaires en attente`, `Commandes`, `Chiffre d'affaires`, `Utilisateurs`), ou tableaux CRUD avec recherche, filtres et modales de confirmation.
