import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { User, Phone, Pencil, Trash2, UserPlus, UserMinus, Gauge, Clock, CalendarDays, Share2, Copy, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function MenageDetail() {
  const { maisonId, menageId } = useParams()
  const navigate = useNavigate()
  const [menage,    setMenage]    = useState(null)
  const [locataire, setLocataire] = useState(null)
  const [maison,    setMaison]    = useState(null)
  const [historique, setHistorique] = useState([])
  const [confirm,   setConfirm]   = useState(false)
  const [liberConfirm, setLiberConfirm] = useState(false)
  const [dateSortie, setDateSortie] = useState(new Date().toISOString().split('T')[0])
  
  // Nouveaux states pour partager les accès
  const [shareModal, setShareModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  async function load() {
    const [{ data: m }, { data: loc }, { data: mais }, { data: hist }] = await Promise.all([
      supabase.from('menages').select('*').eq('id', menageId).single(),
      supabase.from('locataires').select('*').eq('menage_id', menageId).maybeSingle(),
      supabase.from('maisons').select('nom').eq('id', maisonId).single(),
      supabase.from('historique_occupants').select('*').eq('menage_id', menageId).order('date_sortie', { ascending: false }),
    ])
    setMenage(m); setLocataire(loc); setMaison(mais)
    setHistorique(hist ?? [])
  }

  useEffect(() => { load() }, [menageId])

  if (!menage) return <div className="flex-1 flex items-center justify-center text-slate-400">Chargement…</div>

  async function handleShareAccess() {
    if (!locataire || !locataire.profile_id) {
      alert("Ce locataire n'a pas de compte lié.")
      return
    }
    setSharing(true)
    const pwd = genPassword()
    const { error } = await supabase.rpc('reset_locataire_password', {
      p_profile_id: locataire.profile_id,
      p_password: pwd
    })
    
    setSharing(false)
    if (error) {
      alert('Erreur: ' + error.message)
      return
    }
    
    setNewPassword(pwd)
    setShareModal(true)
  }

  function shareOrCopy() {
    const lienConnexion = `${window.location.origin}/locataire-login`
    const msg = `🏠 Votre accès locataire\n\n📱 Téléphone : ${locataire.telephone}\n🔑 Mot de passe : ${newPassword}\n\n🔗 Connectez-vous ici :\n${lienConnexion}\n\n⚠️ Gardez ces informations en sécurité.`
    if (navigator.share) {
      navigator.share({ title: 'Accès locataire', text: msg }).catch(()=>{})
    } else {
      navigator.clipboard.writeText(msg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function liberer() {
    // 1. Sauvegarder dans l'historique
    if (locataire) {
      await supabase.from('historique_occupants').insert({
        menage_id:   menageId,
        maison_id:   maisonId,
        user_id:     menage.user_id,
        nom:         locataire.nom,
        telephone:   locataire.telephone,
        date_entree: locataire.date_entree,
        date_sortie: dateSortie,
      })
      await supabase.from('locataires').delete().eq('id', locataire.id)
    }
    // 2. Marquer le ménage libre
    await supabase.from('menages').update({ statut: 'libre' }).eq('id', menageId)
    setLiberConfirm(false)
    load()
  }

  async function supprimer() {
    if (locataire) await supabase.from('locataires').delete().eq('id', locataire.id)
    await supabase.from('historique_occupants').delete().eq('menage_id', menageId)
    await supabase.from('menages').delete().eq('id', menageId)
    navigate(`/maisons/${maisonId}`)
  }

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title={menage.numero}
        subtitle={maison?.nom}
        back
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate(`/maisons/${maisonId}/menages/${menageId}/edit`)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Pencil size={18} />
            </button>
            <button onClick={() => setConfirm(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500">
              <Trash2 size={18} />
            </button>
          </div>
        }
      />

      {/* Modale suppression ménage */}
      {confirm && (
        <Modal onClose={() => setConfirm(false)}>
          <p className="text-xl font-bold mb-2">Supprimer ce ménage ?</p>
          <p className="text-slate-500 mb-6 text-sm">L&apos;historique des occupants sera également supprimé.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirm(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold">Annuler</button>
            <button onClick={supprimer} className="flex-1 py-4 rounded-2xl bg-red-600 font-bold text-white">Supprimer</button>
          </div>
        </Modal>
      )}

      {/* Modale libération */}
      {liberConfirm && (
        <Modal onClose={() => setLiberConfirm(false)}>
          <p className="text-xl font-bold mb-2">Libérer ce logement ?</p>
          <p className="text-slate-500 mb-4 text-sm">
            {locataire?.nom && locataire.nom !== 'Locataire inconnu'
              ? `${locataire.nom} sera ajouté à l'historique des occupants.`
              : "Le locataire sera ajouté à l'historique des occupants."}
          </p>
          <div className="mb-5">
            <label className="block text-sm font-bold text-slate-600 mb-2">Date de sortie</label>
            <input
              type="date"
              value={dateSortie}
              onChange={e => setDateSortie(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-base outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setLiberConfirm(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold">Annuler</button>
            <button onClick={liberer} className="flex-1 py-4 rounded-2xl bg-blue-600 font-bold text-white">Confirmer</button>
          </div>
        </Modal>
      )}

      {/* Modale de partage */}
      {shareModal && (
        <Modal onClose={() => setShareModal(false)}>
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-xl">Accès générés</p>
              <p className="text-sm text-slate-500 mt-1">Partagez ces identifiants au locataire.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Téléphone</p>
            <p className="font-bold text-slate-900 mb-3">{locataire?.telephone}</p>
            
            <p className="text-xs text-slate-500 mb-1">Nouveau mot de passe</p>
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
              <p className="font-mono font-bold text-blue-600 tracking-widest">{newPassword}</p>
              <button onClick={() => {
                navigator.clipboard.writeText(newPassword)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }} className="text-slate-400">
                {copied ? <CheckCircle2 size={18} className="text-emerald-500"/> : <Copy size={18}/>}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={shareOrCopy} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2">
              <Share2 size={18} /> {navigator.share ? "Envoyer au locataire" : "Copier le message"}
            </button>
            <button onClick={() => setShareModal(false)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-xl">
              Fermer
            </button>
          </div>
        </Modal>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6 max-w-3xl mx-auto w-full space-y-4">

        {/* Statut + loyer */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-xs text-slate-400 mb-1">Statut</p><StatusBadge status={menage.statut} /></div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Loyer</p>
            <p className="text-xl font-bold text-slate-900">
              {menage.loyer ? `${Number(menage.loyer).toLocaleString('fr-FR')} F` : '—'}
            </p>
          </div>
        </div>

        {/* Locataire actuel */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Locataire actuel</p>
          {locataire ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <User size={22} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-base">
                    {locataire.nom && locataire.nom !== 'Locataire inconnu' ? locataire.nom : <span className="text-slate-400 font-normal italic">Nom non renseigné</span>}
                  </p>
                  {locataire.telephone
                    ? <p className="text-sm text-slate-400">{locataire.telephone}</p>
                    : <p className="text-sm text-slate-300 italic">Tél. non renseigné</p>
                  }
                  {locataire.date_entree && (
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <CalendarDays size={11} />
                      Entré le {format(new Date(locataire.date_entree), 'd MMMM yyyy', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  {locataire.telephone && (
                    <a href={`tel:${locataire.telephone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm">
                      <Phone size={16} /> Appeler
                    </a>
                  )}
                  <button onClick={() => setLiberConfirm(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm">
                    <UserMinus size={16} /> Libérer
                  </button>
                </div>
                {locataire.profile_id && (
                  <button onClick={handleShareAccess} disabled={sharing}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm active:opacity-70 disabled:opacity-50">
                    <Share2 size={16} /> {sharing ? "Génération..." : "Réinitialiser et partager les accès"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate(`/maisons/${maisonId}/menages/${menageId}/locataire`)}
              className="w-full flex items-center justify-center gap-2 py-5 bg-blue-600 text-white rounded-2xl font-bold text-base"
            >
              <UserPlus size={20} /> Assigner un locataire
            </button>
          )}
        </div>

        {/* Compteurs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Gauge size={13} /> Compteurs
          </p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">⚡ SBEE (électricité)</span>
              <span className="font-bold text-slate-900">
                {menage.compteur_elec != null ? `${menage.compteur_elec} kWh` : <span className="text-slate-300 font-normal">—</span>}
              </span>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">💧 SONEB (eau)</span>
              <span className="font-bold text-slate-900">
                {menage.compteur_eau != null ? `${menage.compteur_eau} m³` : <span className="text-slate-300 font-normal">—</span>}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/maisons/${maisonId}/menages/${menageId}/edit`)}
            className="w-full mt-3 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm"
          >
            Mettre à jour les compteurs
          </button>
        </div>

        {menage.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-600 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{menage.notes}</p>
          </div>
        )}

        {/* Historique des passages */}
        {historique.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock size={13} /> Historique des occupants ({historique.length})
            </p>
            <div className="space-y-2">
              {historique.map(h => (
                <div key={h.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={16} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">
                        {h.nom && h.nom !== 'Locataire inconnu' ? h.nom : <span className="text-slate-400 italic font-normal">Nom inconnu</span>}
                      </p>
                      {h.telephone && <p className="text-xs text-slate-400">{h.telephone}</p>}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {h.date_entree && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <CalendarDays size={10} />
                            Entrée : {format(new Date(h.date_entree), 'd MMM yyyy', { locale: fr })}
                          </p>
                        )}
                        {h.date_sortie && (
                          <p className="text-[11px] text-orange-500 flex items-center gap-1">
                            <CalendarDays size={10} />
                            Sortie : {format(new Date(h.date_sortie), 'd MMM yyyy', { locale: fr })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-sm p-6 mx-4" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
