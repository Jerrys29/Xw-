import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { Clock, LogOut, Phone } from 'lucide-react'

export default function ComptePending({ statut }) {
  const signOut  = useAuthStore(s => s.signOut)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const isSuspended = statut === 'suspendu'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isSuspended ? 'bg-red-100' : 'bg-amber-100'}`}>
          {isSuspended
            ? <span className="text-4xl">🚫</span>
            : <Clock size={36} className="text-amber-500" />
          }
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-3">
          {isSuspended ? 'Compte suspendu' : 'Compte en attente d\'activation'}
        </h1>

        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {isSuspended
            ? 'Votre compte a été suspendu. Contactez-nous pour plus d\'informations.'
            : 'Votre inscription a bien été reçue. Votre compte sera activé sous peu après vérification. Contactez-nous si vous n\'avez pas de réponse dans les 24h.'
          }
        </p>

        <a
          href="https://wa.me/22900000000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-base mb-3"
        >
          <Phone size={18} /> Contacter sur WhatsApp
        </a>

        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-semibold text-sm"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  )
}
