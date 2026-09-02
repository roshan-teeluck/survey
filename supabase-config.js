// Supabase project settings (Project Settings -> API).
// The anon key is safe to ship to the browser: Row Level Security on the
// table (see supabase/schema.sql) only lets it insert, never read.
window.SUPABASE_CONFIG = {
  url: "https://ouktrnsckmxbbhvjxluw.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91a3RybnNja214YmJodmp4bHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDkzNTcsImV4cCI6MjEwMzkyNTM1N30.8Lrc_s89XMbl2S8ARKyxqZyPhETGLV6Pnx6OZqaeECc",
  table: "proposal_responses",
};
