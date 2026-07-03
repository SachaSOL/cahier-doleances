"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

type ThemeDatum = {
  name: string;
  value: number;
  examples: string[];
};

const themeData: ThemeDatum[] = [
  {
    name: "Voirie",
    value: 15,
    examples: [
      "Dégradation d’un panneau de signalisation sur la voie principale.",
      "Nid-de-poule signalé devant l’école de la rue des Lilas.",
    ],
  },
  {
    name: "Propreté",
    value: 10,
    examples: [
      "Déchets abandonnés à proximité du marché hebdomadaire.",
      "Problème de nettoyage dans le parc municipal.",
    ],
  },
  {
    name: "Sécurité",
    value: 8,
    examples: [
      "Éclairage insuffisant sur le chemin piétonnier du quartier.",
      "Signalisation manquante sur un carrefour fréquenté.",
    ],
  },
  {
    name: "Transports",
    value: 7,
    examples: [
      "Retards fréquents sur la ligne de bus du centre-ville.",
      "Absence de places de stationnement pour les personnes à mobilité réduite.",
    ],
  },
  {
    name: "Logement",
    value: 5,
    examples: [
      "Demande d’information sur les aides au logement.",
      "Problème d’accessibilité dans un immeuble collectif.",
    ],
  },
  {
    name: "Environnement",
    value: 2,
    examples: [
      "Signalement de déchets plastiques dans la rivière locale.",
      "Arbres endommagés après une tempête récente.",
    ],
  },
];

const colors = [
  "#465F9D",
  "#6A6AF4",
  "#00A95F",
  "#FF5D00",
  "#CE614A",
  "#8A5C2E",
];

const territoryOptions = {
  Commune: ["Lyon", "Villeurbanne", "Paris"],
  Département: ["Rhône", "Paris"],
  Région: ["Île-de-France", "Auvergne-Rhône-Alpes"],
};

export default function DashboardPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>(themeData[0].name);
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [territoryType, setTerritoryType] = useState<keyof typeof territoryOptions>("Commune");
  const [territory, setTerritory] = useState<string>(territoryOptions.Commune[0]);

  const total = useMemo(() => themeData.reduce((sum, item) => sum + item.value, 0), []);

  const handleTerritoryTypeChange = (value: string) => {
    const nextType = value as keyof typeof territoryOptions;
    setTerritoryType(nextType);
    setTerritory(territoryOptions[nextType][0]);
  };

  const activeTheme = useMemo(() => {
    const currentTheme = hoveredTheme ?? selectedTheme;
    return themeData.find(item => item.name === currentTheme) ?? themeData[0];
  }, [hoveredTheme, selectedTheme]);

  const activePercent = Math.round((activeTheme.value / total) * 100);

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-lg-8">
            <h1>Tableau de bord des élus et agents</h1>
            <p className="fr-text--lead">
              Vue synthétique des doléances reçues et de leur répartition par thème.
            </p>
          </div>
          <div className="fr-col-12 fr-col-lg-4">
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <label className="fr-label" htmlFor="territory-type-select">
                  Type de territoire
                </label>
                <select
                  className="fr-select"
                  id="territory-type-select"
                  value={territoryType}
                  onChange={event => handleTerritoryTypeChange(event.target.value)}
                >
                  <option value="Commune">Commune</option>
                  <option value="Département">Département</option>
                  <option value="Région">Région</option>
                </select>
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <label className="fr-label" htmlFor="territory-select">
                  Territoire
                </label>
                <select
                  className="fr-select"
                  id="territory-select"
                  value={territory}
                  onChange={event => setTerritory(event.target.value)}
                >
                  {territoryOptions[territoryType].map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">Doléances reçues</h2>
                <p className="fr-card__desc fr-display--xl">47</p>
              </div>
            </div>
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">En traitement</h2>
                <p className="fr-card__desc fr-display--xl">12</p>
              </div>
            </div>
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">Répondues</h2>
                <p className="fr-card__desc fr-display--xl">28</p>
              </div>
            </div>
          </div>
        </div>

        <div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
          <div className="fr-col-12 fr-col-lg-8">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">Répartition par thème</h2>
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={themeData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={2}
                        onMouseEnter={(_, index) => setHoveredTheme(themeData[index].name)}
                        onMouseLeave={() => setHoveredTheme(null)}
                        onClick={(_, index) => setSelectedTheme(themeData[index].name)}
                      >
                        {themeData.map((entry, index) => (
                          <Cell key={entry.name} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value ?? 0} doléances`, "Nombre"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="fr-col-12 fr-col-lg-4">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">Analyse rapide</h2>
                <p className="fr-text--sm fr-mb-1w">
                  <strong>{activeTheme.name}</strong> : {activePercent}% des doléances
                </p>
                <p className="fr-text--sm fr-mb-0">
                  Cliquez sur une part du camembert pour voir des exemples anonymisés.
                </p>

                <div className="fr-mt-3w">
                  <h3 className="fr-h6">Doléances anonymisées</h3>
                  <ul className="fr-mb-0">
                    {activeTheme.examples.map(example => (
                      <li key={example} className="fr-mb-1w">
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
