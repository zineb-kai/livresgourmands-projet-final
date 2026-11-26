import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Carousel,
    Form,
    InputGroup,
    Badge,
    Spinner,
    Alert
} from "react-bootstrap";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import OuvrageCard from "../components/OuvrageCard";
import {
    IconeLivre,
    IconeCadeau,
    IconeEtoile,
    IconePanier
} from "../components/Icones";

function Home() {
    const { utilisateur } = useAuth();
    const navigate = useNavigate();

    // Données dynamiques depuis MySQL
    const [ouvrages, setOuvrages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    // Filtres rapides et accès liste d'un ami
    const [filtreCategorieId, setFiltreCategorieId] = useState("");
    const [rechercheRapide, setRechercheRapide] = useState("");
    const [codeAmi, setCodeAmi] = useState("");

    useEffect(() => {
        const chargerAccueil = async () => {
            setChargement(true);
            setErreur("");
            try {
                const [resOuvrages, resCategories] = await Promise.all([
                    api.get("/ouvrages?tous=true"),
                    api.get("/categories")
                ]);
                setOuvrages(Array.isArray(resOuvrages.data) ? resOuvrages.data : []);
                setCategories(
                    Array.isArray(resCategories.data) ? resCategories.data : []
                );
            } catch (error) {
                setErreur(
                    error.response?.data?.message ||
                        "Impossible de charger la sélection d'ouvrages."
                );
            } finally {
                setChargement(false);
            }
        };

        chargerAccueil();
    }, []);

    // Compter le nombre d'ouvrages par catégorie
    const compterOuvrages = (catId) =>
        ouvrages.filter((o) => String(o.categorie_id) === String(catId)).length;

    // Ouvrages filtrés pour la sélection rapide
    const ouvragesSelection = ouvrages
        .filter(
            (o) =>
                !filtreCategorieId ||
                String(o.categorie_id) === String(filtreCategorieId)
        )
        .slice(0, 8);

    // Nouveautés : derniers ouvrages ajoutés dans MySQL (tri décroissant par ID)
    const nouveautes = [...ouvrages]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 4);

    // Lancer la recherche rapide vers /catalogue?q=...
    const handleRechercheRapide = (e) => {
        e.preventDefault();
        const terme = rechercheRapide.trim();
        if (terme) {
            navigate(`/catalogue?q=${encodeURIComponent(terme)}`);
        } else {
            navigate("/catalogue");
        }
    };

    // Accéder directement à la liste cadeau d'un ami
    const handleAccederListeAmi = (e) => {
        e.preventDefault();
        const code = codeAmi.trim();
        if (code) {
            navigate(`/listes/partage/${encodeURIComponent(code)}`);
        } else {
            navigate("/listes/partage");
        }
    };

    return (
        <div className="lg-fade-in">
            {/* 1. Carrousel professionnel à 3 bannières */}
            <section aria-label="Bannières principales de la librairie">
                <Carousel
                    fade
                    interval={6000}
                    className="lg-hero-carousel"
                    prevLabel="Bannière précédente"
                    nextLabel="Bannière suivante"
                    indicatorLabels={[
                        "Bannière 1 : Bienvenue",
                        "Bannière 2 : Saveurs et découvertes",
                        "Bannière 3 : Listes cadeaux"
                    ]}
                >
                    {/* Bannière 1 : Bienvenue & Catalogue */}
                    <Carousel.Item>
                        <div className="lg-hero-slide lg-hero-slide-1">
                            <Container className="py-5">
                                <Row className="align-items-center">
                                    <Col xs={12} lg={8}>
                                        <Badge className="lg-badge-terracotta px-3 py-2 mb-3">
                                            Librairie en ligne — Sélection 2026
                                        </Badge>
                                        <h1 className="display-5 fw-bold text-white mb-3">
                                            Bienvenue sur LivresGourmands.net
                                        </h1>
                                        {utilisateur && (
                                            <p className="fs-5 text-warning mb-2">
                                                Ravi de vous revoir, {utilisateur.nom} !
                                            </p>
                                        )}
                                        <p className="lead text-white-50 mb-4">
                                            Explorez un catalogue soigneusement choisi :
                                            gastronomie, romans incontournables,
                                            informatique, jeunesse et culture.
                                        </p>
                                        <div className="d-flex flex-wrap gap-3">
                                            <Button
                                                as={Link}
                                                to="/catalogue"
                                                variant="primary"
                                                size="lg"
                                            >
                                                Découvrir le catalogue
                                            </Button>
                                            <Button
                                                as={Link}
                                                to="/categories"
                                                variant="outline-light"
                                                size="lg"
                                            >
                                                Explorer les catégories
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Container>
                        </div>
                    </Carousel.Item>

                    {/* Bannière 2 : Gastronomie & Nouveautés */}
                    <Carousel.Item>
                        <div className="lg-hero-slide lg-hero-slide-2">
                            <Container className="py-5">
                                <Row className="align-items-center">
                                    <Col xs={12} lg={8}>
                                        <Badge bg="light" text="dark" className="px-3 py-2 mb-3">
                                            Saveurs &amp; Découvertes
                                        </Badge>
                                        <h2 className="display-5 fw-bold text-white mb-3">
                                            Des livres qui éveillent la curiosité et l&apos;appétit
                                        </h2>
                                        <p className="lead text-white-50 mb-4">
                                            Consultez les avis d&apos;acheteurs vérifiés,
                                            suivez les stocks en temps réel et choisissez
                                            votre mode de livraison jusqu&apos;en 24h chrono.
                                        </p>
                                        <div className="d-flex flex-wrap gap-3">
                                            <Button
                                                as={Link}
                                                to="/catalogue"
                                                variant="light"
                                                size="lg"
                                            >
                                                Voir les nouveautés
                                            </Button>
                                            <Button
                                                as={Link}
                                                to="/panier"
                                                variant="outline-light"
                                                size="lg"
                                            >
                                                Accéder au panier
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Container>
                        </div>
                    </Carousel.Item>

                    {/* Bannière 3 : Listes cadeaux & Parcours Ami */}
                    <Carousel.Item>
                        <div className="lg-hero-slide lg-hero-slide-3">
                            <Container className="py-5">
                                <Row className="align-items-center">
                                    <Col xs={12} lg={8}>
                                        <Badge className="lg-badge-terracotta px-3 py-2 mb-3">
                                            Partage &amp; Occasions spéciales
                                        </Badge>
                                        <h2 className="display-5 fw-bold text-white mb-3">
                                            Créez et partagez vos listes cadeaux en un clic
                                        </h2>
                                        <p className="lead text-white-50 mb-4">
                                            Composez votre sélection personnalisée et
                                            envoyez un code sécurisé à vos proches pour
                                            qu&apos;ils vous offrent exactement le livre de vos envies.
                                        </p>
                                        <div className="d-flex flex-wrap gap-3">
                                            <Button
                                                as={Link}
                                                to={utilisateur ? "/listes" : "/register"}
                                                variant="primary"
                                                size="lg"
                                            >
                                                {utilisateur
                                                    ? "Gérer mes listes cadeaux"
                                                    : "Créer mon compte"}
                                            </Button>
                                            <Button
                                                as={Link}
                                                to="/listes/partage"
                                                variant="outline-light"
                                                size="lg"
                                            >
                                                Consulter la liste d&apos;un ami
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Container>
                        </div>
                    </Carousel.Item>
                </Carousel>
            </section>

            <Container className="py-5">
                {/* 2. Barre de recherche et filtres rapides */}
                <Card className="lg-panel shadow-sm border-0 p-3 p-md-4 mb-5">
                    <Row className="g-3 align-items-center">
                        <Col xs={12} lg={6}>
                            <Form onSubmit={handleRechercheRapide}>
                                <Form.Label
                                    htmlFor="recherche-rapide-accueil"
                                    className="small fw-semibold mb-1"
                                >
                                    Recherche rapide dans le catalogue
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        id="recherche-rapide-accueil"
                                        type="search"
                                        placeholder="Titre, auteur ou numéro ISBN..."
                                        value={rechercheRapide}
                                        onChange={(e) =>
                                            setRechercheRapide(e.target.value)
                                        }
                                    />
                                    <Button type="submit" variant="primary">
                                        Rechercher
                                    </Button>
                                </InputGroup>
                            </Form>
                        </Col>

                        <Col xs={12} lg={6}>
                            <div className="small fw-semibold mb-2">
                                Filtres rapides par catégorie
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={
                                        filtreCategorieId === ""
                                            ? "primary"
                                            : "outline-secondary"
                                    }
                                    onClick={() => setFiltreCategorieId("")}
                                >
                                    Toutes ({ouvrages.length})
                                </Button>
                                {categories.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        size="sm"
                                        variant={
                                            String(filtreCategorieId) ===
                                            String(cat.id)
                                                ? "primary"
                                                : "outline-secondary"
                                        }
                                        onClick={() =>
                                            setFiltreCategorieId(String(cat.id))
                                        }
                                    >
                                        {cat.nom} ({compterOuvrages(cat.id)})
                                    </Button>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Card>

                {erreur && (
                    <Alert variant="danger" className="mb-4">
                        {erreur}
                    </Alert>
                )}

                {chargement ? (
                    <div className="text-center py-5" role="status">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 text-muted">
                            Chargement de la librairie...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* 3. Sélection d'ouvrages provenant de MySQL */}
                        <section className="mb-5" aria-labelledby="titre-selection">
                            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
                                <div>
                                    <h2 id="titre-selection" className="h2 fw-bold mb-1">
                                        Sélection de la librairie
                                    </h2>
                                    <p className="text-muted small mb-0">
                                        {filtreCategorieId
                                            ? `Ouvrages filtrés par catégorie (${ouvragesSelection.length} affiché(s))`
                                            : "Découvrez nos ouvrages disponibles directement depuis notre catalogue MySQL"}
                                    </p>
                                </div>
                                <Button
                                    as={Link}
                                    to={
                                        filtreCategorieId
                                            ? `/catalogue?categorie=${filtreCategorieId}`
                                            : "/catalogue"
                                    }
                                    variant="outline-primary"
                                    size="sm"
                                >
                                    Voir tout le catalogue
                                </Button>
                            </div>

                            {ouvragesSelection.length === 0 ? (
                                <Alert variant="info">
                                    Aucun ouvrage dans cette catégorie pour le moment.
                                </Alert>
                            ) : (
                                <Row className="g-4">
                                    {ouvragesSelection.map((ouvrage) => (
                                        <Col
                                            key={ouvrage.id}
                                            xs={12}
                                            sm={6}
                                            lg={4}
                                            xl={3}
                                        >
                                            <OuvrageCard ouvrage={ouvrage} />
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </section>

                        {/* 4. Catégories dynamiques */}
                        <section className="mb-5" aria-labelledby="titre-categories">
                            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
                                <div>
                                    <h2 id="titre-categories" className="h2 fw-bold mb-1">
                                        Explorer par catégorie
                                    </h2>
                                    <p className="text-muted small mb-0">
                                        Parcourez nos rayons thématiques et accédez au catalogue filtré
                                    </p>
                                </div>
                                <Button
                                    as={Link}
                                    to="/categories"
                                    variant="outline-secondary"
                                    size="sm"
                                >
                                    Toutes les catégories
                                </Button>
                            </div>

                            <Row className="g-3">
                                {categories.map((cat) => (
                                    <Col key={cat.id} xs={12} sm={6} lg={4}>
                                        <Card className="lg-card lg-card-hover border-0 shadow-sm h-100 p-3">
                                            <Card.Body className="d-flex flex-column">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h3 className="h5 mb-0">{cat.nom}</h3>
                                                    <Badge className="lg-badge-categorie">
                                                        {compterOuvrages(cat.id)} livre(s)
                                                    </Badge>
                                                </div>
                                                <p className="small text-muted flex-grow-1 mb-3">
                                                    {cat.description ||
                                                        `Découvrez tous nos titres dans la catégorie ${cat.nom}.`}
                                                </p>
                                                <Button
                                                    as={Link}
                                                    to={`/catalogue?categorie=${cat.id}`}
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="align-self-start"
                                                >
                                                    Parcourir le rayon
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </section>

                        {/* 5. Section Nouveautés */}
                        {nouveautes.length > 0 && (
                            <section className="mb-5" aria-labelledby="titre-nouveautes">
                                <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
                                    <div>
                                        <Badge className="lg-badge-stock mb-2">
                                            Derniers ajouts
                                        </Badge>
                                        <h2 id="titre-nouveautes" className="h2 fw-bold mb-1">
                                            Nouveautés du catalogue
                                        </h2>
                                        <p className="text-muted small mb-0">
                                            Les derniers ouvrages ajoutés dans notre librairie
                                        </p>
                                    </div>
                                </div>

                                <Row className="g-4">
                                    {nouveautes.map((ouvrage) => (
                                        <Col
                                            key={`new-${ouvrage.id}`}
                                            xs={12}
                                            sm={6}
                                            lg={3}
                                        >
                                            <OuvrageCard ouvrage={ouvrage} />
                                        </Col>
                                    ))}
                                </Row>
                            </section>
                        )}
                    </>
                )}

                {/* 6. Mise en valeur des listes cadeaux et du parcours Ami */}
                <section className="mb-5" aria-labelledby="titre-listes-cadeaux">
                    <Card
                        className="border-0 shadow-sm overflow-hidden"
                        style={{
                            backgroundColor: "var(--lg-ink)",
                            color: "#ffffff",
                            borderRadius: "0.9rem"
                        }}
                    >
                        <Card.Body className="p-4 p-md-5">
                            <Row className="g-4 align-items-center">
                                <Col xs={12} lg={6}>
                                    <Badge className="lg-badge-terracotta px-3 py-2 mb-3">
                                        Parcours Client &amp; Ami
                                    </Badge>
                                    <h2
                                        id="titre-listes-cadeaux"
                                        className="h2 fw-bold text-white mb-3"
                                    >
                                        Offrir le bon livre devient un jeu d&apos;enfant
                                    </h2>
                                    <p className="text-white-50 mb-4">
                                        Créez vos listes cadeaux personnelles, partagez votre
                                        code sécurisé avec vos amis et permettez-leur de vous
                                        offrir vos lectures préférées sans risque de doublon.
                                    </p>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Button
                                            as={Link}
                                            to={utilisateur ? "/listes" : "/login"}
                                            variant="primary"
                                        >
                                            {utilisateur
                                                ? "Gérer mes listes"
                                                : "Créer une liste cadeau"}
                                        </Button>
                                        <Button
                                            as={Link}
                                            to="/listes/partage"
                                            variant="outline-light"
                                        >
                                            Page d&apos;accès Ami
                                        </Button>
                                    </div>
                                </Col>

                                <Col xs={12} lg={6}>
                                    <div
                                        className="p-4 rounded"
                                        style={{
                                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                                            border: "1px solid rgba(255, 255, 255, 0.16)"
                                        }}
                                    >
                                        <div className="d-flex align-items-center gap-2 mb-2 fw-semibold">
                                            <IconeCadeau size={20} className="text-warning" />
                                            <span>Vous avez reçu un code de partage ?</span>
                                        </div>
                                        <p className="small text-white-50 mb-3">
                                            Consultez directement la liste cadeau d&apos;un proche,
                                            même sans créer de compte.
                                        </p>
                                        <Form onSubmit={handleAccederListeAmi}>
                                            <Form.Label
                                                htmlFor="code-ami-accueil"
                                                className="visually-hidden"
                                            >
                                                Code de partage de la liste d&apos;un ami
                                            </Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    id="code-ami-accueil"
                                                    type="text"
                                                    placeholder="Entrez le code personnel..."
                                                    value={codeAmi}
                                                    onChange={(e) =>
                                                        setCodeAmi(e.target.value)
                                                    }
                                                />
                                                <Button type="submit" variant="primary">
                                                    Ouvrir
                                                </Button>
                                            </InputGroup>
                                        </Form>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </section>

                {/* 7. Avantages de notre librairie */}
                <section aria-labelledby="titre-avantages">
                    <div className="text-center mb-4">
                        <h2 id="titre-avantages" className="h2 fw-bold mb-1">
                            Pourquoi choisir LivresGourmands.net ?
                        </h2>
                        <p className="text-muted small mb-0">
                            Une expérience de lecture pensée pour la simplicité, la transparence et la qualité
                        </p>
                    </div>

                    <Row className="g-4">
                        <Col xs={12} sm={6} lg={3}>
                            <Card className="lg-panel shadow-sm border-0 p-4 h-100 text-center">
                                <div
                                    className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
                                    style={{
                                        width: "52px",
                                        height: "52px",
                                        backgroundColor: "var(--lg-terracotta-soft)",
                                        color: "var(--lg-terracotta)"
                                    }}
                                >
                                    <IconeLivre size={24} />
                                </div>
                                <h3 className="h5 mb-2">Stocks en temps réel</h3>
                                <p className="small text-muted mb-0">
                                    Disponibilité vérifiée en direct avec notre base de données
                                    et mise à jour automatique à chaque commande.
                                </p>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} lg={3}>
                            <Card className="lg-panel shadow-sm border-0 p-4 h-100 text-center">
                                <div
                                    className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
                                    style={{
                                        width: "52px",
                                        height: "52px",
                                        backgroundColor: "var(--lg-sage-soft)",
                                        color: "var(--lg-sage)"
                                    }}
                                >
                                    <IconePanier size={24} />
                                </div>
                                <h3 className="h5 mb-2">Livraison au choix</h3>
                                <p className="small text-muted mb-0">
                                    Envoi lent gratuit, livraison rapide ou 24h chrono avec
                                    suivi clair dans votre espace personnel.
                                </p>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} lg={3}>
                            <Card className="lg-panel shadow-sm border-0 p-4 h-100 text-center">
                                <div
                                    className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
                                    style={{
                                        width: "52px",
                                        height: "52px",
                                        backgroundColor: "var(--lg-terracotta-soft)",
                                        color: "var(--lg-terracotta)"
                                    }}
                                >
                                    <IconeEtoile pleine size={24} />
                                </div>
                                <h3 className="h5 mb-2">Avis vérifiés</h3>
                                <p className="small text-muted mb-0">
                                    Seuls les clients ayant acheté un ouvrage peuvent le noter,
                                    et chaque commentaire est modéré par nos éditeurs.
                                </p>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} lg={3}>
                            <Card className="lg-panel shadow-sm border-0 p-4 h-100 text-center">
                                <div
                                    className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
                                    style={{
                                        width: "52px",
                                        height: "52px",
                                        backgroundColor: "var(--lg-sage-soft)",
                                        color: "var(--lg-sage)"
                                    }}
                                >
                                    <IconeCadeau size={24} />
                                </div>
                                <h3 className="h5 mb-2">Listes cadeaux</h3>
                                <p className="small text-muted mb-0">
                                    Partagez vos envies de lecture par code sécurisé afin que
                                    vos proches choisissent le cadeau idéal.
                                </p>
                            </Card>
                        </Col>
                    </Row>
                </section>
            </Container>
        </div>
    );
}

export default Home;
