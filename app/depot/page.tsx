import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default function DepotPage() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Déposer une doléance</h1>
        <p>
          Vue citoyen à construire (tâche 18) : identification FranceConnect
          (mock) → texte + commune → confirmation avec élu compétent et numéro
          de suivi. Pipeline IA : voir kit/prompts/1 à 3.
        </p>
      </main>
    </>
  );
}
