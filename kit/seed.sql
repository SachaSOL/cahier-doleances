-- =====================================================================
-- Cahier de Doléances 2.0 — données de démonstration
-- À coller dans Supabase (SQL Editor > New query > Run)
-- APRÈS avoir exécuté schema.sql.
-- Résultat attendu : ~24 identités, ~40 doléances, 4 réponses.
-- Relançable : il vide d'abord les doléances existantes.
-- =====================================================================

delete from reponses;
delete from doleances;
delete from identites;

-- 1) Des citoyens fictifs (tranches d'âge variées, communes d'Île-de-France)
insert into identites (id, fc_sub_mock, tranche_age, code_insee) values
  ('aaaaaaaa-0000-4000-8000-000000000001','fc-demo-01','25-34','93066'),
  ('aaaaaaaa-0000-4000-8000-000000000002','fc-demo-02','35-49','75056'),
  ('aaaaaaaa-0000-4000-8000-000000000003','fc-demo-03','18-24','77288'),
  ('aaaaaaaa-0000-4000-8000-000000000004','fc-demo-04','50-64','78646'),
  ('aaaaaaaa-0000-4000-8000-000000000005','fc-demo-05','65+','77284'),
  ('aaaaaaaa-0000-4000-8000-000000000006','fc-demo-06','25-34','94028'),
  ('aaaaaaaa-0000-4000-8000-000000000007','fc-demo-07','35-49','92050'),
  ('aaaaaaaa-0000-4000-8000-000000000008','fc-demo-08','18-24','95127'),
  ('aaaaaaaa-0000-4000-8000-000000000009','fc-demo-09','50-64','91228'),
  ('aaaaaaaa-0000-4000-8000-000000000010','fc-demo-10','25-34','75056'),
  ('aaaaaaaa-0000-4000-8000-000000000011','fc-demo-11','65+','93066'),
  ('aaaaaaaa-0000-4000-8000-000000000012','fc-demo-12','35-49','77288'),
  ('aaaaaaaa-0000-4000-8000-000000000013','fc-demo-13','18-24','75056'),
  ('aaaaaaaa-0000-4000-8000-000000000014','fc-demo-14','50-64','94028'),
  ('aaaaaaaa-0000-4000-8000-000000000015','fc-demo-15','25-34','78646'),
  ('aaaaaaaa-0000-4000-8000-000000000016','fc-demo-16','35-49','95127'),
  ('aaaaaaaa-0000-4000-8000-000000000017','fc-demo-17','65+','75056'),
  ('aaaaaaaa-0000-4000-8000-000000000018','fc-demo-18','25-34','92050'),
  ('aaaaaaaa-0000-4000-8000-000000000019','fc-demo-19','18-24','93066'),
  ('aaaaaaaa-0000-4000-8000-000000000020','fc-demo-20','50-64','77284'),
  ('aaaaaaaa-0000-4000-8000-000000000021','fc-demo-21','35-49','91228'),
  ('aaaaaaaa-0000-4000-8000-000000000022','fc-demo-22','25-34','75056'),
  ('aaaaaaaa-0000-4000-8000-000000000023','fc-demo-23','65+','78646'),
  ('aaaaaaaa-0000-4000-8000-000000000024','fc-demo-24','18-24','77288');

-- 2) Les doléances (texte déjà « anonymisé », thème/urgence/résumé déjà remplis
--    comme si le pipeline IA était passé). Répartition pensée pour un joli
--    camembert : transports > logement > education > sante > securite > environnement.

-- Transports → région (Île-de-France Mobilités)
insert into doleances (pseudo_id, texte_anonymise, theme, urgence, resume, code_insee, elu_id, statut) values
  ('aaaaaaaa-0000-4000-8000-000000000001','Le RER B est supprimé un matin sur trois. À la troisième absence, mon employeur m''a mise à pied.','transports','haute','Suppressions répétées du RER B, emploi menacé.','93066',(select id from elus where niveau='region'),'en_traitement'),
  ('aaaaaaaa-0000-4000-8000-000000000003','Le Transilien R est bondé tous les matins, impossible de monter à Melun aux heures de pointe.','transports','moyenne','Saturation du Transilien R en heure de pointe à Melun.','77288',(select id from elus where niveau='region'),'transmise'),
  ('aaaaaaaa-0000-4000-8000-000000000008','Plus aucun bus après 21h dans mon quartier de Cergy, on est coincés sans voiture.','transports','moyenne','Absence de bus le soir dans un quartier de Cergy.','95127',(select id from elus where niveau='region'),'deposee'),
  ('aaaaaaaa-0000-4000-8000-000000000010','La ligne 13 est invivable, on laisse passer trois rames avant de pouvoir monter.','transports','moyenne','Saturation quotidienne de la ligne 13 du métro.','75056',(select id from elus where niveau='region'),'transmise'),
  ('aaaaaaaa-0000-4000-8000-000000000015','Le car scolaire passe à 6h40 pour des cours à 8h30, les enfants dorment debout.','transports','moyenne','Horaires de car scolaire inadaptés, trajet trop long.','78646',(select id from elus where niveau='region'),'deposee'),
  ('aaaaaaaa-0000-4000-8000-000000000019','Les escalators de la gare sont en panne depuis des mois, ma grand-mère ne peut plus prendre le train.','transports','moyenne','Escalators de gare en panne prolongée, accessibilité réduite.','93066',(select id from elus where niveau='region'),'deposee'),
  ('aaaaaaaa-0000-4000-8000-000000000021','Aucune piste cyclable sécurisée entre Évry et la gare, c''est dangereux à vélo.','transports','moyenne','Absence d''itinéraire cyclable sécurisé vers la gare d''Évry.','91228',(select id from elus where niveau='region'),'deposee'),
  ('aaaaaaaa-0000-4000-8000-000000000024','Les retards du Transilien me font rater ma correspondance tous les jours ou presque.','transports','faible','Retards récurrents et correspondances manquées sur le Transilien.','77288',(select id from elus where niveau='region'),'deposee');

-- Logement → commune
insert into doleances (pseudo_id, texte_anonymise, theme, urgence, resume, code_insee, elu_id, statut) values
  ('aaaaaaaa-0000-4000-8000-000000000002','Trois ans que ma demande de logement social est « en cours ». On vit à quatre dans 28 m².','logement','haute','Demande de logement social sans réponse depuis trois ans.','75056',(select id from elus where niveau='commune'),'en_traitement'),
  ('aaaaaaaa-0000-4000-8000-000000000013','Mon immeuble a des moisissures partout, le bailleur ne répond plus depuis des mois.','logement','haute','Moisissures dans un logement, bailleur injoignable.','75056',(select id from elus where niveau='commune'),'transmise'),
  ('aaaaaaaa-0000-4000-8000-000000000017','Les loyers du quartier ont doublé, les retraités comme moi sont poussés dehors.','logement','moyenne','Hausse des loyers, difficulté de maintien des retraités.','75056',(select id from elus where niveau='commune'),'deposee'),
  ('aaaaaaaa-0000-4000-8000-000000000022','L''ascenseur de notre tour est en panne une semaine sur deux, avec des poussettes au 12e.','logement','moyenne','Pannes récurrentes d''ascenseur dans un immeuble social.','75056',(select id from elus where niveau='commune'),'repondue'),
  ('aaaaaaaa-0000-4000-8000-000000000006','Impossible de trouver un T3 abordable à Créteil pour une famille avec deux salaires modestes.','logement','faible','Pénurie de logements familiaux abordables à Créteil.','94028',(select id from elus where niveau='commune'),'deposee');

-- Éducation → département (collèges) et région (lycées)
insert into doleances (pseudo_id, texte_anonymise, theme, urgence, resume, code_insee, elu_id, statut) values
  ('aaaaaaaa-0000-4000-8000-000000000012','36 élèves par classe au collège de mon fils, les profs n''y arrivent plus.','education','moyenne','Classes surchargées dans un collège de Seine-et-Marne.','77288',(select id from elus where niveau='departement'),'en_traitement'),
  ('aaaaaaaa-0000-4000-8000-000000000020','La cantine du collège a augmenté de 30 % en un an, certaines familles déjeunent d''un sandwich.','education','moyenne','Forte hausse du prix de la cantine d''un collège.','77284',(select id from elus where niveau='departement'),'transmise'),
  ('aaaaaaaa-0000-4000-8000-000000000004','Le lycée de ma fille n''a plus de chauffage dans trois salles depuis janvier.','education','haute','Salles de lycée sans chauffage depuis plusieurs mois.','78646',(select id from elus where niveau='region'),'repondue'),
  ('aaaaaaaa-0000-4000-8000-000000000024','Aucune option informatique au lycée alors que tout le monde en parle, on prend du retard.','education','faible','Absence d''option numérique dans un lycée de Seine-et-Marne.','77288',(select id from elus where niveau='region'),'deposee');

-- Santé → État (ARS) : pas d'élu « etat » dans le seed, on route vers la région
-- avec un résumé qui mentionne la réorientation (cas « hors compétence » de la démo).
insert into doleances (pseudo_id, texte_anonymise, theme, urgence, resume, code_insee, elu_id, statut) values
  ('aaaaaaaa-0000-4000-8000-000000000005','Plus aucun médecin traitant ne prend de nouveaux patients à moins de 20 km de chez nous.','sante','haute','Désert médical : aucun médecin traitant disponible. Réorienté ARS.','77284',(select id from elus where niveau='region'),'transmise'),
  ('aaaaaaaa-0000-4000-8000-000000000011','Les urgences de l''hôpital ferment la nuit par manque de personnel, il faut faire 40 minutes de route.','sante','haute','Fermeture nocturne des urgences, allongement des trajets. Réorienté ARS.','93066',(select id from elus where niveau='region'),'transmise'),
  ('aaaaaaaa-0000-4000-8000-000000000009','Huit mois d''attente pour un rendez-vous ophtalmo, ce n''est pas normal.','sante','moyenne','Délais d''attente très longs en ophtalmologie. Réorienté ARS.','91228',(select id from elus where niveau='region'),'deposee'),
  ('aaaaaaaa-0000-4000-8000-000000000023','La maison de santé promise il y a cinq ans n''a toujours pas ouvert.','sante','moyenne','Maison de santé annoncée mais jamais ouverte. Réorienté ARS.','78646',(select id from elus where niveau='region'),'deposee');

-- Sécurité → commune
insert into doleances (pseudo_id, texte_anonymise, theme, urgence, resume, code_insee, elu_id, statut) values
  ('aaaaaaaa-0000-4000-8000-000000000018','La gare routière n''est plus éclairée depuis des mois, ma fille ne rentre plus seule le soir.','securite','haute','Éclairage public en panne autour de la gare routière.','92050',(select id from elus where niveau='commune'),'en_traitement'),
  ('aaaaaaaa-0000-4000-8000-000000000014','Des rodéos urbains tous les soirs d''été sur le parking du centre commercial.','securite','moyenne','Rodéos urbains récurrents sur un parking public.','94028',(select id from elus where niveau='commune'),'transmise'),
  ('aaaaaaaa-0000-4000-8000-000000000007','Le passage piéton devant l''école primaire est effacé, un enfant a failli être renversé.','securite','haute','Passage piéton effacé devant une école primaire, danger.','92050',(select id from elus where niveau='commune'),'repondue');

-- Environnement → commune
insert into doleances (pseudo_id, texte_anonymise, theme, urgence, resume, code_insee, elu_id, statut) values
  ('aaaaaaaa-0000-4000-8000-000000000016','Les dépôts sauvages s''accumulent le long du chemin des Petits-Prés, personne ne ramasse.','environnement','moyenne','Dépôts sauvages non ramassés le long d''un chemin communal.','95127',(select id from elus where niveau='commune'),'transmise'),
  ('aaaaaaaa-0000-4000-8000-000000000019','L''air est irrespirable près de l''autoroute, les enfants de l''école toussent en permanence.','environnement','moyenne','Pollution de l''air ressentie près d''un axe routier.','93066',(select id from elus where niveau='commune'),'deposee'),
  ('aaaaaaaa-0000-4000-8000-000000000001','Le square du quartier est à l''abandon : jeux cassés, pelouse brûlée, plus un banc entier.','environnement','faible','Square de quartier dégradé et non entretenu.','93066',(select id from elus where niveau='commune'),'deposee');

-- Autres → commune
insert into doleances (pseudo_id, texte_anonymise, theme, urgence, resume, code_insee, elu_id, statut) values
  ('aaaaaaaa-0000-4000-8000-000000000017','Impossible de joindre un service public sans internet, et ma voisine de 84 ans n''a pas d''ordinateur.','services_publics','moyenne','Dématérialisation excluant les personnes âgées sans internet.','75056',(select id from elus where niveau='commune'),'deposee'),
  ('aaaaaaaa-0000-4000-8000-000000000010','La mairie annexe n''ouvre plus que deux demi-journées par semaine, files d''attente énormes.','services_publics','faible','Horaires réduits de la mairie annexe, longues attentes.','75056',(select id from elus where niveau='commune'),'deposee');

-- 3) Quelques doléances avec ID fixe + leur réponse (pour montrer le statut « répondue »)
insert into doleances (id, pseudo_id, texte_anonymise, theme, urgence, resume, code_insee, elu_id, statut) values
  ('dddddddd-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000002','Les poubelles de la rue ne sont ramassées qu''une fois par semaine en été, ça sent très mauvais.','environnement','moyenne','Fréquence de ramassage des ordures insuffisante en été.','75056',(select id from elus where niveau='commune'),'repondue'),
  ('dddddddd-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000013','Le feu du carrefour de la mairie reste vert deux secondes pour les piétons, les personnes âgées n''ont pas le temps de traverser.','voirie','moyenne','Durée de traversée piétonne trop courte à un carrefour.','75056',(select id from elus where niveau='commune'),'repondue');

insert into reponses (doleance_id, texte, auteur) values
  ('dddddddd-0000-4000-8000-000000000001','Bonjour, nous avons bien reçu votre signalement concernant la fréquence de ramassage des ordures pendant l''été. Le service propreté a été saisi et une tournée supplémentaire hebdomadaire est à l''étude pour votre secteur. Vous serez informé(e) de la décision dans votre espace de suivi. Merci de votre vigilance.','secretariat'),
  ('dddddddd-0000-4000-8000-000000000002','Bonjour, merci pour votre signalement concernant la durée de traversée au carrefour de la mairie. Nos services techniques ont été saisis pour mesurer le temps de feu piéton et l''ajuster si nécessaire, en lien avec le gestionnaire de voirie. Votre demande est suivie sous le numéro visible dans votre espace. Merci d''avoir pris le temps de nous alerter.','secretariat');

-- Fin. Vérifie dans Table Editor : doleances ≈ 30 lignes, identites = 24, reponses = 2.
