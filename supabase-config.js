// Supabase Configuration
// Replace these with your actual Supabase Project URL and Anon Public Key from Project Settings > API
const SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
};

// Initialize Supabase Client
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  // Check if real credentials have been provided
  if (
    SUPABASE_CONFIG.url && 
    SUPABASE_CONFIG.anonKey && 
    !SUPABASE_CONFIG.url.includes("YOUR_PROJECT_ID") &&
    !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE_ANON") &&
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
