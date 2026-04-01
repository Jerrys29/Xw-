import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import {
  Home, CreditCard, CheckCircle, XCircle,
  RefreshCw, LogOut, Building2, Gauge,
} from 'lucide-react'
import { format, startOfMonth, addMonths, differenceInMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

/* ─── helpers ─────────────────────────────────────────── */
function buildMoisList(dateEntree) {
  const start = startOfMonth(new Date(dateEntree))
  const now   = startOfMonth(new Date())
  const count = Math.max(1, differenceInMonths(now, start) + 1)
  return Array.from({ length: count }, (_, i) => {
    const d = addMonths(start, i)
    return { mois: d.getMonth() + 1, annee: d.getFullYear(), date: d }
  })
}

/* ─── composant principal ─────────────────────────────── */
export default function LocataireDashboard() {
  const profile = useAuthStore(s => s.profile)
  const signOut = useAuthStore(s => s.signOut)

  const [locataire, setLocataire] = useState(null)
  const [menage,    setMenage]    = useState(null)
  const [maison,    setMaison]    = useState(null)
  const [agence,    setAgence]    = useState(null)
  const [paiements, setPaiements] = useState([])
  const [moisList,  setMoisList]  = useState([])
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Chercher le locataire par profile_id OU telephone
      let { data: loc } = await supabase
        .from('locataires')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (!loc && profile.telephone) {
        const tel = profile.telephone.replace(/[^0-9+]/g, '')
        const { data } = await supabase
          .from('locataires')
          .select('*')
          .eq('telephone', tel)
          .maybeSingle()
        loc = data
      }

      if (!loc) { setLoading(false); return }
      setLocataire(loc)

      const [{ data: m }, { data: mais }, { data: pays }, { data: ag }] =
        await Promise.all([
          supabase.from('menages').select('*').eq('id', loc.menage_id).single(),
          supabase.from('maisons').select('nom,quartier,ville').eq('id', loc.maison_id).single(),
          supabase.from('paiements').select('*')
            .eq('locataire_id', loc.id)
            .order('annee').order('mois'),
          loc.user_id
            ? supabase.from('profiles')
                .select('nom,fedapay_public_key')
                .eq('id', loc.user_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ])

      setMenage(m)
      setMaison(mais)
      setPaiements(pays ?? [])
      setAgence(ag)

      if (loc.date_entree) setMoisList(buildMoisList(loc.date_entree))
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.telephone])

  useEffect(() => { load() }, [load])

  /* ── états de chargement / erreur ── */
  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <RefreshCw size={26} className="animate-spin text-blue-500" />
    </div>
  )

  if (!locataire) return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 bg-slate-50">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
        <Home size={28} className="text-amber-500" />
      </div>
      <p className="font-bold text-slate-800 text-lg">Aucun logement associé</p>
      <p className="text-slate-500 text-sm">Contactez votre agence pour configurer votre compte.</p>
      <button onClick={signOut}
        className="mt-2 text-sm text-red-500 font-semibold flex items-center gap-1">
        <LogOut size={15} /> Se déconnecter
      </button>
    </div>
  )

  const loyer        = Number(menage?.loyer ?? 0)
  const now          = new Date()
  const moisCourant  = { mois: now.getMonth() + 1, annee: now.getFullYear() }
  const paieCourant  = paiements.find(
    p => p.mois === moisCourant.mois && p.annee === moisCourant.annee
  )
  const estPaye      = paieCourant?.statut === 'payé'
  const moisNonPayes = moisList.filter(
    ({ mois, annee }) => !paiements.find(p => p.mois === mois && p.annee === annee && p.statut === 'payé')
  ).length

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-blue-600 px-5 pt-10 pb-12">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">Bonjour 👋</p>
            <h1 className="text-white text-2xl font-bold mt-0.5 leading-tight">
              {profile.nom ?? locataire.nom ?? 'Mon espace'}
            </h1>
          </div>
          <button onClick={signOut}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white active:bg-white/30">
            <LogOut size={17} />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4 max-w-lg mx-auto">

        {/* ── Résumé rapide ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">Loyer mensuel</p>
            <p className="text-xl font-bold text-slate-900">
              {loyer.toLocaleString('fr-FR')} <span className="text-sm font-medium text-slate-500">F</span>
            </p>
          </div>
          <div className={`rounded-2xl p-4 border shadow-sm ${moisNonPayes > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-xs text-slate-400 mb-1">Impayés</p>
            <p className={`text-xl font-bold ${moisNonPayes > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {moisNonPayes} mois
            </p>
          </div>
        </div>

        {/* ── Mon logement ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mon logement</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={22} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{menage?.numero ?? '—'}</p>
              <p className="text-sm text-slate-500">{maison?.nom ?? '—'} · {maison?.quartier}</p>
            </div>
          </div>
          {(menage?.compteur_elec != null || menage?.compteur_eau != null) && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><Gauge size={12} /> Compteurs</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">⚡ SBEE</span>
                <span className="font-semibold text-slate-800">
                  {menage.compteur_elec != null ? `${menage.compteur_elec} kWh` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">💧 SONEB</span>
                <span className="font-semibold text-slate-800">
                  {menage.compteur_eau != null ? `${menage.compteur_eau} m³` : '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Mois en cours ── */}
        {moisList.length > 0 && (
          <div className={`rounded-2xl p-4 shadow-sm border ${estPaye ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ce mois</p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${estPaye ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                {estPaye ? '✓ Payé' : 'À payer'}
              </span>
            </div>
            <p className="font-bold text-slate-800 text-base capitalize">
              {format(new Date(moisCourant.annee, moisCourant.mois - 1), 'MMMM yyyy', { locale: fr })}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {loyer.toLocaleString('fr-FR')} F CFA
            </p>

            {!estPaye && agence?.fedapay_public_key && (
              <PayButton
                key={`${moisCourant.annee}-${moisCourant.mois}`}
                locataire={locataire}
                menage={menage}
                mois={moisCourant.mois}
                annee={moisCourant.annee}
                montant={loyer}
                publicKey={agence.fedapay_public_key}
                profile={profile}
                onSuccess={load}
              />
            )}
            {!estPaye && !agence?.fedapay_public_key && (
              <p className="mt-3 text-xs text-orange-600 font-medium">
                ⚠ Le paiement en ligne n&apos;est pas encore activé par votre agence.
              </p>
            )}
          </div>
        )}

        {/* ── Historique ── */}
        {moisList.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Historique ({moisList.length} mois)
            </p>
            <div className="space-y-2">
              {[...moisList].reverse().map(({ mois, annee, date }) => {
                const p   = paiements.find(x => x.mois === mois && x.annee === annee)
                const ok  = p?.statut === 'payé'
                return (
                  <div key={`${annee}-${mois}`}
                    className="bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {ok
                        ? <CheckCircle size={18} className="text-emerald-500" />
                        : <XCircle    size={18} className="text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm capitalize">
                        {format(date, 'MMMM yyyy', { locale: fr })}
                      </p>
                      {ok && p?.created_at && (
                        <p className="text-xs text-slate-400">
                          Payé le {format(new Date(p.created_at), 'd MMM yyyy', { locale: fr })}
                        </p>
                      )}
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${ok ? 'text-emerald-600' : 'text-red-400'}`}>
                      {ok ? `${Number(p.montant).toLocaleString('fr-FR')} F` : 'Impayé'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Bouton de paiement FedaPay ──────────────────────── */
function PayButton({ locataire, menage, mois, annee, montant, publicKey, profile, onSuccess }) {
  const [loading, setLoading] = useState(false)

  function handlePay() {
    if (!window.FedaPay) {
      alert('Module de paiement non chargé. Vérifiez votre connexion et réessayez.')
      return
    }

    const moisLabel = new Date(annee, mois - 1)
      .toLocaleString('fr-FR', { month: 'long', year: 'numeric' })

    window.FedaPay.init({
      public_key: publicKey,
      transaction: {
        amount:      montant,
        description: `Loyer ${moisLabel} — ${menage?.numero ?? ''}`,
      },
      currency: { iso: 'XOF' },
      customer: {
        email:     `loc.${(profile.telephone ?? '').replace(/[^0-9]/g, '')}@demarcheur.app`,
        firstname: (profile.nom ?? locataire.nom ?? '').split(' ')[0] ?? '',
        lastname:  (profile.nom ?? locataire.nom ?? '').split(' ').slice(1).join(' ') ?? '',
      },
      onComplete: async (resp) => {
        if (resp.reason === window.FedaPay.DIALOG_DISMISSED) return
        const tx = resp.transaction
        if (tx?.status === 'approved') {
          setLoading(true)
          try {
            const { data: paiement } = await supabase
              .from('paiements')
              .insert({
                locataire_id:     locataire.id,
                menage_id:        menage?.id ?? null,
                agence_id:        locataire.user_id ?? null,
                mois,
                annee,
                montant,
                statut:           'payé',
                reference_fedapay: String(tx.reference ?? ''),
                transaction_id:   String(tx.id ?? ''),
              })
              .select()
              .single()

            if (paiement?.id) {
              const num = `FAC-${annee}${String(mois).padStart(2,'0')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
              await supabase.from('factures').insert({
                paiement_id:    paiement.id,
                numero_facture: num,
                date:           new Date().toISOString().split('T')[0],
                montant,
              })
            }
            onSuccess()
          } finally {
            setLoading(false)
          }
        }
      },
    }).open()
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full mt-3 py-4 bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:opacity-80"
    >
      {loading
        ? <><RefreshCw size={17} className="animate-spin" /> Traitement…</>
        : <><CreditCard size={17} /> Payer {montant.toLocaleString('fr-FR')} F CFA</>
      }
    </button>
  )
}
