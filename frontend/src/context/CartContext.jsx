import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const CLE_LOCAL_STORAGE = "panier_livresgourmands";

// Création du contexte global du panier
const CartContext = createContext();

// Lire le panier sauvegardé dans localStorage de façon sécurisée
function lirePanierLocal() {
    try {
        const sauvegarde = localStorage.getItem(CLE_LOCAL_STORAGE);
        if (!sauvegarde) {
            return [];
        }
        const donnees = JSON.parse(sauvegarde);
        return Array.isArray(donnees) ? donnees : [];
    } catch {
        return [];
    }
}

// Normaliser un article du panier (venant de l'API ou du catalogue/détail)
function normaliserArticle(item) {
    return {
        ouvrage_id: Number(item.ouvrage_id ?? item.id),
        titre: item.titre || "Ouvrage",
        auteur: item.auteur || "Auteur inconnu",
        prix: Number(item.prix) || 0,
        stock: Number(item.stock ?? 0),
        categorie_id: item.categorie_id ?? null,
        categorie_nom: item.categorie_nom || "",
        quantite: Number(item.quantite) || 1
    };
}

export function CartProvider({ children }) {
    const { utilisateur } = useAuth();
    const [articles, setArticles] = useState(() => lirePanierLocal());
    const [synchronisation, setSynchronisation] = useState(false);

    // Mémoriser l'identifiant précédent pour distinguer un rafraîchissement d'une déconnexion
    const ancienUserIdRef = useRef(utilisateur?.id ?? null);

    // Persister automatiquement chaque changement dans localStorage
    useEffect(() => {
        try {
            localStorage.setItem(CLE_LOCAL_STORAGE, JSON.stringify(articles));
        } catch (error) {
            console.error("Impossible de sauvegarder le panier local :", error);
        }
    }, [articles]);

    // Charger le panier depuis l'API MySQL pour l'utilisateur connecté
    const rechargerPanier = useCallback(async () => {
        if (!utilisateur) {
            return;
        }

        setSynchronisation(true);
        try {
            const response = await api.get("/panier");
            const itemsServeur = Array.isArray(response.data)
                ? response.data
                      .filter((item) => item.ouvrage_id)
                      .map(normaliserArticle)
                : [];
            setArticles(itemsServeur);
        } catch (error) {
            console.error("Erreur lors du chargement du panier serveur :", error);
        } finally {
            setSynchronisation(false);
        }
    }, [utilisateur]);

    // Synchroniser à la connexion (fusionner les articles locaux éventuels vers l'API)
    // et nettoyer lors d'une déconnexion explicite
    useEffect(() => {
        const ancienId = ancienUserIdRef.current;
        const nouvelId = utilisateur?.id ?? null;

        // Cas 1 : l'utilisateur vient de se déconnecter
        if (ancienId !== null && nouvelId === null) {
            setArticles([]);
            localStorage.removeItem(CLE_LOCAL_STORAGE);
            ancienUserIdRef.current = null;
            return;
        }

        // Cas 2 : utilisateur connecté (au montage ou juste après login)
        if (nouvelId !== null) {
            const synchroniserALaConnexion = async () => {
                setSynchronisation(true);
                try {
                    // Si l'utilisateur vient de se connecter avec des articles ajoutés en visiteur,
                    // on tente de les fusionner dans le panier serveur
                    if (ancienId === null) {
                        const articlesLocaux = lirePanierLocal();
                        for (const item of articlesLocaux) {
                            try {
                                await api.post("/panier/items", {
                                    ouvrage_id: item.ouvrage_id,
                                    quantite: item.quantite
                                });
                            } catch {
                                // Ignorer si stock déjà atteint sur le serveur
                            }
                        }
                    }

                    // Récupérer l'état fiable depuis la base de données
                    const response = await api.get("/panier");
                    const itemsServeur = Array.isArray(response.data)
                        ? response.data
                              .filter((item) => item.ouvrage_id)
                              .map(normaliserArticle)
                        : [];
                    setArticles(itemsServeur);
                } catch (error) {
                    console.error("Synchronisation panier impossible :", error);
                } finally {
                    setSynchronisation(false);
                }
            };

            synchroniserALaConnexion();
        }

        ancienUserIdRef.current = nouvelId;
    }, [utilisateur]);

    // Ajouter un ouvrage au panier en respectant le stock disponible
    const ajouterAuPanier = async (ouvrage, quantiteAjout = 1) => {
        const qte = Number(quantiteAjout);
        const stockDisponible = Number(ouvrage.stock ?? 0);
        const ouvrageId = Number(ouvrage.ouvrage_id ?? ouvrage.id);

        if (!Number.isInteger(qte) || qte < 1) {
            return {
                succes: false,
                message: "La quantité doit être d'au moins 1."
            };
        }

        if (stockDisponible <= 0) {
            return {
                succes: false,
                message: "Cet ouvrage est actuellement en rupture de stock."
            };
        }

        const existant = articles.find((a) => a.ouvrage_id === ouvrageId);
        const qteActuelle = existant ? existant.quantite : 0;
        const nouvelleQte = qteActuelle + qte;

        if (nouvelleQte > stockDisponible) {
            const restant = Math.max(0, stockDisponible - qteActuelle);
            return {
                succes: false,
                message:
                    restant > 0
                        ? `Stock insuffisant : vous pouvez encore ajouter au maximum ${restant} exemplaire(s) (stock total : ${stockDisponible}).`
                        : `Vous avez déjà atteint le stock maximum disponible (${stockDisponible}) dans votre panier.`
            };
        }

        // Si l'utilisateur est connecté, synchroniser avec l'API backend
        if (utilisateur) {
            try {
                await api.post("/panier/items", {
                    ouvrage_id: ouvrageId,
                    quantite: qte
                });
                await rechargerPanier();
                return {
                    succes: true,
                    message: `${qte} exemplaire(s) de « ${ouvrage.titre} » ajouté(s) au panier.`
                };
            } catch (error) {
                return {
                    succes: false,
                    message:
                        error.response?.data?.message ||
                        "Impossible d'ajouter cet ouvrage au panier."
                };
            }
        }

        // Mode visiteur : mise à jour directe de l'état + localStorage
        setArticles((precedents) => {
            const dejaPresent = precedents.find(
                (a) => a.ouvrage_id === ouvrageId
            );

            if (dejaPresent) {
                return precedents.map((a) =>
                    a.ouvrage_id === ouvrageId
                        ? {
                              ...a,
                              stock: stockDisponible,
                              prix: Number(ouvrage.prix),
                              quantite: a.quantite + qte
                          }
                        : a
                );
            }

            return [
                ...precedents,
                normaliserArticle({
                    ...ouvrage,
                    ouvrage_id: ouvrageId,
                    quantite: qte
                })
            ];
        });

        return {
            succes: true,
            message: `${qte} exemplaire(s) de « ${ouvrage.titre} » ajouté(s) au panier.`
        };
    };

    // Modifier la quantité d'un article présent dans le panier
    const modifierQuantite = async (ouvrageId, nouvelleQuantite) => {
        const idNum = Number(ouvrageId);
        const qte = Number(nouvelleQuantite);
        const article = articles.find((a) => a.ouvrage_id === idNum);

        if (!article) {
            return { succes: false, message: "Article introuvable dans le panier." };
        }

        if (!Number.isInteger(qte) || qte < 1) {
            return {
                succes: false,
                message: "La quantité doit être au minimum de 1."
            };
        }

        if (qte > article.stock) {
            return {
                succes: false,
                message: `Stock insuffisant : maximum ${article.stock} exemplaire(s) disponible(s) pour « ${article.titre} ».`
            };
        }

        if (utilisateur) {
            try {
                await api.put(`/panier/items/${idNum}`, { quantite: qte });
                await rechargerPanier();
                return { succes: true, message: "Quantité mise à jour." };
            } catch (error) {
                return {
                    succes: false,
                    message:
                        error.response?.data?.message ||
                        "Impossible de modifier la quantité."
                };
            }
        }

        setArticles((precedents) =>
            precedents.map((a) =>
                a.ouvrage_id === idNum ? { ...a, quantite: qte } : a
            )
        );

        return { succes: true, message: "Quantité mise à jour." };
    };

    // Retirer un ouvrage du panier
    const supprimerDuPanier = async (ouvrageId) => {
        const idNum = Number(ouvrageId);

        if (utilisateur) {
            try {
                await api.delete(`/panier/items/${idNum}`);
                await rechargerPanier();
                return { succes: true, message: "Ouvrage retiré du panier." };
            } catch (error) {
                return {
                    succes: false,
                    message:
                        error.response?.data?.message ||
                        "Impossible de retirer cet ouvrage du panier."
                };
            }
        }

        setArticles((precedents) =>
            precedents.filter((a) => a.ouvrage_id !== idNum)
        );

        return { succes: true, message: "Ouvrage retiré du panier." };
    };

    // Vider entièrement le panier
    const viderPanier = async () => {
        if (utilisateur) {
            try {
                await api.delete("/panier");
                setArticles([]);
                return { succes: true, message: "Votre panier a été vidé." };
            } catch (error) {
                return {
                    succes: false,
                    message:
                        error.response?.data?.message ||
                        "Impossible de vider le panier."
                };
            }
        }

        setArticles([]);
        return { succes: true, message: "Votre panier a été vidé." };
    };

    // Calculs automatiques : nombre total d'articles et montant total
    const nombreArticles = articles.reduce(
        (somme, item) => somme + Number(item.quantite || 0),
        0
    );

    const totalPanier = articles.reduce(
        (somme, item) =>
            somme + Number(item.prix || 0) * Number(item.quantite || 0),
        0
    );

    // Connaître la quantité d'un ouvrage déjà dans le panier
    const obtenirQuantiteDansPanier = (ouvrageId) => {
        const item = articles.find((a) => a.ouvrage_id === Number(ouvrageId));
        return item ? item.quantite : 0;
    };

    return (
        <CartContext.Provider
            value={{
                articles,
                nombreArticles,
                totalPanier,
                synchronisation,
                ajouterAuPanier,
                modifierQuantite,
                supprimerDuPanier,
                viderPanier,
                rechargerPanier,
                obtenirQuantiteDansPanier
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

// Hook personnalisé pour consommer le contexte panier
export const useCart = () => useContext(CartContext);
