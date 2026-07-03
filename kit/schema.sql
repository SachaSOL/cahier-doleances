-- =====================================================================
-- Cahier de Doléances 2.0 — schéma de base de données
-- À coller tel quel dans Supabase : SQL Editor > New query > Run
-- =====================================================================

-- 0) Nettoyage : permet de relancer ce script sans erreur.
--    ATTENTION : efface les tables ET leurs données si elles existent.
--    Pratique pendant le hackathon, à ne plus lancer une fois la vraie
--    démo remplie.
drop table if exists reponses cascade;
drop table if exists doleances cascade;
drop table if exists identites cascade;
drop table if exists elus cascade;
drop type if exists statut_doleance cascade;

-- 1) Les statuts possibles d'une doléance (le « suivi colis »).
create type statut_doleance as enum
  ('deposee', 'transmise', 'en_traitement', 'repondue');

-- 2) IDENTITES : qui est le citoyen (rempli par le mock FranceConnect).
--    Table SÉPARÉE du contenu : c'est le cœur de l'argument privacy.
--    Aucune règle de lecture (RLS) n'est créée dessus => elle est
--    illisible avec la clé publique de l'app. Seul le serveur y accède.
create table identites (
  id          uuid primary key default gen_random_uuid(),
  fc_sub_mock text unique not null,   -- identifiant FranceConnect (mocké)
  tranche_age text not null,          -- '18-24','25-34','35-49','50-64','65+'
  code_insee  text not null,          -- commune de résidence
  created_at  timestamptz not null default now()
);

-- 3) ELUS : importés du Répertoire national des élus (RNE).
create table elus (
  id              uuid primary key default gen_random_uuid(),
  nom             text not null,
  mandat          text not null,      -- 'Maire', 'Président de région'...
  niveau          text not null
                  check (niveau in ('commune','departement','region','etat')),
  territoire_code text not null,      -- code INSEE, n° dept, code région...
  email           text
);

-- 4) DOLEANCES : le contenu, TOUJOURS anonymisé avant insertion.
--    pseudo_id fait le lien avec identites sans exposer l'identité.
create table doleances (
  id              uuid primary key default gen_random_uuid(),
  pseudo_id       uuid not null references identites(id),
  texte_anonymise text not null,
  theme           text,               -- rempli par l'IA
  urgence         text check (urgence in ('faible','moyenne','haute')),
  resume          text,               -- résumé en 1 phrase, par l'IA
  code_insee      text not null,
  elu_id          uuid references elus(id),  -- rempli par le routing IA
  statut          statut_doleance not null default 'deposee',
  cluster_id      uuid,               -- doléances similaires regroupées
  created_at      timestamptz not null default now()
);

-- 5) REPONSES : ce que le secrétariat / l'élu répond.
create table reponses (
  id          uuid primary key default gen_random_uuid(),
  doleance_id uuid not null references doleances(id),
  texte       text not null,
  auteur      text not null default 'secretariat',
  created_at  timestamptz not null default now()
);

-- 6) Index pour que le dashboard reste instantané.
create index idx_doleances_elu    on doleances(elu_id);
create index idx_doleances_theme  on doleances(theme);
create index idx_doleances_insee  on doleances(code_insee);
create index idx_doleances_statut on doleances(statut);

-- 7) Sécurité (RLS) — réglage DÉMO, à durcir si le projet continue.
alter table identites enable row level security;
alter table elus      enable row level security;
alter table doleances enable row level security;
alter table reponses  enable row level security;

-- identites : AUCUNE policy => illisible avec la clé publique. Voulu.
-- elus : lecture publique.
create policy "lecture publique elus"
  on elus for select using (true);
-- doleances / reponses : ouvert pendant le hackathon
-- (le texte est déjà anonymisé avant d'arriver ici).
create policy "demo select doleances"
  on doleances for select using (true);
create policy "demo insert doleances"
  on doleances for insert with check (true);
create policy "demo update doleances"
  on doleances for update using (true);
create policy "demo select reponses"
  on reponses for select using (true);
create policy "demo insert reponses"
  on reponses for insert with check (true);

-- 8) Trois élus d'exemple pour tester tout de suite, un par niveau
--    (le vrai import RNE viendra après).
insert into elus (nom, mandat, niveau, territoire_code, email) values
  ('Présidence de la région Île-de-France', 'Président(e) de région',
   'region', '11', 'demo-region-idf@example.org'),
  ('Mairie de Paris', 'Maire',
   'commune', '75056', 'demo-mairie-paris@example.org'),
  ('Présidence du département de Seine-et-Marne', 'Président(e) de département',
   'departement', '77', 'demo-dept-77@example.org');

-- Fin. Vérifie dans Table Editor : 4 tables, dont « elus » avec 3 lignes.
