-- ============================================
-- MIGRATION v5 — Réinitialisation du mot de passe locataire
-- Exécuter dans Supabase : Dashboard > SQL Editor > New query > Run
-- ============================================

CREATE OR REPLACE FUNCTION public.reset_locataire_password(
  p_profile_id uuid,
  p_password text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Met à jour le mot de passe dans la table auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(p_password, gen_salt('bf'))
  WHERE id = p_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_locataire_password(uuid, text) TO authenticated;
