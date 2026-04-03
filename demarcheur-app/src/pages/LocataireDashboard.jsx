import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import {
  Home, CreditCard, CheckCircle, XCircle,
  RefreshCw, LogOut, Building2, Gauge, Download, Printer
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

  // Pour l'impression
  const [selectedPaiement, setSelectedPaiement] = useState(null)
  const printRef = useRef(null)

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/locataire-login'
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Trouver le locataire
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
        
        // Optionnel : lier le profile_id pour les prochaines fois
        if (loc) {
          await supabase.from('locataires').update({ profile_id: profile.id }).eq('id', loc.id)
        }
      }

      if (!loc) { setLoading(false); return }
      setLocataire(loc)

      // 2. Charger les données liées
      const [mRes, maisRes, paysRes, agRes] = await Promise.all([
        supabase.from('menages').select('*').eq('id', loc.menage_id).maybeSingle(),
        supabase.from('maisons').select('nom,quartier,ville').eq('id', loc.maison_id).maybeSingle(),
        supabase.from('paiements').select('*').eq('locataire_id', loc.id).order('annee', { ascending: false }).order('mois', { ascending: false }),
        loc.user_id ? supabase.from('profiles').select('nom,fedapay_public_key,momo_numero').eq('id', loc.user_id).maybeSingle() : Promise.resolve({ data: null })
      ])

      setMenage(mRes.data)
      setMaison(maisRes.data)
      setPaiements(paysRes.data ?? [])
      setAgence(agRes.data)

      if (loc.date_entree) {
        setMoisList(buildMoisList(loc.date_entree))
      }
    } catch (err) {
      console.error('Erreur chargement dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.telephone])

  useEffect(() => { load() }, [load])

  const handlePrint = (paiement) => {
    setSelectedPaiement(paiement)
    setTimeout(() => {
      window.print()
    }, 500)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
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
  const paieCourant  = paiements.find(p => p.mois === moisCourant.mois && p.annee === moisCourant.annee && p.statut === 'payé')
  const estPaye      = !!paieCourant
  const moisNonPayes = moisList.filter(({ mois, annee }) => 
    !paiements.find(p => p.mois === mois && p.annee === annee && p.statut === 'payé')
  ).length

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-slate-50 relative">
      
      {/* ── Header ── */}
      <div className="bg-emerald-700 px-5 pt-10 pb-12 print:hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium opacity-80">Espace Locataire</p>
            <h1 className="text-white text-2xl font-bold mt-0.5 leading-tight">
              {profile.nom ?? locataire.nom ?? 'Mon compte'}
            </h1>
          </div>
          <button onClick={signOut}
            className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white active:bg-white/30 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4 max-w-lg mx-auto print:hidden">

        {/* ── État du loyer ── */}
        <div className={`rounded-3xl p-5 shadow-xl border-2 ${estPaye ? 'bg-white border-emerald-100' : 'bg-white border-orange-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${estPaye ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {estPaye ? 'Loyer à jour' : 'Loyer en attente'}
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase">
              {format(now, 'MMMM yyyy', { locale: fr })}
            </p>
          </div>
          
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl font-black text-slate-900">{loyer.toLocaleString('fr-FR')}</span>
            <span className="text-lg font-bold text-slate-400">F CFA</span>
          </div>

          {!estPaye && agence?.fedapay_public_key ? (
            <PayButton
              locataire={locataire}
              menage={menage}
              mois={moisCourant.mois}
              annee={moisCourant.annee}
              montant={loyer}
              publicKey={agence.fedapay_public_key}
              profile={profile}
              onSuccess={load}
            />
          ) : !estPaye && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500 text-center italic">
                Paiement Mobile Money indisponible pour le moment.
              </p>
            </div>
          )}

          {estPaye && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-emerald-900 font-bold">Paiement validé</p>
                <p className="text-emerald-700 text-xs opacity-80">Merci pour votre ponctualité !</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Infos Logement ── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Détails du logement</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building2 size={24} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 truncate">Appartement {menage?.numero ?? '—'}</p>
              <p className="text-sm text-slate-500 truncate">{maison?.nom ?? '—'} · {maison?.quartier}</p>
            </div>
          </div>
          
          {(menage?.compteur_elec || menage?.compteur_eau) && (
            <div className="mt-5 pt-5 border-t border-slate-50 grid grid-cols-2 gap-4">
              {menage.compteur_elec && (
                <div className="flex items-center gap-2">
                  <Gauge size={14} className="text-amber-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">SBEE</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{menage.compteur_elec} kWh</p>
                  </div>
                </div>
              )}
              {menage.compteur_eau && (
                <div className="flex items-center gap-2">
                  <Gauge size={14} className="text-blue-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">SONEB</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{menage.compteur_eau} m³</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Historique ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Historique des paiements</p>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {moisList.length} mois
            </span>
          </div>
          
          <div className="space-y-2">
            {[...moisList].reverse().map(({ mois, annee, date }) => {
              const p = paiements.find(x => x.mois === mois && x.annee === annee)
              const isOk = p?.statut === 'payé'
              
              return (
                <div key={`${annee}-${mois}`}
                  className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 transition-all active:scale-[0.98]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOk ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'}`}>
                    {isOk ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 capitalize leading-tight">
                      {format(date, 'MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {isOk ? `Payé le ${format(new Date(p.created_at), 'dd/MM/yyyy')}` : 'Paiement non reçu'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${isOk ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {loyer.toLocaleString('fr-FR')} F
                    </p>
                    {isOk && (
                      <button 
                        onClick={() => handlePrint(p)}
                        className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1 ml-auto mt-1 active:opacity-50">
                        <Printer size={10} /> Reçu
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Zone d'impression (cachée) ── */}
      {selectedPaiement && (
        <div className="hidden print:block p-10 bg-white min-h-screen text-slate-900" id="receipt">
          <div className="border-b-2 border-slate-100 pb-8 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-emerald-700">REÇU DE LOYER</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest mt-1">Généré par Demarcheur App</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-400 uppercase">Référence</p>
              <p className="font-black">#{selectedPaiement.id.slice(0,8).toUpperCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Locataire</p>
              <p className="text-xl font-black">{profile.nom ?? locataire.nom}</p>
              <p className="text-slate-500 font-medium">{profile.telephone ?? locataire.telephone}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Logement</p>
              <p className="text-lg font-black">Appartement {menage?.numero}</p>
              <p className="text-slate-500 font-medium">{maison?.nom}, {maison?.quartier}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 mb-12">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="pb-4 text-xs font-black text-slate-400 uppercase">Désignation</th>
                  <th className="pb-4 text-xs font-black text-slate-400 uppercase text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-6 font-bold text-lg capitalize">
                    Loyer {format(new Date(selectedPaiement.annee, selectedPaiement.mois - 1), 'MMMM yyyy', { locale: fr })}
                  </td>
                  <td className="py-6 font-black text-xl text-right">
                    {Number(selectedPaiement.montant).toLocaleString('fr-FR')} F CFA
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td className="pt-6 font-black text-2xl uppercase">Total Payé</td>
                  <td className="pt-6 font-black text-3xl text-right text-emerald-600">
                    {Number(selectedPaiement.montant).toLocaleString('fr-FR')} F CFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between items-end mt-20">
            <div className="text-xs text-slate-400 max-w-xs italic">
              Ce document fait office de preuve de paiement pour le mois indiqué. 
              Transaction confirmée via Mobile Money ({selectedPaiement.reference_fedapay}).
            </div>
            <div className="text-center">
              <div className="w-32 h-1 bg-slate-900 mb-2"></div>
              <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Cachet de l&apos;agence</p>
            </div>
          </div>
        </div>
      )}

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
            // Insertion du paiement
            const { data: paiement, error: pErr } = await supabase
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

            if (pErr) throw pErr

            // Insertion de la facture auto
            if (paiement?.id) {
              const num = `FAC-${annee}${String(mois).padStart(2,'0')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
              await supabase.from('factures').insert({
                paiement_id:    paiement.id,
                numero_facture: num,
                montant,
                locataire_nom:  profile.nom ?? locataire.nom,
                menage_nom:     menage?.numero,
                maison_nom:     'Logement', // On pourrait charger le nom de la maison ici
              })
            }
            
            onSuccess()
          } catch (err) {
            console.error('Erreur insertion paiement:', err)
            alert('Le paiement a réussi mais une erreur est survenue lors de l\'enregistrement. Contactez votre agence avec la référence : ' + tx.reference)
          } finally {
            setLoading(false)
          }
        } else {
          alert('Le paiement n\'a pas été approuvé. Statut : ' + tx?.status)
        }
      },
    }).open()
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full mt-2 py-4 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
    >
      {loading ? (
        <><RefreshCw size={18} className="animate-spin" /> Traitement…</>
      ) : (
        <><CreditCard size={18} /> Payer {montant.toLocaleString('fr-FR')} F</>
      )}
    </button>
  )
}
