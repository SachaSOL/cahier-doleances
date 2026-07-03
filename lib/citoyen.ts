"use client";

// Identité citoyenne de démonstration, stable, stockée dans le navigateur.
// Sert à retrouver « mes » doléances dans la page de suivi. Aucune donnée
// personnelle : juste un pseudonyme aléatoire.

const CLE = "cd_fc_sub";
const CLE_NOM = "cd_fc_nom";

export function getFcSub(): string {
  if (typeof window === "undefined") return "";
  let v = localStorage.getItem(CLE);
  if (!v) {
    v = "fc-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(CLE, v);
  }
  return v;
}

export function setFcNom(nom: string) {
  if (typeof window !== "undefined") localStorage.setItem(CLE_NOM, nom);
}

export function getFcNom(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CLE_NOM) ?? "Camille D.";
}
