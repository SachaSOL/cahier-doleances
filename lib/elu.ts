"use client";

import type { NiveauTerr } from "@/lib/territoire";

// Contexte de l'élu « connecté » (démo), passé de la page de connexion à la
// boîte de réception via sessionStorage.
export type EluSession = {
  label: string; // nom affiché
  mandat: string;
  niveauTerr: NiveauTerr; // pour filtrer les doléances
  code: string; // code territoire ("" si national)
  territoireNom: string;
  photo?: string;
};

const CLE = "cd_elu";

export function setElu(e: EluSession) {
  sessionStorage.setItem(CLE, JSON.stringify(e));
}

export function getElu(): EluSession | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(CLE);
  return v ? (JSON.parse(v) as EluSession) : null;
}

// Traduit le niveau d'un élu (table elus) en niveau territorial de filtrage.
export function niveauTerritorial(niveauElu: string): NiveauTerr {
  if (niveauElu === "commune" || niveauElu === "arrondissement")
    return "commune";
  if (
    niveauElu === "region" ||
    niveauElu === "conseil_regional" ||
    niveauElu === "assemblee"
  )
    return "region";
  // departement, etat, senateur, epci, conseil_departemental… → département
  return "departement";
}
