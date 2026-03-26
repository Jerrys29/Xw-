import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// Hook générique pour fetch une table
export function useQuery(table, options = {}) {
  const { filter, eq, order = 'created_at', deps = [] } = options
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from(table).select('*').order(order, { ascending: false })
    if (eq) Object.entries(eq).forEach(([col, val]) => { q = q.eq(col, val) })
    const { data: rows } = await q
    setData(rows ?? [])
    setLoading(false)
  }, [table, JSON.stringify(eq)])

  useEffect(() => { fetch() }, [fetch, ...deps])

  return { data, loading, refetch: fetch }
}

// Hook pour un seul enregistrement
export function useRecord(table, id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase.from(table).select('*').eq('id', id).single()
      .then(({ data: row }) => { setData(row); setLoading(false) })
  }, [table, id])

  return { data, loading }
}
