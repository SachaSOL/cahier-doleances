import { labelStatut } from "@/lib/statuts";

const STYLE: Record<string, { bg: string; fg: string }> = {
  deposee: { bg: "#e8edff", fg: "#0063cb" },
  transmise: { bg: "#e6e6fb", fg: "#3a3ad6" },
  en_traitement: { bg: "#fceed5", fg: "#b34000" },
  repondue: { bg: "#dffee6", fg: "#18753c" },
};

// Badge de statut bien visible (grande pastille colorée).
export function StatutBadge({ statut }: { statut: string }) {
  const s = STYLE[statut] ?? { bg: "#eee", fg: "#333" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.fg,
        fontSize: 15,
        fontWeight: 700,
        padding: "6px 14px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: s.fg,
          display: "inline-block",
        }}
        aria-hidden="true"
      />
      {labelStatut(statut)}
    </span>
  );
}
