import { useState } from "react";
import {
    Card,
    Row,
    Col,
    Form,
    Button,
    Table,
    Badge,
    Alert,
    Modal,
    Spinner
} from "react-bootstrap";

import api from "../../services/api";
import {
    formaterPrix,
    formaterDate,
    obtenirBadgeStatut
} from "../../utils/couvertures";

const STATUTS = [
    { valeur: "en_cours", label: "En cours" },
    { valeur: "payee", label: "Payée" },
    { valeur: "expediee", label: "Expédiée" },
    { valeur: "annulee", label: "Annulée" }
];

// Transitions métier autorisées (identiques à la vérification backend)
const TRANSITIONS_AUTORISEES = {
    en_cours: ["en_cours", "payee", "annulee"],
    payee: ["payee", "expediee", "annulee"],
    expediee: ["expediee"],
    annulee: ["annulee"]
};

function GestionCommandes({ commandes, onRafraichir }) {
    const [recherche, setRecherche] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("tous");
    const [message, setMessage] = useState(null);
    const [majEnCoursId, setMajEnCoursId] = useState(null);

    // Modale de détails de commande
    const [modalOuverte, setModalOuverte] = useState(false);
    const [detailChargement, setDetailChargement] = useState(false);
    const [detailData, setDetailData] = useState(null);

    const handleChangerStatut = async (commandeId, nouveauStatut) => {
        setMessage(null);
        setMajEnCoursId(commandeId);
        try {
            const res = await api.put(`/commandes/${commandeId}`, {
                statut: nouveauStatut
            });
            setMessage({
                variante: "success",
                texte: `Commande #${commandeId} : ${res.data.message}`
            });
            await onRafraichir();
        } catch (error) {
            setMessage({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de modifier le statut de la commande."
            });
        } finally {
            setMajEnCoursId(null);
        }
    };

    const handleVoirDetails = async (commandeId) => {
        setModalOuverte(true);
        setDetailChargement(true);
        setDetailData(null);
        try {
            const res = await api.get(`/commandes/${commandeId}`);
            setDetailData(res.data);
        } catch (error) {
            setMessage({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de charger les détails de la commande."
            });
            setModalOuverte(false);
        } finally {
            setDetailChargement(false);
        }
    };

    const commandesFiltrees = commandes.filter((c) => {
        const q = recherche.toLowerCase().trim();
        const matchTexte =
            !q ||
            String(c.id).includes(q) ||
            (c.client_nom || "").toLowerCase().includes(q) ||
            (c.client_email || "").toLowerCase().includes(q);
        const matchStatut =
            filtreStatut === "tous" || c.statut === filtreStatut;
        return matchTexte && matchStatut;
    });

    return (
        <Card className="lg-panel shadow-sm border-0 p-3 p-md-4">
            <h2 className="h3 mb-1">
                Gestion des commandes ({commandes.length})
            </h2>
            <p className="text-muted small mb-3">
                Suivez les commandes des clients et mettez à jour leur statut
                (transitions autorisées : En cours → Payée/Annulée, Payée → Expédiée/Annulée ; les statuts Expédiée et Annulée sont définitifs).
            </p>

            {message && (
                <Alert
                    variant={message.variante}
                    dismissible
                    onClose={() => setMessage(null)}
                    className="small"
                >
                    {message.texte}
                </Alert>
            )}

            <Row className="g-2 mb-3">
                <Col xs={12} md={8}>
                    <Form.Control
                        type="search"
                        size="sm"
                        placeholder="Rechercher par numéro, nom ou email client..."
                        aria-label="Rechercher une commande"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                    />
                </Col>
                <Col xs={12} md={4}>
                    <Form.Select
                        size="sm"
                        aria-label="Filtrer par statut"
                        value={filtreStatut}
                        onChange={(e) => setFiltreStatut(e.target.value)}
                    >
                        <option value="tous">Tous les statuts</option>
                        {STATUTS.map((s) => (
                            <option key={s.valeur} value={s.valeur}>
                                {s.label}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
            </Row>

            {commandesFiltrees.length === 0 ? (
                <Alert variant="info" className="mb-0">
                    Aucune commande ne correspond à vos critères.
                </Alert>
            ) : (
                <Table responsive hover className="align-middle small mb-0">
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Livraison</th>
                            <th className="text-end">Total</th>
                            <th>Statut</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commandesFiltrees.map((c) => {
                            const badge = obtenirBadgeStatut(c.statut);
                            return (
                                <tr key={c.id}>
                                    <td className="fw-semibold">#{c.id}</td>
                                    <td>{formaterDate(c.date)}</td>
                                    <td>
                                        <div className="fw-semibold">
                                            {c.client_nom}
                                        </div>
                                        <div className="text-muted">
                                            {c.client_email}
                                        </div>
                                    </td>
                                    <td>{c.mode_livraison || "Standard"}</td>
                                    <td className="text-end fw-bold">
                                        {formaterPrix(c.total)}
                                    </td>
                                    <td style={{ minWidth: "145px" }}>
                                        <Form.Select
                                            size="sm"
                                            value={c.statut}
                                            disabled={
                                                majEnCoursId === c.id ||
                                                (TRANSITIONS_AUTORISEES[c.statut] || [])
                                                    .length <= 1
                                            }
                                            aria-label={`Statut de la commande #${c.id}`}
                                            onChange={(e) =>
                                                handleChangerStatut(
                                                    c.id,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            {STATUTS.map((s) => {
                                                const autorise = (
                                                    TRANSITIONS_AUTORISEES[c.statut] ||
                                                    []
                                                ).includes(s.valeur);
                                                return (
                                                    <option
                                                        key={s.valeur}
                                                        value={s.valeur}
                                                        disabled={!autorise}
                                                    >
                                                        {s.label}
                                                    </option>
                                                );
                                            })}
                                        </Form.Select>
                                        <Badge
                                            bg={badge.bg}
                                            text={badge.text}
                                            className="mt-1"
                                        >
                                            {badge.label}
                                        </Badge>
                                    </td>
                                    <td className="text-end">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() =>
                                                handleVoirDetails(c.id)
                                            }
                                        >
                                            Détails
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}

            {/* Modale détails commande */}
            <Modal
                show={modalOuverte}
                onHide={() => setModalOuverte(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="lg-serif">
                        {detailData?.commande
                            ? `Commande #${detailData.commande.id} — ${detailData.commande.client_nom || ""}`
                            : "Détails de la commande"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detailChargement && (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    )}
                    {!detailChargement && detailData?.commande && (
                        <>
                            <Row
                                className="g-2 small p-3 rounded mb-3"
                                style={{ backgroundColor: "var(--lg-cream)" }}
                            >
                                <Col xs={12} md={6}>
                                    <strong>Client :</strong>{" "}
                                    {detailData.commande.client_nom} (
                                    {detailData.commande.client_email})
                                </Col>
                                <Col xs={12} md={6}>
                                    <strong>Date :</strong>{" "}
                                    {formaterDate(detailData.commande.date)}
                                </Col>
                                <Col xs={12} md={6}>
                                    <strong>Adresse :</strong>{" "}
                                    {detailData.commande.adresse_livraison}
                                </Col>
                                <Col xs={12} md={6}>
                                    <strong>Livraison / Paiement :</strong>{" "}
                                    {detailData.commande.mode_livraison} —{" "}
                                    {detailData.commande.mode_paiement}
                                </Col>
                            </Row>

                            <Table responsive size="sm" className="mb-3">
                                <thead>
                                    <tr>
                                        <th>Ouvrage</th>
                                        <th className="text-center">Qté</th>
                                        <th className="text-end">Prix unit.</th>
                                        <th className="text-end">Sous-total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailData.articles.map((art) => (
                                        <tr key={art.ouvrage_id}>
                                            <td>{art.titre}</td>
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

                            <div className="text-end">
                                <span className="text-muted me-2">Total :</span>
                                <span className="lg-prix fs-4">
                                    {formaterPrix(detailData.commande.total)}
                                </span>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setModalOuverte(false)}
                    >
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}

export default GestionCommandes;
