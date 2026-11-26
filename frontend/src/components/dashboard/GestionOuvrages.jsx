import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Card,
    Row,
    Col,
    Form,
    Button,
    Table,
    Badge,
    Alert,
    Modal
} from "react-bootstrap";

import api from "../../services/api";
import { formaterPrix } from "../../utils/couvertures";

const FORM_INITIAL = {
    titre: "",
    auteur: "",
    isbn: "",
    description: "",
    prix: "",
    stock: "0",
    categorie_id: ""
};

function GestionOuvrages({ ouvrages, categories, estAdmin, onRafraichir }) {
    const [recherche, setRecherche] = useState("");
    const [filtreCategorie, setFiltreCategorie] = useState("");
    const [filtreStock, setFiltreStock] = useState("tous");

    const [message, setMessage] = useState(null);
    const [modalOuverte, setModalOuverte] = useState(false);
    const [editionId, setEditionId] = useState(null);
    const [formulaire, setFormulaire] = useState(FORM_INITIAL);
    const [envoi, setEnvoi] = useState(false);
    const [erreurModal, setErreurModal] = useState("");

    const [confirmationSuppr, setConfirmationSuppr] = useState(null);

    // Ouvrir la modale en mode ajout
    const ouvrirAjout = () => {
        setEditionId(null);
        setFormulaire({
            ...FORM_INITIAL,
            categorie_id: categories[0] ? String(categories[0].id) : ""
        });
        setErreurModal("");
        setModalOuverte(true);
    };

    // Ouvrir la modale en mode édition
    const ouvrirEdition = (ouvrage) => {
        setEditionId(ouvrage.id);
        setFormulaire({
            titre: ouvrage.titre || "",
            auteur: ouvrage.auteur || "",
            isbn: ouvrage.isbn || "",
            description: ouvrage.description || "",
            prix: String(ouvrage.prix ?? ""),
            stock: String(ouvrage.stock ?? 0),
            categorie_id: ouvrage.categorie_id ? String(ouvrage.categorie_id) : ""
        });
        setErreurModal("");
        setModalOuverte(true);
    };

    // Soumettre la création ou la modification d'un ouvrage
    const handleSoumettre = async (e) => {
        e.preventDefault();
        if (envoi) {
            return;
        }

        setErreurModal("");
        const prixNum = Number(formulaire.prix);
        const stockNum = Number(formulaire.stock);

        if (!formulaire.titre.trim() || !formulaire.auteur.trim()) {
            setErreurModal("Le titre et l'auteur sont obligatoires.");
            return;
        }
        if (!Number.isFinite(prixNum) || prixNum < 0) {
            setErreurModal("Veuillez saisir un prix valide (0 ou plus).");
            return;
        }
        if (!Number.isInteger(stockNum) || stockNum < 0) {
            setErreurModal("Le stock doit être un entier positif ou nul.");
            return;
        }

        setEnvoi(true);
        const payload = {
            titre: formulaire.titre.trim(),
            auteur: formulaire.auteur.trim(),
            isbn: formulaire.isbn.trim() || null,
            description: formulaire.description.trim() || null,
            prix: prixNum,
            stock: stockNum,
            categorie_id: formulaire.categorie_id
                ? Number(formulaire.categorie_id)
                : null
        };

        try {
            if (editionId) {
                const res = await api.put(`/ouvrages/${editionId}`, payload);
                setMessage({
                    variante: "success",
                    texte: res.data.message || "Ouvrage modifié avec succès."
                });
            } else {
                const res = await api.post("/ouvrages", payload);
                setMessage({
                    variante: "success",
                    texte: res.data.message || "Ouvrage ajouté avec succès."
                });
            }
            setModalOuverte(false);
            await onRafraichir();
        } catch (error) {
            setErreurModal(
                error.response?.data?.message ||
                    "Impossible d'enregistrer l'ouvrage."
            );
        } finally {
            setEnvoi(false);
        }
    };

    // Supprimer un ouvrage (administrateur uniquement)
    const handleSupprimer = async (ouvrage) => {
        setMessage(null);
        try {
            const res = await api.delete(`/ouvrages/${ouvrage.id}`);
            setConfirmationSuppr(null);
            setMessage({
                variante: "info",
                texte:
                    res.data.message ||
                    `« ${ouvrage.titre} » a été supprimé avec succès.`
            });
            await onRafraichir();
        } catch (error) {
            setConfirmationSuppr(null);
            setMessage({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de supprimer cet ouvrage."
            });
        }
    };

    // Filtrer les ouvrages selon la recherche, la catégorie et le stock
    const ouvragesFiltres = ouvrages.filter((o) => {
        const q = recherche.toLowerCase().trim();
        const matchTexte =
            !q ||
            (o.titre || "").toLowerCase().includes(q) ||
            (o.auteur || "").toLowerCase().includes(q) ||
            String(o.isbn || "").toLowerCase().includes(q);

        const matchCategorie =
            !filtreCategorie || String(o.categorie_id) === filtreCategorie;

        const matchStock =
            filtreStock === "tous" ||
            (filtreStock === "disponible" && Number(o.stock) > 0) ||
            (filtreStock === "rupture" && Number(o.stock) === 0);

        return matchTexte && matchCategorie && matchStock;
    });

    return (
        <Card className="lg-panel shadow-sm border-0 p-3 p-md-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                    <h2 className="h3 mb-0">
                        Gestion des ouvrages ({ouvrages.length})
                    </h2>
                    <p className="text-muted small mb-0">
                        Ajoutez, modifiez et suivez les stocks des livres du catalogue
                    </p>
                </div>
                <Button variant="primary" onClick={ouvrirAjout}>
                    + Ajouter un ouvrage
                </Button>
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

            {/* Filtres et recherche */}
            <Row className="g-2 mb-3">
                <Col xs={12} md={5}>
                    <Form.Control
                        type="search"
                        size="sm"
                        placeholder="Rechercher par titre, auteur ou ISBN..."
                        aria-label="Rechercher un ouvrage"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                    />
                </Col>
                <Col xs={12} sm={6} md={4}>
                    <Form.Select
                        size="sm"
                        aria-label="Filtrer par catégorie"
                        value={filtreCategorie}
                        onChange={(e) => setFiltreCategorie(e.target.value)}
                    >
                        <option value="">Toutes les catégories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nom}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <Form.Select
                        size="sm"
                        aria-label="Filtrer par stock"
                        value={filtreStock}
                        onChange={(e) => setFiltreStock(e.target.value)}
                    >
                        <option value="tous">Tous les stocks</option>
                        <option value="disponible">En stock</option>
                        <option value="rupture">Rupture de stock</option>
                    </Form.Select>
                </Col>
            </Row>

            {ouvragesFiltres.length === 0 ? (
                <Alert variant="info" className="mb-0">
                    Aucun ouvrage ne correspond aux filtres sélectionnés.
                </Alert>
            ) : (
                <Table responsive hover className="align-middle small mb-0">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Ouvrage</th>
                            <th>ISBN</th>
                            <th>Catégorie</th>
                            <th className="text-end">Prix</th>
                            <th className="text-center">Stock</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ouvragesFiltres.map((o) => {
                            const enStock = Number(o.stock) > 0;
                            return (
                                <tr key={o.id}>
                                    <td className="text-muted">#{o.id}</td>
                                    <td>
                                        <Link
                                            to={`/ouvrages/${o.id}`}
                                            className="fw-semibold text-decoration-none d-block"
                                            style={{ color: "var(--lg-ink)" }}
                                        >
                                            {o.titre}
                                        </Link>
                                        <span className="text-muted">
                                            {o.auteur}
                                        </span>
                                    </td>
                                    <td>{o.isbn || "—"}</td>
                                    <td>
                                        <Badge className="lg-badge-categorie">
                                            {o.categorie_nom || "Sans catégorie"}
                                        </Badge>
                                    </td>
                                    <td className="text-end fw-semibold">
                                        {formaterPrix(o.prix)}
                                    </td>
                                    <td className="text-center">
                                        {enStock ? (
                                            <Badge className="lg-badge-stock">
                                                {o.stock}
                                            </Badge>
                                        ) : (
                                            <Badge bg="danger">Rupture</Badge>
                                        )}
                                    </td>
                                    <td className="text-end">
                                        <div className="d-inline-flex gap-2">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => ouvrirEdition(o)}
                                            >
                                                Modifier
                                            </Button>
                                            {estAdmin && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() =>
                                                        setConfirmationSuppr(o)
                                                    }
                                                >
                                                    Supprimer
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

            {/* Modale Ajout / Modification d'un ouvrage */}
            <Modal
                show={modalOuverte}
                onHide={() => setModalOuverte(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="lg-serif">
                        {editionId
                            ? `Modifier l'ouvrage #${editionId}`
                            : "Ajouter un nouvel ouvrage"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSoumettre}>
                    <Modal.Body>
                        {erreurModal && (
                            <Alert variant="danger" className="small">
                                {erreurModal}
                            </Alert>
                        )}

                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <Form.Group controlId="ouvrage-titre">
                                    <Form.Label className="small fw-semibold">
                                        Titre *
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formulaire.titre}
                                        onChange={(e) =>
                                            setFormulaire({
                                                ...formulaire,
                                                titre: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="ouvrage-auteur">
                                    <Form.Label className="small fw-semibold">
                                        Auteur *
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formulaire.auteur}
                                        onChange={(e) =>
                                            setFormulaire({
                                                ...formulaire,
                                                auteur: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} sm={6} md={4}>
                                <Form.Group controlId="ouvrage-isbn">
                                    <Form.Label className="small fw-semibold">
                                        ISBN
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ex. 978-2-1234-5678-9"
                                        value={formulaire.isbn}
                                        onChange={(e) =>
                                            setFormulaire({
                                                ...formulaire,
                                                isbn: e.target.value
                                            })
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={6} sm={3} md={4}>
                                <Form.Group controlId="ouvrage-prix">
                                    <Form.Label className="small fw-semibold">
                                        Prix ($) *
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formulaire.prix}
                                        onChange={(e) =>
                                            setFormulaire({
                                                ...formulaire,
                                                prix: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={6} sm={3} md={4}>
                                <Form.Group controlId="ouvrage-stock">
                                    <Form.Label className="small fw-semibold">
                                        Stock *
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={formulaire.stock}
                                        onChange={(e) =>
                                            setFormulaire({
                                                ...formulaire,
                                                stock: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Group controlId="ouvrage-categorie">
                                    <Form.Label className="small fw-semibold">
                                        Catégorie
                                    </Form.Label>
                                    <Form.Select
                                        value={formulaire.categorie_id}
                                        onChange={(e) =>
                                            setFormulaire({
                                                ...formulaire,
                                                categorie_id: e.target.value
                                            })
                                        }
                                    >
                                        <option value="">Sans catégorie</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nom}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Group controlId="ouvrage-description">
                                    <Form.Label className="small fw-semibold">
                                        Description
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formulaire.description}
                                        onChange={(e) =>
                                            setFormulaire({
                                                ...formulaire,
                                                description: e.target.value
                                            })
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="outline-secondary"
                            onClick={() => setModalOuverte(false)}
                            disabled={envoi}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" variant="primary" disabled={envoi}>
                            {envoi
                                ? "Enregistrement..."
                                : editionId
                                ? "Enregistrer les modifications"
                                : "Ajouter l'ouvrage"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modale de confirmation de suppression */}
            <Modal
                show={Boolean(confirmationSuppr)}
                onHide={() => setConfirmationSuppr(null)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="lg-serif">
                        Confirmer la suppression
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Voulez-vous vraiment supprimer l&apos;ouvrage{" "}
                    <strong>{confirmationSuppr?.titre}</strong> ? Cette action est
                    irréversible.
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
                        Supprimer définitivement
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}

export default GestionOuvrages;
