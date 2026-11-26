import { createContext, useContext, useState } from "react";
import api from "../services/api";

// Création du contexte d'authentification
const AuthContext = createContext();

// Composant qui partage les données d'authentification
export function AuthProvider({ children }) {
    // Récupérer l'utilisateur enregistré dans localStorage
    const [utilisateur, setUtilisateur] = useState(() => {
        try {
            const savedUser = localStorage.getItem("utilisateur");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    // Connexion de l'utilisateur
    const login = async (email, motDePasse) => {
        const response = await api.post("/auth/login", {
            email,
            motDePasse
        });

        const { token, utilisateur: userConnecte } = response.data;

        // Enregistrer le token et l'utilisateur
        localStorage.setItem("token", token);
        localStorage.setItem("utilisateur", JSON.stringify(userConnecte));

        setUtilisateur(userConnecte);

        return userConnecte;
    };

    // Inscription d'un nouvel utilisateur
    const register = async (nom, email, motDePasse) => {
        const response = await api.post("/auth/register", {
            nom,
            email,
            motDePasse
        });

        return response.data;
    };

    // Mettre à jour les informations utilisateur dans le contexte et localStorage
    const mettreAJourUtilisateur = (nouvellesInfos) => {
        setUtilisateur((precedent) => {
            if (!precedent) {
                return null;
            }
            const maj = {
                ...precedent,
                ...nouvellesInfos
            };
            localStorage.setItem("utilisateur", JSON.stringify(maj));
            return maj;
        });
    };

    // Déconnexion de l'utilisateur
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("utilisateur");

        setUtilisateur(null);
    };

    return (
        <AuthContext.Provider
            value={{
                utilisateur,
                login,
                register,
                mettreAJourUtilisateur,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => useContext(AuthContext);
