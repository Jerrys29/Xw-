import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import MapPicker from '../components/MapPicker'
import MapPreview from '../components/MapPreview'
import { Plus, MapPin, Share2, Pencil, Trash2, Home, User, Gauge, ChevronRight, Navigation, Edit3 } from 'lucide-react'

export default function MaisonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [maison, setMaison] = useState(null)
  const [menages, setMenages] = useState([])
  const [proprio, setProprio] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function load() {
    const [{ data: m }, { data: men }] = await Promise.all([
      supabase.from('maisons').select('*').eq('id', id).single(),
      supabase.from('menages').select('*').eq('maison_id', id).order('numero'),
    ])
    setMaison(m)
    setMenages(men ?? [])
    if (m?.proprietaire_id) {
      const { data: p } = await supabase.from('proprietaires').select('*').eq('id', m.proprietaire_id).single()
      setProprio(p)
    }
  }

  useEffect(() => { load() }, [id])

  if (!maison) return <div className="flex-1 flex items-center justify-center text-slate-400">Chargement…</div>

  const libres  = menages.filter(m => m.statut === 'libre').length
  const occupes = menages.filter(m => m.statut === 'occupé').length

  async function saveGPS(lat, lng) {
    await supabase.from('maisons').update({ latitude: lat, longitude: lng }).eq('id', id)
    setMaison(m => ({ ...m, latitude: lat, longitude: lng }))
    setShowMap(false)
  }

  function partagerWhatsApp() {
    const mapsUrl = `https://maps.google.com/?q=${maison.latitude},${maison.longitude}`
    const txt = `📍 *${maison.nom}*\n${maison.quartier}, ${maison.ville}\n\n${libres} chambre${libres > 1 ? 's' : ''} disponible${libres > 1 ? 's' : ''}\n\nVoir sur Google Maps : ${mapsUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank')
  }

  async function supprimer() {
    await supabase.from('maisons').delete().eq('id', id)
    navigate('/maisons')
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Carte plein écran */}
      {showMap && (
        <MapPicker
          initial={maison.latitude ? [maison.latitude, maison.longitude] : null}
          onConfirm={saveGPS}
          onClose={() => setShowMap(false)}
        />
      )}

      <PageHeader
        title={maison.nom}
        subtitle={`${maison.quartier} · ${maison.ville}`}
        back
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate(`/maisons/${id}/edit`)}
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

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={() => setConfirm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-sm p-6 mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-xl font-bold text-slate-900 mb-2">Supprimer cette maison ?</p>
            <p className="text-slate-500 mb-6">Tous les ménages et locataires associés seront supprimés.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-700">Annuler</button>
              <button onClick={supprimer} className="flex-1 py-4 rounded-2xl bg-red-600 font-bold text-white">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6 max-w-3xl mx-auto w-full space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{libres}</p>
            <p className="text-sm font-semibold text-blue-500">Libre{libres !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{occupes}</p>
            <p className="text-sm font-semibold text-emerald-500">Occupé{occupes !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Propriétaire */}
        {proprio && (
          <button onClick={() => navigate(`/proprietaires/${proprio.id}`)}
            className="w-full text-left bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <User size={18} className="text-violet-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400">Propriétaire</p>
              <p className="font-bold text-slate-900 text-sm">{proprio.nom}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        )}

        {/* Section GPS / Carte */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={13} /> Localisation
            </p>
            {maison.latitude && (
              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                ✓ GPS enregistré
              </span>
            )}
          </div>

          {/* Mini carte si position enregistrée */}
          {maison.latitude && (
            <div className="px-4 pb-3">
              <MapPreview lat={maison.latitude} lng={maison.longitude} height="180px" />
            </div>
          )}

          <div className={`px-4 pb-4 flex gap-2 ${!maison.latitude ? 'flex-col' : ''}`}>
            {!maison.latitude ? (
              <>
                <p className="text-sm text-slate-500 mb-3 text-center">
                  Allez sur place et enregistrez la position exacte de la maison sur la carte
                </p>
                <button
                  onClick={() => setShowMap(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold text-base"
                >
                  <Navigation size={20} /> Ouvrir la carte et localiser
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowMap(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm">
                  <Edit3 size={16} /> Modifier
                </button>
                <button onClick={partagerWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold text-sm">
                  <Share2 size={16} /> Partager WhatsApp
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ménages */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ménages / Chambres ({menages.length})
            </p>
            <button onClick={() => navigate(`/maisons/${id}/menages/nouveau`)}
              className="flex items-center gap-1 text-blue-600 text-sm font-bold">
              <Plus size={16} /> Ajouter
            </button>
          </div>

          {menages.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
              <Home size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500 font-medium">Aucun ménage</p>
              <p className="text-xs text-slate-400 mt-1">Ajoutez les chambres ou appartements de cette maison</p>
            </div>
          )}

          <div className="space-y-2">
            {menages.map(m => <MenageRow key={m.id} menage={m} onClick={() => navigate(`/maisons/${id}/menages/${m.id}`)} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function MenageRow({ menage, onClick }) {
  const [locataire, setLocataire] = useState(null)
  useEffect(() => {
    if (menage.statut === 'occupé') {
      supabase.from('locataires').select('nom').eq('menage_id', menage.id).maybeSingle()
        .then(({ data }) => setLocataire(data))
    }
  }, [menage])

  return (
    <button onClick={onClick}
      className="w-full text-left bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100 active:bg-slate-50 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${menage.statut === 'libre' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
        <Home size={20} className={menage.statut === 'libre' ? 'text-blue-400' : 'text-emerald-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-900 text-sm">{menage.numero}</p>
          <StatusBadge status={menage.statut} />
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {locataire ? locataire.nom : `${menage.type} · ${menage.loyer ? Number(menage.loyer).toLocaleString('fr-FR') + ' F/mois' : 'Prix N/A'}`}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {(menage.compteur_elec || menage.compteur_eau) && <Gauge size={15} className="text-slate-300" />}
        <ChevronRight size={18} className="text-slate-300" />
      </div>
    </button>
  )
}
