/**
 * Client Supabase avec la clé service_role.
 * ⚠️  NE PAS exposer cette clé publiquement.
 * Usage limité : création de comptes locataires depuis l'agence.
 * Ajouter dans .env : VITE_SUPABASE_SERVICE_KEY=<ta clé service_role>
 */
import { createClient } from '@supabase/supabase-js'

const url        = import.meta.env.VITE_SUPABASE_URL
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

export const supabaseAdmin = serviceKey
  ? createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null
