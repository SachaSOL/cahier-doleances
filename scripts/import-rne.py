#!/usr/bin/env python3
# Import du Répertoire national des élus (RNE) dans la table elus.
# Usage : python3 scripts/import-rne.py /chemin/vers/les/csv
# Fichiers requis : elus-maires-mai.csv, elus-deputes-dep.csv,
#   elus-conseillers-departementaux-cd.csv, elus-conseillers-regionaux-cr.csv
# Emails : FICTIFS partout (@demo.example.org) — décision d'équipe, pas de vrais emails.

import csv, json, sys, urllib.request
from pathlib import Path

DOSSIER = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
NOM = "Nom de l'élu"
PRENOM = "Prénom de l'élu"

# Lecture de .env.local (URL + clé secrète serveur)
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
    # Code INSEE commune : re-remplir le zéro de tête perdu (1001 -> 01001)
    brut = str(brut).strip()
    return brut.zfill(5) if brut.isdigit() else brut  # 2A004 reste tel quel


def code_dept(brut):
    brut = str(brut).strip()
    return brut.zfill(2) if brut.isdigit() and len(brut) < 3 else brut  # 971, 2A restent


lignes = []

for r in lire("elus-maires-mai.csv"):
    insee = code5(r["Code de la commune"])
    lignes.append({
        "nom": r[PRENOM] + " " + r[NOM],
        "mandat": "Maire",
        "niveau": "commune",
        "territoire_code": insee,
        "email": "mairie-" + insee + "@demo.example.org",
    })

for r in lire("elus-deputes-dep.csv"):
    dept = code_dept(r["Code du département"] or r.get("Code de la collectivité à statut particulier") or "ZZ")
    circo = str(r["Code de la circonscription législative"]).strip()
    lignes.append({
        "nom": r[PRENOM] + " " + r[NOM],
        "mandat": "Députée" if r["Code sexe"] == "F" else "Député",
        "niveau": "etat",
        "territoire_code": dept,
        "email": "depute-" + circo + "@demo.example.org",
    })

for r in lire("elus-conseillers-departementaux-cd.csv"):
    fonction = (r.get("Libellé de la fonction") or "").lower()
    if fonction.startswith("président") and "conseil départemental" in fonction:
        dept = code_dept(r["Code du département"])
        lignes.append({
            "nom": r[PRENOM] + " " + r[NOM],
            "mandat": ("Présidente" if r["Code sexe"] == "F" else "Président") + " du conseil départemental",
            "niveau": "departement",
            "territoire_code": dept,
            "email": "dept-" + dept + "@demo.example.org",
        })

for r in lire("elus-conseillers-regionaux-cr.csv"):
    fonction = (r.get("Libellé de la fonction") or "").lower()
    if fonction.startswith("président") and "conseil régional" in fonction:
        region = code_dept(r["Code de la région"])
        lignes.append({
            "nom": r[PRENOM] + " " + r[NOM],
            "mandat": ("Présidente" if r["Code sexe"] == "F" else "Président") + " du conseil régional",
            "niveau": "region",
            "territoire_code": region,
            "email": "region-" + region + "@demo.example.org",
        })

print(str(len(lignes)) + " élus à insérer...")
for i in range(0, len(lignes), 1000):
    rest("POST", "/elus", lignes[i:i + 1000])
    print("  " + str(min(i + 1000, len(lignes))) + "/" + str(len(lignes)))

# Re-pointer les doléances des 3 élus de démo vers les vrais élus, puis supprimer les démos.
demos = rest("GET", "/elus?email=like.demo-*%40example.org&select=id,niveau,territoire_code")
for d in demos:
    reel = rest(
        "GET",
        "/elus?niveau=eq." + d["niveau"] + "&territoire_code=eq." + d["territoire_code"]
        + "&email=like.*%40demo.example.org&select=id&limit=1",
    )
    if reel:
        rest("PATCH", "/doleances?elu_id=eq." + d["id"], {"elu_id": reel[0]["id"]})
        rest("DELETE", "/elus?id=eq." + d["id"])
        print("  démo " + d["niveau"] + "/" + d["territoire_code"] + " remplacée et supprimée")

# Bilan
for niveau in ["commune", "departement", "region", "etat"]:
    n = rest("GET", "/elus?niveau=eq." + niveau + "&select=id")
    print(niveau + ": " + str(len(n)) + " élus")
