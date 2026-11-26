import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    InputGroup,
    Alert,
    Badge,
    Spinner
} from "react-bootstrap";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CouvertureOuvrage from "../components/CouvertureOuvrage";
import { IconePanier, IconeFlecheRetour } from "../components/Icones";
import { formaterPrix } from "../utils/couvertures";

function Panier() {
    const {
        articles,
        nombreArticles,
        totalPanier,
        synchronisation,
        modifierQuantite,
        supprimerDuPanier,
        viderPanier
    } = useCart();

    const { utilisateur } = useAuth();
    const navigate = useNavigate();

    const [message, setMessage] = useState(null);
    const [confirmationVidage, setConfirmationVidage] = useState(false);

    // Mettre à jour la quantité d'un article avec contrôle du stock
    const handleChangerQuantite = async (article, nouvelleQte) => {
        setMessage(null);
        const resultat = await modifierQuantite(article.ouvrage_id, nouvelleQte);

        if (!resultat.succes) {
            setMessage({ variante: "warning", texte: resultat.message });
        }
    };

    // Saisie directe dans le champ quantité
    const handleSaisieQuantite = async (article, valeurBrute) => {
        const valeur = Number(valeurBrute);
        if (Number.isNaN(valeur)) {
            return;
        }
        if (valeur < 1) {
            await handleChangerQuantite(article, 1);
            return;
        }
        await handleChangerQuantite(article, Math.floor(valeur));
    };

    // Supprimer une ligne du panier
    const handleSupprimer = async (article) => {
        setMessage(null);
        const resultat = await supprimerDuPanier(article.ouvrage_id);

        setMessage({
            variante: resultat.succes ? "info" : "danger",
            texte: resultat.succes
                ? `« ${article.titre} » a été retiré de votre panier.`
                : resultat.message
        });
    };

    // Vider tout le panier après confirmation utilisateur
    const handleViderPanier = async () => {
        setMessage(null);
        const resultat = await viderPanier();
        setConfirmationVidage(false);

        setMessage({
            variante: resultat.succes ? "info" : "danger",
            texte: resultat.message
        });
    };

    // Rediriger vers la validation de commande ou connexion si visiteur
    const handleValiderPanier = () => {
        if (!utilisateur) {
            navigate("/login", {
                state: {
                    from: "/commandes",
                    message: "Connectez-vous pour finaliser votre commande."
                }
            });
            return;
        }
        navigate("/commandes");
    };

    return (
        <Container className="py-4">
            {/* En-tête de la page panier */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h1 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <IconePanier size={28} />
                        Mon panier
                    </h1>
                    <p className="text-muted mb-0">
                        {nombreArticles === 0
                            ? "Aucun article dans votre panier"
                            : `${nombreArticles} article${nombreArticles > 1 ? "s" : ""} sélectionné${nombreArticles > 1 ? "s" : ""}`}
                    </p>
                </div>

                <div className="d-flex flex-wrap gap-2">
                    <Button
                        as={Link}
                        to="/catalogue"
                        variant="outline-secondary"
                        size="sm"
                        className="d-inline-flex align-items-center gap-2"
                    >
                        <IconeFlecheRetour size={16} />
                        Continuer mes achats
                    </Button>

                    {articles.length > 0 && !confirmationVidage && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setConfirmationVidage(true)}
                        >
                            Vider le panier
                        </Button>
                    )}
                </div>
            </div>

            {/* Confirmation avant de vider le panier */}
            {confirmationVidage && (
                <Alert
                    variant="warning"
                    className="d-flex flex-wrap justify-content-between align-items-center gap-3"
                >
                    <span>
                        Voulez-vous vraiment supprimer tous les ouvrages de votre panier ?
                    </span>
                    <div className="d-flex gap-2">
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleViderPanier}
                        >
                            Confirmer le vidage
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setConfirmationVidage(false)}
                        >
                            Annuler
                        </Button>
                    </div>
                </Alert>
            )}

            {/* Message de retour utilisateur */}
            {message && (
                <Alert
                    variant={message.variante}
                    dismissible
                    onClose={() => setMessage(null)}
                >
                    {message.texte}
                </Alert>
            )}

            {/* Indicateur de synchronisation avec le serveur */}
            {synchronisation && (
                <div className="d-flex align-items-center gap-2 text-muted small mb-3" role="status">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <span>Synchronisation du panier en cours...</span>
                </div>
            )}

            {/* État vide */}
            {articles.length === 0 ? (
                <Card className="lg-panel shadow-sm border-0 text-center p-5">
                    <Card.Body>
                        <div
                            className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
                            style={{
                                width: "72px",
                                height: "72px",
                                backgroundColor: "var(--lg-terracotta-soft)",
                                color: "var(--lg-terracotta)"
                            }}
                        >
                            <IconePanier size={34} />
                        </div>
                        <h2 className="h4 mb-2">Votre panier est vide</h2>
                        <p className="text-muted mb-4">
                            Explorez notre catalogue de livres et ajoutez vos prochains coups de cœur.
                        </p>
                        <Button as={Link} to="/catalogue" variant="primary">
                            Parcourir le catalogue
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-4 align-items-start">
                    {/* Liste des articles du panier */}
                    <Col xs={12} lg={8}>
                        <div className="d-flex flex-column gap-3">
                            {articles.map((article) => {
                                const sousTotal =
                                    Number(article.prix) * Number(article.quantite);
                                const stockMaxAtteint =
                                    article.quantite >= article.stock;

                                return (
                                    <Card
                                        key={article.ouvrage_id}
                                        className="lg-panel shadow-sm border-0 p-3"
                                    >
                                        <Row className="g-3 align-items-center">
                                            {/* Miniature de couverture éditoriale */}
                                            <Col xs={4} sm={3} md={2}>
                                                <Link
                                                    to={`/ouvrages/${article.ouvrage_id}`}
                                                    className="text-decoration-none d-block"
                                                    aria-label={`Voir ${article.titre}`}
                                                >
                                                    <CouvertureOuvrage
                                                        ouvrage={article}
                                                        categorieNom={
                                                            article.categorie_nom
                                                        }
                                                        variante="mini"
                                                    />
                                                </Link>
                                            </Col>

                                            {/* Informations de l'ouvrage */}
                                            <Col xs={8} sm={9} md={5}>
                                                <h2 className="h5 mb-1">
                                                    <Link
                                                        to={`/ouvrages/${article.ouvrage_id}`}
                                                        className="text-decoration-none"
                                                        style={{
                                                            color: "var(--lg-ink)"
                                                        }}
                                                    >
                                                        {article.titre}
                                                    </Link>
                                                </h2>
                                                <p className="text-muted small mb-1">
                                                    {article.auteur}
                                                </p>
                                                <div className="d-flex flex-wrap align-items-center gap-2 small">
                                                    <span className="fw-semibold">
                                                        {formaterPrix(article.prix)} / unité
                                                    </span>
                                                    <Badge className="lg-badge-stock">
                                                        Stock : {article.stock}
                                                    </Badge>
                                                </div>
                                            </Col>

                                            {/* Contrôle de quantité */}
                                            <Col xs={7} sm={6} md={3}>
                                                <Form.Label
                                                    htmlFor={`qte-${article.ouvrage_id}`}
                                                    className="small text-muted mb-1 d-block"
                                                >
                                                    Quantité
                                                </Form.Label>
                                                <InputGroup size="sm" className="lg-qty-group">
                                                    <Button
                                                        variant="outline-secondary"
                                                        onClick={() =>
                                                            handleChangerQuantite(
                                                                article,
                                                                article.quantite - 1
                                                            )
                                                        }
                                                        disabled={article.quantite <= 1}
                                                        aria-label={`Diminuer la quantité de ${article.titre}`}
                                                    >
                                                        −
                                                    </Button>
                                                    <Form.Control
                                                        id={`qte-${article.ouvrage_id}`}
                                                        type="number"
                                                        min={1}
                                                        max={article.stock}
                                                        value={article.quantite}
                                                        onChange={(e) =>
                                                            handleSaisieQuantite(
                                                                article,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="text-center"
                                                        aria-label={`Quantité pour ${article.titre}`}
                                                    />
                                                    <Button
                                                        variant="outline-secondary"
                                                        onClick={() =>
                                                            handleChangerQuantite(
                                                                article,
                                                                article.quantite + 1
                                                            )
                                                        }
                                                        disabled={stockMaxAtteint}
                                                        aria-label={`Augmenter la quantité de ${article.titre}`}
                                                    >
                                                        +
                                                    </Button>
                                                </InputGroup>
                                                {stockMaxAtteint && (
                                                    <div className="small text-warning mt-1">
                                                        Stock maximum atteint
                                                    </div>
                                                )}
                                            </Col>

                                            {/* Sous-total et suppression */}
                                            <Col
                                                xs={5}
                                                sm={6}
                                                md={2}
                                                className="text-end"
                                            >
                                                <div className="small text-muted">
                                                    Sous-total
                                                </div>
                                                <div className="lg-prix fs-5 mb-2">
                                                    {formaterPrix(sousTotal)}
                                                </div>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleSupprimer(article)
                                                    }
                                                    aria-label={`Supprimer ${article.titre} du panier`}
                                                >
                                                    Supprimer
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card>
                                );
                            })}
                        </div>
                    </Col>

                    {/* Récapitulatif du panier */}
                    <Col xs={12} lg={4}>
                        <Card className="lg-panel shadow-sm border-0 p-4">
                            <h2 className="h4 mb-3">Récapitulatif</h2>

                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">
                                    Articles ({nombreArticles})
                                </span>
                                <span>{formaterPrix(totalPanier)}</span>
                            </div>

                            <div className="d-flex justify-content-between align-items-baseline gap-3 mb-3">
                                <span className="text-muted">Livraison</span>
                                <span className="text-muted small text-end">
                                    Choisie à l&apos;étape commande
                                </span>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <strong className="fs-5">Total estimé</strong>
                                <span className="lg-prix fs-4">
                                    {formaterPrix(totalPanier)}
                                </span>
                            </div>

                            {utilisateur ? (
                                <Alert variant="success" className="py-2 px-3 small mb-3">
                                    Votre panier est sauvegardé et synchronisé avec votre compte.
                                </Alert>
                            ) : (
                                <Alert variant="info" className="py-2 px-3 small mb-3">
                                    Votre panier est sauvegardé localement. Connectez-vous pour
                                    valider votre commande.
                                </Alert>
                            )}

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-100"
                                onClick={handleValiderPanier}
                            >
                                {utilisateur
                                    ? "Valider la commande"
                                    : "Se connecter pour commander"}
                            </Button>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default Panier;
