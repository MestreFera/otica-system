import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,       // Use localStorage to persist the session
        autoRefreshToken: true,     // Automatically refresh token before expiry
        detectSessionInUrl: true,   // Handle magic link / OAuth redirects
        storageKey: 'oticasystem-auth',  // Unique key to avoid collisions
    },
})

