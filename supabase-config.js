// Supabase Live Configuration
const SUPABASE_CONFIG = {
  url: "https://jehhjilmqoljxmsvnwgd.supabase.co",
  anonKey: "sb_publishable_4x2bY6PkwBmfdIW47ILf3w_L-Q0JoJQ"
};

// Initialize Supabase Client
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  if (
    SUPABASE_CONFIG.url && 
    SUPABASE_CONFIG.anonKey && 
    window.supabase
  ) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      console.log("[Supabase] Connected successfully to:", SUPABASE_CONFIG.url);
    } catch (e) {
      console.error("[Supabase] Initialization error:", e);
    }
  }
  return supabaseClient;
}
