import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget audit log using the existing log_audit SECURITY DEFINER function.
 */
export async function logAction(
  action: string,
  tableName: string,
  recordId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.rpc('log_audit', {
      p_action: action,
      p_table_name: tableName,
      p_record_id: recordId ?? undefined,
      p_new_data: details ? (details as never) : undefined,
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to log action:', err);
  }
}

/** React hook wrapper */
export function useAuditLogger() {
  return { logAction };
}
