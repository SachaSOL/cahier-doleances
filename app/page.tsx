"use client";

import Link from "next/link";
import { FranceConnectButton } from "@codegouvfr/react-dsfr/FranceConnectButton";
import { StartDsfrOnHydration } from "../dsfr-bootstrap";

export default function Home() {
  return (
    <>
      <StartDsfrOnHydration />

      {/* Bandeau FIXE doléances — reste visible même en scrollant */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "var(--background-flat-blue-france, #000091)",
          color: "#fff",
          padding: "0.5rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        <span style={{ fontWeight: 500 }}>
          📣 Cahier de Doléances 2.0 — c’est ici que vous déposez vos plaintes
          et doléances
        </span>
        <Link
          href="/connexion"
          className="fr-btn fr-btn--sm"
          style={{ background: "#fff", color: "#000091" }}
        >
          Déposer une doléance
        </Link>
      </div>

      {/* En-tête façon FranceConnect */}
      <header role="banner" className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <p className="fr-logo">
                      République
                      <br />
                      Française
                    </p>
                  </div>
                </div>
                <div className="fr-header__service">
                  <p className="fr-header__service-title">
                    FranceConnect{" "}
                    <span
                      style={{
                        color: "var(--text-default-error, #e1000f)",
                        fontWeight: 700,
                      }}
                    >
                      · 10 ans
                    </span>
                  </p>
                  <p className="fr-header__service-tagline">
                    Maquette de démonstration — hackathon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bandeau d’information bleu, comme sur le site officiel */}
      <div className="fr-notice fr-notice--info">
        <div className="fr-container">
          <div className="fr-notice__body">
            <p className="fr-notice__title">
              Démonstration.{" "}
              <span style={{ fontWeight: 400 }}>
                Cette page est une reproduction du parcours FranceConnect à des
                fins de démonstration. Aucune donnée réelle n’est collectée ni
                transmise.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Corps : titre bleu centré + bouton officiel */}
      <main style={{ textAlign: "center", padding: "4.5rem 1rem 6rem" }}>
        <h1
          style={{
            color: "var(--text-title-blue-france, #000091)",
            maxWidth: "46rem",
            margin: "0 auto 3rem",
          }}
        >
          Pour accéder à votre tableau de bord FranceConnect, veuillez vous
          connecter
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "2.5rem",
          }}
        >
          <FranceConnectButton
            onClick={() => window.location.assign("/connexion")}
          />
        </div>

        <p style={{ maxWidth: "38rem", margin: "0 auto" }}>
          Une fois connecté, vous pourrez consulter l’historique de vos
          connexions et configurer vos accès FranceConnect.
        </p>
      </main>

      {/* Pied de page façon site officiel */}
      <footer className="fr-footer" role="contentinfo">
        <div className="fr-container">
          <div className="fr-footer__body">
            <div className="fr-footer__brand">
              <p className="fr-logo">
                République
                <br />
                Française
              </p>
            </div>
            <div className="fr-footer__content">
              <p className="fr-footer__content-desc">
                FranceConnect est le dispositif d’identification conçu par
                l’État pour vous faciliter l’accès à vos services en ligne. En
                utilisant un de vos comptes déjà existants, vous pourrez vous
                connecter de façon sécurisée à plus de 1000 services sans créer
                de nouveau mot de passe.
              </p>
              <ul className="fr-footer__content-list">
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://legifrance.gouv.fr"
                  >
                    legifrance.gouv.fr
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://info.gouv.fr"
                  >
                    info.gouv.fr
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://service-public.gouv.fr"
                  >
                    service-public.gouv.fr
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://data.gouv.fr"
                  >
                    data.gouv.fr
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="fr-footer__bottom">
            <ul className="fr-footer__bottom-list">
              <li className="fr-footer__bottom-item">
                <span className="fr-footer__bottom-link">Plan du site</span>
              </li>
              <li className="fr-footer__bottom-item">
                <span className="fr-footer__bottom-link">
                  Accessibilité : non conforme
                </span>
              </li>
              <li className="fr-footer__bottom-item">
                <span className="fr-footer__bottom-link">Mentions légales</span>
              </li>
              <li className="fr-footer__bottom-item">
                <span className="fr-footer__bottom-link">
                  Données personnelles
                </span>
              </li>
              <li className="fr-footer__bottom-item">
                <span className="fr-footer__bottom-link">
                  Gestion des cookies
                </span>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}
