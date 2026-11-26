import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    InputGroup
} from "react-bootstrap";

import api from "../services/api";
import { IconeCadeau } from "../components/Icones";
import {
    formaterPrix,
    formaterDate,
    obtenirPaletteCouverture
} from "../utils/couvertures";

function ListesCadeaux() {
    const navigate = useNavigate();

    // Données des listes du propriétaire
    const [listes, setListes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");
    const [messageSucces, setMessageSucces] = useState("");

    // Formulaire de création d'une nouvelle liste
    const [nouveauNom, setNouveauNom] = useState("");
    const [creationEnCours, setCreationEnCours] = useState(false);

    // Accès rapide à la liste d'un ami via son code
    const [codeAmi, setCodeAmi] = useState("");

    // Édition inline du nom d'une liste
    const [editionId, setEditionId] = useState(null);
    const [nomEdition, setNomEdition] = useState("");

    // Confirmation de suppression
    const [confirmationSupprId, setConfirmationSupprId] = useState(null);

    // Retour visuel lors de la copie du lien
    const [lienCopieId, setLienCopieId] = useState(null);

    // Charger les listes de l'utilisateur connecté
    const chargerMesListes = useCallback(async () => {
        setChargement(true);
        setErreur("");
        try {
            const response = await api.get("/listes/mes-listes");
            setListes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                    "Impossible de charger vos listes cadeaux."
            );
        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => {
        chargerMesListes();
    }, [chargerMesListes]);

    // Créer une nouvelle liste cadeau
    const handleCreerListe = async (e) => {
        e.preventDefault();
        setErreur("");
        setMessageSucces("");

        if (!nouveauNom.trim()) {
            setErreur("Veuillez indiquer un nom pour votre liste cadeau.");
            return;
        }

        setCreationEnCours(true);
        try {
            const res = await api.post("/listes", { nom: nouveauNom.trim() });
            setNouveauNom("");
            setMessageSucces(
                `Liste « ${res.data.nom || nouveauNom.trim()} » créée avec succès ! Vous pouvez maintenant y ajouter des ouvrages.`
            );
            await chargerMesListes();
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                    "Impossible de créer la liste cadeau."
            );
        } finally {
            setCreationEnCours(false);
        }
    };

    // Enregistrer le nouveau nom d'une liste
    const handleSauvegarderNom = async (listeId) => {
        setErreur("");
        setMessageSucces("");

        if (!nomEdition.trim()) {
            setErreur("Le nom de la liste ne peut pas être vide.");
            return;
        }

        try {
            await api.put(`/listes/${listeId}`, { nom: nomEdition.trim() });
            setEditionId(null);
            setNomEdition("");
            setMessageSucces("Nom de la liste mis à jour avec succès.");
            await chargerMesListes();
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                    "Impossible de modifier le nom de la liste."
            );
        }
    };

    // Supprimer une liste cadeau
    const handleSupprimerListe = async (listeId) => {
        setErreur("");
        setMessageSucces("");
        try {
            await api.delete(`/listes/${listeId}`);
            setConfirmationSupprId(null);
            setMessageSucces("Liste cadeau supprimée avec succès.");
            await chargerMesListes();
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                    "Impossible de supprimer cette liste."
            );
        }
    };

    // Retirer un ouvrage d'une liste
    const handleRetirerArticle = async (listeId, ouvrageId, titre) => {
        setErreur("");
        setMessageSucces("");
        try {
            await api.delete(`/listes/${listeId}/articles/${ouvrageId}`);
            setMessageSucces(`« ${titre} » a été retiré de la liste cadeau.`);
            await chargerMesListes();
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                    "Impossible de retirer cet ouvrage de la liste."
            );
        }
    };

    // Construire l'URL complète de partage sécurisé
    const construireLienPartage = (codePartage) => {
        return `${window.location.origin}/listes/partage/${codePartage}`;
    };

    // Copier le lien de partage dans le presse-papiers
    const handleCopierLien = async (liste) => {
        const url = construireLienPartage(liste.code_partage);
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                // Solution de secours si le presse-papiers n'est pas disponible
                const champ = document.createElement("textarea");
                champ.value = url;
                document.body.appendChild(champ);
                champ.select();
                document.execCommand("copy");
                document.body.removeChild(champ);
            }
            setLienCopieId(liste.id);
            setTimeout(() => setLienCopieId(null), 2500);
        } catch {
            setErreur("Impossible de copier automatiquement. Copiez le lien manuellement.");
        }
    };

    // Accéder à la liste d'un ami via son code
    const handleAccederListeAmi = (e) => {
        e.preventDefault();
        if (!codeAmi.trim()) {
            return;
        }
        navigate(`/listes/partage/${encodeURIComponent(codeAmi.trim())}`);
    };

    return (
        <Container className="py-4">
            <div className="mb-4">
                <h1 className="fw-bold mb-1 d-flex align-items-center gap-2">
                    <IconeCadeau size={28} />
                    Mes listes cadeaux
                </h1>
                <p className="text-muted mb-0">
                    Créez vos sélections d&apos;ouvrages, gérez vos envies et partagez un lien sécurisé avec vos proches
                </p>
            </div>

            {erreur && (
                <Alert variant="danger" dismissible onClose={() => setErreur("")}>
                    {erreur}
                </Alert>
            )}

            {messageSucces && (
                <Alert
                    variant="success"
                    dismissible
                    onClose={() => setMessageSucces("")}
                >
                    {messageSucces}
                </Alert>
            )}

            {/* Bandeau supérieur : créer une liste + accéder à la liste d'un ami */}
            <Row className="g-4 mb-4">
                <Col xs={12} lg={7}>
                    <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                        <h2 className="h4 mb-3">Créer une nouvelle liste cadeau</h2>
                        <Form onSubmit={handleCreerListe}>
                            <Form.Label htmlFor="nom-nouvelle-liste" className="small fw-semibold">
                                Nom de l&apos;occasion ou de la liste
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    id="nom-nouvelle-liste"
                                    type="text"
                                    placeholder="Ex. : Liste d'anniversaire, Noël gourmand..."
                                    value={nouveauNom}
                                    onChange={(e) => setNouveauNom(e.target.value)}
                                    required
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={creationEnCours}
                                >
                                    {creationEnCours ? "Création..." : "Créer la liste"}
                                </Button>
                            </InputGroup>
                        </Form>
                    </Card>
                </Col>

                <Col xs={12} lg={5}>
                    <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                        <h2 className="h4 mb-3">Consulter la liste d&apos;un ami</h2>
                        <Form onSubmit={handleAccederListeAmi}>
                            <Form.Label htmlFor="code-partage-ami" className="small fw-semibold">
                                Code de partage reçu
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    id="code-partage-ami"
                                    type="text"
                                    placeholder="Collez le code personnel..."
                                    value={codeAmi}
                                    onChange={(e) => setCodeAmi(e.target.value)}
                                />
                                <Button type="submit" variant="outline-primary">
                                    Ouvrir
                                </Button>
                            </InputGroup>
                        </Form>
                    </Card>
                </Col>
            </Row>

            {/* Chargement */}
            {chargement && (
                <div className="text-center py-5" role="status">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">
                        Chargement de vos listes cadeaux...
                    </p>
                </div>
            )}

            {/* État vide */}
            {!chargement && listes.length === 0 && (
                <Card className="lg-panel shadow-sm border-0 text-center p-5">
                    <Card.Body>
                        <div
                            className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
                            style={{
                                width: "68px",
                                height: "68px",
                                backgroundColor: "var(--lg-terracotta-soft)",
                                color: "var(--lg-terracotta)"
                            }}
                        >
                            <IconeCadeau size={32} />
                        </div>
                        <h2 className="h4 mb-2">
                            Vous n&apos;avez pas encore de liste cadeau
                        </h2>
                        <p className="text-muted mb-3">
                            Créez votre première liste ci-dessus, puis ajoutez-y des ouvrages
                            directement depuis leurs fiches produits.
                        </p>
                        <Button as={Link} to="/catalogue" variant="outline-primary">
                            Explorer le catalogue
                        </Button>
                    </Card.Body>
                </Card>
            )}

            {/* Affichage des listes de l'utilisateur */}
            {!chargement && listes.length > 0 && (
                <div className="d-flex flex-column gap-4">
                    {listes.map((liste) => {
                        const lienPartage = construireLienPartage(liste.code_partage);
                        const estEnEdition = editionId === liste.id;

                        return (
                            <Card
                                key={liste.id}
                                className="lg-panel shadow-sm border-0 p-3 p-md-4"
                            >
                                {/* En-tête de la liste */}
                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                                    <div className="flex-grow-1">
                                        {estEnEdition ? (
                                            <InputGroup className="mb-1" style={{ maxWidth: "420px" }}>
                                                <Form.Control
                                                    type="text"
                                                    value={nomEdition}
                                                    onChange={(e) =>
                                                        setNomEdition(e.target.value)
                                                    }
                                                    aria-label="Nouveau nom de la liste"
                                                />
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleSauvegarderNom(liste.id)
                                                    }
                                                >
                                                    Enregistrer
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditionId(null);
                                                        setNomEdition("");
                                                    }}
                                                >
                                                    Annuler
                                                </Button>
                                            </InputGroup>
                                        ) : (
                                            <h2 className="h3 mb-1">{liste.nom}</h2>
                                        )}

                                        <div className="small text-muted d-flex flex-wrap gap-3">
                                            <span>
                                                Créée le {formaterDate(liste.date_creation)}
                                            </span>
                                            <span>
                                                <strong>{liste.articles.length}</strong>{" "}
                                                ouvrage(s)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Boutons de gestion propriétaire */}
                                    <div className="d-flex flex-wrap gap-2">
                                        {!estEnEdition && (
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setEditionId(liste.id);
                                                    setNomEdition(liste.nom);
                                                }}
                                            >
                                                Renommer
                                            </Button>
                                        )}

                                        <Button
                                            as={Link}
                                            to={`/listes/partage/${liste.code_partage}`}
                                            variant="outline-primary"
                                            size="sm"
                                        >
                                            Aperçu Ami
                                        </Button>

                                        {confirmationSupprId === liste.id ? (
                                            <>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleSupprimerListe(liste.id)
                                                    }
                                                >
                                                    Confirmer suppression
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        setConfirmationSupprId(null)
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
                                                    setConfirmationSupprId(liste.id)
                                                }
                                            >
                                                Supprimer
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Zone de lien de partage sécurisé */}
                                <div
                                    className="p-3 rounded mb-3"
                                    style={{
                                        backgroundColor: "var(--lg-cream)",
                                        border: "1px solid var(--lg-border)"
                                    }}
                                >
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 small">
                                        <span className="fw-semibold">
                                            Lien de partage sécurisé (réservé aux personnes disposant du code)
                                        </span>
                                        <span>
                                            Code :{" "}
                                            <code className="fw-bold">
                                                {liste.code_partage}
                                            </code>
                                        </span>
                                    </div>

                                    <InputGroup size="sm">
                                        <Form.Control
                                            type="text"
                                            readOnly
                                            value={lienPartage}
                                            aria-label={`Lien de partage pour ${liste.nom}`}
                                        />
                                        <Button
                                            variant={
                                                lienCopieId === liste.id
                                                    ? "success"
                                                    : "primary"
                                            }
                                            onClick={() => handleCopierLien(liste)}
                                        >
                                            {lienCopieId === liste.id
                                                ? "Lien copié !"
                                                : "Copier le lien"}
                                        </Button>
                                    </InputGroup>
                                </div>

                                {/* Articles de la liste */}
                                {liste.articles.length === 0 ? (
                                    <Alert variant="light" className="border mb-0 small d-flex flex-wrap justify-content-between align-items-center gap-2">
                                        <span>
                                            Cette liste ne contient encore aucun ouvrage.
                                        </span>
                                        <Button
                                            as={Link}
                                            to="/catalogue"
                                            variant="outline-primary"
                                            size="sm"
                                        >
                                            Ajouter depuis le catalogue
                                        </Button>
                                    </Alert>
                                ) : (
                                    <Row className="g-3">
                                        {liste.articles.map((art) => {
                                            const palette = obtenirPaletteCouverture({
                                                id: art.ouvrage_id,
                                                categorie_id: art.categorie_id
                                            });
                                            const enStock = Number(art.stock) > 0;

                                            return (
                                                <Col
                                                    key={art.ouvrage_id}
                                                    xs={12}
                                                    md={6}
                                                >
                                                    <div className="d-flex gap-3 p-3 rounded border bg-white h-100 align-items-center">
                                                        {/* Mini couverture */}
                                                        <Link
                                                            to={`/ouvrages/${art.ouvrage_id}`}
                                                            className="text-decoration-none flex-shrink-0"
                                                        >
                                                            <div
                                                                className="rounded p-2 d-flex flex-column justify-content-between"
                                                                style={{
                                                                    width: "68px",
                                                                    height: "92px",
                                                                    background: `linear-gradient(145deg, ${palette.fond} 0%, #151e29 100%)`,
                                                                    boxShadow:
                                                                        "inset 5px 0 0 rgba(0,0,0,0.2)"
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: "18px",
                                                                        height: "2px",
                                                                        backgroundColor:
                                                                            palette.accent
                                                                    }}
                                                                />
                                                                <div
                                                                    className="lg-serif fw-bold text-white"
                                                                    style={{
                                                                        fontSize: "0.65rem",
                                                                        lineHeight: 1.15,
                                                                        display: "-webkit-box",
                                                                        WebkitLineClamp: 3,
                                                                        WebkitBoxOrient:
                                                                            "vertical",
                                                                        overflow: "hidden"
                                                                    }}
                                                                >
                                                                    {art.titre}
                                                                </div>
                                                            </div>
                                                        </Link>

                                                        {/* Détails de l'article */}
                                                        <div className="flex-grow-1 min-w-0">
                                                            <Link
                                                                to={`/ouvrages/${art.ouvrage_id}`}
                                                                className="fw-semibold text-decoration-none d-block text-truncate"
                                                                style={{
                                                                    color: "var(--lg-ink)"
                                                                }}
                                                            >
                                                                {art.titre}
                                                            </Link>
                                                            <div className="small text-muted mb-1">
                                                                {art.auteur}
                                                            </div>
                                                            <div className="d-flex flex-wrap align-items-center gap-2 small mb-2">
                                                                <span className="lg-prix">
                                                                    {formaterPrix(art.prix)}
                                                                </span>
                                                                {enStock ? (
                                                                    <Badge className="lg-badge-stock">
                                                                        En stock ({art.stock})
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge bg="danger">
                                                                        Rupture
                                                                    </Badge>
                                                                )}
                                                                <span className="text-muted">
                                                                    Qté souhaitée :{" "}
                                                                    <strong>
                                                                        {art.quantite_souhaitee}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRetirerArticle(
                                                                        liste.id,
                                                                        art.ouvrage_id,
                                                                        art.titre
                                                                    )
                                                                }
                                                            >
                                                                Retirer
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </Container>
    );
}

export default ListesCadeaux;
