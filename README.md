# Score EPS

Application web de **suivi de scores de matchs** pour l’EPS (badminton en priorité, adaptable à d’autres sports à points).

Fonctionne sur **PC, tablette et téléphone**. Les données restent **dans le navigateur** (localStorage) — pas de cloud tiers, adapté à un usage scolaire.

## Fonctionnalités

- Créer / supprimer des **classes**
- Ajouter / retirer des **élèves**
- Lancer une **séance** avec un mode de jeu :
  - **10 points joués** (somme des scores = 10)
  - **Premier à 15** (service aux gagnants)
- Saisir un match : élève A, élève B, scores, **arbitre optionnel**
- Attribution auto des points : **victoire 3 · nul 2 · défaite 1**
- Statut **présent / dispensé / absent** (0 pt, sans pénalité)
- Objectif **3 matchs** par élève et par séance
- **Classement de séance** + **classement général**
- Export / import JSON pour sauvegarde ou changement d’appareil

## Lancer en local

```bash
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Déploiement Render (statique)

1. Poussez ce dépôt sur GitHub.
2. Sur [Render](https://dashboard.render.com) : **New → Static Site** (ou Blueprint via `render.yaml`).
3. Build : `npm ci && npm run build`
4. Publish directory : `dist`
5. Rewrite SPA : `/*` → `/index.html` (déjà dans `render.yaml`)

Aucune variable d’environnement n’est requise.

## Données & confidentialité

- Stockage **local uniquement** (appareil / navigateur du professeur).
- Préférez prénom ou prénom + initiale (minimisation).
- Exportez régulièrement un JSON de sauvegarde.
- Pour un usage établissement, informez le DPD / le chef d’établissement si besoin.

## Stack

Vue 3 · Vite · Pinia · Vue Router · Tailwind CSS
