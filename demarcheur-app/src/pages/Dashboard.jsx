import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { 
  Building2, Home, Users, RefreshCw, WifiOff, 
  TrendingUp, Wallet, Calendar, Filter, CheckCircle2, AlertCircle,
  ChevronRight, ArrowUpRight
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Dashboard() {
  const navigate = useNavigate()
  const profile  = useAuthStore(s => s.profile)
  
  // États
  const [loading, setLoading] = useState(true)
  const [houses,   setHouses]  = useState([])
  const [occupied, setOccupied] = useState([])
  const [payments, setPayments] = useState([])
  
  // Filtres
  const [selectedMonth,  setSelectedMonth]  = useState(format(new Date(), 'yyyy-MM'))
  const [selectedHouse,  setSelectedHouse]  = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const year  = parseInt(selectedMonth.split('-')[0])
      const month = parseInt(selectedMonth.split('-')[1])

      // 1. Charger les maisons et les ménages occupés
      const [housesRes, menagesRes, paymentsRes] = await Promise.all([
        supabase.from('maisons').select('id, nom, quartier'),
        supabase.from('menages').select(`
          id, numero, loyer, maison_id,
          locataires(id, nom, telephone)
        `).eq('statut', 'occupé'),
        supabase.from('paiements')
          .select('*')
          .eq('mois', month)
          .eq('annee', year)
          .eq('statut', 'payé')
      ])

      setHouses(housesRes.data ?? [])
      setOccupied(menagesRes.data ?? [])
      setPayments(paymentsRes.data ?? [])
    } catch (err) {
      console.error('Erreur dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => { load() }, [load])

  // Calculs financiers
  const stats = useMemo(() => {
    const filteredOccupied = selectedHouse === 'all' 
      ? occupied 
      : occupied.filter(m => m.maison_id === selectedHouse)

    const filteredPayments = selectedHouse === 'all'
      ? payments
      : payments.filter(p => filteredOccupied.some(m => m.id === p.menage_id))

    const totalExpected = filteredOccupied.reduce((sum, m) => sum + (Number(m.loyer) || 0), 0)
    const totalCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.montant) || 0), 0)
    
    const commissionRate = profile?.commission_taux ?? 10
    const totalCommissions = (totalCollected * commissionRate) / 100

    return {
      expected: totalExpected,
      collected: totalCollected,
      commissions: totalCommissions,
      countOccupied: filteredOccupied.length,
      countPaid: filteredPayments.length,
      unpaid: filteredOccupied.length - filteredPayments.length
    }
  }, [occupied, payments, selectedHouse, profile])

  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      return {
        label: format(d, 'MMMM yyyy', { locale: fr }),
        value: format(d, 'yyyy-MM')
      }
    })
  }, [])

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-slate-50">
      
      {/* ── Header Financier ── */}
      <div className="bg-blue-700 px-5 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Revenus Agence</p>
            <h1 className="text-white text-3xl font-black mt-1">
              {stats.commissions.toLocaleString('fr-FR')} <span className="text-lg font-bold opacity-60">F</span>
            </h1>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
            <TrendingUp className="text-white" size={24} />
          </div>
        </div>

        {/* Sélecteur de mois rapide */}
        <div className="relative z-10 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {months.map(m => (
            <button
              key={m.value}
              onClick={() => setSelectedMonth(m.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedMonth === m.value 
                ? 'bg-white text-blue-700 shadow-lg' 
                : 'bg-white/10 text-white border border-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-6 max-w-lg mx-auto relative z-20">
        
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <Wallet size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encaissé</p>
            <p className="text-lg font-black text-slate-900 mt-1">
              {stats.collected.toLocaleString('fr-FR')} F
            </p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <Calendar size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendu</p>
            <p className="text-lg font-black text-slate-900 mt-1">
              {stats.expected.toLocaleString('fr-FR')} F
            </p>
          </div>
        </div>

        {/* ── Filtre Maison ── */}
        <div className="bg-white rounded-3xl p-2 flex items-center shadow-sm border border-slate-100">
          <div className="pl-4 text-slate-400">
            <Filter size={16} />
          </div>
          <select 
            value={selectedHouse}
            onChange={e => setSelectedHouse(e.target.value)}
            className="flex-1 bg-transparent py-3 px-3 text-sm font-bold text-slate-700 outline-none appearance-none"
          >
            <option value="all">Toutes les maisons</option>
            {houses.map(h => (
              <option key={h.id} value={h.id}>{h.nom} ({h.quartier})</option>
            ))}
          </select>
        </div>

        {/* ── Suivi des Loyers ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">État des recouvrements</p>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {stats.countPaid} Payés
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {stats.unpaid} Retards
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {occupied
              .filter(m => selectedHouse === 'all' || m.maison_id === selectedHouse)
              .map(m => {
                const isPaid = payments.some(p => p.menage_id === m.id)
                const locataire = m.locataires?.[0]
                
                return (
                  <div key={m.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPaid ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'}`}>
                      {isPaid ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {locataire?.nom ?? 'Sans nom'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Logement {m.numero} · {Number(m.loyer).toLocaleString('fr-FR')} F
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {isPaid ? 'Payé' : 'Retard'}
                      </span>
                    </div>
                  </div>
                )
              })}
            
            {occupied.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400">Aucun ménage occupé pour le moment</p>
                <button 
                  onClick={() => navigate('/maisons')}
                  className="mt-3 text-blue-600 font-black text-xs uppercase tracking-widest"
                >
                  Gérer mon patrimoine →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Actions Rapides ── */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={() => navigate('/proprietaires/nouveau')} 
            className="flex flex-col items-center gap-2 bg-blue-50 text-blue-700 p-5 rounded-3xl border border-blue-100 active:scale-95 transition-all">
            <Users size={24} />
            <span className="text-[11px] font-black uppercase tracking-wider">Propriétaire</span>
          </button>
          <button onClick={() => navigate('/maisons/nouveau')} 
            className="flex flex-col items-center gap-2 bg-violet-50 text-violet-700 p-5 rounded-3xl border border-violet-100 active:scale-95 transition-all">
            <Building2 size={24} />
            <span className="text-[11px] font-black uppercase tracking-wider">Maison</span>
          </button>
        </div>

      </div>
    </div>
  )
}
