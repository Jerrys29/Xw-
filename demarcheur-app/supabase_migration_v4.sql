-- ============================================
-- MIGRATION v4 — pgcrypto + RPC locataire + fix factures
-- Exécuter dans Supabase : Dashboard > SQL Editor > New query > Run
-- ============================================

-- ── 1. Activer pgcrypto (requis pour gen_salt / crypt) ────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 2. Normaliser la table factures ──────────────────────
-- Ajouter les colonnes v2 si elles n'existent pas
ALTER TABLE factures ADD COLUMN IF NOT EXISTS locataire_nom text;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS menage_nom    text;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS maison_nom    text;

-- Rendre la colonne "date" optionnelle si elle existe (schéma v1)
ALTER TABLE factures ALTER COLUMN date DROP NOT NULL;

-- ── 3. Recréer la RPC create_locataire_account ───────────
DROP FUNCTION IF EXISTS public.create_locataire_account(text, text, text);

CREATE OR REPLACE FUNCTION public.create_locataire_account(
  p_phone    text,
  p_password text,
  p_nom      text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

  -- Le trigger handle_new_user crée le profil automatiquement.
  -- On met à jour le rôle et statut.
  UPDATE public.profiles
  SET nom          = p_nom,
      telephone    = p_phone,
      statut       = 'actif',
      role         = 'locataire',
      cgu_acceptees = true
  WHERE id = v_user_id;

  RETURN v_user_id;

EXCEPTION
  WHEN unique_violation THEN
    -- Compte déjà existant → retourner l'id existant
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_locataire_account(text, text, text) TO authenticated;

-- ── 4. S'assurer que la contrainte UNIQUE sur paiements existe ──
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_locataire_id_mois_annee_key;
ALTER TABLE paiements ADD CONSTRAINT paiements_locataire_id_mois_annee_key
  UNIQUE (locataire_id, mois, annee);
