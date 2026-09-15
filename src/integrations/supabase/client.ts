// Supabase client for Acodes.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const DEFAULT_SUPABASE_URL = 'https://vudmpeluukvraqozkwxr.supabase.co';

// Legacy anon keys are still supported for browser clients and are more
// compatible with older Supabase auth gateways/proxies than sb_publishable_.
// VITE_SUPABASE_ANON_KEY should be set in Vercel. The publishable key remains
// a fallback for environments that have not been updated yet.
function createSupabaseClient() {
  const SUPABASE_URL =
    import.meta.env['VITE_SUPABASE_URL'] ||
    process.env['SUPABASE_URL'] ||
    DEFAULT_SUPABASE_URL;

  const SUPABASE_KEY =
    import.meta.env['VITE_SUPABASE_ANON_KEY'] ||
    process.env['SUPABASE_ANON_KEY'] ||
    import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
    process.env['SUPABASE_PUBLISHABLE_KEY'];

  if (!SUPABASE_KEY) {
    throw new Error('Missing Supabase API key. Add VITE_SUPABASE_ANON_KEY in Vercel.');
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
