import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

/**
 * Singleton Supabase client instance
 * 
 * This ensures only one GoTrueClient instance exists in the browser context,
 * preventing the "Multiple GoTrueClient instances detected" warning.
 * 
 * Always import this client instead of creating new instances:
 * import { supabase } from '../utils/supabase/client';
 */
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
