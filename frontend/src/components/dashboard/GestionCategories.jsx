import { useState } from "react";
import {
    Card,
    Row,
    Col,
    Form,
    Button,
    Table,
    Alert,
    Modal
} from "react-bootstrap";

import api from "../../services/api";

function GestionCategories({ categories, ouvrages, onRafraichir }) {
    const [nom, setNom] = useState("");
    const [description, setDescription] = useState("");
    const [editionId, setEditionId] = useState(null);
    const [envoi, setEnvoi] = useState(false);
    const [message, setMessage] = useState(null);
    const [confirmationSuppr, setConfirmationSuppr] = useState(null);

    const compterOuvrages = (catId) =>
        ouvrages.filter((o) => String(o.categorie_id) === String(catId)).length;

    const reinitialiser = () => {
        setNom("");
        setDescription("");
        setEditionId(null);
    };

    const handleSoumettre = async (e) => {
        e.preventDefault();
        if (envoi || !nom.trim()) {
            return;
        }

        setMessage(null);
        setEnvoi(true);

        try {
            if (editionId) {
                const res = await api.put(`/categories/${editionId}`, {
                    nom: nom.trim(),
                    description: description.trim() || null
                });
                setMessage({
                    variante: "success",
                    texte: res.data.message || "Catégorie modifiée avec succès."
                });
            } else {
                const res = await api.post("/categories", {
                    nom: nom.trim(),
                    description: description.trim() || null
                });
                setMessage({
                    variante: "success",
                    texte: res.data.message || "Catégorie ajoutée avec succès."
                });
            }
            reinitialiser();
            await onRafraichir();
        } catch (error) {
            setMessage({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible d'enregistrer cette catégorie."
            });
        } finally {
            setEnvoi(false);
        }
    };

    const handleSupprimer = async (cat) => {
        setMessage(null);
        try {
            const res = await api.delete(`/categories/${cat.id}`);
            setConfirmationSuppr(null);
            setMessage({
                variante: "info",
                texte: res.data.message || "Catégorie supprimée avec succès."
            });
            await onRafraichir();
        } catch (error) {
            setConfirmationSuppr(null);
            setMessage({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de supprimer cette catégorie."
            });
        }
    };

    return (
        <Card className="lg-panel shadow-sm border-0 p-3 p-md-4">
            <h2 className="h3 mb-1">
                Gestion des catégories ({categories.length})
            </h2>
            <p className="text-muted small mb-3">
                Organisez les thématiques de votre librairie (réservé aux administrateurs)
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

            {/* Formulaire ajout / modification */}
            <Form
                onSubmit={handleSoumettre}
                className="p-3 rounded mb-4"
                style={{
                    backgroundColor: "var(--lg-cream)",
                    border: "1px solid var(--lg-border)"
                }}
            >
                <div className="fw-semibold small mb-2">
                    {editionId
                        ? `Modifier la catégorie #${editionId}`
                        : "Ajouter une nouvelle catégorie"}
                </div>
                <Row className="g-2 align-items-end">
                    <Col xs={12} md={4}>
                        <Form.Label htmlFor="cat-nom" className="small mb-1">
                            Nom *
                        </Form.Label>
                        <Form.Control
                            id="cat-nom"
                            size="sm"
                            type="text"
                            placeholder="Ex. : Pâtisserie, Gastronomie..."
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            required
                        />
                    </Col>
                    <Col xs={12} md={5}>
                        <Form.Label htmlFor="cat-desc" className="small mb-1">
                            Description
                        </Form.Label>
                        <Form.Control
                            id="cat-desc"
                            size="sm"
                            type="text"
                            placeholder="Courte description (optionnelle)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Col>
                    <Col xs={12} md={3} className="d-flex gap-2">
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="flex-grow-1"
                            disabled={envoi}
                        >
                            {editionId ? "Enregistrer" : "Ajouter"}
                        </Button>
                        {editionId && (
                            <Button
                                type="button"
                                variant="outline-secondary"
                                size="sm"
                                onClick={reinitialiser}
                            >
                                Annuler
                            </Button>
                        )}
                    </Col>
                </Row>
            </Form>

            <Table responsive hover className="align-middle small mb-0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Description</th>
                        <th className="text-center">Ouvrages</th>
                        <th className="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((cat) => (
                        <tr key={cat.id}>
                            <td className="text-muted">#{cat.id}</td>
                            <td className="fw-semibold">{cat.nom}</td>
                            <td className="text-muted">
                                {cat.description || "—"}
                            </td>
                            <td className="text-center">
                                {compterOuvrages(cat.id)}
                            </td>
                            <td className="text-end">
                                <div className="d-inline-flex gap-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => {
                                            setEditionId(cat.id);
                                            setNom(cat.nom || "");
                                            setDescription(cat.description || "");
                                        }}
                                    >
                                        Modifier
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => setConfirmationSuppr(cat)}
                                    >
                                        Supprimer
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal
                show={Boolean(confirmationSuppr)}
                onHide={() => setConfirmationSuppr(null)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="lg-serif">
                        Supprimer la catégorie
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Confirmez-vous la suppression de la catégorie{" "}
                    <strong>{confirmationSuppr?.nom}</strong> ?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        onClick={() => setConfirmationSuppr(null)}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleSupprimer(confirmationSuppr)}
                    >
                        Supprimer
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}

export default GestionCategories;
