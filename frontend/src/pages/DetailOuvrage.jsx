import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    Container,
    Row,
    Col,
    Card,
    Badge,
    Button,
    Form,
    InputGroup,
    Alert,
    Spinner,
    Breadcrumb,
    Modal
} from "react-bootstrap";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import CouvertureOuvrage from "../components/CouvertureOuvrage";
import {
    IconePanier,
    IconeCadeau,
    IconeFlecheRetour,
    IconeEtoile,
    IconeCommentaire
} from "../components/Icones";
import { formaterPrix, formaterDate } from "../utils/couvertures";

function DetailOuvrage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { utilisateur } = useAuth();
    const { ajouterAuPanier, obtenirQuantiteDansPanier } = useCart();

    const estModerateur =
        utilisateur &&
        (utilisateur.role === "administrateur" ||
            utilisateur.role === "editeur");

    // États des données récupérées depuis l'API
    const [ouvrage, setOuvrage] = useState(null);
    const [categorieNom, setCategorieNom] = useState("");
    const [avis, setAvis] = useState([]);
    const [commentaires, setCommentaires] = useState([]);
    const [commentairesEnAttente, setCommentairesEnAttente] = useState([]);

    // États d'interface principaux
    const [quantite, setQuantite] = useState(1);
    const [chargement, setChargement] = useState(true);
    const [ajoutEnCours, setAjoutEnCours] = useState(false);
    const [erreur, setErreur] = useState("");
    const [messageAction, setMessageAction] = useState(null);

    // États de la modale "Ajouter à une liste cadeau"
    const [modalListeOuverte, setModalListeOuverte] = useState(false);
    const [mesListes, setMesListes] = useState([]);
    const [chargementListes, setChargementListes] = useState(false);
    const [listeSelectionneeId, setListeSelectionneeId] = useState("");
    const [nouveauNomListe, setNouveauNomListe] = useState("");
    const [qteListe, setQteListe] = useState(1);
    const [envoiListe, setEnvoiListe] = useState(false);
    const [erreurListe, setErreurListe] = useState("");

    // États du formulaire d'avis (création / modification)
    const [noteAvis, setNoteAvis] = useState(5);
    const [commentaireAvis, setCommentaireAvis] = useState("");
    const [envoiAvis, setEnvoiAvis] = useState(false);
    const [messageAvis, setMessageAvis] = useState(null);
    const [editionAvisId, setEditionAvisId] = useState(null);
    const [noteEdition, setNoteEdition] = useState(5);
    const [texteEdition, setTexteEdition] = useState("");
    const [confirmationSupprAvisId, setConfirmationSupprAvisId] = useState(null);

    // États du formulaire de commentaire
    const [nouveauCommentaire, setNouveauCommentaire] = useState("");
    const [envoiCommentaire, setEnvoiCommentaire] = useState(false);
    const [messageCommentaire, setMessageCommentaire] = useState(null);

    // Recharger uniquement les avis et les commentaires (après publication ou modération)
    const rechargerAvisEtCommentaires = useCallback(async () => {
        try {
            const requetes = [
                api.get(`/avis/ouvrage/${id}`).catch(() => ({ data: [] })),
                api.get(`/commentaires/ouvrage/${id}`).catch(() => ({ data: [] }))
            ];

            if (estModerateur) {
                requetes.push(
                    api
                        .get(`/commentaires?statut=en_attente&ouvrage_id=${id}`)
                        .catch(() => ({ data: [] }))
                );
            }

            const [resAvis, resCommentaires, resAttente] =
                await Promise.all(requetes);

            setAvis(Array.isArray(resAvis.data) ? resAvis.data : []);
            setCommentaires(
                Array.isArray(resCommentaires.data) ? resCommentaires.data : []
            );
            if (estModerateur && resAttente) {
                setCommentairesEnAttente(
                    Array.isArray(resAttente.data) ? resAttente.data : []
                );
            }
        } catch (error) {
            console.error("Erreur rafraîchissement avis/commentaires :", error);
        }
    }, [id, estModerateur]);

    // Charger dynamiquement les détails de l'ouvrage, ses avis et ses commentaires validés
    useEffect(() => {
        const chargerDetails = async () => {
            setChargement(true);
            setErreur("");
            setMessageAction(null);
            setMessageAvis(null);
            setMessageCommentaire(null);

            try {
                const resOuvrage = await api.get(`/ouvrages/${id}`);
                const dataOuvrage = resOuvrage.data;
                setOuvrage(dataOuvrage);

                if (dataOuvrage.categorie_nom) {
                    setCategorieNom(dataOuvrage.categorie_nom);
                } else if (dataOuvrage.categorie_id) {
                    const resCategories = await api.get("/categories");
                    const cat = resCategories.data.find(
                        (c) => String(c.id) === String(dataOuvrage.categorie_id)
                    );
                    setCategorieNom(cat ? cat.nom : "Sans catégorie");
                } else {
                    setCategorieNom("Sans catégorie");
                }

                setQuantite(Number(dataOuvrage.stock) > 0 ? 1 : 0);
                await rechargerAvisEtCommentaires();
            } catch (error) {
                if (error.response?.status === 404) {
                    setErreur("Cet ouvrage est introuvable dans notre catalogue.");
                } else if (error.response?.status === 400) {
                    setErreur("L'identifiant de l'ouvrage demandé est invalide.");
                } else {
                    setErreur(
                        error.response?.data?.message ||
                            "Impossible de charger les détails de l'ouvrage. Vérifiez la connexion au serveur."
                    );
                }
            } finally {
                setChargement(false);
            }
        };

        chargerDetails();
    }, [id, rechargerAvisEtCommentaires]);

    // Calculer la note moyenne des avis
    const noteMoyenne =
        avis.length > 0
            ? (
                  avis.reduce((somme, item) => somme + Number(item.note || 0), 0) /
                  avis.length
              ).toFixed(1)
            : null;

    // Vérifier si l'utilisateur connecté a déjà publié un avis sur cet ouvrage
    const monAvis = utilisateur
        ? avis.find((a) => Number(a.client_id) === Number(utilisateur.id))
        : null;

    const stockDisponible = Number(ouvrage?.stock || 0);
    const estEnStock = stockDisponible > 0;

    // Gérer la modification sécurisée de la quantité dans les limites du stock
    const diminuerQuantite = () => {
        setQuantite((q) => Math.max(1, q - 1));
    };

    const augmenterQuantite = () => {
        setQuantite((q) => Math.min(stockDisponible, q + 1));
    };

    const handleChangeQuantite = (e) => {
        const valeur = Number(e.target.value);
        if (Number.isNaN(valeur)) {
            return;
        }
        if (valeur < 1) {
            setQuantite(1);
        } else if (valeur > stockDisponible) {
            setQuantite(stockDisponible);
        } else {
            setQuantite(Math.floor(valeur));
        }
    };

    // Action d'ajout au panier via CartContext (avec contrôle du stock et persistance)
    const handleAjouterAuPanier = async () => {
        if (!estEnStock) {
            setMessageAction({
                variante: "danger",
                texte: "Cet ouvrage est actuellement en rupture de stock."
            });
            return;
        }

        setAjoutEnCours(true);
        const resultat = await ajouterAuPanier(
            { ...ouvrage, categorie_nom: categorieNom },
            quantite
        );
        setAjoutEnCours(false);

        setMessageAction({
            variante: resultat.succes ? "success" : "warning",
            texte: resultat.message,
            lienPanier: resultat.succes
        });
    };

    // Ouvrir la modale pour ajouter cet ouvrage à une liste cadeau
    const handleAjouterListeCadeau = async () => {
        if (!utilisateur) {
            setMessageAction({
                variante: "warning",
                texte: "Veuillez vous connecter pour ajouter cet ouvrage à une liste cadeau.",
                lienConnexion: true
            });
            return;
        }

        setModalListeOuverte(true);
        setErreurListe("");
        setNouveauNomListe("");
        setQteListe(Math.max(1, quantite || 1));
        setChargementListes(true);

        try {
            const response = await api.get("/listes/mes-listes");
            const listes = Array.isArray(response.data) ? response.data : [];
            setMesListes(listes);
            setListeSelectionneeId(
                listes.length > 0 ? String(listes[0].id) : "nouvelle"
            );
        } catch (error) {
            setErreurListe(
                error.response?.data?.message ||
                    "Impossible de charger vos listes cadeaux."
            );
        } finally {
            setChargementListes(false);
        }
    };

    // Enregistrer l'ouvrage dans la liste sélectionnée (ou nouvellement créée)
    const handleConfirmerAjoutListe = async (e) => {
        e.preventDefault();
        if (envoiListe || !ouvrage) {
            return;
        }

        setErreurListe("");
        setEnvoiListe(true);

        try {
            let cibleListeId = listeSelectionneeId;

            if (cibleListeId === "nouvelle" || mesListes.length === 0) {
                if (!nouveauNomListe.trim()) {
                    setErreurListe("Veuillez donner un nom à votre nouvelle liste.");
                    setEnvoiListe(false);
                    return;
                }
                const resCreation = await api.post("/listes", {
                    nom: nouveauNomListe.trim()
                });
                cibleListeId = String(resCreation.data.id);
            }

            await api.post(`/listes/${cibleListeId}/articles`, {
                ouvrage_id: ouvrage.id,
                quantite_souhaitee: Number(qteListe)
            });

            setModalListeOuverte(false);
            setMessageAction({
                variante: "success",
                texte: `« ${ouvrage.titre} » a été ajouté à votre liste cadeau (quantité souhaitée : ${qteListe}).`,
                lienListes: true
            });
        } catch (error) {
            setErreurListe(
                error.response?.data?.message ||
                    "Impossible d'ajouter cet ouvrage à la liste cadeau."
            );
        } finally {
            setEnvoiListe(false);
        }
    };

    // Publier un nouvel avis (réservé aux clients ayant acheté l'ouvrage)
    const handlePublierAvis = async (e) => {
        e.preventDefault();
        if (envoiAvis || !ouvrage) {
            return;
        }

        setMessageAvis(null);
        if (noteAvis < 1 || noteAvis > 5) {
            setMessageAvis({
                variante: "danger",
                texte: "Veuillez sélectionner une note entre 1 et 5 étoiles."
            });
            return;
        }

        setEnvoiAvis(true);
        try {
            const response = await api.post("/avis", {
                ouvrage_id: ouvrage.id,
                note: Number(noteAvis),
                commentaire: commentaireAvis.trim()
            });

            setCommentaireAvis("");
            setNoteAvis(5);
            setMessageAvis({
                variante: "success",
                texte: response.data.message || "Votre avis a été publié avec succès."
            });
            await rechargerAvisEtCommentaires();
        } catch (error) {
            setMessageAvis({
                variante: error.response?.status === 403 ? "warning" : "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de publier votre avis."
            });
        } finally {
            setEnvoiAvis(false);
        }
    };

    // Enregistrer la modification de son propre avis
    const handleModifierAvis = async (avisId) => {
        setMessageAvis(null);
        try {
            const response = await api.put(`/avis/${avisId}`, {
                note: Number(noteEdition),
                commentaire: texteEdition.trim()
            });
            setEditionAvisId(null);
            setMessageAvis({
                variante: "success",
                texte: response.data.message || "Avis modifié avec succès."
            });
            await rechargerAvisEtCommentaires();
        } catch (error) {
            setMessageAvis({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de modifier cet avis."
            });
        }
    };

    // Supprimer son propre avis (ou suppression par administrateur)
    const handleSupprimerAvis = async (avisId) => {
        setMessageAvis(null);
        try {
            const response = await api.delete(`/avis/${avisId}`);
            setConfirmationSupprAvisId(null);
            setMessageAvis({
                variante: "info",
                texte: response.data.message || "Avis supprimé."
            });
            await rechargerAvisEtCommentaires();
        } catch (error) {
            setMessageAvis({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de supprimer cet avis."
            });
        }
    };

    // Soumettre un commentaire (mis en attente de validation)
    const handlePublierCommentaire = async (e) => {
        e.preventDefault();
        if (envoiCommentaire || !ouvrage) {
            return;
        }

        setMessageCommentaire(null);
        if (nouveauCommentaire.trim().length < 3) {
            setMessageCommentaire({
                variante: "warning",
                texte: "Votre commentaire doit contenir au moins 3 caractères."
            });
            return;
        }

        setEnvoiCommentaire(true);
        try {
            const response = await api.post("/commentaires", {
                ouvrage_id: ouvrage.id,
                contenu: nouveauCommentaire.trim()
            });

            setNouveauCommentaire("");
            setMessageCommentaire({
                variante: "success",
                texte:
                    response.data.message ||
                    "Commentaire soumis en attente de validation."
            });
            await rechargerAvisEtCommentaires();
        } catch (error) {
            setMessageCommentaire({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de soumettre votre commentaire."
            });
        } finally {
            setEnvoiCommentaire(false);
        }
    };

    // Valider ou supprimer un commentaire en attente (éditeur / administrateur)
    const handleModererCommentaire = async (commentaireId, approuver) => {
        setMessageCommentaire(null);
        try {
            if (approuver) {
                const res = await api.put(
                    `/commentaires/${commentaireId}/validation`,
                    { valide: true }
                );
                setMessageCommentaire({
                    variante: "success",
                    texte: res.data.message
                });
            } else {
                const res = await api.delete(`/commentaires/${commentaireId}`);
                setMessageCommentaire({
                    variante: "info",
                    texte: res.data.message
                });
            }
            await rechargerAvisEtCommentaires();
        } catch (error) {
            setMessageCommentaire({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Erreur lors de la modération du commentaire."
            });
        }
    };

    // Affichage en lecture seule des étoiles pour une note sur 5
    const afficherEtoiles = (note) => {
        const score = Math.round(Number(note) || 0);
        return (
            <span
                className="d-inline-flex align-items-center gap-1"
                aria-label={`Note de ${score} sur 5`}
            >
                {[1, 2, 3, 4, 5].map((index) => (
                    <IconeEtoile key={index} pleine={index <= score} size={16} />
                ))}
            </span>
        );
    };

    // Sélecteur interactif de 1 à 5 étoiles
    const afficherSelecteurEtoiles = (valeur, onChange) => (
        <div
            className="d-inline-flex align-items-center gap-1"
            role="radiogroup"
            aria-label="Choisir une note de 1 à 5 étoiles"
        >
            {[1, 2, 3, 4, 5].map((score) => (
                <button
                    key={score}
                    type="button"
                    onClick={() => onChange(score)}
                    className="btn btn-link p-1 border-0 text-decoration-none"
                    aria-label={`Noter ${score} sur 5`}
                    aria-checked={valeur === score}
                    role="radio"
                >
                    <IconeEtoile pleine={score <= valeur} size={24} />
                </button>
            ))}
            <span className="ms-2 small fw-semibold text-muted">
                {valeur} / 5
            </span>
        </div>
    );

    return (
        <Container className="py-4">
            {/* Fil d'Ariane + bouton retour au catalogue */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                <Breadcrumb className="mb-0 small">
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
                        Accueil
                    </Breadcrumb.Item>
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/catalogue" }}>
                        Catalogue
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>
                        {ouvrage ? ouvrage.titre : "Détails de l'ouvrage"}
                    </Breadcrumb.Item>
                </Breadcrumb>

                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate("/catalogue")}
                    className="d-inline-flex align-items-center gap-2"
                >
                    <IconeFlecheRetour size={16} />
                    Retour au catalogue
                </Button>
            </div>

            {/* État de chargement */}
            {chargement && (
                <div className="text-center py-5" role="status" aria-live="polite">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">
                        Chargement de la fiche produit...
                    </p>
                </div>
            )}

            {/* Message d'erreur */}
            {!chargement && erreur && (
                <Alert variant="danger" className="p-4">
                    <Alert.Heading className="h5">
                        Impossible d&apos;afficher cet ouvrage
                    </Alert.Heading>
                    <p className="mb-3">{erreur}</p>
                    <Button as={Link} to="/catalogue" variant="primary" size="sm">
                        Retourner au catalogue
                    </Button>
                </Alert>
            )}

            {/* Contenu principal de la fiche ouvrage */}
            {!chargement && !erreur && ouvrage && (
                <>
                    <Card className="lg-panel shadow-sm border-0 p-3 p-md-4 mb-4">
                        <Row className="g-4 align-items-stretch">
                            {/* Colonne gauche : Couverture */}
                            <Col xs={12} md={5} lg={4}>
                                <CouvertureOuvrage
                                    ouvrage={ouvrage}
                                    categorieNom={categorieNom}
                                    variante="detail"
                                />
                            </Col>

                            {/* Colonne droite : Informations complètes et actions */}
                            <Col xs={12} md={7} lg={8} className="d-flex flex-column">
                                {/* Badges Catégorie et Stock */}
                                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                                    {ouvrage.categorie_id ? (
                                        <Link
                                            to={`/catalogue?categorie=${ouvrage.categorie_id}`}
                                            className="text-decoration-none"
                                        >
                                            <Badge className="lg-badge-categorie px-3 py-2">
                                                {categorieNom}
                                            </Badge>
                                        </Link>
                                    ) : (
                                        <Badge className="lg-badge-categorie px-3 py-2">
                                            {categorieNom}
                                        </Badge>
                                    )}

                                    {estEnStock ? (
                                        <Badge className="lg-badge-stock px-3 py-2">
                                            En stock ({stockDisponible} exemplaire
                                            {stockDisponible > 1 ? "s" : ""})
                                        </Badge>
                                    ) : (
                                        <Badge bg="danger" className="px-3 py-2">
                                            Rupture de stock
                                        </Badge>
                                    )}
                                </div>

                                {/* Titre et auteur */}
                                <h1 className="h2 fw-bold mb-1">{ouvrage.titre}</h1>
                                <p className="text-muted fs-5 mb-3">
                                    Par <strong className="text-dark">{ouvrage.auteur}</strong>
                                </p>

                                {/* Résumé des avis */}
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    {noteMoyenne ? (
                                        <>
                                            {afficherEtoiles(noteMoyenne)}
                                            <span className="fw-semibold">
                                                {noteMoyenne} / 5
                                            </span>
                                            <span className="text-muted small">
                                                ({avis.length} avis)
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-muted small">
                                            Aucun avis pour le moment
                                        </span>
                                    )}
                                </div>

                                {/* Prix */}
                                <div className="mb-3">
                                    <span className="lg-prix fs-2">
                                        {formaterPrix(ouvrage.prix)}
                                    </span>
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <h2 className="h6 text-uppercase text-muted mb-2">
                                        Description
                                    </h2>
                                    <p className="mb-0">
                                        {ouvrage.description ||
                                            "Aucune description détaillée n'est disponible pour cet ouvrage."}
                                    </p>
                                </div>

                                {/* Caractéristiques techniques */}
                                <Row
                                    className="g-2 small mb-4 p-3 rounded"
                                    style={{ backgroundColor: "var(--lg-cream)" }}
                                >
                                    <Col xs={12} sm={4}>
                                        <span className="text-muted d-block">ISBN</span>
                                        <strong>{ouvrage.isbn || "Non renseigné"}</strong>
                                    </Col>
                                    <Col xs={12} sm={4}>
                                        <span className="text-muted d-block">Catégorie</span>
                                        <strong>{categorieNom}</strong>
                                    </Col>
                                    <Col xs={12} sm={4}>
                                        <span className="text-muted d-block">Disponibilité</span>
                                        <strong
                                            className={
                                                estEnStock ? "text-success" : "text-danger"
                                            }
                                        >
                                            {estEnStock
                                                ? `${stockDisponible} disponible(s)`
                                                : "Épuisé"}
                                        </strong>
                                    </Col>
                                </Row>

                                {/* Message de retour utilisateur */}
                                {messageAction && (
                                    <Alert
                                        variant={messageAction.variante}
                                        dismissible
                                        onClose={() => setMessageAction(null)}
                                        className="mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2"
                                    >
                                        <span>{messageAction.texte}</span>
                                        <div className="d-flex gap-2">
                                            {messageAction.lienPanier && (
                                                <Button
                                                    as={Link}
                                                    to="/panier"
                                                    variant="outline-success"
                                                    size="sm"
                                                >
                                                    Voir le panier
                                                </Button>
                                            )}
                                            {messageAction.lienListes && (
                                                <Button
                                                    as={Link}
                                                    to="/listes"
                                                    variant="outline-success"
                                                    size="sm"
                                                >
                                                    Voir mes listes
                                                </Button>
                                            )}
                                            {messageAction.lienConnexion && (
                                                <Button
                                                    as={Link}
                                                    to="/login"
                                                    state={{ from: `/ouvrages/${id}` }}
                                                    variant="outline-dark"
                                                    size="sm"
                                                >
                                                    Se connecter
                                                </Button>
                                            )}
                                        </div>
                                    </Alert>
                                )}

                                {/* Indication si déjà présent dans le panier */}
                                {obtenirQuantiteDansPanier(ouvrage.id) > 0 && (
                                    <p className="small text-muted mb-2">
                                        Déjà dans votre panier :{" "}
                                        <strong>
                                            {obtenirQuantiteDansPanier(ouvrage.id)}{" "}
                                            exemplaire(s)
                                        </strong>
                                    </p>
                                )}

                                {/* Alerte dédiée en cas de rupture de stock */}
                                {!estEnStock && (
                                    <Alert variant="warning" className="mb-3 small">
                                        Cet ouvrage est momentanément en rupture de stock.
                                        L&apos;ajout au panier est désactivé jusqu&apos;au
                                        réapprovisionnement.
                                    </Alert>
                                )}

                                {/* Sélecteur de quantité + boutons d'action */}
                                <div className="mt-auto pt-3 border-top">
                                    <div className="d-flex flex-wrap align-items-end gap-3">
                                        <div>
                                            <Form.Label
                                                htmlFor="quantite-ouvrage"
                                                className="small fw-semibold mb-1"
                                            >
                                                Quantité
                                            </Form.Label>
                                            <InputGroup className="lg-qty-group">
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={diminuerQuantite}
                                                    disabled={!estEnStock || quantite <= 1}
                                                    aria-label="Diminuer la quantité"
                                                >
                                                    −
                                                </Button>
                                                <Form.Control
                                                    id="quantite-ouvrage"
                                                    type="number"
                                                    min={estEnStock ? 1 : 0}
                                                    max={stockDisponible}
                                                    value={quantite}
                                                    onChange={handleChangeQuantite}
                                                    disabled={!estEnStock}
                                                    className="text-center"
                                                    aria-label="Quantité souhaitée"
                                                />
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={augmenterQuantite}
                                                    disabled={
                                                        !estEnStock ||
                                                        quantite >= stockDisponible
                                                    }
                                                    aria-label="Augmenter la quantité"
                                                >
                                                    +
                                                </Button>
                                            </InputGroup>
                                        </div>

                                        <Button
                                            variant="primary"
                                            size="lg"
                                            disabled={!estEnStock || ajoutEnCours}
                                            onClick={handleAjouterAuPanier}
                                            className="d-inline-flex align-items-center gap-2"
                                        >
                                            <IconePanier size={19} />
                                            {!estEnStock
                                                ? "Rupture de stock"
                                                : ajoutEnCours
                                                ? "Ajout en cours..."
                                                : "Ajouter au panier"}
                                        </Button>

                                        <Button
                                            variant="outline-primary"
                                            size="lg"
                                            onClick={handleAjouterListeCadeau}
                                            className="d-inline-flex align-items-center gap-2"
                                        >
                                            <IconeCadeau size={19} />
                                            Ajouter à une liste cadeau
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Section Avis et Commentaires interactifs */}
                    <Row className="g-4">
                        {/* Colonne Avis des acheteurs vérifiés */}
                        <Col xs={12} lg={6}>
                            <Card className="lg-panel shadow-sm border-0 h-100">
                                <Card.Body className="p-4 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h2 className="h4 mb-0">
                                            Avis des lecteurs ({avis.length})
                                        </h2>
                                        {noteMoyenne && (
                                            <Badge className="lg-badge-terracotta px-3 py-2">
                                                Moyenne : {noteMoyenne} / 5
                                            </Badge>
                                        )}
                                    </div>

                                    {messageAvis && (
                                        <Alert
                                            variant={messageAvis.variante}
                                            dismissible
                                            onClose={() => setMessageAvis(null)}
                                            className="small"
                                        >
                                            {messageAvis.texte}
                                        </Alert>
                                    )}

                                    {/* Formulaire de publication d'un avis */}
                                    <div
                                        className="p-3 rounded mb-4"
                                        style={{
                                            backgroundColor: "var(--lg-cream)",
                                            border: "1px solid var(--lg-border)"
                                        }}
                                    >
                                        {!utilisateur ? (
                                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 small">
                                                <span className="text-muted">
                                                    Connectez-vous pour noter cet ouvrage
                                                    (réservé aux acheteurs vérifiés).
                                                </span>
                                                <Button
                                                    as={Link}
                                                    to="/login"
                                                    state={{ from: `/ouvrages/${id}` }}
                                                    variant="outline-primary"
                                                    size="sm"
                                                >
                                                    Se connecter
                                                </Button>
                                            </div>
                                        ) : monAvis ? (
                                            <div className="small text-muted">
                                                Vous avez déjà publié un avis sur cet
                                                ouvrage. Vous pouvez le modifier ou le
                                                supprimer dans la liste ci-dessous.
                                            </div>
                                        ) : (
                                            <Form onSubmit={handlePublierAvis}>
                                                <div className="fw-semibold small mb-2">
                                                    Donner votre avis (acheteurs vérifiés)
                                                </div>

                                                <div className="mb-2">
                                                    {afficherSelecteurEtoiles(
                                                        noteAvis,
                                                        setNoteAvis
                                                    )}
                                                </div>

                                                <Form.Group
                                                    className="mb-2"
                                                    controlId="commentaire-avis"
                                                >
                                                    <Form.Label className="visually-hidden">
                                                        Votre avis écrit (optionnel)
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        placeholder="Partagez votre ressenti sur cet ouvrage (optionnel)..."
                                                        value={commentaireAvis}
                                                        onChange={(e) =>
                                                            setCommentaireAvis(
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </Form.Group>

                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={envoiAvis}
                                                >
                                                    {envoiAvis
                                                        ? "Publication..."
                                                        : "Publier mon avis"}
                                                </Button>
                                            </Form>
                                        )}
                                    </div>

                                    {/* Liste des avis existants */}
                                    {avis.length === 0 ? (
                                        <p className="text-muted mb-0 small">
                                            Aucun avis publié pour cet ouvrage pour le
                                            moment.
                                        </p>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {avis.map((item) => {
                                                const estMonAvis =
                                                    utilisateur &&
                                                    Number(item.client_id) ===
                                                        Number(utilisateur.id);
                                                const peutSupprimer =
                                                    estMonAvis ||
                                                    utilisateur?.role ===
                                                        "administrateur";
                                                const enEdition =
                                                    editionAvisId === item.id;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="p-3 rounded"
                                                        style={{
                                                            backgroundColor:
                                                                "var(--lg-cream)",
                                                            border: "1px solid var(--lg-border)"
                                                        }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <strong>{item.nom}</strong>
                                                                {estMonAvis && (
                                                                    <Badge bg="secondary">
                                                                        Votre avis
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {!enEdition &&
                                                                afficherEtoiles(item.note)}
                                                        </div>

                                                        <div className="small text-muted mb-2">
                                                            Publié le{" "}
                                                            {formaterDate(item.date)}
                                                        </div>

                                                        {enEdition ? (
                                                            <div>
                                                                <div className="mb-2">
                                                                    {afficherSelecteurEtoiles(
                                                                        noteEdition,
                                                                        setNoteEdition
                                                                    )}
                                                                </div>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={2}
                                                                    className="mb-2"
                                                                    value={texteEdition}
                                                                    onChange={(e) =>
                                                                        setTexteEdition(
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                />
                                                                <div className="d-flex gap-2">
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleModifierAvis(
                                                                                item.id
                                                                            )
                                                                        }
                                                                    >
                                                                        Enregistrer
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            setEditionAvisId(
                                                                                null
                                                                            )
                                                                        }
                                                                    >
                                                                        Annuler
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {item.commentaire && (
                                                                    <p className="mb-2 small">
                                                                        {item.commentaire}
                                                                    </p>
                                                                )}

                                                                {(estMonAvis ||
                                                                    peutSupprimer) && (
                                                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                                                        {estMonAvis && (
                                                                            <Button
                                                                                variant="outline-secondary"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setEditionAvisId(
                                                                                        item.id
                                                                                    );
                                                                                    setNoteEdition(
                                                                                        item.note
                                                                                    );
                                                                                    setTexteEdition(
                                                                                        item.commentaire ||
                                                                                            ""
                                                                                    );
                                                                                }}
                                                                            >
                                                                                Modifier
                                                                            </Button>
                                                                        )}

                                                                        {peutSupprimer &&
                                                                            (confirmationSupprAvisId ===
                                                                            item.id ? (
                                                                                <>
                                                                                    <Button
                                                                                        variant="danger"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            handleSupprimerAvis(
                                                                                                item.id
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        Confirmer
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="outline-secondary"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            setConfirmationSupprAvisId(
                                                                                                null
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        Annuler
                                                                                    </Button>
                                                                                </>
                                                                            ) : (
                                                                                <Button
                                                                                    variant="outline-danger"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        setConfirmationSupprAvisId(
                                                                                            item.id
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Supprimer
                                                                                </Button>
                                                                            ))}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Colonne Commentaires (avec soumission + modération éditeur/admin) */}
                        <Col xs={12} lg={6}>
                            <Card className="lg-panel shadow-sm border-0 h-100">
                                <Card.Body className="p-4 d-flex flex-column">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <IconeCommentaire size={20} />
                                        <h2 className="h4 mb-0">
                                            Commentaires ({commentaires.length})
                                        </h2>
                                    </div>

                                    {messageCommentaire && (
                                        <Alert
                                            variant={messageCommentaire.variante}
                                            dismissible
                                            onClose={() => setMessageCommentaire(null)}
                                            className="small"
                                        >
                                            {messageCommentaire.texte}
                                        </Alert>
                                    )}

                                    {/* Formulaire d'ajout de commentaire */}
                                    <div
                                        className="p-3 rounded mb-4"
                                        style={{
                                            backgroundColor: "var(--lg-cream)",
                                            border: "1px solid var(--lg-border)"
                                        }}
                                    >
                                        {!utilisateur ? (
                                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 small">
                                                <span className="text-muted">
                                                    Connectez-vous pour publier un
                                                    commentaire sur cet ouvrage.
                                                </span>
                                                <Button
                                                    as={Link}
                                                    to="/login"
                                                    state={{ from: `/ouvrages/${id}` }}
                                                    variant="outline-primary"
                                                    size="sm"
                                                >
                                                    Se connecter
                                                </Button>
                                            </div>
                                        ) : (
                                            <Form onSubmit={handlePublierCommentaire}>
                                                <Form.Group
                                                    className="mb-2"
                                                    controlId="nouveau-commentaire"
                                                >
                                                    <Form.Label className="fw-semibold small">
                                                        Écrire un commentaire (soumis à
                                                        validation)
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        placeholder="Posez une question ou partagez votre opinion (min. 3 caractères)..."
                                                        value={nouveauCommentaire}
                                                        onChange={(e) =>
                                                            setNouveauCommentaire(
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </Form.Group>
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={envoiCommentaire}
                                                >
                                                    {envoiCommentaire
                                                        ? "Envoi en cours..."
                                                        : "Soumettre le commentaire"}
                                                </Button>
                                            </Form>
                                        )}
                                    </div>

                                    {/* Espace rapide de modération pour éditeur / administrateur */}
                                    {estModerateur &&
                                        commentairesEnAttente.length > 0 && (
                                            <div className="mb-4 p-3 rounded border border-warning bg-warning-subtle">
                                                <div className="fw-semibold small mb-2">
                                                    Modération —{" "}
                                                    {commentairesEnAttente.length}{" "}
                                                    commentaire(s) en attente
                                                </div>
                                                <div className="d-flex flex-column gap-2">
                                                    {commentairesEnAttente.map((c) => (
                                                        <div
                                                            key={c.id}
                                                            className="p-2 bg-white rounded border small"
                                                        >
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <strong>
                                                                    {c.auteur_nom}
                                                                </strong>
                                                                <span className="text-muted">
                                                                    {formaterDate(
                                                                        c.date_soumission
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <p className="mb-2">
                                                                {c.contenu}
                                                            </p>
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleModererCommentaire(
                                                                            c.id,
                                                                            true
                                                                        )
                                                                    }
                                                                >
                                                                    Valider
                                                                </Button>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleModererCommentaire(
                                                                            c.id,
                                                                            false
                                                                        )
                                                                    }
                                                                >
                                                                    Refuser
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    {/* Liste des commentaires validés */}
                                    {commentaires.length === 0 ? (
                                        <p className="text-muted mb-0 small">
                                            Aucun commentaire validé pour cet ouvrage pour le
                                            moment.
                                        </p>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {commentaires.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-3 rounded"
                                                    style={{
                                                        backgroundColor: "var(--lg-cream)",
                                                        border: "1px solid var(--lg-border)"
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <strong>{item.nom}</strong>
                                                        <span className="small text-muted">
                                                            {formaterDate(
                                                                item.date_soumission
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="mb-0 small">
                                                        {item.contenu}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Modale d'ajout à une liste cadeau */}
                    <Modal
                        show={modalListeOuverte}
                        onHide={() => setModalListeOuverte(false)}
                        centered
                    >
                        <Modal.Header closeButton>
                            <Modal.Title className="lg-serif">
                                Ajouter à une liste cadeau
                            </Modal.Title>
                        </Modal.Header>

                        <Form onSubmit={handleConfirmerAjoutListe}>
                            <Modal.Body>
                                {erreurListe && (
                                    <Alert variant="danger">{erreurListe}</Alert>
                                )}

                                {chargementListes ? (
                                    <div className="text-center py-3">
                                        <Spinner
                                            animation="border"
                                            size="sm"
                                            variant="primary"
                                        />
                                        <span className="ms-2 small text-muted">
                                            Chargement de vos listes...
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="small text-muted mb-3">
                                            Ouvrage sélectionné :{" "}
                                            <strong className="text-dark">
                                                {ouvrage.titre}
                                            </strong>
                                        </p>

                                        {mesListes.length > 0 && (
                                            <Form.Group
                                                className="mb-3"
                                                controlId="choix-liste-cadeau"
                                            >
                                                <Form.Label className="small fw-semibold">
                                                    Choisir une liste
                                                </Form.Label>
                                                <Form.Select
                                                    value={listeSelectionneeId}
                                                    onChange={(e) =>
                                                        setListeSelectionneeId(
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    {mesListes.map((l) => (
                                                        <option key={l.id} value={l.id}>
                                                            {l.nom} ({l.articles.length}{" "}
                                                            ouvrage(s))
                                                        </option>
                                                    ))}
                                                    <option value="nouvelle">
                                                        + Créer une nouvelle liste...
                                                    </option>
                                                </Form.Select>
                                            </Form.Group>
                                        )}

                                        {(listeSelectionneeId === "nouvelle" ||
                                            mesListes.length === 0) && (
                                            <Form.Group
                                                className="mb-3"
                                                controlId="nouveau-nom-liste-modal"
                                            >
                                                <Form.Label className="small fw-semibold">
                                                    Nom de la nouvelle liste *
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Ex. : Liste de Noël, Anniversaire..."
                                                    value={nouveauNomListe}
                                                    onChange={(e) =>
                                                        setNouveauNomListe(
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </Form.Group>
                                        )}

                                        <Form.Group controlId="qte-liste-modal">
                                            <Form.Label className="small fw-semibold">
                                                Quantité souhaitée
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={1}
                                                max={20}
                                                value={qteListe}
                                                onChange={(e) =>
                                                    setQteListe(
                                                        Math.max(
                                                            1,
                                                            Number(e.target.value) || 1
                                                        )
                                                    )
                                                }
                                                required
                                            />
                                        </Form.Group>
                                    </>
                                )}
                            </Modal.Body>

                            <Modal.Footer>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setModalListeOuverte(false)}
                                    disabled={envoiListe}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={chargementListes || envoiListe}
                                >
                                    {envoiListe
                                        ? "Ajout en cours..."
                                        : "Ajouter à la liste"}
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                </>
            )}
        </Container>
    );
}

export default DetailOuvrage;
