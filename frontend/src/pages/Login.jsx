import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    // Les informations saisies par l'utilisateur
    const [email, setEmail] = useState("");
    const [motDePasse, setMotDePasse] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const messageInfo = location.state?.message || "";
    const destinationApresConnexion = location.state?.from || null;

    // Gestion de la connexion
    const handleSubmit = async (e) => {
        e.preventDefault();

        setErreur("");
        setChargement(true);

        try {
            const utilisateur = await login(email, motDePasse);

            // Rediriger vers la page demandée ou selon le rôle
            if (destinationApresConnexion) {
                navigate(destinationApresConnexion, { replace: true });
            } else if (
                utilisateur.role === "administrateur" ||
                utilisateur.role === "editeur"
            ) {
                navigate("/dashboard");
            } else {
                navigate("/");
            }
        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                "Impossible de se connecter au serveur."
            );
        } finally {
            setChargement(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col xs={12} md={7} lg={5}>

                    <Card className="lg-panel shadow-sm border-0 p-4">

                        <div className="text-center mb-3">
                            <Link
                                to="/"
                                className="lg-serif fw-bold fs-4 text-decoration-none"
                                style={{ color: "var(--lg-ink)" }}
                            >
                                LivresGourmands.net
                            </Link>
                        </div>

                        <h1 className="h2 text-center mb-2">
                            Connexion
                        </h1>

                        <p className="text-center text-muted mb-4">
                            Accédez à votre espace librairie
                        </p>

                        {messageInfo && (
                            <Alert variant="info">
                                {messageInfo}
                            </Alert>
                        )}

                        {erreur && (
                            <Alert variant="danger">
                                {erreur}
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>

                            <Form.Group className="mb-3" controlId="email">
                                <Form.Label>Adresse email</Form.Label>

                                <Form.Control
                                    type="email"
                                    placeholder="Entrez votre email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="motDePasse">
                                <Form.Label>Mot de passe</Form.Label>

                                <Form.Control
                                    type="password"
                                    placeholder="Entrez votre mot de passe"
                                    value={motDePasse}
                                    onChange={(e) => setMotDePasse(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-100"
                                disabled={chargement}
                            >
                                {chargement
                                    ? "Connexion en cours..."
                                    : "Se connecter"}
                            </Button>

                        </Form>

                        <p className="text-center mt-4 mb-0">
                            Vous n'avez pas de compte ?{" "}
                            <Link to="/register">
                                S'inscrire
                            </Link>
                        </p>

                    </Card>

                </Col>
            </Row>
        </Container>
    );
}

export default Login;