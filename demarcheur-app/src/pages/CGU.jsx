import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function CGU() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-slate-900">Conditions générales d&apos;utilisation</h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <p className="text-xs text-slate-400">Dernière mise à jour : mars 2026</p>

        <Section title="1. Objet">
          L&apos;application <strong>Gestion immobilière</strong> (ci-après « l&apos;Application ») est éditée par Xwé
          (ci-après « l&apos;Éditeur »). Elle permet aux professionnels de l&apos;immobilier de gérer des
          propriétaires, des maisons, des ménages et des locataires. L&apos;accès à l&apos;Application est
          subordonné à l&apos;acceptation des présentes conditions et à l&apos;activation préalable du compte
          par l&apos;Éditeur.
        </Section>

        <Section title="2. Accès et activation">
          L&apos;inscription crée un compte en attente. L&apos;accès effectif à l&apos;Application n&apos;est accordé
          qu&apos;après validation manuelle par l&apos;Éditeur. L&apos;Éditeur se réserve le droit de refuser
          ou de suspendre tout accès sans justification. Aucun remboursement ne sera effectué
          en cas de suspension pour violation des présentes conditions.
        </Section>

        <Section title="3. Abonnement et tarification">
          L&apos;utilisation de l&apos;Application est payante selon les tarifs en vigueur communiqués
          par l&apos;Éditeur. La première période peut faire l&apos;objet d&apos;un forfait annuel. Les périodes
          suivantes peuvent être converties en abonnement mensuel ou annuel à la discrétion
          de l&apos;Éditeur. Le non-paiement entraîne la suspension du compte.
        </Section>

        <Section title="4. Utilisation des données — Écosystème Xwé">
          <span className="font-semibold text-slate-900">4.1 Collecte.</span>{' '}Dans le cadre de
          l&apos;utilisation de l&apos;Application, l&apos;Éditeur collecte les données saisies par l&apos;utilisateur
          (propriétaires, maisons, ménages, locataires, localisations GPS, compteurs).
          Ces données sont hébergées sur des serveurs sécurisés (Supabase / infrastructure cloud).
          <br /><br />
          <span className="font-semibold text-slate-900">4.2 Finalité étendue — Plateforme Xwé.</span>{' '}
          En acceptant les présentes conditions, l&apos;utilisateur consent expressément à ce que
          les données agrégées et anonymisées issues de l&apos;Application puissent être utilisées
          par l&apos;Éditeur dans le cadre du développement de <strong>Xwé</strong>, une plateforme
          immobilière plus large destinée à mettre en relation propriétaires, démarcheurs et
          locataires. Cette utilisation est strictement limitée à des fins d&apos;amélioration du
          service, de statistiques de marché et de fonctionnalités futures bénéficiant directement
          aux utilisateurs. Aucune donnée personnellement identifiable ne sera vendue à des tiers.
          <br /><br />
          <span className="font-semibold text-slate-900">4.3 Droit de retrait.</span>{' '}
          L&apos;utilisateur peut retirer son consentement à tout moment en contactant l&apos;Éditeur,
          ce qui entraîne la suppression de ses données de la plateforme Xwé mais ne suspend
          pas son accès à l&apos;Application.
        </Section>

        <Section title="5. Propriété intellectuelle">
          L&apos;Application, son code, son design et ses contenus sont la propriété exclusive de
          l&apos;Éditeur. Toute reproduction, modification ou redistribution est interdite sans
          autorisation écrite préalable.
        </Section>

        <Section title="6. Responsabilité">
          L&apos;Éditeur ne saurait être tenu responsable des pertes de données dues à une mauvaise
          utilisation, à une interruption de connexion ou à un cas de force majeure.
          L&apos;utilisateur est seul responsable des informations qu&apos;il saisit dans l&apos;Application.
        </Section>

        <Section title="7. Droit applicable">
          Les présentes conditions sont soumises au droit de la République du Bénin.
          Tout litige sera soumis aux tribunaux compétents de Cotonou.
        </Section>

        <Section title="8. Contact">
          Pour toute question : <strong>contact@xwe.bj</strong>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-bold text-slate-900 text-base mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  )
}
