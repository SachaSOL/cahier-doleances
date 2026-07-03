import { createClient } from "@supabase/supabase-js";

// Client « public » : utilisable côté navigateur (vues citoyen/élu).
// Il ne peut PAS lire la table identites (aucune policy RLS dessus) — voulu.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Client « serveur » : UNIQUEMENT dans les routes API (app/api/**).
// Il contourne le RLS — nécessaire pour écrire dans identites.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
