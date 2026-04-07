-- ============================================
-- MIGRATION v3 — Auto-activation des comptes agence
-- Exécuter dans Supabase : Dashboard > SQL Editor > New query > Run
-- ============================================

-- Met à jour le trigger pour que les nouveaux comptes soient actifs immédiatement
-- avec le rôle 'agence' (self-registration depuis /register)
-- Les locataires sont créés via RPC et gèrent leur propre rôle

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, telephone, email, statut, role, cgu_acceptees)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'nom',
    new.raw_user_meta_data->>'telephone',
    new.email,
    'actif',    -- actif immédiatement, pas besoin d'activation admin
    'agence',   -- rôle agence par défaut pour les auto-inscriptions
    COALESCE((new.raw_user_meta_data->>'cgu_acceptees')::boolean, false)
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Active également tous les comptes en_attente existants (si tu en as)
-- Décommenter si nécessaire :
-- UPDATE profiles SET statut = 'actif', role = 'agence'
-- WHERE statut = 'en_attente' AND role IN ('user', 'agence');
