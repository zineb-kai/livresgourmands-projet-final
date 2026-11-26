import { useState } from "react";
import { Card, Row, Col, Form, Table, Badge, Alert, Button } from "react-bootstrap";

import api from "../../services/api";
import { formaterDate } from "../../utils/couvertures";

const ROLES = [
    { valeur: "client", label: "Client" },
    { valeur: "editeur", label: "Éditeur" },
    { valeur: "gestionnaire", label: "Gestionnaire" },
    { valeur: "administrateur", label: "Administrateur" }
];

function GestionUtilisateurs({ utilisateurs, utilisateurCourant, onRafraichir }) {
    const [recherche, setRecherche] = useState("");
    const [filtreRole, setFiltreRole] = useState("tous");
    const [message, setMessage] = useState(null);
    const [majId, setMajId] = useState(null);

    // Modifier le rôle ou le statut actif d'un autre utilisateur (admin uniquement)
    const handleMettreAJour = async (user, champs) => {
        setMessage(null);
        setMajId(user.id);
        try {
            await api.put(`/users/${user.id}`, {
                nom: user.nom,
                email: user.email,
                role: champs.role ?? user.role,
                actif: champs.actif !== undefined ? champs.actif : user.actif
            });
            setMessage({
                variante: "success",
                texte: `Compte de ${user.nom} mis à jour avec succès.`
            });
            await onRafraichir();
        } catch (error) {
            setMessage({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de modifier cet utilisateur."
            });
        } finally {
            setMajId(null);
        }
    };

    const utilisateursFiltres = utilisateurs.filter((u) => {
        const q = recherche.toLowerCase().trim();
        const matchTexte =
            !q ||
            (u.nom || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q);
        const matchRole = filtreRole === "tous" || u.role === filtreRole;
        return matchTexte && matchRole;
    });

    return (
        <Card className="lg-panel shadow-sm border-0 p-3 p-md-4">
            <h2 className="h3 mb-1">
                Gestion des utilisateurs ({utilisateurs.length})
            </h2>
            <p className="text-muted small mb-3">
                Consultez les comptes inscrits et gérez les rôles (aucun mot de passe n&apos;est jamais exposé)
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
                        placeholder="Rechercher par nom ou email..."
                        aria-label="Rechercher un utilisateur"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                    />
                </Col>
                <Col xs={12} md={4}>
                    <Form.Select
                        size="sm"
                        aria-label="Filtrer par rôle"
                        value={filtreRole}
                        onChange={(e) => setFiltreRole(e.target.value)}
                    >
                        <option value="tous">Tous les rôles</option>
                        {ROLES.map((r) => (
                            <option key={r.valeur} value={r.valeur}>
                                {r.label}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
            </Row>

            <Table responsive hover className="align-middle small mb-0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Inscrit le</th>
                        <th className="text-end">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {utilisateursFiltres.map((u) => {
                        const estMoi =
                            Number(u.id) === Number(utilisateurCourant?.id);
                        return (
                            <tr key={u.id}>
                                <td className="text-muted">#{u.id}</td>
                                <td className="fw-semibold">
                                    {u.nom}{" "}
                                    {estMoi && (
                                        <Badge bg="secondary">Vous</Badge>
                                    )}
                                </td>
                                <td>{u.email}</td>
                                <td style={{ minWidth: "145px" }}>
                                    <Form.Select
                                        size="sm"
                                        value={u.role}
                                        disabled={estMoi || majId === u.id}
                                        aria-label={`Rôle de ${u.nom}`}
                                        onChange={(e) =>
                                            handleMettreAJour(u, {
                                                role: e.target.value
                                            })
                                        }
                                    >
                                        {ROLES.map((r) => (
                                            <option
                                                key={r.valeur}
                                                value={r.valeur}
                                            >
                                                {r.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </td>
                                <td>
                                    {u.actif ? (
                                        <Badge bg="success">Actif</Badge>
                                    ) : (
                                        <Badge bg="secondary">Inactif</Badge>
                                    )}
                                </td>
                                <td>{formaterDate(u.created_at)}</td>
                                <td className="text-end">
                                    {!estMoi && (
                                        <Button
                                            variant={
                                                u.actif
                                                    ? "outline-danger"
                                                    : "outline-success"
                                            }
                                            size="sm"
                                            disabled={majId === u.id}
                                            onClick={() =>
                                                handleMettreAJour(u, {
                                                    actif: u.actif ? 0 : 1
                                                })
                                            }
                                        >
                                            {u.actif
                                                ? "Désactiver"
                                                : "Réactiver"}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </Card>
    );
}

export default GestionUtilisateurs;
