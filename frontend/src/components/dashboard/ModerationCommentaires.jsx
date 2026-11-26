import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Badge, Alert, ButtonGroup } from "react-bootstrap";

import api from "../../services/api";
import { formaterDate } from "../../utils/couvertures";

function ModerationCommentaires({ commentaires, onRafraichir }) {
    const [filtre, setFiltre] = useState("en_attente");
    const [message, setMessage] = useState(null);
    const [actionId, setActionId] = useState(null);

    const handleValider = async (id, valide) => {
        setMessage(null);
        setActionId(id);
        try {
            const res = await api.put(`/commentaires/${id}/validation`, {
                valide
            });
            setMessage({
                variante: "success",
                texte: res.data.message
            });
            await onRafraichir();
        } catch (error) {
            setMessage({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de modérer ce commentaire."
            });
        } finally {
            setActionId(null);
        }
    };

    const handleSupprimer = async (id) => {
        setMessage(null);
        setActionId(id);
        try {
            const res = await api.delete(`/commentaires/${id}`);
            setMessage({
                variante: "info",
                texte: res.data.message || "Commentaire rejeté et supprimé."
            });
            await onRafraichir();
        } catch (error) {
            setMessage({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de supprimer ce commentaire."
            });
        } finally {
            setActionId(null);
        }
    };

    const nbEnAttente = commentaires.filter((c) => !c.valide).length;
    const nbValides = commentaires.filter((c) => Boolean(c.valide)).length;

    const listeFiltree = commentaires.filter((c) => {
        if (filtre === "en_attente") return !c.valide;
        if (filtre === "valides") return Boolean(c.valide);
        return true;
    });

    return (
        <Card className="lg-panel shadow-sm border-0 p-3 p-md-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                    <h2 className="h3 mb-0">Modération des commentaires</h2>
                    <p className="text-muted small mb-0">
                        Validez ou rejetez les commentaires avant leur publication sur les fiches ouvrages
                    </p>
                </div>

                <ButtonGroup size="sm">
                    <Button
                        variant={
                            filtre === "en_attente"
                                ? "primary"
                                : "outline-primary"
                        }
                        onClick={() => setFiltre("en_attente")}
                    >
                        En attente ({nbEnAttente})
                    </Button>
                    <Button
                        variant={
                            filtre === "valides" ? "primary" : "outline-primary"
                        }
                        onClick={() => setFiltre("valides")}
                    >
                        Validés ({nbValides})
                    </Button>
                    <Button
                        variant={
                            filtre === "tous" ? "primary" : "outline-primary"
                        }
                        onClick={() => setFiltre("tous")}
                    >
                        Tous ({commentaires.length})
                    </Button>
                </ButtonGroup>
            </div>

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

            {listeFiltree.length === 0 ? (
                <Alert variant="info" className="mb-0">
                    {filtre === "en_attente"
                        ? "Aucun commentaire en attente de validation."
                        : "Aucun commentaire dans cette catégorie."}
                </Alert>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {listeFiltree.map((c) => (
                        <div
                            key={c.id}
                            className="p-3 rounded border"
                            style={{ backgroundColor: "var(--lg-cream)" }}
                        >
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 small">
                                <div>
                                    <strong>{c.auteur_nom}</strong> sur{" "}
                                    <Link
                                        to={`/ouvrages/${c.ouvrage_id}`}
                                        className="fw-semibold"
                                    >
                                        {c.ouvrage_titre}
                                    </Link>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {formaterDate(c.date_soumission)}
                                    </span>
                                    {c.valide ? (
                                        <Badge bg="success">Validé</Badge>
                                    ) : (
                                        <Badge bg="warning" text="dark">
                                            En attente
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <p className="mb-3">{c.contenu}</p>

                            <div className="d-flex flex-wrap gap-2">
                                {!c.valide ? (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        disabled={actionId === c.id}
                                        onClick={() => handleValider(c.id, true)}
                                    >
                                        Valider et publier
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={actionId === c.id}
                                        onClick={() =>
                                            handleValider(c.id, false)
                                        }
                                    >
                                        Masquer
                                    </Button>
                                )}

                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={actionId === c.id}
                                    onClick={() => handleSupprimer(c.id)}
                                >
                                    Rejeter / Supprimer
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

export default ModerationCommentaires;
