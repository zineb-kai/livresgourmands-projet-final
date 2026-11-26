import { Routes, Route, useLocation, Link } from "react-router-dom";
import { Container, Card, Button } from "react-bootstrap";

// Importer les composants
import Navigation from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Importer les pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Catalogue from "./pages/Catalogue";
import Categories from "./pages/Categories";
import DetailOuvrage from "./pages/DetailOuvrage";
import Panier from "./pages/Panier";
import Commandes from "./pages/Commandes";
import ListesCadeaux from "./pages/ListesCadeaux";
import ListePartagee from "./pages/ListePartagee";
import Profil from "./pages/Profil";
import Dashboard from "./pages/Dashboard";

function App() {
    // Récupérer la route actuelle
    const location = useLocation();

    // Masquer la Navbar et le Footer sur les pages d'authentification
    const masquerNavigation =
        location.pathname === "/login" ||
        location.pathname === "/register";

    return (
        <>
            {/* Barre de navigation */}
            {!masquerNavigation && <Navigation />}

            {/* Contenu principal */}
            <main className="lg-main-content">
                <Routes>
                    {/* Page d'accueil */}
                    <Route path="/" element={<Home />} />

                    {/* Page de connexion */}
                    <Route path="/login" element={<Login />} />

                    {/* Page d'inscription */}
                    <Route path="/register" element={<Register />} />

                    {/* Page du catalogue */}
                    <Route path="/catalogue" element={<Catalogue />} />

                    {/* Page de détails d'un ouvrage */}
                    <Route path="/ouvrages/:id" element={<DetailOuvrage />} />

                    {/* Page des catégories */}
                    <Route path="/categories" element={<Categories />} />

                    {/* Page du panier dynamique */}
                    <Route path="/panier" element={<Panier />} />

                    {/* Page des commandes et paiement simulé (protégée) */}
                    <Route
                        path="/commandes"
                        element={
                            <ProtectedRoute>
                                <Commandes />
                            </ProtectedRoute>
                        }
                    />

                    {/* Gestion des listes cadeaux du client connecté (protégée) */}
                    <Route
                        path="/listes"
                        element={
                            <ProtectedRoute>
                                <ListesCadeaux />
                            </ProtectedRoute>
                        }
                    />

                    {/* Accès public par code personnel à une liste partagée (parcours Ami) */}
                    <Route path="/listes/partage" element={<ListePartagee />} />
                    <Route path="/listes/partage/:code" element={<ListePartagee />} />

                    {/* Profil utilisateur sécurisé (protégé) */}
                    <Route
                        path="/profil"
                        element={
                            <ProtectedRoute>
                                <Profil />
                            </ProtectedRoute>
                        }
                    />

                    {/* Tableau de bord (protégé : administrateur et éditeur uniquement) */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute
                                rolesAutorises={["administrateur", "editeur"]}
                            >
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Route de secours (404) */}
                    <Route
                        path="*"
                        element={
                            <Container className="py-5 text-center">
                                <Card className="lg-panel shadow-sm border-0 p-5 mx-auto" style={{ maxWidth: "560px" }}>
                                    <h1 className="h2 fw-bold mb-2">Page introuvable</h1>
                                    <p className="text-muted mb-4">
                                        La page demandée n&apos;existe pas ou a été déplacée.
                                    </p>
                                    <div className="d-flex justify-content-center gap-2">
                                        <Button as={Link} to="/" variant="primary">
                                            Retour à l&apos;accueil
                                        </Button>
                                        <Button as={Link} to="/catalogue" variant="outline-primary">
                                            Voir le catalogue
                                        </Button>
                                    </div>
                                </Card>
                            </Container>
                        }
                    />
                </Routes>
            </main>

            {/* Pied de page */}
            {!masquerNavigation && <Footer />}
        </>
    );
}

export default App;
