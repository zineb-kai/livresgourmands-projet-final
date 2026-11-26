import { Navigate, useLocation, Link } from "react-router-dom";
import { Container, Alert, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

// Composant de routage protégé (authentification + vérification optionnelle des rôles)
function ProtectedRoute({ children, rolesAutorises = null }) {
    const { utilisateur } = useAuth();
    const location = useLocation();

    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!utilisateur) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                    message: "Veuillez vous connecter pour accéder à cette page."
                }}
            />
        );
    }

    // Si des rôles spécifiques sont exigés et que l'utilisateur n'a pas la permission
    if (
        Array.isArray(rolesAutorises) &&
        rolesAutorises.length > 0 &&
        !rolesAutorises.includes(utilisateur.role)
    ) {
        return (
            <Container className="py-5">
                <Alert variant="danger" className="p-4 shadow-sm">
                    <Alert.Heading className="h4">
                        Accès non autorisé
                    </Alert.Heading>
                    <p className="mb-3">
                        Votre compte (rôle <strong>{utilisateur.role}</strong>) ne dispose
                        pas des permissions nécessaires pour accéder à cette section.
                    </p>
                    <Button as={Link} to="/" variant="primary" size="sm">
                        Retourner à l&apos;accueil
                    </Button>
                </Alert>
            </Container>
        );
    }

    return children;
}

export default ProtectedRoute;
