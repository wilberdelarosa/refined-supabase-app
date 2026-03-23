import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const EXTERNAL_SUPABASE_URL = import.meta.env.VITE_EXTERNAL_SUPABASE_URL?.trim();
const EXTERNAL_SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY?.trim();

export const hasExternalSupabaseConfig = Boolean(
  EXTERNAL_SUPABASE_URL && EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
);

export const externalSupabase = hasExternalSupabaseConfig
  ? createClient<Database>(
      EXTERNAL_SUPABASE_URL!,
      EXTERNAL_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    )
  : null;
