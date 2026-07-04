"use client";

import { QRCodeSVG } from "qrcode.react";

// QR code du site, épinglé en haut à droite et visible en permanence
// (position fixe) — pour que le public scanne et teste le site pendant la démo.
const URL = "https://cahier-doleances.vercel.app";

export function QrPresentation() {
  return (
    <div
      aria-label="QR code pour tester le site"
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 3000,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 8,
        boxShadow: "0 3px 14px rgba(0,0,0,0.2)",
        textAlign: "center",
        width: 128,
      }}
    >
      <a href={URL} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
        <QRCodeSVG value={URL} size={104} bgColor="#ffffff" fgColor="#000091" />
      </a>
      <p
        style={{
          margin: "5px 0 0",
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.2,
          color: "#000091",
        }}
      >
        Scannez pour
        <br />
        tester le site
      </p>
    </div>
  );
}
