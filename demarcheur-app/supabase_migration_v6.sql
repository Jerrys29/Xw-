-- ============================================
-- MIGRATION v6 — Accès en lecture aux maisons et ménages pour les locataires
-- Exécuter dans Supabase : Dashboard > SQL Editor > New query > Run
-- ============================================

-- Permettre au locataire de lire les infos de la maison où il réside
DROP POLICY IF EXISTS "maison_locataire_select" ON maisons;
CREATE POLICY "maison_locataire_select" ON maisons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM locataires l 
    WHERE l.maison_id = maisons.id AND l.profile_id = auth.uid()
  )
);

-- Permettre au locataire de lire les infos de son propre ménage
DROP POLICY IF EXISTS "menage_locataire_select" ON menages;
CREATE POLICY "menage_locataire_select" ON menages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM locataires l 
    WHERE l.menage_id = menages.id AND l.profile_id = auth.uid()
  )
);
