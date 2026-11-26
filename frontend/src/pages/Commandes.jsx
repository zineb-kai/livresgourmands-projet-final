import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
    Table,
    Modal
} from "react-bootstrap";

import api from "../services/api";
import { useCart } from "../context/CartContext";
import {
    formaterPrix,
    formaterDate,
    obtenirBadgeStatut
} from "../utils/couvertures";

// Modes de livraison conformes à la maquette du cours (PDF 1, page 7)
const MODES_LIVRAISON = [
    {
        valeur: "Lent",
        libelle: "Envoi lent (Standard — 5 à 7 jours ouvrables)",
        frais: 0
    },
    {
        valeur: "Rapide",
        libelle: "Envoi rapide (2 à 3 jours ouvrables)",
        frais: 4.99
    },
    {
        valeur: "24h chrono",
        libelle: "Livraison 24h chrono (Express)",
        frais: 9.99
    }
];

const MODES_PAIEMENT = [
    {
        valeur: "Carte bancaire (Visa / Mastercard)",
        libelle: "Carte bancaire — Visa / Mastercard (environnement de test)"
    },
    {
        valeur: "PayPal Sandbox",
        libelle: "PayPal Sandbox (environnement de test)"
    }
];

function Commandes() {
    const { articles, totalPanier, rechargerPanier } = useCart();

    // Formulaire de validation du panier
    const [adresseLivraison, setAdresseLivraison] = useState("");
    const [modeLivraison, setModeLivraison] = useState("Lent");
    const [modePaiement, setModePaiement] = useState(MODES_PAIEMENT[0].valeur);
    const [simulerEchec, setSimulerEchec] = useState(false);

    // États d'envoi et de confirmation
    const [envoiCommande, setEnvoiCommande] = useState(false);
    const [erreurCommande, setErreurCommande] = useState("");
    const [confirmation, setConfirmation] = useState(null);

    // Historique des commandes du client connecté
    const [commandes, setCommandes] = useState([]);
    const [chargementHistorique, setChargementHistorique] = useState(true);
    const [erreurHistorique, setErreurHistorique] = useState("");

    // Détails d'une commande sélectionnée (modale)
    const [detailModalOuvert, setDetailModalOuvert] = useState(false);
    const [detailChargement, setDetailChargement] = useState(false);
    const [detailErreur, setDetailErreur] = useState("");
    const [detailCommande, setDetailCommande] = useState(null);
    const [paiementEnCoursId, setPaiementEnCoursId] = useState(null);

    // Charger l'historique des commandes de l'utilisateur connecté
    const chargerCommandes = useCallback(async () => {
        setChargementHistorique(true);
        setErreurHistorique("");
        try {
            const response = await api.get("/commandes");
            setCommandes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            setErreurHistorique(
                error.response?.data?.message ||
                    "Impossible de récupérer votre historique de commandes."
            );
        } finally {
            setChargementHistorique(false);
        }
    }, []);

    useEffect(() => {
        chargerCommandes();
    }, [chargerCommandes]);

    // Calcul des frais de livraison et du total affiché (revérifié côté serveur)
    const optionLivraison =
        MODES_LIVRAISON.find((m) => m.valeur === modeLivraison) ||
        MODES_LIVRAISON[0];
    const fraisLivraison = optionLivraison.frais;
    const montantTotal = Number((totalPanier + fraisLivraison).toFixed(2));

    // Soumettre la validation du panier et le paiement simulé
    const handleValiderCommande = async (e) => {
        e.preventDefault();

        // Empêcher les soumissions en double
        if (envoiCommande) {
            return;
        }

        setErreurCommande("");
        setConfirmation(null);

        if (!adresseLivraison.trim() || adresseLivraison.trim().length < 6) {
            setErreurCommande(
                "Veuillez saisir une adresse de livraison complète (au moins 6 caractères)."
            );
            return;
        }

        setEnvoiCommande(true);

        try {
            const response = await api.post("/commandes", {
                adresse_livraison: adresseLivraison.trim(),
                mode_livraison: modeLivraison,
                mode_paiement: modePaiement,
                payer_maintenant: true,
                simuler_echec_paiement: simulerEchec
            });

            setConfirmation({
                commandeId: response.data.commande_id,
                sousTotal: response.data.sous_total,
                fraisLivraison: response.data.frais_livraison,
                total: response.data.total,
                statut: response.data.statut,
                referencePaiement: response.data.payment_provider_id,
                adresse: adresseLivraison.trim(),
                modeLivraison,
                modePaiement
            });

            setAdresseLivraison("");
            setSimulerEchec(false);

            // Recharger le panier (maintenant vide côté serveur) et l'historique
            await Promise.all([rechargerPanier(), chargerCommandes()]);
        } catch (error) {
            setErreurCommande(
                error.response?.data?.message ||
                    "Impossible de valider la commande. Veuillez réessayer."
            );
        } finally {
            setEnvoiCommande(false);
        }
    };

    // Ouvrir les détails d'une commande spécifique
    const handleVoirDetails = async (commandeId) => {
        setDetailModalOuvert(true);
        setDetailChargement(true);
        setDetailErreur("");
        setDetailCommande(null);

        try {
            const response = await api.get(`/commandes/${commandeId}`);
            setDetailCommande(response.data);
        } catch (error) {
            setDetailErreur(
                error.response?.data?.message ||
                    "Impossible de charger les détails de cette commande."
            );
        } finally {
            setDetailChargement(false);
        }
    };

    // Payer une commande en attente (statut en_cours) en mode test
    const handlePayerCommandeEnAttente = async (commandeId) => {
        if (paiementEnCoursId) {
            return;
        }

        setPaiementEnCoursId(commandeId);
        setErreurHistorique("");

        try {
            await api.post(`/commandes/${commandeId}/payer`, {
                mode_paiement: "Carte bancaire (Visa / Mastercard)",
                simuler_echec: false
            });
            await chargerCommandes();
            if (detailCommande?.commande?.id === commandeId) {
                await handleVoirDetails(commandeId);
            }
        } catch (error) {
            setErreurHistorique(
                error.response?.data?.message ||
                    "Erreur lors du règlement de la commande."
            );
        } finally {
            setPaiementEnCoursId(null);
        }
    };

    return (
        <Container className="py-4">
            <div className="mb-4">
                <h1 className="fw-bold mb-1">Commandes &amp; Paiement</h1>
                <p className="text-muted mb-0">
                    Finalisez votre panier en environnement de test et consultez votre historique de commandes
                </p>
            </div>

            {/* Confirmation après commande réussie */}
            {confirmation && (
                <Alert variant="success" className="p-4 shadow-sm mb-4">
                    <Alert.Heading className="h4">
                        Commande #{confirmation.commandeId} confirmée !
                    </Alert.Heading>
                    <p className="mb-2">
                        Votre commande a été enregistrée et payée avec succès en environnement de test.
                        Votre panier a été vidé et les stocks ont été mis à jour.
                    </p>
                    <Row className="g-2 small mb-3">
                        <Col xs={12} md={4}>
                            <strong>Référence paiement :</strong>{" "}
                            <code>{confirmation.referencePaiement}</code>
                        </Col>
                        <Col xs={12} md={4}>
                            <strong>Livraison :</strong> {confirmation.modeLivraison} (
                            {formaterPrix(confirmation.fraisLivraison)})
                        </Col>
                        <Col xs={12} md={4}>
                            <strong>Montant total payé :</strong>{" "}
                            <span className="fw-bold">
                                {formaterPrix(confirmation.total)}
                            </span>
                        </Col>
                    </Row>
                    <div className="d-flex flex-wrap gap-2">
                        <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleVoirDetails(confirmation.commandeId)}
                        >
                            Voir le récapitulatif détaillé
                        </Button>
                        <Button as={Link} to="/catalogue" variant="primary" size="sm">
                            Retourner au catalogue
                        </Button>
                    </div>
                </Alert>
            )}

            {/* Formulaire de validation du panier (affiché si le panier n'est pas vide) */}
            {articles.length > 0 && (
                <Card className="lg-panel shadow-sm border-0 p-3 p-md-4 mb-5">
                    <h2 className="h3 mb-3">Finaliser ma commande</h2>

                    {erreurCommande && (
                        <Alert
                            variant="danger"
                            dismissible
                            onClose={() => setErreurCommande("")}
                        >
                            {erreurCommande}
                        </Alert>
                    )}

                    <Row className="g-4">
                        {/* Colonne formulaire livraison & règlement */}
                        <Col xs={12} lg={7}>
                            <Form onSubmit={handleValiderCommande}>
                                {/* Adresse de livraison */}
                                <Form.Group className="mb-4" controlId="adresseLivraison">
                                    <Form.Label className="fw-semibold">
                                        Adresse de livraison *
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Ex. : 1001 Boulevard Crémazie Est, Montréal, QC H2M 1M3"
                                        value={adresseLivraison}
                                        onChange={(e) =>
                                            setAdresseLivraison(e.target.value)
                                        }
                                        required
                                    />
                                </Form.Group>

                                {/* Choix du mode de livraison */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold d-block">
                                        Mode de livraison *
                                    </Form.Label>
                                    <div className="d-flex flex-column gap-2">
                                        {MODES_LIVRAISON.map((mode) => (
                                            <label
                                                key={mode.valeur}
                                                className="d-flex justify-content-between align-items-center p-3 rounded border"
                                                style={{
                                                    cursor: "pointer",
                                                    backgroundColor:
                                                        modeLivraison === mode.valeur
                                                            ? "var(--lg-terracotta-soft)"
                                                            : "var(--lg-surface)",
                                                    borderColor:
                                                        modeLivraison === mode.valeur
                                                            ? "var(--lg-terracotta)"
                                                            : "var(--lg-border)"
                                                }}
                                            >
                                                <span className="d-flex align-items-center gap-2">
                                                    <Form.Check
                                                        type="radio"
                                                        name="modeLivraison"
                                                        id={`livraison-${mode.valeur}`}
                                                        checked={
                                                            modeLivraison === mode.valeur
                                                        }
                                                        onChange={() =>
                                                            setModeLivraison(mode.valeur)
                                                        }
                                                    />
                                                    <span>{mode.libelle}</span>
                                                </span>
                                                <strong className="ms-2 text-nowrap">
                                                    {mode.frais === 0
                                                        ? "Gratuit"
                                                        : formaterPrix(mode.frais)}
                                                </strong>
                                            </label>
                                        ))}
                                    </div>
                                </Form.Group>

                                {/* Choix du mode de paiement (environnement de test) */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold d-block">
                                        Mode de règlement (environnement de test) *
                                    </Form.Label>
                                    <div className="d-flex flex-column gap-2">
                                        {MODES_PAIEMENT.map((mode) => (
                                            <label
                                                key={mode.valeur}
                                                className="d-flex align-items-center gap-2 p-3 rounded border"
                                                style={{
                                                    cursor: "pointer",
                                                    backgroundColor:
                                                        modePaiement === mode.valeur
                                                            ? "var(--lg-terracotta-soft)"
                                                            : "var(--lg-surface)"
                                                }}
                                            >
                                                <Form.Check
                                                    type="radio"
                                                    name="modePaiement"
                                                    id={`paiement-${mode.valeur}`}
                                                    checked={modePaiement === mode.valeur}
                                                    onChange={() =>
                                                        setModePaiement(mode.valeur)
                                                    }
                                                />
                                                <span>{mode.libelle}</span>
                                            </label>
                                        ))}
                                    </div>
                                </Form.Group>

                                {/* Encadré mode test + option de simulation d'échec */}
                                <div
                                    className="p-3 rounded mb-4 small"
                                    style={{
                                        backgroundColor: "var(--lg-cream)",
                                        border: "1px solid var(--lg-border)"
                                    }}
                                >
                                    <div className="fw-semibold mb-1">
                                        Environnement de paiement simulé (projet académique)
                                    </div>
                                    <p className="text-muted mb-2">
                                        Aucune donnée bancaire réelle n&apos;est collectée et
                                        aucune transaction réelle n&apos;est effectuée.
                                    </p>
                                    <Form.Check
                                        type="switch"
                                        id="simuler-echec-paiement"
                                        label="Simuler un refus de paiement (tester la conservation du panier en cas d'échec)"
                                        checked={simulerEchec}
                                        onChange={(e) =>
                                            setSimulerEchec(e.target.checked)
                                        }
                                    />
                                </div>

                                <div className="d-flex flex-wrap gap-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        disabled={envoiCommande}
                                    >
                                        {envoiCommande
                                            ? "Traitement sécurisé en cours..."
                                            : `Confirmer et payer ${formaterPrix(montantTotal)} (test)`}
                                    </Button>

                                    <Button
                                        as={Link}
                                        to="/panier"
                                        variant="outline-secondary"
                                        size="lg"
                                        disabled={envoiCommande}
                                    >
                                        Modifier le panier
                                    </Button>
                                </div>
                            </Form>
                        </Col>

                        {/* Colonne récapitulatif du panier */}
                        <Col xs={12} lg={5}>
                            <div
                                className="p-3 p-md-4 rounded h-100"
                                style={{
                                    backgroundColor: "var(--lg-cream)",
                                    border: "1px solid var(--lg-border)"
                                }}
                            >
                                <h3 className="h5 mb-3">Résumé de votre panier</h3>

                                <div className="d-flex flex-column gap-2 mb-3">
                                    {articles.map((item) => (
                                        <div
                                            key={item.ouvrage_id}
                                            className="d-flex justify-content-between align-items-start gap-2 small pb-2 border-bottom"
                                        >
                                            <div>
                                                <div className="fw-semibold">
                                                    {item.titre}
                                                </div>
                                                <div className="text-muted">
                                                    {item.quantite} ×{" "}
                                                    {formaterPrix(item.prix)}
                                                </div>
                                            </div>
                                            <span className="fw-semibold text-nowrap">
                                                {formaterPrix(
                                                    Number(item.prix) *
                                                        Number(item.quantite)
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="d-flex justify-content-between mb-2 small">
                                    <span className="text-muted">Sous-total articles</span>
                                    <span>{formaterPrix(totalPanier)}</span>
                                </div>

                                <div className="d-flex justify-content-between mb-3 small">
                                    <span className="text-muted">
                                        Livraison ({modeLivraison})
                                    </span>
                                    <span>
                                        {fraisLivraison === 0
                                            ? "Gratuit"
                                            : formaterPrix(fraisLivraison)}
                                    </span>
                                </div>

                                <hr />

                                <div className="d-flex justify-content-between align-items-center">
                                    <strong>Montant total</strong>
                                    <span className="lg-prix fs-4">
                                        {formaterPrix(montantTotal)}
                                    </span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card>
            )}

            {/* Historique des commandes du client */}
            <Card className="lg-panel shadow-sm border-0 p-3 p-md-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h2 className="h3 mb-0">
                        Mes commandes ({commandes.length})
                    </h2>
                    {articles.length === 0 && (
                        <Button as={Link} to="/catalogue" variant="outline-primary" size="sm">
                            Parcourir le catalogue
                        </Button>
                    )}
                </div>

                {erreurHistorique && (
                    <Alert variant="danger">{erreurHistorique}</Alert>
                )}

                {chargementHistorique ? (
                    <div className="text-center py-4" role="status">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted mb-0">
                            Chargement de vos commandes...
                        </p>
                    </div>
                ) : commandes.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                        Vous n&apos;avez pas encore passé de commande. Ajoutez des ouvrages à
                        votre panier pour commencer !
                    </Alert>
                ) : (
                    <Table responsive hover className="align-middle mb-0">
                        <thead>
                            <tr>
                                <th>N°</th>
                                <th>Date</th>
                                <th>Livraison</th>
                                <th>Paiement</th>
                                <th>Statut</th>
                                <th className="text-end">Total</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commandes.map((cmd) => {
                                const badge = obtenirBadgeStatut(cmd.statut);
                                return (
                                    <tr key={cmd.id}>
                                        <td className="fw-semibold">#{cmd.id}</td>
                                        <td>{formaterDate(cmd.date)}</td>
                                        <td>{cmd.mode_livraison || "Standard"}</td>
                                        <td className="small">
                                            {cmd.mode_paiement || "—"}
                                        </td>
                                        <td>
                                            <Badge
                                                bg={badge.bg}
                                                text={badge.text}
                                            >
                                                {badge.label}
                                            </Badge>
                                        </td>
                                        <td className="text-end fw-bold">
                                            {formaterPrix(cmd.total)}
                                        </td>
                                        <td className="text-end">
                                            <div className="d-inline-flex gap-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleVoirDetails(cmd.id)
                                                    }
                                                >
                                                    Détails
                                                </Button>
                                                {cmd.statut === "en_cours" && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        disabled={
                                                            paiementEnCoursId ===
                                                            cmd.id
                                                        }
                                                        onClick={() =>
                                                            handlePayerCommandeEnAttente(
                                                                cmd.id
                                                            )
                                                        }
                                                    >
                                                        {paiementEnCoursId === cmd.id
                                                            ? "..."
                                                            : "Payer (test)"}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Card>

            {/* Modale de détails d'une commande */}
            <Modal
                show={detailModalOuvert}
                onHide={() => setDetailModalOuvert(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="lg-serif">
                        {detailCommande?.commande
                            ? `Détails de la commande #${detailCommande.commande.id}`
                            : "Détails de la commande"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {detailChargement && (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    )}

                    {detailErreur && (
                        <Alert variant="danger">{detailErreur}</Alert>
                    )}

                    {!detailChargement && detailCommande?.commande && (
                        <>
                            <Row className="g-3 small mb-4 p-3 rounded" style={{ backgroundColor: "var(--lg-cream)" }}>
                                <Col xs={12} md={6}>
                                    <div className="text-muted">Date</div>
                                    <strong>
                                        {formaterDate(detailCommande.commande.date)}
                                    </strong>
                                </Col>
                                <Col xs={12} md={6}>
                                    <div className="text-muted">Statut</div>
                                    <Badge
                                        bg={
                                            obtenirBadgeStatut(
                                                detailCommande.commande.statut
                                            ).bg
                                        }
                                        text={
                                            obtenirBadgeStatut(
                                                detailCommande.commande.statut
                                            ).text
                                        }
                                    >
                                        {
                                            obtenirBadgeStatut(
                                                detailCommande.commande.statut
                                            ).label
                                        }
                                    </Badge>
                                </Col>
                                <Col xs={12} md={6}>
                                    <div className="text-muted">Adresse de livraison</div>
                                    <strong>
                                        {detailCommande.commande.adresse_livraison}
                                    </strong>
                                </Col>
                                <Col xs={12} md={6}>
                                    <div className="text-muted">
                                        Livraison &amp; Paiement
                                    </div>
                                    <strong>
                                        {detailCommande.commande.mode_livraison} —{" "}
                                        {detailCommande.commande.mode_paiement}
                                    </strong>
                                    {detailCommande.commande.payment_provider_id && (
                                        <div className="text-muted mt-1">
                                            Réf. :{" "}
                                            <code>
                                                {
                                                    detailCommande.commande
                                                        .payment_provider_id
                                                }
                                            </code>
                                        </div>
                                    )}
                                </Col>
                            </Row>

                            <h3 className="h6 text-uppercase text-muted mb-2">
                                Ouvrages commandés
                            </h3>
                            <Table responsive size="sm" className="mb-3">
                                <thead>
                                    <tr>
                                        <th>Ouvrage</th>
                                        <th className="text-center">Qté</th>
                                        <th className="text-end">Prix unitaire</th>
                                        <th className="text-end">Sous-total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailCommande.articles.map((art) => (
                                        <tr key={art.ouvrage_id}>
                                            <td>
                                                <Link
                                                    to={`/ouvrages/${art.ouvrage_id}`}
                                                    onClick={() =>
                                                        setDetailModalOuvert(false)
                                                    }
                                                >
                                                    {art.titre}
                                                </Link>
                                            </td>
                                            <td className="text-center">
                                                {art.quantite}
                                            </td>
                                            <td className="text-end">
                                                {formaterPrix(art.prix_unitaire)}
                                            </td>
                                            <td className="text-end fw-semibold">
                                                {formaterPrix(
                                                    Number(art.prix_unitaire) *
                                                        Number(art.quantite)
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <div className="d-flex justify-content-end align-items-center gap-3 pt-2 border-top">
                                <span className="text-muted">
                                    Total (livraison incluse) :
                                </span>
                                <span className="lg-prix fs-4">
                                    {formaterPrix(detailCommande.commande.total)}
                                </span>
                            </div>

                            {detailCommande.paiements &&
                                detailCommande.paiements.length > 0 && (
                                    <div className="mt-4 pt-3 border-top">
                                        <h3 className="h6 text-uppercase text-muted mb-2">
                                            Historique des paiements (test)
                                        </h3>
                                        <ul className="list-unstyled small mb-0">
                                            {detailCommande.paiements.map((p) => (
                                                <li
                                                    key={p.id}
                                                    className="d-flex justify-content-between py-1"
                                                >
                                                    <span>
                                                        {p.methode} —{" "}
                                                        <code>
                                                            {p.transaction_id}
                                                        </code>
                                                    </span>
                                                    <span>
                                                        <Badge
                                                            bg={
                                                                p.statut === "reussi"
                                                                    ? "success"
                                                                    : "danger"
                                                            }
                                                            className="me-2"
                                                        >
                                                            {p.statut}
                                                        </Badge>
                                                        {formaterPrix(p.montant)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setDetailModalOuvert(false)}
                    >
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default Commandes;
