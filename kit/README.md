# Kit de démarrage — Cahier de Doléances 2.0

Contenu du kit et ordre d'utilisation :

| Fichier | À quoi ça sert | Quand |
|---|---|---|
| `schema.sql` | Construit la base de données (4 tables + sécurité) | En 1er, à coller dans Supabase → SQL Editor → Run |
| `seed.sql` | Remplit la base avec ~50 doléances de démo réalistes | En 2e, juste après le schéma (même méthode) |
| `prompts/1-anonymisation.md` | Prompt Claude : retire les infos personnelles du texte | Dev A, tâche 12 |
| `prompts/2-classification.md` | Prompt Claude : thème + urgence + résumé | Dev A, tâche 13 |
| `prompts/3-routing.md` | Prompt Claude : trouve le bon niveau (commune/dept/région/État) | Dev A, tâche 14 — LA feature différenciante |
| `prompts/4-reponse-secretaire.md` | Prompt Claude : réponse pré-rédigée pour la secrétaire | Dev A, tâche 16 |

## Infos projet Supabase

- Projet créé le 3 juillet 2026, région **West EU (Ireland)** — donnée hébergée en UE ✔
- L'URL du projet et les 2 clés (`anon public` et `service_role`) se récupèrent dans
  **Project Settings (roue dentée) → API**. Elles iront dans le fichier `.env.local` de l'appli :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # secrète, jamais côté navigateur
ANTHROPIC_API_KEY=...                # pour les prompts Claude
```

## Rappels d'architecture

- Le texte d'une doléance est anonymisé par Claude AVANT d'être stocké (prompt 1).
- La table `identites` est volontairement illisible avec la clé publique (aucune policy RLS) :
  c'est l'argument privacy de la démo.
- Chaîne de traitement d'une doléance : prompt 1 → prompt 2 → prompt 3 → insertion en base.
- Le seed contient 3 élus (région Île-de-France, mairie de Paris, département 77) : le routing
  sélectionne l'élu par `niveau` + `territoire_code`. L'import complet du RNE est la tâche 9.
