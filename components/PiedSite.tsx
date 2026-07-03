"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@codegouvfr/react-dsfr/Footer";

// Pied de page officiel de l'État (bannière République Française + liens),
// présent en bas de toutes les pages sauf l'accueil (qui a déjà son pied).
export function PiedSite() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Footer
      brandTop={
        <>
          République
          <br />
          Française
        </>
      }
      homeLinkProps={{
        href: "/choix",
        title: "Accueil — Cahier de Doléances 2.0",
      }}
      accessibility="partially compliant"
      contentDescription="Cahier de Doléances 2.0 est une démonstration réalisée dans le cadre d'un hackathon. Aucune donnée réelle n'est collectée. Les doléances affichées sont fictives et anonymisées."
      bottomItems={[
        {
          text: "legifrance.gouv.fr",
          linkProps: { href: "https://legifrance.gouv.fr" },
        },
        {
          text: "info.gouv.fr",
          linkProps: { href: "https://info.gouv.fr" },
        },
        {
          text: "service-public.fr",
          linkProps: { href: "https://service-public.fr" },
        },
        {
          text: "data.gouv.fr",
          linkProps: { href: "https://data.gouv.fr" },
        },
      ]}
    />
  );
}
