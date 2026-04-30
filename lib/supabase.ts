import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Strip any non-printable-ASCII characters that would cause Headers.set() to throw.
// This guards against invisible Unicode chars (zero-width spaces, BOMs, etc.)
// that can sneak in when env vars are copy-pasted.
const clean = (s: string | undefined): string =>
  (s ?? '').replace(/[^\x20-\x7E]/g, '').trim();

const url = clean(import.meta.env.VITE_SUPABASE_URL);
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;
