import { useState } from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import CouvertureOuvrage from "./CouvertureOuvrage";
import { IconePanier } from "./Icones";
import { useCart } from "../context/CartContext";
import { formaterPrix } from "../utils/couvertures";

// Carte d'ouvrage réutilisable dans le catalogue et la page d'accueil
function OuvrageCard({ ouvrage, nomCategorie }) {
    const { ajouterAuPanier } = useCart();
    const [retourAjout, setRetourAjout] = useState(null);
    const [enCours, setEnCours] = useState(false);

    const enStock = Number(ouvrage.stock) > 0;
    const libelleCategorie =
        nomCategorie || ouvrage.categorie_nom || "Sans catégorie";

    // Ajout rapide de 1 exemplaire depuis la carte
    const handleAjoutRapide = async () => {
        setEnCours(true);
        const resultat = await ajouterAuPanier(
            { ...ouvrage, categorie_nom: libelleCategorie },
            1
        );
        setEnCours(false);

        setRetourAjout({
            succes: resultat.succes,
            texte: resultat.succes ? "Ajouté au panier" : resultat.message
        });

        // Effacer automatiquement le petit retour visuel après quelques secondes
        setTimeout(() => {
            setRetourAjout(null);
        }, 3000);
    };

    return (
        <Card className="h-100 shadow-sm lg-card lg-card-hover border-0">
            {/* Couverture cliquable vers la page de détails */}
            <Link
                to={`/ouvrages/${ouvrage.id}`}
                className="text-decoration-none"
                aria-label={`Consulter les détails de ${ouvrage.titre}`}
            >
                <CouvertureOuvrage
                    ouvrage={ouvrage}
                    categorieNom={libelleCategorie}
                    variante="card"
                />
            </Link>

            <Card.Body className="d-flex flex-column p-3">
                {/* Badges de disponibilité et de catégorie */}
                <div className="d-flex flex-wrap gap-2 mb-2">
                    {enStock ? (
                        <Badge className="lg-badge-stock">
                            En stock ({ouvrage.stock})
                        </Badge>
                    ) : (
                        <Badge bg="danger">
                            Rupture de stock
                        </Badge>
                    )}

                    <Badge className="lg-badge-categorie">
                        {libelleCategorie}
                    </Badge>
                </div>

                {/* Titre de l'ouvrage */}
                <Card.Title className="fs-5 mb-1">
                    <Link
                        to={`/ouvrages/${ouvrage.id}`}
                        className="text-decoration-none"
                        style={{ color: "var(--lg-ink)" }}
                    >
                        {ouvrage.titre}
                    </Link>
                </Card.Title>

                {/* Auteur */}
                <Card.Subtitle className="mb-2 text-muted small">
                    {ouvrage.auteur}
                </Card.Subtitle>

                {/* Extrait de description */}
                <Card.Text
                    className="small text-muted mb-3 flex-grow-1"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                    }}
                >
                    {ouvrage.description || "Aucune description disponible."}
                </Card.Text>

                {/* Petit message de retour d'ajout rapide */}
                {retourAjout && (
                    <div
                        className={`small mb-2 fw-medium ${
                            retourAjout.succes ? "text-success" : "text-danger"
                        }`}
                        role="status"
                    >
                        {retourAjout.texte}
                    </div>
                )}

                {/* Prix et actions */}
                <div className="pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="lg-prix fs-5 mb-0">
                            {formaterPrix(ouvrage.prix)}
                        </span>
                        <Button
                            as={Link}
                            to={`/ouvrages/${ouvrage.id}`}
                            variant="outline-secondary"
                            size="sm"
                        >
                            Voir les détails
                        </Button>
                    </div>

                    <Button
                        variant="primary"
                        size="sm"
                        className="w-100 d-inline-flex align-items-center justify-content-center gap-2"
                        disabled={!enStock || enCours}
                        onClick={handleAjoutRapide}
                    >
                        <IconePanier size={15} />
                        {!enStock
                            ? "Rupture de stock"
                            : enCours
                            ? "Ajout..."
                            : "Ajouter au panier"}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}

export default OuvrageCard;
