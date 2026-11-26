import {
    obtenirPaletteCouverture,
    obtenirImageCouverture
} from "../utils/couvertures";
import { IconeLivre } from "./Icones";

// Couverture visuelle éditoriale utilisant les illustrations SVG locales (/public/covers/)
// Variantes supportées : "card" (catalogue/accueil), "detail" (fiche produit), "mini" (panier/listes)
function CouvertureOuvrage({
    ouvrage,
    categorieNom = "",
    variante = "card"
}) {
    const palette = obtenirPaletteCouverture(ouvrage);
    const estDetail = variante === "detail";
    const estMini = variante === "mini";
    const libelleCategorie =
        categorieNom || ouvrage?.categorie_nom || "Collection Librairie";
    const imageSrc = obtenirImageCouverture(libelleCategorie, ouvrage);

    const classeVariante = estDetail
        ? "lg-book-cover-detail"
        : estMini
        ? "lg-book-cover-mini"
        : "lg-book-cover-card";

    return (
        <div className={`lg-book-cover ${classeVariante}`}>
            {/* Illustration locale thématique en arrière-plan */}
            <img
                src={imageSrc}
                alt={`Couverture illustrée de l'ouvrage ${ouvrage?.titre || ""}`}
                className="lg-book-cover-img"
                loading="lazy"
            />

            {/* Contenu typographique éditorial par-dessus l'illustration */}
            <div className="lg-book-cover-content">
                {!estMini && (
                    <div className="d-flex justify-content-between align-items-center gap-2">
                        <span
                            className="text-uppercase fw-semibold text-truncate"
                            style={{
                                fontSize: estDetail ? "0.75rem" : "0.68rem",
                                letterSpacing: "1.1px",
                                color: palette.accent
                            }}
                        >
                            {libelleCategorie}
                        </span>

                        <span
                            className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                            style={{
                                width: estDetail ? "38px" : "30px",
                                height: estDetail ? "38px" : "30px",
                                backgroundColor: palette.motif,
                                color: palette.accent
                            }}
                        >
                            <IconeLivre size={estDetail ? 20 : 16} />
                        </span>
                    </div>
                )}

                <div className={estMini ? "my-auto" : "my-auto py-2"}>
                    <div
                        className={estMini ? "mb-1" : "mb-2"}
                        style={{
                            width: estDetail ? "52px" : estMini ? "22px" : "36px",
                            height: estMini ? "2px" : "3px",
                            backgroundColor: palette.accent
                        }}
                    />
                    <div
                        className="lg-serif fw-bold text-white"
                        style={{
                            fontSize: estDetail
                                ? "1.6rem"
                                : estMini
                                ? "0.72rem"
                                : "1.08rem",
                            lineHeight: 1.22,
                            display: "-webkit-box",
                            WebkitLineClamp: estDetail ? 4 : 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                        }}
                    >
                        {ouvrage?.titre || "Ouvrage"}
                    </div>
                </div>

                {!estMini && (
                    <div
                        className="pt-2"
                        style={{
                            borderTop: "1px solid rgba(255, 255, 255, 0.18)"
                        }}
                    >
                        <div
                            className="fw-medium text-white-50 text-truncate"
                            style={{ fontSize: estDetail ? "0.95rem" : "0.82rem" }}
                        >
                            {ouvrage?.auteur || "Auteur inconnu"}
                        </div>
                        {estDetail && (
                            <div
                                className="mt-1 text-uppercase"
                                style={{
                                    fontSize: "0.7rem",
                                    letterSpacing: "1.4px",
                                    color: palette.accent
                                }}
                            >
                                Éditions LivresGourmands.net
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CouvertureOuvrage;
