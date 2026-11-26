// Importer Axios
import axios from "axios";

// Créer une instance Axios pour communiquer avec le backend
const api = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// Ajouter automatiquement le token aux requêtes
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Exporter notre instance Axios
export default api;