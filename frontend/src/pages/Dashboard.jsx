import { useEffect, useState, useCallback } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Nav,
    Badge,
    Alert,
    Spinner,
    Button
} from "react-bootstrap";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { IconeDashboard } from "../components/Icones";
import GestionOuvrages from "../components/dashboard/GestionOuvrages";
import GestionCategories from "../components/dashboard/GestionCategories";
import GestionCommandes from "../components/dashboard/GestionCommandes";
import ModerationCommentaires from "../components/dashboard/ModerationCommentaires";
import GestionUtilisateurs from "../components/dashboard/GestionUtilisateurs";
import { formaterPrix } from "../utils/couvertures";

function Dashboard() {
    const { utilisateur } = useAuth();
    const estAdmin = utilisateur?.role === "administrateur";

    // Onglet actif du menu latéral
    const [sectionActive, setSectionActive] = useState("apercu");

    // Données dynamiques chargées depuis MySQL selon les permissions du rôle
    const [ouvrages, setOuvrages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [commandes, setCommandes] = useState([]);
    const [commentaires, setCommentaires] = useState([]);
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    // Charger uniquement les ressources autorisées pour le rôle connecté
    const chargerDonneesDashboard = useCallback(async () => {
        setChargement(true);
        setErreur("");

        try {
            const promesses = [
                api.get("/ouvrages?tous=true"),
                api.get("/categories"),
                api.get("/commentaires")
            ];

            if (estAdmin) {
                promesses.push(api.get("/commandes/admin/toutes"));
                promesses.push(api.get("/users"));
            }

            const resultats = await Promise.all(promesses);

            setOuvrages(Array.isArray(resultats[0].data) ? resultats[0].data : []);
            setCategories(
                Array.isArray(resultats[1].data) ? resultats[1].data : []
            );
            setCommentaires(
                Array.isArray(resultats[2].data) ? resultats[2].data : []
            );

            if (estAdmin) {
                setCommandes(
                    Array.isArray(resultats[3].data) ? resultats[3].data : []
                );
                setUtilisateurs(
                    Array.isArray(resultats[4].data) ? resultats[4].data : []
                );
            }
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                    "Impossible de charger les données du tableau de bord."
            );
        } finally {
            setChargement(false);
        }
    }, [estAdmin]);

    useEffect(() => {
        chargerDonneesDashboard();
    }, [chargerDonneesDashboard]);

    // Statistiques réelles calculées depuis les données MySQL
    const nbRuptures = ouvrages.filter((o) => Number(o.stock) === 0).length;
    const nbCommentairesAttente = commentaires.filter((c) => !c.valide).length;
    const commandesPayees = commandes.filter(
        (c) => c.statut === "payee" || c.statut === "expediee"
    );
    const chiffreAffaires = commandesPayees.reduce(
        (somme, c) => somme + Number(c.total || 0),
        0
    );

    // Éléments du menu latéral filtrés selon les permissions du rôle
    const itemsMenu = [
        { id: "apercu", label: "Vue d'ensemble" },
        { id: "ouvrages", label: "Ouvrages", badge: ouvrages.length },
        {
            id: "commentaires",
            label: "Commentaires",
            badge: nbCommentairesAttente,
            alerte: nbCommentairesAttente > 0
        },
        ...(estAdmin
            ? [
                  {
                      id: "categories",
                      label: "Catégories",
                      badge: categories.length
                  },
                  {
                      id: "commandes",
                      label: "Commandes",
                      badge: commandes.length
                  },
                  {
                      id: "utilisateurs",
                      label: "Utilisateurs",
                      badge: utilisateurs.length
                  }
              ]
            : [])
    ];

    return (
        <Container fluid className="py-4 px-3 px-lg-4">
            {/* En-tête du tableau de bord */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                <div>
                    <h1 className="h2 fw-bold mb-1 d-flex align-items-center gap-2">
                        <IconeDashboard size={26} />
                        Tableau de bord —{" "}
                        {estAdmin ? "Administration" : "Espace Éditeur"}
                    </h1>
                    <p className="text-muted small mb-0">
                        Connecté en tant que{" "}
                        <strong>{utilisateur?.nom}</strong> — Rôle :{" "}
                        <Badge bg={estAdmin ? "danger" : "warning"} text={estAdmin ? undefined : "dark"}>
                            {utilisateur?.role}
                        </Badge>
                    </p>
                </div>

                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={chargerDonneesDashboard}
                    disabled={chargement}
                >
                    Actualiser les données
                </Button>
            </div>

            {erreur && (
                <Alert variant="danger" dismissible onClose={() => setErreur("")}>
                    {erreur}
                </Alert>
            )}

            <Row className="g-4 align-items-start">
                {/* Menu latéral de navigation */}
                <Col xs={12} lg={3} xl={2}>
                    <Card className="lg-panel shadow-sm border-0 p-3">
                        <div className="small text-uppercase text-muted fw-semibold mb-2 px-2">
                            Navigation
                        </div>
                        <Nav
                            variant="pills"
                            className="flex-row flex-lg-column gap-1 flex-wrap"
                            activeKey={sectionActive}
                            onSelect={(cle) => cle && setSectionActive(cle)}
                        >
                            {itemsMenu.map((item) => (
                                <Nav.Item key={item.id}>
                                    <Nav.Link
                                        eventKey={item.id}
                                        className="d-flex justify-content-between align-items-center gap-2 py-2 px-3 small"
                                        style={
                                            sectionActive === item.id
                                                ? {
                                                      backgroundColor:
                                                          "var(--lg-ink)",
                                                      color: "#ffffff"
                                                  }
                                                : {
                                                      color: "var(--lg-ink)"
                                                  }
                                        }
                                    >
                                        <span>{item.label}</span>
                                        {item.badge !== undefined && (
                                            <Badge
                                                pill
                                                bg={
                                                    item.alerte
                                                        ? "danger"
                                                        : sectionActive ===
                                                          item.id
                                                        ? "light"
                                                        : "secondary"
                                                }
                                                text={
                                                    !item.alerte &&
                                                    sectionActive === item.id
                                                        ? "dark"
                                                        : undefined
                                                }
                                            >
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </Nav.Link>
                                </Nav.Item>
                            ))}
                        </Nav>
                    </Card>
                </Col>

                {/* Zone principale dynamique */}
                <Col xs={12} lg={9} xl={10}>
                    {chargement ? (
                        <Card className="lg-panel shadow-sm border-0 p-5 text-center">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted mb-0">
                                Chargement des données en temps réel depuis MySQL...
                            </p>
                        </Card>
                    ) : (
                        <>
                            {/* Vue d'ensemble — Cartes statistiques dynamiques */}
                            {sectionActive === "apercu" && (
                                <>
                                    <Row className="g-3 mb-4">
                                        <Col xs={12} sm={6} xl={4}>
                                            <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                                <div className="small text-uppercase text-muted mb-1">
                                                    Ouvrages au catalogue
                                                </div>
                                                <div
                                                    className="fs-2 fw-bold"
                                                    style={{ color: "var(--lg-ink)" }}
                                                >
                                                    {ouvrages.length}
                                                </div>
                                                <div className="small text-muted mt-1">
                                                    Dont{" "}
                                                    <strong
                                                        className={
                                                            nbRuptures > 0
                                                                ? "text-danger"
                                                                : "text-success"
                                                        }
                                                    >
                                                        {nbRuptures} en rupture de stock
                                                    </strong>
                                                </div>
                                            </Card>
                                        </Col>

                                        <Col xs={12} sm={6} xl={4}>
                                            <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                                <div className="small text-uppercase text-muted mb-1">
                                                    Catégories
                                                </div>
                                                <div
                                                    className="fs-2 fw-bold"
                                                    style={{ color: "var(--lg-ink)" }}
                                                >
                                                    {categories.length}
                                                </div>
                                                <div className="small text-muted mt-1">
                                                    Thématiques actives en base
                                                </div>
                                            </Card>
                                        </Col>

                                        <Col xs={12} sm={6} xl={4}>
                                            <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                                <div className="small text-uppercase text-muted mb-1">
                                                    Commentaires en attente
                                                </div>
                                                <div
                                                    className="fs-2 fw-bold"
                                                    style={{
                                                        color:
                                                            nbCommentairesAttente > 0
                                                                ? "var(--lg-terracotta)"
                                                                : "var(--lg-sage)"
                                                    }}
                                                >
                                                    {nbCommentairesAttente}
                                                </div>
                                                <div className="small text-muted mt-1">
                                                    Sur {commentaires.length} commentaire(s) total
                                                </div>
                                            </Card>
                                        </Col>

                                        {estAdmin && (
                                            <>
                                                <Col xs={12} sm={6} xl={4}>
                                                    <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                                        <div className="small text-uppercase text-muted mb-1">
                                                            Commandes clients
                                                        </div>
                                                        <div
                                                            className="fs-2 fw-bold"
                                                            style={{
                                                                color: "var(--lg-ink)"
                                                            }}
                                                        >
                                                            {commandes.length}
                                                        </div>
                                                        <div className="small text-muted mt-1">
                                                            {commandesPayees.length} payée(s) / expédiée(s)
                                                        </div>
                                                    </Card>
                                                </Col>

                                                <Col xs={12} sm={6} xl={4}>
                                                    <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                                        <div className="small text-uppercase text-muted mb-1">
                                                            Chiffre d&apos;affaires (payées)
                                                        </div>
                                                        <div className="fs-2 fw-bold lg-prix">
                                                            {formaterPrix(
                                                                chiffreAffaires
                                                            )}
                                                        </div>
                                                        <div className="small text-muted mt-1">
                                                            Calculé sur les commandes réglées
                                                        </div>
                                                    </Card>
                                                </Col>

                                                <Col xs={12} sm={6} xl={4}>
                                                    <Card className="lg-panel shadow-sm border-0 p-4 h-100">
                                                        <div className="small text-uppercase text-muted mb-1">
                                                            Utilisateurs inscrits
                                                        </div>
                                                        <div
                                                            className="fs-2 fw-bold"
                                                            style={{
                                                                color: "var(--lg-sage)"
                                                            }}
                                                        >
                                                            {utilisateurs.length}
                                                        </div>
                                                        <div className="small text-muted mt-1">
                                                            Comptes enregistrés dans MySQL
                                                        </div>
                                                    </Card>
                                                </Col>
                                            </>
                                        )}
                                    </Row>

                                    <Card className="lg-panel shadow-sm border-0 p-4">
                                        <h2 className="h4 mb-2">
                                            Accès rapides selon vos permissions
                                        </h2>
                                        <p className="text-muted small mb-3">
                                            {estAdmin
                                                ? "En tant qu'administrateur, vous disposez de l'ensemble des droits de gestion sur les ouvrages, catégories, commandes, commentaires et utilisateurs."
                                                : "En tant qu'éditeur, vous pouvez ajouter et modifier des ouvrages ainsi que modérer les commentaires des lecteurs."}
                                        </p>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() =>
                                                    setSectionActive("ouvrages")
                                                }
                                            >
                                                Gérer les ouvrages
                                            </Button>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() =>
                                                    setSectionActive(
                                                        "commentaires"
                                                    )
                                                }
                                            >
                                                Modérer les commentaires (
                                                {nbCommentairesAttente})
                                            </Button>
                                            {estAdmin && (
                                                <>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSectionActive(
                                                                "categories"
                                                            )
                                                        }
                                                    >
                                                        Gérer les catégories
                                                    </Button>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSectionActive(
                                                                "commandes"
                                                            )
                                                        }
                                                    >
                                                        Consulter les commandes
                                                    </Button>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSectionActive(
                                                                "utilisateurs"
                                                            )
                                                        }
                                                    >
                                                        Gérer les utilisateurs
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </Card>
                                </>
                            )}

                            {/* Section Ouvrages (éditeur + admin) */}
                            {sectionActive === "ouvrages" && (
                                <GestionOuvrages
                                    ouvrages={ouvrages}
                                    categories={categories}
                                    estAdmin={estAdmin}
                                    onRafraichir={chargerDonneesDashboard}
                                />
                            )}

                            {/* Section Modération commentaires (éditeur + admin) */}
                            {sectionActive === "commentaires" && (
                                <ModerationCommentaires
                                    commentaires={commentaires}
                                    onRafraichir={chargerDonneesDashboard}
                                />
                            )}

                            {/* Sections réservées à l'administrateur */}
                            {sectionActive === "categories" && estAdmin && (
                                <GestionCategories
                                    categories={categories}
                                    ouvrages={ouvrages}
                                    onRafraichir={chargerDonneesDashboard}
                                />
                            )}

                            {sectionActive === "commandes" && estAdmin && (
                                <GestionCommandes
                                    commandes={commandes}
                                    onRafraichir={chargerDonneesDashboard}
                                />
                            )}

                            {sectionActive === "utilisateurs" && estAdmin && (
                                <GestionUtilisateurs
                                    utilisateurs={utilisateurs}
                                    utilisateurCourant={utilisateur}
                                    onRafraichir={chargerDonneesDashboard}
                                />
                            )}
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default Dashboard;
