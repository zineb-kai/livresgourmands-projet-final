import {
    Navbar,
    Nav,
    NavDropdown,
    Container,
    Button,
    Badge
} from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
    IconeLivre,
    IconeDashboard,
    IconePanier,
    IconeUtilisateur
} from "./Icones";

function Navigation() {
    // Récupérer l'utilisateur connecté et le compteur du panier
    const { utilisateur, logout } = useAuth();
    const { nombreArticles } = useCart();
    const navigate = useNavigate();

    // Vérifier si l'utilisateur a accès au Dashboard (éditeur ou administrateur)
    const accesDashboard =
        utilisateur &&
        (utilisateur.role === "administrateur" ||
            utilisateur.role === "editeur");

    // Gestion de la déconnexion
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <Navbar expand="lg" variant="dark" className="lg-navbar py-2 shadow-sm">
            <Container fluid className="px-3 px-lg-4">
                {/* Identité du site */}
                <Navbar.Brand
                    as={Link}
                    to="/"
                    className="d-flex align-items-center gap-2 text-nowrap"
                >
                    <IconeLivre size={22} className="text-warning" />
                    <span>LivresGourmands.net</span>
                </Navbar.Brand>

                {/* Bouton menu mobile / tablette */}
                <Navbar.Toggle aria-controls="navbar-menu" />

                <Navbar.Collapse id="navbar-menu">
                    {/* Liens de navigation principaux */}
                    <Nav className="me-auto align-items-lg-center gap-lg-1">
                        <Nav.Link as={NavLink} to="/" end className="text-nowrap">
                            Accueil
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/catalogue" className="text-nowrap">
                            Catalogue
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/categories" className="text-nowrap">
                            Catégories
                        </Nav.Link>

                        <Nav.Link
                            as={NavLink}
                            to="/listes/partage"
                            className="text-nowrap"
                        >
                            Liste d&apos;un ami
                        </Nav.Link>

                        <Nav.Link
                            as={NavLink}
                            to="/panier"
                            className="d-inline-flex align-items-center gap-2 text-nowrap"
                        >
                            <IconePanier size={16} />
                            <span>Panier</span>
                            <Badge
                                pill
                                className="lg-badge-terracotta"
                                aria-label={`${nombreArticles} article(s) dans le panier`}
                            >
                                {nombreArticles}
                            </Badge>
                        </Nav.Link>

                        {accesDashboard && (
                            <Nav.Link
                                as={NavLink}
                                to="/dashboard"
                                className="d-inline-flex align-items-center gap-1 text-nowrap"
                            >
                                <IconeDashboard size={15} />
                                Dashboard
                            </Nav.Link>
                        )}
                    </Nav>

                    {/* Espace utilisateur (menu déroulant compact pour éviter tout débordement) */}
                    <Nav className="align-items-lg-center gap-2 mt-2 mt-lg-0">
                        {utilisateur ? (
                            <>
                                <NavDropdown
                                    align="end"
                                    id="menu-compte-utilisateur"
                                    title={
                                        <span className="d-inline-flex align-items-center gap-1 text-white">
                                            <IconeUtilisateur size={16} />
                                            <span
                                                className="text-truncate"
                                                style={{ maxWidth: "140px" }}
                                            >
                                                {utilisateur.nom}
                                            </span>
                                        </span>
                                    }
                                >
                                    <NavDropdown.Item as={Link} to="/profil">
                                        Mon profil
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/commandes">
                                        Mes commandes
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/listes">
                                        Mes listes cadeaux
                                    </NavDropdown.Item>
                                    {accesDashboard && (
                                        <>
                                            <NavDropdown.Divider />
                                            <NavDropdown.Item as={Link} to="/dashboard">
                                                Tableau de bord ({utilisateur.role})
                                            </NavDropdown.Item>
                                        </>
                                    )}
                                </NavDropdown>

                                <Button
                                    variant="outline-light"
                                    size="sm"
                                    className="text-nowrap"
                                    onClick={handleLogout}
                                >
                                    Déconnexion
                                </Button>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={NavLink} to="/login" className="text-nowrap">
                                    Connexion
                                </Nav.Link>

                                <Button
                                    as={Link}
                                    to="/register"
                                    variant="primary"
                                    size="sm"
                                    className="text-nowrap"
                                >
                                    Inscription
                                </Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Navigation;
