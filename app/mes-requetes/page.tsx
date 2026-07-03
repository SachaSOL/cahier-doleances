"use client";

import { useMemo, useState } from "react";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

type RequestStatus = "Déposée" | "Transmise" | "En traitement" | "Répondue";

type RequestItem = {
  id: number;
  theme: string;
  excerpt: string;
  commune: string;
  date: string;
  status: RequestStatus;
};

const initialRequests: RequestItem[] = [
  {
    id: 1,
    theme: "Voirie",
    excerpt: "Nid-de-poule signalé devant l’école du quartier.",
    commune: "Lyon",
    date: "02/07/2026",
    status: "Déposée",
  },
  {
    id: 2,
    theme: "Propreté",
    excerpt: "Déchets abandonnés autour du marché hebdomadaire.",
    commune: "Villeurbanne",
    date: "30/06/2026",
    status: "Transmise",
  },
  {
    id: 3,
    theme: "Sécurité",
    excerpt: "Éclairage insuffisant sur le chemin piétonnier.",
    commune: "Lyon",
    date: "28/06/2026",
    status: "En traitement",
  },
  {
    id: 4,
    theme: "Transports",
    excerpt: "Retards fréquents sur la ligne de bus du centre-ville.",
    commune: "Paris",
    date: "25/06/2026",
    status: "Répondue",
  },
  {
    id: 5,
    theme: "Logement",
    excerpt: "Problème d’accessibilité dans un immeuble collectif.",
    commune: "Paris",
    date: "20/06/2026",
    status: "En traitement",
  },
  {
    id: 6,
    theme: "Environnement",
    excerpt: "Déchets plastiques retrouvés près de la rivière.",
    commune: "Villeurbanne",
    date: "18/06/2026",
    status: "Transmise",
  },
];

const territoryOptions = {
  Commune: ["Lyon", "Villeurbanne", "Paris"],
  Département: ["Rhône", "Paris"],
  Région: ["Île-de-France", "Auvergne-Rhône-Alpes"],
};

const statusSeverity: Record<RequestStatus, "info" | "new" | "warning" | "success"> = {
  Déposée: "info",
  Transmise: "new",
  "En traitement": "warning",
  Répondue: "success",
};

const themeChartData = [
  { name: "Voirie", count: 1 },
  { name: "Propreté", count: 1 },
  { name: "Sécurité", count: 1 },
  { name: "Transports", count: 1 },
  { name: "Logement", count: 1 },
  { name: "Environnement", count: 1 },
];

export default function MesRequetesPage() {
  const [territoryType, setTerritoryType] = useState<keyof typeof territoryOptions>("Commune");
  const [territory, setTerritory] = useState<string>(territoryOptions.Commune[0]);
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);

  const handleTerritoryTypeChange = (value: string) => {
    const nextType = value as keyof typeof territoryOptions;
    setTerritoryType(nextType);
    setTerritory(territoryOptions[nextType][0]);
  };

  const handleStatusChange = (id: number, status: RequestStatus) => {
    setRequests(current => current.map(request => (request.id === id ? { ...request, status } : request)));
  };

  const themeCounts = useMemo(() => {
    const counts = requests.reduce<Record<string, number>>((acc, request) => {
      acc[request.theme] = (acc[request.theme] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [requests]);

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Boîte de réception des doléances</h1>
        <p className="fr-text--lead">
          Gérez les demandes qui concernent votre territoire et mettez à jour leur statut.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
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

        <div className="fr-card fr-card--no-border fr-mb-4w">
          <div className="fr-card__body">
            <h2 className="fr-card__title">Répartition par thème</h2>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={themeCounts.length > 0 ? themeCounts : themeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#465F9D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="fr-card fr-card--no-border">
          <div className="fr-card__body">
            <h2 className="fr-card__title">Doléances à traiter</h2>
            <div className="fr-grid-row fr-grid-row--gutters">
              {requests.map(request => (
                <div key={request.id} className="fr-col-12">
                  <div className="fr-card fr-card--no-border fr-card--shadow">
                    <div className="fr-card__body">
                      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                        <div className="fr-col-12 fr-col-lg-3">
                          <Badge severity="info">{request.theme}</Badge>
                        </div>
                        <div className="fr-col-12 fr-col-lg-4">
                          <p className="fr-mb-0">{request.excerpt}</p>
                        </div>
                        <div className="fr-col-12 fr-col-lg-2">
                          <p className="fr-mb-0">{request.commune}</p>
                        </div>
                        <div className="fr-col-12 fr-col-lg-1">
                          <p className="fr-mb-0">{request.date}</p>
                        </div>
                        <div className="fr-col-12 fr-col-lg-2">
                          <Badge severity={statusSeverity[request.status]}>{request.status}</Badge>
                        </div>
                        <div className="fr-col-12 fr-col-lg-0">
                          <label className="fr-label fr-sr-only" htmlFor={`status-${request.id}`}>
                            Statut
                          </label>
                          <select
                            className="fr-select"
                            id={`status-${request.id}`}
                            value={request.status}
                            onChange={event => handleStatusChange(request.id, event.target.value as RequestStatus)}
                          >
                            <option value="Déposée">Déposée</option>
                            <option value="Transmise">Transmise</option>
                            <option value="En traitement">En traitement</option>
                            <option value="Répondue">Répondue</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
