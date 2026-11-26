import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Importer Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";

// Importer notre fichier CSS
import "./index.css";

// Importer le composant principal
import App from "./App.jsx";

// Importer les contextes globaux (authentification et panier)
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

// Démarrer notre application React
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <App />
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
