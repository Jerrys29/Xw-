import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
// @ts-ignore
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { title, body, url, user_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    webpush.setVapidDetails(
      `mailto:${Deno.env.get('ADMIN_EMAIL') ?? 'admin@xwe.app'}`,
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    // Si user_id fourni → push vers cet utilisateur précis
    // Sinon → push vers tous les admins
    let query = supabase.from('push_subscriptions').select('subscription')
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: subs, error } = await query

    if (error || !subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const payload = JSON.stringify({ title, body, url: url ?? '/admin' })

    const results = await Promise.allSettled(
      subs.map(({ subscription }) =>
        webpush.sendNotification(JSON.parse(subscription), payload)
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
