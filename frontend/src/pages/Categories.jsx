import { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Alert,
    Spinner,
    Badge
} from "react-bootstrap";
import { Link } from "react-router-dom";

import api from "../services/api";
import { obtenirImageCouverture } from "../utils/couvertures";

function Categories() {
    // États du composant
    const [categories, setCategories] = useState([]);
    const [ouvrages, setOuvrages] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    // Récupérer les catégories et les ouvrages
    useEffect(() => {
        const chargerDonnees = async () => {
            try {
                const [responseCategories, responseOuvrages] = await Promise.all([
                    api.get("/categories"),
                    api.get("/ouvrages?tous=true")
                ]);

                setCategories(responseCategories.data);
                setOuvrages(responseOuvrages.data);
            } catch (error) {
                setErreur(
                    error.response?.data?.message ||
                        "Impossible de récupérer les catégories."
                );
            } finally {
                setChargement(false);
            }
        };

        chargerDonnees();
    }, []);

    // Compter les ouvrages dans chaque catégorie
    const compterOuvrages = (categorieId) =>
        ouvrages.filter(
            (ouvrage) => String(ouvrage.categorie_id) === String(categorieId)
        ).length;

    return (
        <Container className="py-4 lg-fade-in">
            {/* Titre de la page */}
            <div className="text-center mb-4">
                <h1 className="fw-bold mb-2">Nos catégories</h1>
                <p className="text-muted mb-0">
                    Explorez nos rayons thématiques et accédez directement au catalogue filtré
                </p>
            </div>

            {erreur && <Alert variant="danger">{erreur}</Alert>}

            {chargement && (
                <div className="text-center py-5" role="status">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">
                        Chargement des catégories...
                    </p>
                </div>
            )}

            {!chargement && !erreur && categories.length === 0 && (
                <Alert variant="info">Aucune catégorie disponible.</Alert>
            )}

            {!chargement && !erreur && categories.length > 0 && (
                <Row className="g-4">
                    {categories.map((categorie) => {
                        const imageRayon = obtenirImageCouverture(categorie.nom);
                        const total = compterOuvrages(categorie.id);

                        return (
                            <Col key={categorie.id} xs={12} sm={6} lg={4}>
                                <Card className="h-100 shadow-sm lg-card lg-card-hover border-0 overflow-hidden">
                                    {/* Bandeau illustré thématique */}
                                    <div
                                        className="position-relative d-flex align-items-end p-3"
                                        style={{ height: "130px" }}
                                    >
                                        <img
                                            src={imageRayon}
                                            alt={`Illustration de la catégorie ${categorie.nom}`}
                                            className="lg-book-cover-img"
                                            loading="lazy"
                                        />
                                        <div className="position-relative z-1 d-flex justify-content-between align-items-center w-100">
                                            <h2 className="h4 text-white mb-0">
                                                {categorie.nom}
                                            </h2>
                                            <Badge bg="light" text="dark">
                                                {total} ouvrage(s)
                                            </Badge>
                                        </div>
                                    </div>

                                    <Card.Body className="p-4 d-flex flex-column">
                                        <Card.Text className="text-muted small flex-grow-1 mb-3">
                                            {categorie.description ||
                                                `Découvrez notre sélection d'ouvrages dans la catégorie ${categorie.nom}.`}
                                        </Card.Text>

                                        <Button
                                            as={Link}
                                            to={`/catalogue?categorie=${categorie.id}`}
                                            variant="primary"
                                            size="sm"
                                            className="align-self-start"
                                        >
                                            Voir les ouvrages
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
}

export default Categories;
