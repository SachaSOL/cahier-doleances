#!/usr/bin/env python3
# Import COMPLET du RNE (les 8 fichiers restants) + préfectures.
# À lancer APRÈS import-rne.py (maires/députés/présidents déjà en base)
# et APRÈS avoir élargi la contrainte : alter table elus drop constraint elus_niveau_check;
# Usage : python3 scripts/import-rne-complet.py /chemin/vers/les/csv
# Emails : FICTIFS partout (@demo.example.org).

import csv, json, sys, urllib.request
from pathlib import Path

DOSSIER = Path(sys.argv[1] if len(sys.argv) > 1 else ".")

env = {}
for ligne in Path(".env.local").read_text().splitlines():
    if "=" in ligne and not ligne.strip().startswith("#"):
        cle, _, val = ligne.partition("=")
        env[cle.strip()] = val.strip()
URL = env["NEXT_PUBLIC_SUPABASE_URL"] + "/rest/v1"
SECRET = env["SUPABASE_SERVICE_ROLE_KEY"]


def rest(methode, chemin, corps=None):
    req = urllib.request.Request(URL + chemin, method=methode)
    req.add_header("apikey", SECRET)
    req.add_header("Authorization", "Bearer " + SECRET)
    req.add_header("Content-Type", "application/json")
    data = json.dumps(corps).encode() if corps is not None else None
    with urllib.request.urlopen(req, data) as r:
        texte = r.read().decode()
        return json.loads(texte) if texte else None


def lire(fichier):
    with open(DOSSIER / fichier, encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f, delimiter=";")


def code5(brut):
    brut = str(brut or "").strip()
    return brut.zfill(5) if brut.isdigit() else brut


def code_dept(brut):
    brut = str(brut or "").strip()
    return brut.zfill(2) if brut.isdigit() and len(brut) < 3 else brut


def champ(r, *candidats):
    # Les entêtes varient légèrement d'un fichier à l'autre : on tente plusieurs clés.
    for c in candidats:
        if c in r and r[c] is not None:
            return str(r[c]).strip()
    return ""


def elu(r, mandat_defaut, niveau, territoire, prefixe_email):
    nom = champ(r, "Prénom de l'élu") + " " + champ(r, "Nom de l'élu")
    fonction = champ(r, "Libellé de la fonction")
    return {
        "nom": nom.strip(),
        "mandat": fonction if fonction else mandat_defaut,
        "niveau": niveau,
        "territoire_code": territoire or "00",
        "email": prefixe_email + "-" + (territoire or "00") + "@demo.example.org",
    }


lignes = []

# Sénateurs -> niveau 'senateur' (territoire : département ou collectivité)
for r in lire("elus-senateurs-sen.csv"):
    terr = code_dept(champ(r, "Code du département")) or champ(r, "Code de la collectivité à statut particulier")
    sexe = champ(r, "Code sexe")
    lignes.append(elu(r, "Sénatrice" if sexe == "F" else "Sénateur", "senateur", terr, "senat"))

# Eurodéputés -> 'europe' (circonscription nationale unique)
for r in lire("elus-representant-parlement-europeen-rpe.csv"):
    sexe = champ(r, "Code sexe")
    lignes.append(elu(r, "Députée européenne" if sexe == "F" else "Député européen", "europe", "FR", "europe"))

# Conseillers AFE -> 'afe'
for r in lire("elus-assemblee-des-francais-de-letranger-afe.csv"):
    terr = champ(r, "Code de la circ. AFE", "Code de la circonscription AFE")
    lignes.append(elu(r, "Conseiller AFE", "afe", terr, "afe"))

# Conseillers des Français de l'étranger -> 'consulaire'
for r in lire("elus-conseillers-des-francais-de-letranger-cons.csv"):
    terr = champ(r, "Code de la circonscription consulaire")
    lignes.append(elu(r, "Conseiller des Français de l'étranger", "consulaire", terr, "consulaire"))

# Tous les conseillers départementaux -> 'conseil_departemental'
for r in lire("elus-conseillers-departementaux-cd.csv"):
    terr = code_dept(champ(r, "Code du département"))
    lignes.append(elu(r, "Conseiller départemental", "conseil_departemental", terr, "cd"))

# Tous les conseillers régionaux -> 'conseil_regional'
for r in lire("elus-conseillers-regionaux-cr.csv"):
    terr = code_dept(champ(r, "Code de la région"))
    lignes.append(elu(r, "Conseiller régional", "conseil_regional", terr, "cr"))

# Membres d'une assemblée (Corse, Martinique, Guyane, outre-mer...) -> 'assemblee'
for r in lire("elus-membres-dune-assemblee-ma.csv"):
    terr = champ(r, "Code de la collectivité à statut particulier") or code_dept(champ(r, "Code de la région"))
    lignes.append(elu(r, "Membre d'assemblée territoriale", "assemblee", terr, "assemblee"))

# Conseillers d'arrondissement (Paris, Lyon, Marseille) -> 'arrondissement'
for r in lire("elus-conseillers-arrondissements-ca.csv"):
    terr = code5(champ(r, "Code de la commune"))
    lignes.append(elu(r, "Conseiller d'arrondissement", "arrondissement", terr, "arrond"))

# Conseillers communautaires (EPCI / intercommunalités) -> 'epci' (territoire = SIREN)
for r in lire("elus-conseillers-communautaires-epci.csv"):
    terr = champ(r, "N° SIREN")
    lignes.append(elu(r, "Conseiller communautaire", "epci", terr, "epci"))

# Conseillers municipaux -> 'conseil_municipal'
for r in lire("elus-conseillers-municipaux-cm.csv"):
    terr = code5(champ(r, "Code de la commune"))
    lignes.append(elu(r, "Conseiller municipal", "conseil_municipal", terr, "cm"))

# Préfectures : une par département (institution, pas un élu — les préfets
# nommés ne figurent pas au RNE). Départements déduits du fichier des maires.
depts = {}
for r in lire("elus-maires-mai.csv"):
    code = code_dept(champ(r, "Code du département")) or champ(r, "Code de la collectivité à statut particulier")
    libelle = champ(r, "Libellé du département") or champ(r, "Libellé de la collectivité à statut particulier")
    if code and code not in depts:
        depts[code] = libelle
for code, libelle in sorted(depts.items()):
    lignes.append({
        "nom": "Préfecture (" + libelle + ")",
        "mandat": "Préfet",
        "niveau": "prefecture",
        "territoire_code": code,
        "email": "prefet-" + code + "@demo.example.org",
    })

print(str(len(lignes)) + " élus/institutions à insérer...")
for i in range(0, len(lignes), 1000):
    rest("POST", "/elus", lignes[i:i + 1000])
    fait = min(i + 1000, len(lignes))
    if fait % 25000 < 1000 or fait == len(lignes):
        print("  " + str(fait) + "/" + str(len(lignes)))

print("Import terminé.")
