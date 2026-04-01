-- ============================================
-- MIGRATION v2 — Rôles agence/locataire + Paiements + Commissions
-- Exécuter dans Supabase : Dashboard > SQL Editor > New query > Run
-- ============================================

-- 1. MISE À JOUR TABLE PROFILES
-- Nouvelles colonnes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS momo_numero       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kkiapay_public_key text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commission_taux   numeric DEFAULT 10;

-- Étendre la contrainte CHECK sur le rôle (ajoute agence et locataire)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user','admin','agence','locataire'));

-- Mettre à jour le trigger pour qu'il supporte ON CONFLICT
-- (nécessaire car la fonction RPC crée d'abord le profil elle-même)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, telephone, email, statut, cgu_acceptees)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'nom',
    new.raw_user_meta_data->>'telephone',
    new.email,
    'en_attente',
    COALESCE((new.raw_user_meta_data->>'cgu_acceptees')::boolean, false)
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique : un locataire peut voir le profil de son agence (pour clé KKiapay / Momo)
DROP POLICY IF EXISTS "profile_agence_locataire" ON profiles;
CREATE POLICY "profile_agence_locataire" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM locataires l
    WHERE l.profile_id = auth.uid() AND l.user_id = profiles.id
  )
);

-- 2. MISE À JOUR TABLE LOCATAIRES
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE locataires ADD COLUMN IF NOT EXISTS loyer      numeric;

-- Politique : le locataire peut voir son propre enregistrement
DROP POLICY IF EXISTS "locataire_self" ON locataires;
CREATE POLICY "locataire_self" ON locataires FOR SELECT USING (profile_id = auth.uid());

-- 3. TABLE PAIEMENTS
CREATE TABLE IF NOT EXISTS paiements (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  locataire_id   uuid REFERENCES locataires(id) ON DELETE CASCADE,
  menage_id      uuid REFERENCES menages(id)    ON DELETE CASCADE,
  agence_id      uuid REFERENCES profiles(id)   ON DELETE CASCADE,
  mois           text    NOT NULL,  -- format "2025-01"
  montant        numeric NOT NULL,
  statut         text DEFAULT 'en_attente' CHECK (statut IN ('en_attente','payé','échoué')),
  reference_momo text,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "paiement_agence" ON paiements;
CREATE POLICY "paiement_agence" ON paiements FOR ALL
  USING (auth.uid() = agence_id);

DROP POLICY IF EXISTS "paiement_locataire_select" ON paiements;
CREATE POLICY "paiement_locataire_select" ON paiements FOR SELECT USING (
  EXISTS (SELECT 1 FROM locataires l WHERE l.id = paiements.locataire_id AND l.profile_id = auth.uid())
);

DROP POLICY IF EXISTS "paiement_locataire_insert" ON paiements;
CREATE POLICY "paiement_locataire_insert" ON paiements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM locataires l WHERE l.id = locataire_id AND l.profile_id = auth.uid())
);

DROP POLICY IF EXISTS "paiement_locataire_update" ON paiements;
CREATE POLICY "paiement_locataire_update" ON paiements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM locataires l WHERE l.id = paiements.locataire_id AND l.profile_id = auth.uid())
);

-- 4. TABLE FACTURES
CREATE TABLE IF NOT EXISTS factures (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paiement_id    uuid REFERENCES paiements(id) ON DELETE CASCADE,
  numero_facture text UNIQUE NOT NULL,
  date_facture   timestamptz DEFAULT now(),
  montant        numeric NOT NULL,
  locataire_nom  text,
  menage_nom     text,
  maison_nom     text,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facture_agence" ON factures;
CREATE POLICY "facture_agence" ON factures FOR ALL USING (
  EXISTS (SELECT 1 FROM paiements p WHERE p.id = factures.paiement_id AND p.agence_id = auth.uid())
);

DROP POLICY IF EXISTS "facture_locataire" ON factures;
CREATE POLICY "facture_locataire" ON factures FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM paiements p
    JOIN locataires l ON l.id = p.locataire_id
    WHERE p.id = factures.paiement_id AND l.profile_id = auth.uid()
  )
);

-- 5. FONCTION RPC : créer un compte locataire (contourne email confirmation)
CREATE OR REPLACE FUNCTION public.create_locataire_account(
  p_phone    text,
  p_password text,
  p_nom      text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
BEGIN
  v_email := 'loc.' || regexp_replace(p_phone, '[^0-9]', '', 'g') || '@demarcheur.app';

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('nom', p_nom, 'telephone', p_phone)::jsonb,
    NOW(), NOW(),
    '', '', '', ''
  ) RETURNING id INTO v_user_id;

  -- Le trigger handle_new_user crée le profil (ON CONFLICT DO NOTHING)
  -- On met à jour pour définir le rôle locataire et activer le compte
  UPDATE public.profiles
  SET nom = p_nom, telephone = p_phone,
      statut = 'actif', role = 'locataire', cgu_acceptees = true
  WHERE id = v_user_id;

  RETURN v_user_id;

EXCEPTION
  WHEN unique_violation THEN
    -- Compte déjà existant pour ce numéro → retourner l'ID existant
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_locataire_account(text, text, text) TO authenticated;
