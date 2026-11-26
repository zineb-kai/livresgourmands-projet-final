import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { IconeLivre } from "./Icones";

function Footer() {
    return (
        <footer className="lg-footer py-4 mt-5">
            <Container>
                <Row className="g-4 align-items-start">
                    {/* Identité de la librairie */}
                    <Col xs={12} md={5}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <IconeLivre size={22} className="text-warning" />
                            <span className="lg-serif fw-bold fs-5 text-white">
                                LivresGourmands.net
                            </span>
                        </div>
                        <p className="small mb-0 text-white-50">
                            Librairie en ligne dédiée aux passionnés de lecture, de
                            gastronomie et de découverte. Trouvez votre prochain ouvrage,
                            créez vos listes cadeaux et partagez vos avis.
                        </p>
                    </Col>

                    {/* Navigation rapide */}
                    <Col xs={12} sm={6} md={3}>
                        <h2 className="h6 text-white text-uppercase mb-3">
                            Navigation
                        </h2>
                        <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                            <li>
                                <Link to="/">Accueil</Link>
                            </li>
                            <li>
                                <Link to="/catalogue">Catalogue</Link>
                            </li>
                            <li>
                                <Link to="/categories">Catégories</Link>
                            </li>
                            <li>
                                <Link to="/listes/partage">
                                    Accéder à une liste cadeau
                                </Link>
                            </li>
                        </ul>
                    </Col>

                    {/* Services & contact */}
                    <Col xs={12} sm={6} md={4}>
                        <h2 className="h6 text-white text-uppercase mb-3">
                            Services &amp; Contact
                        </h2>
                        <ul className="list-unstyled small d-flex flex-column gap-2 mb-0 text-white-50 text-break">
                            <li>Support : contact@livresgourmands.net</li>
                            <li>Livraison : Standard, Rapide ou 24h chrono</li>
                            <li>Projet scolaire — Cours 420-WA6-AG</li>
                        </ul>
                    </Col>
                </Row>

                <hr className="border-secondary my-3 opacity-50" />

                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 small text-white-50">
                    <span>© 2026 LivresGourmands.net — Tous droits réservés.</span>
                    <span>Programmation Web avancée — Institut Grasset</span>
                </div>
            </Container>
        </footer>
    );
}

export default Footer;
