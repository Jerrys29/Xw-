-- ════════════════════════════════════════════════════════
--  MIGRATION : Paiements locataires + FedaPay
--  À exécuter dans Supabase > SQL Editor
-- ════════════════════════════════════════════════════════

-- ── 1. Colonnes supplémentaires sur profiles ──────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fedapay_public_key TEXT,
  ADD COLUMN IF NOT EXISTS commission_taux    DECIMAL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS momo_numero        TEXT;

-- ── 2. Colonnes supplémentaires sur locataires ────────────
ALTER TABLE locataires
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ── 3. Table paiements ────────────────────────────────────
CREATE TABLE IF NOT EXISTS paiements (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  locataire_id      UUID        REFERENCES locataires(id) ON DELETE CASCADE,
  menage_id         UUID        REFERENCES menages(id)    ON DELETE SET NULL,
  agence_id         UUID        REFERENCES profiles(id)   ON DELETE SET NULL,
  mois              INT         NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee             INT         NOT NULL CHECK (annee >= 2020),
  montant           DECIMAL     NOT NULL,
  statut            TEXT        NOT NULL DEFAULT 'payé',
  reference_fedapay TEXT,
  transaction_id    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (locataire_id, mois, annee)
);

-- ── 4. Table factures ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS factures (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  paiement_id     UUID        REFERENCES paiements(id) ON DELETE CASCADE,
  numero_facture  TEXT        NOT NULL UNIQUE,
  date            DATE        NOT NULL,
  montant         DECIMAL     NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. RLS — paiements ────────────────────────────────────
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

-- L'agence voit tous ses paiements
CREATE POLICY "agence_paiements_all" ON paiements
  FOR ALL
  USING  (agence_id = auth.uid())
  WITH CHECK (agence_id = auth.uid());

-- Le locataire voit ses propres paiements
CREATE POLICY "locataire_paiements_select" ON paiements
  FOR SELECT
  USING (
    locataire_id IN (
      SELECT id FROM locataires WHERE profile_id = auth.uid()
    )
  );

-- Le locataire peut insérer un paiement pour lui-même
CREATE POLICY "locataire_paiements_insert" ON paiements
  FOR INSERT
  WITH CHECK (
    locataire_id IN (
      SELECT id FROM locataires WHERE profile_id = auth.uid()
    )
  );

-- ── 6. RLS — factures ─────────────────────────────────────
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agence_factures_select" ON factures
  FOR SELECT
  USING (
    paiement_id IN (
      SELECT id FROM paiements WHERE agence_id = auth.uid()
    )
  );

CREATE POLICY "locataire_factures_select" ON factures
  FOR SELECT
  USING (
    paiement_id IN (
      SELECT id FROM paiements
      WHERE locataire_id IN (
        SELECT id FROM locataires WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "locataire_factures_insert" ON factures
  FOR INSERT
  WITH CHECK (
    paiement_id IN (
      SELECT id FROM paiements
      WHERE locataire_id IN (
        SELECT id FROM locataires WHERE profile_id = auth.uid()
      )
    )
  );

-- ── 7. Trigger profil — s'assurer que le role/statut est bien lu ──
-- Si tu n'as pas encore de trigger handle_new_user, ajoute celui-ci :

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, nom, telephone, role, statut)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom',       ''),
    COALESCE(NEW.raw_user_meta_data->>'telephone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role',      'agence'),
    COALESCE(NEW.raw_user_meta_data->>'statut',    'en_attente')
  )
  ON CONFLICT (id) DO UPDATE SET
    nom       = EXCLUDED.nom,
    telephone = EXCLUDED.telephone,
    role      = EXCLUDED.role,
    statut    = EXCLUDED.statut;
  RETURN NEW;
END;
$$;

-- Attache le trigger si pas encore fait
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END;
$$;
