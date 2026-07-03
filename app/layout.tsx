import type { Metadata } from "next";
import { getHtmlAttributes, DsfrHead } from "../dsfr-bootstrap/server-only-index";
import { DsfrProvider } from "../dsfr-bootstrap";
import { NavPrincipale } from "../components/NavPrincipale";

export const metadata: Metadata = {
  title: "Cahier de Doléances 2.0",
  description:
    "Votre voix, au bon élu, avec suivi — entre deux élections.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = "fr";
  return (
    <html {...getHtmlAttributes({ lang })}>
      <head>
        <DsfrHead />
      </head>
      <body>
        <DsfrProvider lang={lang}>
          <NavPrincipale />
          {children}
        </DsfrProvider>
      </body>
    </html>
  );
}
