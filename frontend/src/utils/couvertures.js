// Utilitaires d'affichage, de mise en forme et de couvertures locales pour LivresGourmands.net

// Formater un montant en dollars canadiens (ex. 19,99 $)
export function formaterPrix(valeur) {
    const nombre = Number(valeur);
    if (!Number.isFinite(nombre)) {
        return "0,00 $";
    }
    return `${nombre.toFixed(2).replace(".", ",")} $`;
}

// Formater une date ISO en date lisible en français
export function formaterDate(dateIso) {
    if (!dateIso) {
        return "Date non disponible";
    }

    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) {
        return "Date non disponible";
    }

    return date.toLocaleDateString("fr-CA", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

// Palette éditoriale cohérente pour chaque ouvrage / catégorie
const PALETTES_COUVERTURES = [
    { fond: "#1E2A38", accent: "#E3B778", motif: "rgba(255,255,255,0.10)" },
    { fond: "#4E6E58", accent: "#E4C58E", motif: "rgba(255,255,255,0.12)" },
    { fond: "#8C462B", accent: "#F5D9C3", motif: "rgba(255,255,255,0.10)" },
    { fond: "#34495E", accent: "#D99B66", motif: "rgba(255,255,255,0.10)" },
    { fond: "#5C4738", accent: "#E7C697", motif: "rgba(255,255,255,0.10)" },
    { fond: "#2E4C47", accent: "#D89A6A", motif: "rgba(255,255,255,0.10)" }
];

export function obtenirPaletteCouverture(ouvrage) {
    const id = Number(ouvrage?.id ?? ouvrage?.ouvrage_id) || 0;
    const catId = Number(ouvrage?.categorie_id) || 0;
    const index = Math.abs(id + catId) % PALETTES_COUVERTURES.length;
    return PALETTES_COUVERTURES[index];
}

// Associer une illustration SVG locale libre de droits selon la catégorie
export function obtenirImageCouverture(categorieNom = "", ouvrage = null) {
    const nom = String(categorieNom || ouvrage?.categorie_nom || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (nom.includes("cuisine") || nom.includes("gastronomie") || nom.includes("patisserie")) {
        return "/covers/cuisine.svg";
    }
    if (nom.includes("informatique") || nom.includes("web") || nom.includes("code")) {
        return "/covers/informatique.svg";
    }
    if (nom.includes("developpement") || nom.includes("personnel") || nom.includes("bien")) {
        return "/covers/developpement.svg";
    }
    if (nom.includes("jeunesse") || nom.includes("enfant")) {
        return "/covers/jeunesse.svg";
    }
    if (nom.includes("culture") || nom.includes("decouverte") || nom.includes("histoire")) {
        return "/covers/culture.svg";
    }
    return "/covers/romans.svg";
}

// Obtenir un libellé de statut de commande clair et sa couleur Bootstrap
export function obtenirBadgeStatut(statut) {
    switch (statut) {
        case "payee":
            return { label: "Payée", bg: "success" };
        case "expediee":
            return { label: "Expédiée", bg: "info" };
        case "annulee":
            return { label: "Annulée", bg: "danger" };
        case "en_cours":
        default:
            return { label: "En cours", bg: "warning", text: "dark" };
    }
}
