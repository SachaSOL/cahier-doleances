"use client";

import { usePathname, useRouter } from "next/navigation";
import { Header } from "@codegouvfr/react-dsfr/Header";

// En-tête officiel de l'État (DSFR) présent sur toutes les pages sauf l'accueil
// (qui garde sa réplique FranceConnect). Logo République Française à gauche,
// nom du service en Marianne, menu de navigation, bouton Retour.
const LIENS = [
  { text: "Accueil", href: "/choix" },
  { text: "Déposer", href: "/deposer" },
  { text: "Mon suivi", href: "/suivi" },
  { text: "Consulter", href: "/consulter" },
  { text: "Espace élu", href: "/espace-elu" },
];

export function EnteteSite() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  return (
    <Header
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
      serviceTitle="Cahier de Doléances 2.0"
      serviceTagline="Votre voix, au bon élu, avec suivi"
      quickAccessItems={[
        {
          iconId: "fr-icon-arrow-left-line",
          text: "Retour",
          buttonProps: { onClick: () => router.back() },
        },
      ]}
      navigation={LIENS.map((l) => ({
        text: l.text,
        linkProps: { href: l.href },
        isActive: pathname === l.href,
      }))}
    />
  );
}
