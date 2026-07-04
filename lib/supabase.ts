import { createClient } from "@supabase/supabase-js";

// Client « serveur » : UNIQUEMENT dans les routes API (app/api/**).
// Il contourne le RLS — nécessaire pour écrire dans identites.
// Créé paresseusement (à l'appel) pour que le build réussisse même sans clés.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
