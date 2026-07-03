"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Barre de navigation principale + bouton retour, présente sur toutes les pages
// SAUF l'accueil (qui doit rester la réplique FranceConnect).
const LIENS = [
  { href: "/choix", label: "Accueil" },
  { href: "/deposer", label: "Déposer" },
  { href: "/suivi", label: "Mon suivi" },
  { href: "/consulter", label: "Consulter" },
  { href: "/espace-elu", label: "Espace élu" },
];

export function NavPrincipale() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  return (
    <nav
      aria-label="Navigation principale"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 900,
        background: "#000091",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.4rem 1rem",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "6px 12px",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        ← Retour
      </button>

      <Link
        href="/choix"
        style={{
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
          marginRight: "auto",
          marginLeft: "0.5rem",
          fontSize: 15,
        }}
      >
        Cahier de Doléances 2.0
      </Link>

      <ul
        style={{
          display: "flex",
          listStyle: "none",
          gap: "0.25rem",
          margin: 0,
          padding: 0,
          flexWrap: "wrap",
        }}
      >
        {LIENS.map((l) => {
          const actif = pathname === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: actif ? 700 : 400,
                  background: actif ? "rgba(255,255,255,0.2)" : "transparent",
                  borderBottom: actif ? "2px solid #fff" : "2px solid transparent",
                }}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
