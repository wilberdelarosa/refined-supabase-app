import { externalSupabase, hasExternalSupabaseConfig } from './external-client';
import { lovableSupabase } from './lovable-client';

const FORCE_EXTERNAL_SUPABASE =
  import.meta.env.VITE_EXTERNAL_SUPABASE_ENABLED === 'true';

if (FORCE_EXTERNAL_SUPABASE && !hasExternalSupabaseConfig) {
  throw new Error(
    'VITE_EXTERNAL_SUPABASE_ENABLED=true requires VITE_EXTERNAL_SUPABASE_URL and VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY.',
  );
}

export const supabase = externalSupabase ?? lovableSupabase;
export const supabaseConfigSource = externalSupabase
  ? 'external'
  : 'lovable-cloud';

export { externalSupabase, hasExternalSupabaseConfig, lovableSupabase };
