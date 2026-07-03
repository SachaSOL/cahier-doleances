import Link from "next/link";
import { StartDsfrOnHydration } from "../dsfr-bootstrap";

export default function Home() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Cahier de Doléances 2.0</h1>
        <p className="fr-text--lead">
          Votre voix, au bon élu, avec suivi — entre deux élections.
        </p>
        <ul className="fr-btns-group fr-btns-group--inline-md">
          <li>
            <Link className="fr-btn" href="/depot">
              Déposer une doléance
            </Link>
          </li>
          <li>
            <Link className="fr-btn fr-btn--secondary" href="/secretariat">
              Espace secrétariat
            </Link>
          </li>
          <li>
            <Link className="fr-btn fr-btn--secondary" href="/dashboard">
              Tableau de bord élu
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}
