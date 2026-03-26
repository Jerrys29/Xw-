import Dexie from 'dexie'

export const db = new Dexie('DemarcheurDB_v2')

db.version(1).stores({
  proprietaires: '++id, nom, telephone, createdAt',
  maisons:       '++id, proprietaireId, nom, ville, quartier, latitude, longitude, createdAt',
  menages:       '++id, maisonId, numero, statut, createdAt',
  locataires:    '++id, menageId, maisonId, nom, telephone, createdAt',
})

export async function seedIfEmpty() {
  const count = await db.proprietaires.count()
  if (count > 0) return
  const now = new Date().toISOString()

  const p1 = await db.proprietaires.add({ nom: 'Monsieur Agbossou', telephone: '+229 97 11 22 33', createdAt: now })
  const p2 = await db.proprietaires.add({ nom: 'Madame Koudjo', telephone: '+229 96 44 55 66', createdAt: now })

  const m1 = await db.maisons.add({ proprietaireId: p1, nom: 'Maison Fidjrossè', ville: 'Cotonou', quartier: 'Fidjrossè', latitude: 6.3572, longitude: 2.4343, createdAt: now })
  const m2 = await db.maisons.add({ proprietaireId: p1, nom: 'Villa Akpakpa', ville: 'Cotonou', quartier: 'Akpakpa', latitude: null, longitude: null, createdAt: now })
  const m3 = await db.maisons.add({ proprietaireId: p2, nom: 'Immeuble Zogbo', ville: 'Cotonou', quartier: 'Zogbo', latitude: null, longitude: null, createdAt: now })

  const men1 = await db.menages.add({ maisonId: m1, numero: 'Chambre 1', type: 'Chambre', statut: 'occupé', loyer: 35000, compteurEau: 320, compteurElec: 1250, notes: '', createdAt: now })
  const men2 = await db.menages.add({ maisonId: m1, numero: 'Chambre 2', type: 'Chambre', statut: 'libre', loyer: 35000, compteurEau: null, compteurElec: null, notes: '', createdAt: now })
  const men3 = await db.menages.add({ maisonId: m1, numero: 'Appartement', type: 'Appartement', statut: 'occupé', loyer: 80000, compteurEau: 150, compteurElec: 890, notes: '', createdAt: now })
  const men4 = await db.menages.add({ maisonId: m2, numero: 'Chambre A', type: 'Chambre', statut: 'libre', loyer: 30000, compteurEau: null, compteurElec: null, notes: '', createdAt: now })
  const men5 = await db.menages.add({ maisonId: m3, numero: 'Studio 01', type: 'Studio', statut: 'occupé', loyer: 55000, compteurEau: 200, compteurElec: 760, notes: '', createdAt: now })
  const men6 = await db.menages.add({ maisonId: m3, numero: 'Studio 02', type: 'Studio', statut: 'libre', loyer: 55000, compteurEau: null, compteurElec: null, notes: '', createdAt: now })

  await db.locataires.add({ menageId: men1, maisonId: m1, nom: 'Kouassi Aimé', telephone: '+229 95 12 34 56', dateEntree: '2025-01-01', createdAt: now })
  await db.locataires.add({ menageId: men3, maisonId: m1, nom: 'Fatoumata Diallo', telephone: '+229 96 78 90 12', dateEntree: '2025-03-01', createdAt: now })
  await db.locataires.add({ menageId: men5, maisonId: m3, nom: 'Jean-Pierre Agossa', telephone: '+229 97 34 56 78', dateEntree: '2024-10-01', createdAt: now })
}
