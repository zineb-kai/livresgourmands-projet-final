import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Container,
    Row,
    Col,
    Form,
    Alert,
    Spinner
} from "react-bootstrap";

import api from "../services/api";
import OuvrageCard from "../components/OuvrageCard";

function Catalogue() {
    // Récupérer la catégorie et la recherche éventuelle depuis l'URL
    const [searchParams, setSearchParams] = useSearchParams();

    // États du composant
    const [ouvrages, setOuvrages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [recherche, setRecherche] = useState(() => searchParams.get("q") || "");
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    // Catégorie sélectionnée
    const categorieSelectionnee = searchParams.get("categorie") || "";

    // Modifier la catégorie dans l'URL
    const changerCategorie = (categorieId) => {
        const params = new URLSearchParams(searchParams);

        if (categorieId) {
            params.set("categorie", categorieId);
        } else {
            params.delete("categorie");
        }

        setSearchParams(params);
    };

    // Récupérer tous les ouvrages (y compris en rupture pour afficher leur statut) et les catégories
    useEffect(() => {
        const chargerDonnees = async () => {
            try {
                const [responseOuvrages, responseCategories] = await Promise.all([
                    api.get("/ouvrages?tous=true"),
                    api.get("/categories")
                ]);

                setOuvrages(responseOuvrages.data);
                setCategories(responseCategories.data);
            } catch (error) {
                setErreur(
                    error.response?.data?.message ||
                        "Impossible de récupérer les données du catalogue."
                );
            } finally {
                setChargement(false);
            }
        };

        chargerDonnees();
    }, []);

    // Filtrer les ouvrages par recherche (titre, auteur, ISBN) et par catégorie
    const ouvragesFiltres = ouvrages.filter((ouvrage) => {
        const texte = recherche.toLowerCase().trim();

        const correspondRecherche =
            (ouvrage.titre || "").toLowerCase().includes(texte) ||
            (ouvrage.auteur || "").toLowerCase().includes(texte) ||
            String(ouvrage.isbn || "").toLowerCase().includes(texte);

        const correspondCategorie =
            categorieSelectionnee === "" ||
            String(ouvrage.categorie_id) === categorieSelectionnee;

        return correspondRecherche && correspondCategorie;
    });

    // Récupérer le nom de la catégorie
    const obtenirNomCategorie = (categorieId) => {
        const categorie = categories.find(
            (c) => String(c.id) === String(categorieId)
        );
        return categorie ? categorie.nom : "Sans catégorie";
    };

    return (
        <Container className="py-4">
            {/* En-tête de la page */}
            <div className="text-center mb-4">
                <h1 className="fw-bold mb-2">Notre catalogue</h1>
                <p className="text-muted mb-0">
                    Recherchez par titre, auteur ou ISBN et cliquez sur un ouvrage pour consulter sa fiche complète
                </p>
            </div>

            {/* Barre de recherche et filtre par catégorie */}
            <div className="lg-panel p-3 mb-4 shadow-sm">
                <Row className="g-3">
                    <Col xs={12} md={8}>
                        <Form.Label htmlFor="recherche-catalogue" className="visually-hidden">
                            Rechercher un ouvrage
                        </Form.Label>
                        <Form.Control
                            id="recherche-catalogue"
                            type="search"
                            placeholder="Rechercher par titre, auteur ou ISBN..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                        />
                    </Col>

                    <Col xs={12} md={4}>
                        <Form.Label htmlFor="filtre-categorie" className="visually-hidden">
                            Filtrer par catégorie
                        </Form.Label>
                        <Form.Select
                            id="filtre-categorie"
                            value={categorieSelectionnee}
                            onChange={(e) => changerCategorie(e.target.value)}
                        >
                            <option value="">Toutes les catégories</option>
                            {categories.map((categorie) => (
                                <option key={categorie.id} value={categorie.id}>
                                    {categorie.nom}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row>
            </div>

            {/* Message d'erreur */}
            {erreur && <Alert variant="danger">{erreur}</Alert>}

            {/* Indicateur de chargement */}
            {chargement && (
                <div className="text-center py-5" role="status" aria-live="polite">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Chargement des ouvrages...</p>
                </div>
            )}

            {/* Aucun résultat */}
            {!chargement && !erreur && ouvragesFiltres.length === 0 && (
                <Alert variant="info">
                    Aucun ouvrage ne correspond à vos critères de recherche.
                </Alert>
            )}

            {/* Grille d'ouvrages */}
            {!chargement && !erreur && ouvragesFiltres.length > 0 && (
                <>
                    <p className="text-muted small mb-3">
                        {ouvragesFiltres.length} ouvrage(s) trouvé(s)
                    </p>

                    <Row className="g-4">
                        {ouvragesFiltres.map((ouvrage) => (
                            <Col
                                key={ouvrage.id}
                                xs={12}
                                sm={6}
                                lg={4}
                                xl={3}
                            >
                                <OuvrageCard
                                    ouvrage={ouvrage}
                                    nomCategorie={obtenirNomCategorie(
                                        ouvrage.categorie_id
                                    )}
                                />
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </Container>
    );
}

export default Catalogue;
