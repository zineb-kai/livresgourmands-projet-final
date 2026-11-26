import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {

    // Informations de l'utilisateur
    const [nom, setNom] = useState("");
    const [email, setEmail] = useState("");
    const [motDePasse, setMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    // Gestion de l'inscription
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErreur("");

        // Vérifier les mots de passe
        if (motDePasse !== confirmation) {
            setErreur("Les mots de passe ne correspondent pas.");
            return;
        }

        setChargement(true);

        try {

            // Envoyer les informations au backend
            await register(nom, email, motDePasse);

            // Rediriger vers la connexion
            navigate("/login");

        } catch (error) {
            setErreur(
                error.response?.data?.message ||
                error.response?.data?.erreurs?.[0]?.msg ||
                "Une erreur est survenue lors de l'inscription."
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
                            Inscription
                        </h1>

                        <p className="text-center text-muted mb-4">
                            Créez votre compte LivresGourmands.net
                        </p>

                        {erreur && (
                            <Alert variant="danger">
                                {erreur}
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>

                            <Form.Group className="mb-3" controlId="nom">
                                <Form.Label>Nom complet</Form.Label>

                                <Form.Control
                                    type="text"
                                    placeholder="Entrez votre nom"
                                    value={nom}
                                    onChange={(e) => setNom(e.target.value)}
                                    required
                                />
                            </Form.Group>

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

                            <Form.Group className="mb-3" controlId="motDePasse">
                                <Form.Label>Mot de passe</Form.Label>

                                <Form.Control
                                    type="password"
                                    placeholder="Entrez votre mot de passe"
                                    value={motDePasse}
                                    onChange={(e) => setMotDePasse(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="confirmation">
                                <Form.Label>Confirmer le mot de passe</Form.Label>

                                <Form.Control
                                    type="password"
                                    placeholder="Confirmez votre mot de passe"
                                    value={confirmation}
                                    onChange={(e) => setConfirmation(e.target.value)}
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
                                    ? "Inscription en cours..."
                                    : "S'inscrire"}
                            </Button>

                        </Form>

                        <p className="text-center mt-4 mb-0">
                            Vous avez déjà un compte ?{" "}
                            <Link to="/login">
                                Se connecter
                            </Link>
                        </p>

                    </Card>

                </Col>
            </Row>
        </Container>
    );
}

export default Register;