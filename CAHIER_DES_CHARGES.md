# Cahier des Charges
## Application de Gestion Immobilière — Démarcheur App
**Version :** 1.0  
**Date :** Avril 2026  
**Prestataire :** [Ton nom / Ton agence]  
**Client :** [Nom du client]

---

## 1. Contexte et Objectifs

### 1.1 Contexte
Le client exerce une activité de gestion immobilière (démarchage, location, suivi des loyers) dans la ville de Cotonou. Il gère un portefeuille de maisons pour le compte de plusieurs propriétaires et doit assurer le suivi des locataires, des paiements et des disponibilités.

### 1.2 Objectif général
Fournir une application web mobile (PWA) permettant à l'agence de :
- Gérer l'ensemble de son portefeuille immobilier de manière centralisée
- Suivre les paiements de loyers en temps réel
- Permettre aux locataires de payer leur loyer directement via mobile money
- Générer des rapports financiers mensuels

### 1.3 Périmètre fonctionnel
L'application couvre la gestion complète du cycle immobilier : de l'enregistrement du propriétaire jusqu'au suivi du paiement mensuel du locataire.

---

## 2. Acteurs du Système

| Acteur | Rôle |
|---|---|
| **Administrateur plateforme** | Gère les comptes agences, active/suspend les accès |
| **Agence / Démarcheur** | Gère ses propriétaires, maisons, locataires et paiements |
| **Locataire** | Consulte ses informations et paie son loyer via l'app |

---

## 3. Fonctionnalités Détaillées

### 3.1 Authentification et Gestion des comptes
- Inscription de l'agence avec validation admin (compte en attente → actif)
- Connexion sécurisée par email/mot de passe
- Réinitialisation de mot de passe par email
- Connexion locataire via portail dédié
- Acceptation des CGU obligatoire à l'inscription
- Gestion des rôles : `admin`, `agence`, `locataire`

### 3.2 Gestion des Propriétaires
- Ajouter / modifier / supprimer un propriétaire
- Informations : nom, téléphone
- Affichage du nombre de maisons par propriétaire
- Fiche détaillée avec liste des biens associés

### 3.3 Gestion des Maisons
- Ajouter / modifier / supprimer une maison
- Informations : nom, ville, quartier, coordonnées GPS
- Sélection de la position sur carte interactive (Leaflet)
- Association à un propriétaire
- Vue carte de toutes les maisons
- Affichage du taux d'occupation par maison

### 3.4 Gestion des Ménages (Chambres / Logements)
- Ajouter des ménages dans une maison (chambre, studio, appartement…)
- Informations : numéro, type, statut (libre / occupé), loyer, compteurs eau/électricité, notes
- Suivi du statut d'occupation en temps réel
- Historique des anciens occupants par ménage

### 3.5 Gestion des Locataires
- Enregistrement d'un locataire avec ses informations (nom, téléphone)
- Affectation à un ménage
- Création d'un compte locataire (email) pour accès à l'app
- Départ du locataire avec archivage dans l'historique

### 3.6 Paiements et Suivi Financier
- Suivi mensuel des paiements par ménage
- Enregistrement manuel d'un paiement (marquer comme payé)
- Paiement en ligne via **FedaPay** (Mobile Money : MTN, Moov, Celtiis)
- Statuts de paiement : `en attente`, `payé`, `échoué`
- Référence et ID de transaction conservés pour chaque paiement
- Commission agence configurable (taux en %)
- Dashboard financier mensuel : total attendu, total encaissé, taux de recouvrement

### 3.7 Tableau de Bord (Dashboard)
- Vue synthétique : nombre de maisons, ménages occupés, locataires actifs
- Chiffre d'affaires du mois en cours
- Filtrage par maison et par mois
- Indicateurs : taux d'occupation, loyers en attente, loyers payés
- Accès rapide aux actions fréquentes

### 3.8 Portail Locataire
- Interface simplifiée dédiée au locataire
- Visualisation de ses informations et de son ménage
- Historique de ses paiements
- Bouton de paiement FedaPay directement depuis l'app

### 3.9 Administration Plateforme
- Liste de toutes les agences inscrites
- Activation / suspension d'un compte agence
- Vue globale de l'activité

### 3.10 Fonctionnalités Techniques
- **PWA (Progressive Web App)** : installable sur mobile, fonctionne hors ligne
- **Mode hors ligne** : consultation des données en cache sans connexion internet
- **Notifications push** : alertes de paiement, rappels
- **Responsive design** : adapté mobile, tablette et desktop
- **Navigation mobile** : barre de navigation inférieure sur mobile

---

## 4. Architecture Technique

| Composant | Technologie |
|---|---|
| Frontend | React 19 + Vite |
| Style | Tailwind CSS 4 |
| Base de données | Supabase (PostgreSQL) |
| Authentification | Supabase Auth |
| Paiements | FedaPay API |
| Cartographie | Leaflet / React-Leaflet |
| Gestion d'état | Zustand |
| Cache offline | Dexie (IndexedDB) |
| PWA | Vite Plugin PWA |
| Hébergement | Vercel |
| Icônes | Lucide React |

---

## 5. Sécurité

- Row Level Security (RLS) activé sur toutes les tables Supabase
- Chaque agence ne voit que ses propres données
- Les locataires ne voient que leurs propres informations
- Clés FedaPay stockées par agence (pas mutualisées)
- Authentification JWT via Supabase

---

## 6. Livrables

| Livrable | Description |
|---|---|
| Application web déployée | URL en production accessible 24h/24 |
| Nom de domaine | Domaine .com configuré |
| Base de données configurée | Schéma Supabase + politiques RLS |
| Compte admin configuré | Accès administrateur opérationnel |
| Formation | Session de prise en main (1h) |
| Documentation utilisateur | Guide d'utilisation simplifié |
| Code source | Accès au dépôt GitHub |

---

## 7. Conditions et Délais

| Étape | Durée estimée | Statut |
|---|---|---|
| Développement de l'application | 3–4 semaines | Terminé |
| Tests et corrections | 1 semaine | Terminé |
| Déploiement et configuration | 2–3 jours | En cours |
| Formation client | 1 jour | À planifier |
| **Total** | **~5 semaines** | |

---

## 8. Conditions Financières

### 8.1 Forfait développement (frais uniques)

| Prestation | Montant |
|---|---|
| Développement complet de l'application | 200 000 XOF |
| Configuration domaine + hébergement | 15 000 XOF |
| Formation et mise en main | 15 000 XOF |
| **Total** | **230 000 XOF** |

### 8.2 Maintenance mensuelle (abonnement)

| Formule | Montant/mois | Inclus |
|---|---|---|
| Maintenance Standard | 15 000 XOF | Corrections bugs, mises à jour mineures, support WhatsApp |
| Maintenance Premium | 25 000 XOF | Standard + nouvelles fonctionnalités mineures, priorité de réponse |

### 8.3 Infrastructure (à la charge du client ou incluse selon formule)

| Service | Coût |
|---|---|
| Nom de domaine .com | ~10 000 XOF/an |
| Hébergement Vercel | Gratuit (free tier) |
| Base de données Supabase | Gratuit (free tier) |
| FedaPay | Commission sur transactions uniquement |

---

## 9. Conditions Générales

- Un acompte de **50% est demandé avant le démarrage** des travaux.
- Le solde est dû à la livraison.
- Les modifications majeures hors périmètre feront l'objet d'un devis séparé.
- Les données du client lui appartiennent et peuvent être exportées à tout moment.
- Le prestataire s'engage à une disponibilité de l'application de **99% hors maintenance**.

---

## 10. Signatures

| | Prestataire | Client |
|---|---|---|
| **Nom** | | |
| **Date** | | |
| **Signature** | | |

---

*Document confidentiel — établi dans le cadre d'une relation commerciale directe*
