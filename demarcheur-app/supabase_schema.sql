-- ============================================
-- SCHEMA — Gestion immobilière
-- Dashboard > SQL Editor > New query > Run
-- ============================================

-- 0. PROFILS UTILISATEURS (activation admin)
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom          text,
  telephone    text,
  email        text,
  statut       text DEFAULT 'en_attente' CHECK (statut IN ('en_attente','actif','suspendu')),
  role         text DEFAULT 'user' CHECK (role IN ('user','admin')),
  cgu_acceptees boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Chaque user voit son profil ; l'admin voit tout
DROP POLICY IF EXISTS "profile_self"  ON profiles;
DROP POLICY IF EXISTS "profile_admin" ON profiles;
CREATE POLICY "profile_self"  ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profile_admin" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Trigger : créer le profil automatiquement à l'inscription
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
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Pour te donner le rôle admin : remplace TON_EMAIL par ton email
-- UPDATE profiles SET role = 'admin', statut = 'actif' WHERE email = 'TON_EMAIL@gmail.com';

-- 1. PROPRIÉTAIRES
CREATE TABLE IF NOT EXISTS proprietaires (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nom           text NOT NULL,
  telephone     text NOT NULL,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE proprietaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proprio_user" ON proprietaires;
CREATE POLICY "proprio_user" ON proprietaires FOR ALL USING (auth.uid() = user_id);

-- 2. MAISONS
CREATE TABLE IF NOT EXISTS maisons (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  proprietaire_id  uuid REFERENCES proprietaires(id) ON DELETE SET NULL,
  nom              text NOT NULL,
  ville            text DEFAULT 'Cotonou',
  quartier         text NOT NULL,
  latitude         double precision,
  longitude        double precision,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE maisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maison_user" ON maisons;
CREATE POLICY "maison_user" ON maisons FOR ALL USING (auth.uid() = user_id);

-- 3. MÉNAGES / CHAMBRES
CREATE TABLE IF NOT EXISTS menages (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  maison_id      uuid REFERENCES maisons(id) ON DELETE CASCADE,
  numero         text NOT NULL,
  type           text DEFAULT 'Chambre',
  statut         text DEFAULT 'libre' CHECK (statut IN ('libre', 'occupé')),
  loyer          numeric,
  compteur_elec  numeric,
  compteur_eau   numeric,
  notes          text,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE menages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menage_user" ON menages;
CREATE POLICY "menage_user" ON menages FOR ALL USING (auth.uid() = user_id);

-- 4. LOCATAIRES (occupants actuels)
CREATE TABLE IF NOT EXISTS locataires (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  menage_id    uuid REFERENCES menages(id) ON DELETE CASCADE,
  maison_id    uuid REFERENCES maisons(id) ON DELETE SET NULL,
  nom          text DEFAULT 'Locataire inconnu',
  telephone    text DEFAULT '',
  date_entree  date,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE locataires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "locataire_user" ON locataires;
CREATE POLICY "locataire_user" ON locataires FOR ALL USING (auth.uid() = user_id);

-- 5. HISTORIQUE DES OCCUPANTS
CREATE TABLE IF NOT EXISTS historique_occupants (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  menage_id    uuid REFERENCES menages(id) ON DELETE CASCADE,
  maison_id    uuid REFERENCES maisons(id) ON DELETE SET NULL,
  nom          text DEFAULT '',
  telephone    text DEFAULT '',
  date_entree  date,
  date_sortie  date,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE historique_occupants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "historique_user" ON historique_occupants;
CREATE POLICY "historique_user" ON historique_occupants FOR ALL USING (auth.uid() = user_id);
