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
    Spinner
} from "react-bootstrap";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { IconeUtilisateur, IconeCadeau } from "../components/Icones";
import {
    formaterPrix,
    formaterDate,
    obtenirBadgeStatut
} from "../utils/couvertures";

function Profil() {
    const { utilisateur, mettreAJourUtilisateur } = useAuth();

    // Données du profil + commandes + listes
    const [profil, setProfil] = useState(null);
    const [commandes, setCommandes] = useState([]);
    const [listes, setListes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreurGlobale, setErreurGlobale] = useState("");

    // Formulaire d'édition des informations personnelles
    const [nom, setNom] = useState(utilisateur?.nom || "");
    const [email, setEmail] = useState(utilisateur?.email || "");
    const [envoiInfos, setEnvoiInfos] = useState(false);
    const [messageInfos, setMessageInfos] = useState(null);

    // Formulaire de changement de mot de passe
    const [ancienMotDePasse, setAncienMotDePasse] = useState("");
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
    const [confirmationMdp, setConfirmationMdp] = useState("");
    const [envoiMdp, setEnvoiMdp] = useState(false);
    const [messageMdp, setMessageMdp] = useState(null);

    // Charger le profil, les statistiques, les commandes et les listes
    const chargerDonneesProfil = useCallback(async () => {
        setChargement(true);
        setErreurGlobale("");

        try {
            const [resProfil, resCommandes, resListes] = await Promise.all([
                api.get("/users/me"),
                api.get("/commandes").catch(() => ({ data: [] })),
                api.get("/listes/mes-listes").catch(() => ({ data: [] }))
            ]);

            setProfil(resProfil.data);
            setNom(resProfil.data.nom || "");
            setEmail(resProfil.data.email || "");
            setCommandes(Array.isArray(resCommandes.data) ? resCommandes.data : []);
            setListes(Array.isArray(resListes.data) ? resListes.data : []);
        } catch (error) {
            setErreurGlobale(
                error.response?.data?.message ||
                    "Impossible de charger les informations de votre profil."
            );
        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => {
        chargerDonneesProfil();
    }, [chargerDonneesProfil]);

    // Enregistrer les modifications du nom et de l'email
    const handleModifierInfos = async (e) => {
        e.preventDefault();
        if (envoiInfos || !utilisateur) {
            return;
        }

        setMessageInfos(null);

        if (nom.trim().length < 2) {
            setMessageInfos({
                variante: "danger",
                texte: "Le nom doit contenir au moins 2 caractères."
            });
            return;
        }

        setEnvoiInfos(true);
        try {
            const response = await api.put(`/users/${utilisateur.id}`, {
                nom: nom.trim(),
                email: email.trim()
            });

            const userMaj = response.data.utilisateur;
            if (userMaj) {
                mettreAJourUtilisateur({
                    nom: userMaj.nom,
                    email: userMaj.email
                });
                setProfil((prev) =>
                    prev
                        ? { ...prev, nom: userMaj.nom, email: userMaj.email }
                        : prev
                );
            }

            setMessageInfos({
                variante: "success",
                texte:
                    response.data.message ||
                    "Vos informations personnelles ont été mises à jour."
            });
        } catch (error) {
            setMessageInfos({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de mettre à jour vos informations."
            });
        } finally {
            setEnvoiInfos(false);
        }
    };

    // Modifier le mot de passe en vérifiant l'ancien mot de passe
    const handleModifierMotDePasse = async (e) => {
        e.preventDefault();
        if (envoiMdp) {
            return;
        }

        setMessageMdp(null);

        if (nouveauMotDePasse.length < 6) {
            setMessageMdp({
                variante: "danger",
                texte: "Le nouveau mot de passe doit contenir au moins 6 caractères."
            });
            return;
        }

        if (nouveauMotDePasse !== confirmationMdp) {
            setMessageMdp({
                variante: "danger",
                texte: "La confirmation ne correspond pas au nouveau mot de passe."
            });
            return;
        }

        setEnvoiMdp(true);
        try {
            const response = await api.put("/users/me/mot-de-passe", {
                ancienMotDePasse,
                nouveauMotDePasse
            });

            setAncienMotDePasse("");
            setNouveauMotDePasse("");
            setConfirmationMdp("");

            setMessageMdp({
                variante: "success",
                texte:
                    response.data.message ||
                    "Votre mot de passe a été modifié avec succès."
            });
        } catch (error) {
            setMessageMdp({
                variante: "danger",
                texte:
                    error.response?.data?.message ||
                    "Impossible de modifier le mot de passe."
            });
        } finally {
            setEnvoiMdp(false);
        }
    };

    const stats = profil?.statistiques || {
        nb_commandes: commandes.length,
        total_depense: 0,
        nb_listes: listes.length,
        nb_avis: 0
    };

    const libelleRole = (role) => {
        switch (role) {
            case "administrateur":
                return { texte: "Administrateur", bg: "danger" };
            case "editeur":
                return { texte: "Éditeur", bg: "warning", text: "dark" };
            case "gestionnaire":
                return { texte: "Gestionnaire", bg: "info", text: "dark" };
            default:
                return { texte: "Client", bg: "secondary" };
        }
    };

    const badgeRole = libelleRole(profil?.role || utilisateur?.role);

    return (
        <Container className="py-4">
            <div className="mb-4">
                <h1 className="fw-bold mb-1 d-flex align-items-center gap-2">
                    <IconeUtilisateur size={28} />
                    Mon profil
                </h1>
                <p className="text-muted mb-0">
                    Consultez vos informations personnelles, gérez votre sécurité et accédez rapidement à vos commandes et listes cadeaux
                </p>
            </div>

            {erreurGlobale && (
                <Alert variant="danger">{erreurGlobale}</Alert>
            )}

            {chargement ? (
                <div className="text-center py-5" role="status">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">
                        Chargement de votre profil...
                    </p>
                </div>
            ) : (
                <>
                    {/* Bandeau d'identité et statistiques personnelles */}
                    <Card className="lg-panel shadow-sm border-0 p-4 mb-4">
                        <Row className="g-4 align-items-center">
                            <Col xs={12} lg={5}>
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold fs-4"
                                        style={{
                                            width: "64px",
                                            height: "64px",
                                            backgroundColor: "var(--lg-ink)"
                                        }}
                                        aria-hidden="true"
                                    >
                                        {(profil?.nom || utilisateur?.nom || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="h4 mb-1 text-truncate">
                                            {profil?.nom || utilisateur?.nom}
                                        </h2>
                                        <div className="small text-muted text-truncate mb-2">
                                            {profil?.email || utilisateur?.email}
                                        </div>
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <Badge
                                                bg={badgeRole.bg}
                                                text={badgeRole.text}
                                            >
                                                Rôle : {badgeRole.texte}
                                            </Badge>
                                            {profil?.created_at && (
                                                <span className="small text-muted">
                                                    Membre depuis le{" "}
                                                    {formaterDate(profil.created_at)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={12} lg={7}>
                                <Row className="g-3 text-center">
                                    <Col xs={6} sm={3}>
                                        <div
                                            className="p-3 rounded h-100"
                                            style={{ backgroundColor: "var(--lg-cream)" }}
                                        >
                                            <div className="fs-4 fw-bold" style={{ color: "var(--lg-ink)" }}>
                                                {stats.nb_commandes}
                                            </div>
                                            <div className="small text-muted">
                                                Commande(s)
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={6} sm={3}>
                                        <div
                                            className="p-3 rounded h-100"
                                            style={{ backgroundColor: "var(--lg-cream)" }}
                                        >
                                            <div className="fs-5 fw-bold lg-prix">
                                                {formaterPrix(stats.total_depense)}
                                            </div>
                                            <div className="small text-muted">
                                                Total achats
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={6} sm={3}>
                                        <div
                                            className="p-3 rounded h-100"
                                            style={{ backgroundColor: "var(--lg-cream)" }}
                                        >
                                            <div className="fs-4 fw-bold" style={{ color: "var(--lg-ink)" }}>
                                                {stats.nb_listes}
                                            </div>
                                            <div className="small text-muted">
                                                Liste(s) cadeaux
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={6} sm={3}>
                                        <div
                                            className="p-3 rounded h-100"
                                            style={{ backgroundColor: "var(--lg-cream)" }}
                                        >
                                            <div className="fs-4 fw-bold" style={{ color: "var(--lg-sage)" }}>
                                                {stats.nb_avis}
                                            </div>
                                            <div className="small text-muted">
                                                Avis publié(s)
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>

                    {/* Formulaires : Informations personnelles + Mot de passe */}
                    <Row className="g-4 mb-4">
                        <Col xs={12} lg={6}>
                            <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                <h2 className="h4 mb-3">
                                    Informations personnelles
                                </h2>

                                {messageInfos && (
                                    <Alert
                                        variant={messageInfos.variante}
                                        dismissible
                                        onClose={() => setMessageInfos(null)}
                                        className="small"
                                    >
                                        {messageInfos.texte}
                                    </Alert>
                                )}

                                <Form onSubmit={handleModifierInfos}>
                                    <Form.Group className="mb-3" controlId="profil-nom">
                                        <Form.Label className="small fw-semibold">
                                            Nom complet *
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={nom}
                                            onChange={(e) => setNom(e.target.value)}
                                            minLength={2}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="profil-email">
                                        <Form.Label className="small fw-semibold">
                                            Adresse email *
                                        </Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="profil-role">
                                        <Form.Label className="small fw-semibold">
                                            Rôle du compte (lecture seule)
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={badgeRole.texte}
                                            disabled
                                            readOnly
                                        />
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={envoiInfos}
                                    >
                                        {envoiInfos
                                            ? "Enregistrement..."
                                            : "Enregistrer mes informations"}
                                    </Button>
                                </Form>
                            </Card>
                        </Col>

                        <Col xs={12} lg={6}>
                            <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                <h2 className="h4 mb-3">
                                    Sécurité — Modifier mon mot de passe
                                </h2>

                                {messageMdp && (
                                    <Alert
                                        variant={messageMdp.variante}
                                        dismissible
                                        onClose={() => setMessageMdp(null)}
                                        className="small"
                                    >
                                        {messageMdp.texte}
                                    </Alert>
                                )}

                                <Form onSubmit={handleModifierMotDePasse}>
                                    <Form.Group
                                        className="mb-3"
                                        controlId="ancien-mot-de-passe"
                                    >
                                        <Form.Label className="small fw-semibold">
                                            Ancien mot de passe *
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Saisissez votre mot de passe actuel"
                                            value={ancienMotDePasse}
                                            onChange={(e) =>
                                                setAncienMotDePasse(e.target.value)
                                            }
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group
                                        className="mb-3"
                                        controlId="nouveau-mot-de-passe"
                                    >
                                        <Form.Label className="small fw-semibold">
                                            Nouveau mot de passe (min. 6 caractères) *
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Choisissez un nouveau mot de passe"
                                            value={nouveauMotDePasse}
                                            onChange={(e) =>
                                                setNouveauMotDePasse(e.target.value)
                                            }
                                            minLength={6}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group
                                        className="mb-4"
                                        controlId="confirmation-mot-de-passe"
                                    >
                                        <Form.Label className="small fw-semibold">
                                            Confirmer le nouveau mot de passe *
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Confirmez votre nouveau mot de passe"
                                            value={confirmationMdp}
                                            onChange={(e) =>
                                                setConfirmationMdp(e.target.value)
                                            }
                                            minLength={6}
                                            required
                                        />
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="outline-primary"
                                        disabled={envoiMdp}
                                    >
                                        {envoiMdp
                                            ? "Mise à jour..."
                                            : "Changer mon mot de passe"}
                                    </Button>
                                </Form>
                            </Card>
                        </Col>
                    </Row>

                    {/* Accès rapides : Commandes récentes et Listes cadeaux */}
                    <Row className="g-4">
                        <Col xs={12} lg={6}>
                            <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h2 className="h4 mb-0">
                                        Dernières commandes ({commandes.length})
                                    </h2>
                                    <Button
                                        as={Link}
                                        to="/commandes"
                                        variant="outline-primary"
                                        size="sm"
                                    >
                                        Voir tout
                                    </Button>
                                </div>

                                {commandes.length === 0 ? (
                                    <p className="text-muted small mb-0">
                                        Aucune commande enregistrée pour le moment.
                                    </p>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {commandes.slice(0, 3).map((cmd) => {
                                            const badge = obtenirBadgeStatut(cmd.statut);
                                            return (
                                                <div
                                                    key={cmd.id}
                                                    className="d-flex justify-content-between align-items-center p-3 rounded border small"
                                                    style={{
                                                        backgroundColor: "var(--lg-cream)"
                                                    }}
                                                >
                                                    <div>
                                                        <div className="fw-semibold">
                                                            Commande #{cmd.id}
                                                        </div>
                                                        <div className="text-muted">
                                                            {formaterDate(cmd.date)} —{" "}
                                                            {cmd.mode_livraison || "Standard"}
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="fw-bold">
                                                            {formaterPrix(cmd.total)}
                                                        </div>
                                                        <Badge
                                                            bg={badge.bg}
                                                            text={badge.text}
                                                        >
                                                            {badge.label}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        </Col>

                        <Col xs={12} lg={6}>
                            <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h2 className="h4 mb-0 d-flex align-items-center gap-2">
                                        <IconeCadeau size={20} />
                                        Mes listes cadeaux ({listes.length})
                                    </h2>
                                    <Button
                                        as={Link}
                                        to="/listes"
                                        variant="outline-primary"
                                        size="sm"
                                    >
                                        Gérer mes listes
                                    </Button>
                                </div>

                                {listes.length === 0 ? (
                                    <p className="text-muted small mb-0">
                                        Vous n&apos;avez pas encore créé de liste cadeau.
                                    </p>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {listes.slice(0, 3).map((liste) => (
                                            <div
                                                key={liste.id}
                                                className="d-flex justify-content-between align-items-center p-3 rounded border small"
                                                style={{
                                                    backgroundColor: "var(--lg-cream)"
                                                }}
                                            >
                                                <div>
                                                    <div className="fw-semibold">
                                                        {liste.nom}
                                                    </div>
                                                    <div className="text-muted">
                                                        Code :{" "}
                                                        <code>{liste.code_partage}</code>
                                                    </div>
                                                </div>
                                                <Badge className="lg-badge-categorie">
                                                    {liste.articles.length} ouvrage(s)
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
}

export default Profil;
