import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    Button,
    Alert,
    Badge,
    Spinner,
    InputGroup,
    Modal
} from "react-bootstrap";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import CouvertureOuvrage from "../components/CouvertureOuvrage";
import { IconeCadeau, IconePanier } from "../components/Icones";
import { formaterPrix, formaterDate } from "../utils/couvertures";

const MODES_LIVRAISON = [
    { valeur: "Lent", libelle: "Envoi lent (Gratuit)", frais: 0 },
    { valeur: "Rapide", libelle: "Envoi rapide (+4,99 $)", frais: 4.99 },
    { valeur: "24h chrono", libelle: "24h chrono (+9,99 $)", frais: 9.99 }
];

function ListePartagee() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { utilisateur } = useAuth();
    const { ajouterAuPanier } = useCart();

    // Saisie du code de partage (parcours Ami)
    const [codeSaisi, setCodeSaisi] = useState(code || "");

    // Données de la liste partagée
    const [liste, setListe] = useState(null);
    const [articles, setArticles] = useState([]);
    const [chargement, setChargement] = useState(Boolean(code));
    const [erreur, setErreur] = useState("");
    const [messageAction, setMessageAction] = useState(null);

    // Modale "Offrir cet ouvrage" (achat direct test via POST /api/listes/:id/acheter)
    const [articleAOffrir, setArticleAOffrir] = useState(null);
    const [qteOffrir, setQteOffrir] = useState(1);
    const [adresseCadeau, setAdresseCadeau] = useState("");
    const [modeLivraison, setModeLivraison] = useState("Lent");
    const [modePaiement, setModePaiement] = useState(
        "Carte bancaire (Visa / Mastercard)"
    );
    const [achatEnCours, setAchatEnCours] = useState(false);
    const [erreurAchat, setErreurAchat] = useState("");

    // Charger la liste correspondant au code dans l'URL
    const chargerListe = useCallback(async (codeRecherche) => {
        if (!codeRecherche) {
            setListe(null);
            setArticles([]);
            setChargement(false);
            return;
        }

        setChargement(true);
        setErreur("");

        try {
            const response = await api.get(
                `/listes/${encodeURIComponent(codeRecherche.trim())}`
            );
            setListe(response.data.liste);
            setArticles(
                Array.isArray(response.data.articles) ? response.data.articles : []
            );
        } catch (error) {
            setListe(null);
            setArticles([]);
            setErreur(
                error.response?.data?.message ||
                    "Impossible de trouver cette liste cadeau. Vérifiez le code saisi."
            );
        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => {
        setCodeSaisi(code || "");
        chargerListe(code);
    }, [code, chargerListe]);

    // Soumettre un code personnel pour consulter la liste
    const handleRechercherCode = (e) => {
        e.preventDefault();
        if (!codeSaisi.trim()) {
            setErreur("Veuillez saisir un code de partage.");
            return;
        }
        setMessageAction(null);
        navigate(`/listes/partage/${encodeURIComponent(codeSaisi.trim())}`);
    };

    // Ajouter un ouvrage de la liste au panier (fonctionne même sans connexion)
    const handleMettreAuPanier = async (art) => {
        const resultat = await ajouterAuPanier(
            {
                id: art.ouvrage_id,
                titre: art.titre,
                auteur: art.auteur,
                prix: art.prix,
                stock: art.stock,
                categorie_id: art.categorie_id,
                categorie_nom: art.categorie_nom
            },
            1
        );

        setMessageAction({
            variante: resultat.succes ? "success" : "warning",
            texte: resultat.message,
            lienPanier: resultat.succes
        });
    };

    // Ouvrir la modale pour offrir directement un ouvrage
    const handleOuvrirOffrir = (art) => {
        if (!utilisateur) {
            navigate("/login", {
                state: {
                    from: `/listes/partage/${code}`,
                    message:
                        "Connectez-vous pour offrir directement un ouvrage de cette liste cadeau (ou ajoutez-le à votre panier)."
                }
            });
            return;
        }

        setArticleAOffrir(art);
        setQteOffrir(1);
        setAdresseCadeau("");
        setModeLivraison("Lent");
        setErreurAchat("");
    };

    // Confirmer l'achat cadeau via POST /api/listes/:id/acheter
    const handleConfirmerCadeau = async (e) => {
        e.preventDefault();
        if (!articleAOffrir || achatEnCours) {
            return;
        }

        setErreurAchat("");
        if (!adresseCadeau.trim() || adresseCadeau.trim().length < 6) {
            setErreurAchat(
                "Veuillez renseigner une adresse de livraison pour ce cadeau."
            );
            return;
        }

        setAchatEnCours(true);
        try {
            const response = await api.post(`/listes/${liste.id}/acheter`, {
                ouvrage_id: articleAOffrir.ouvrage_id,
                quantite: Number(qteOffrir),
                adresse_livraison: adresseCadeau.trim(),
                mode_livraison: modeLivraison,
                mode_paiement: modePaiement
            });

            setMessageAction({
                variante: "success",
                texte: `${response.data.message} — Commande #${response.data.commande_id} (${formaterPrix(response.data.total)}, réf. ${response.data.payment_provider_id}).`
            });
            setArticleAOffrir(null);
            await chargerListe(code);
        } catch (error) {
            setErreurAchat(
                error.response?.data?.message ||
                    "Impossible de finaliser l'achat de cet ouvrage."
            );
        } finally {
            setAchatEnCours(false);
        }
    };

    const fraisModal =
        MODES_LIVRAISON.find((m) => m.valeur === modeLivraison)?.frais || 0;
    const totalModal = articleAOffrir
        ? Number(articleAOffrir.prix) * Number(qteOffrir) + fraisModal
        : 0;

    return (
        <Container className="py-4">
            {/* Bandeau d'accès par code personnel (parcours Ami) */}
            <Card className="lg-panel shadow-sm border-0 p-4 mb-4">
                <Row className="g-3 align-items-center">
                    <Col xs={12} lg={6}>
                        <h1 className="h2 fw-bold mb-1 d-flex align-items-center gap-2">
                            <IconeCadeau size={26} />
                            Accéder à une liste cadeau
                        </h1>
                        <p className="text-muted small mb-0">
                            Saisissez le code personnel partagé par un proche pour découvrir sa sélection et lui offrir un ouvrage.
                        </p>
                    </Col>

                    <Col xs={12} lg={6}>
                        <Form onSubmit={handleRechercherCode}>
                            <Form.Label htmlFor="code-liste-partagee" className="visually-hidden">
                                Code personnel de la liste cadeau
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    id="code-liste-partagee"
                                    type="text"
                                    placeholder="Entrez le code personnel de la liste..."
                                    value={codeSaisi}
                                    onChange={(e) => setCodeSaisi(e.target.value)}
                                />
                                <Button type="submit" variant="primary">
                                    Consulter la liste
                                </Button>
                            </InputGroup>
                        </Form>
                    </Col>
                </Row>
            </Card>

            {/* Messages de retour */}
            {messageAction && (
                <Alert
                    variant={messageAction.variante}
                    dismissible
                    onClose={() => setMessageAction(null)}
                    className="d-flex flex-wrap justify-content-between align-items-center gap-2"
                >
                    <span>{messageAction.texte}</span>
                    {messageAction.lienPanier && (
                        <Button
                            as={Link}
                            to="/panier"
                            variant="outline-success"
                            size="sm"
                        >
                            Voir mon panier
                        </Button>
                    )}
                </Alert>
            )}

            {/* Chargement */}
            {chargement && (
                <div className="text-center py-5" role="status">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">
                        Recherche de la liste cadeau...
                    </p>
                </div>
            )}

            {/* Erreur (ex. code invalide ou introuvable) */}
            {!chargement && erreur && (
                <Alert variant="danger" className="p-4">
                    <Alert.Heading className="h5">
                        Liste cadeau introuvable
                    </Alert.Heading>
                    <p className="mb-0">{erreur}</p>
                </Alert>
            )}

            {/* Affichage de la liste partagée */}
            {!chargement && !erreur && liste && (
                <>
                    <Card className="lg-panel shadow-sm border-0 p-4 mb-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <Badge className="lg-badge-terracotta mb-2">
                                    Liste cadeau partagée
                                </Badge>
                                <h2 className="h3 mb-1">{liste.nom}</h2>
                                <p className="text-muted small mb-0">
                                    Préparée par{" "}
                                    <strong>{liste.proprietaire_nom}</strong> — créée le{" "}
                                    {formaterDate(liste.date_creation)}
                                </p>
                            </div>
                            <div className="small text-muted">
                                {articles.length} ouvrage(s) souhaité(s)
                            </div>
                        </div>
                    </Card>

                    {articles.length === 0 ? (
                        <Alert variant="info" className="p-4">
                            Cette liste cadeau est actuellement vide ou tous les ouvrages
                            souhaités ont déjà été offerts !
                        </Alert>
                    ) : (
                        <Row className="g-4">
                            {articles.map((art) => {
                                const enStock = Number(art.stock) > 0;
                                return (
                                    <Col
                                        key={art.ouvrage_id}
                                        xs={12}
                                        sm={6}
                                        lg={4}
                                    >
                                        <Card className="h-100 shadow-sm lg-card border-0">
                                            <Link
                                                to={`/ouvrages/${art.ouvrage_id}`}
                                                className="text-decoration-none"
                                            >
                                                <CouvertureOuvrage
                                                    ouvrage={{
                                                        id: art.ouvrage_id,
                                                        titre: art.titre,
                                                        auteur: art.auteur,
                                                        categorie_id: art.categorie_id,
                                                        categorie_nom: art.categorie_nom
                                                    }}
                                                    variante="card"
                                                />
                                            </Link>

                                            <Card.Body className="d-flex flex-column p-3">
                                                <div className="d-flex flex-wrap gap-2 mb-2">
                                                    {enStock ? (
                                                        <Badge className="lg-badge-stock">
                                                            En stock ({art.stock})
                                                        </Badge>
                                                    ) : (
                                                        <Badge bg="danger">
                                                            Rupture de stock
                                                        </Badge>
                                                    )}
                                                    <Badge bg="secondary">
                                                        Souhaité : {art.quantite_souhaitee}
                                                    </Badge>
                                                </div>

                                                <Card.Title className="fs-5 mb-1">
                                                    <Link
                                                        to={`/ouvrages/${art.ouvrage_id}`}
                                                        className="text-decoration-none"
                                                        style={{ color: "var(--lg-ink)" }}
                                                    >
                                                        {art.titre}
                                                    </Link>
                                                </Card.Title>
                                                <Card.Subtitle className="text-muted small mb-3">
                                                    {art.auteur}
                                                </Card.Subtitle>

                                                <div className="mt-auto pt-2 border-top">
                                                    <div className="lg-prix fs-4 mb-2">
                                                        {formaterPrix(art.prix)}
                                                    </div>

                                                    <div className="d-grid gap-2">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            disabled={!enStock}
                                                            onClick={() =>
                                                                handleOuvrirOffrir(art)
                                                            }
                                                            className="d-inline-flex align-items-center justify-content-center gap-2"
                                                        >
                                                            <IconeCadeau size={15} />
                                                            {enStock
                                                                ? "Offrir cet ouvrage (test)"
                                                                : "Indisponible"}
                                                        </Button>

                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            disabled={!enStock}
                                                            onClick={() =>
                                                                handleMettreAuPanier(art)
                                                            }
                                                            className="d-inline-flex align-items-center justify-content-center gap-2"
                                                        >
                                                            <IconePanier size={15} />
                                                            Ajouter à mon panier
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </>
            )}

            {/* Modale d'achat direct pour offrir un ouvrage (parcours Ami) */}
            <Modal
                show={Boolean(articleAOffrir)}
                onHide={() => setArticleAOffrir(null)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="lg-serif">
                        Offrir un ouvrage
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleConfirmerCadeau}>
                    <Modal.Body>
                        {erreurAchat && (
                            <Alert variant="danger">{erreurAchat}</Alert>
                        )}

                        {articleAOffrir && (
                            <>
                                <div
                                    className="p-3 rounded mb-3 small"
                                    style={{ backgroundColor: "var(--lg-cream)" }}
                                >
                                    <div className="fw-bold fs-6">
                                        {articleAOffrir.titre}
                                    </div>
                                    <div className="text-muted">
                                        {articleAOffrir.auteur} —{" "}
                                        {formaterPrix(articleAOffrir.prix)} / unité
                                    </div>
                                </div>

                                <Form.Group className="mb-3" controlId="qte-offrir">
                                    <Form.Label className="small fw-semibold">
                                        Quantité à offrir (max{" "}
                                        {Math.min(
                                            articleAOffrir.stock,
                                            articleAOffrir.quantite_souhaitee
                                        )}
                                        )
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        max={Math.min(
                                            articleAOffrir.stock,
                                            articleAOffrir.quantite_souhaitee
                                        )}
                                        value={qteOffrir}
                                        onChange={(e) =>
                                            setQteOffrir(
                                                Math.max(1, Number(e.target.value) || 1)
                                            )
                                        }
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="adresse-cadeau">
                                    <Form.Label className="small fw-semibold">
                                        Adresse de livraison du cadeau *
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Ex. : 250 Rue Sainte-Catherine, Montréal, QC"
                                        value={adresseCadeau}
                                        onChange={(e) =>
                                            setAdresseCadeau(e.target.value)
                                        }
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="livraison-cadeau">
                                    <Form.Label className="small fw-semibold">
                                        Mode de livraison
                                    </Form.Label>
                                    <Form.Select
                                        value={modeLivraison}
                                        onChange={(e) =>
                                            setModeLivraison(e.target.value)
                                        }
                                    >
                                        {MODES_LIVRAISON.map((m) => (
                                            <option key={m.valeur} value={m.valeur}>
                                                {m.libelle}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="paiement-cadeau">
                                    <Form.Label className="small fw-semibold">
                                        Règlement simulé (environnement de test)
                                    </Form.Label>
                                    <Form.Select
                                        value={modePaiement}
                                        onChange={(e) =>
                                            setModePaiement(e.target.value)
                                        }
                                    >
                                        <option value="Carte bancaire (Visa / Mastercard)">
                                            Carte bancaire (Test)
                                        </option>
                                        <option value="PayPal Sandbox">
                                            PayPal Sandbox (Test)
                                        </option>
                                    </Form.Select>
                                </Form.Group>

                                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                    <strong>Total à régler (test)</strong>
                                    <span className="lg-prix fs-4">
                                        {formaterPrix(totalModal)}
                                    </span>
                                </div>
                            </>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="outline-secondary"
                            onClick={() => setArticleAOffrir(null)}
                            disabled={achatEnCours}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={achatEnCours}
                        >
                            {achatEnCours
                                ? "Validation en cours..."
                                : "Confirmer le cadeau (test)"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default ListePartagee;
