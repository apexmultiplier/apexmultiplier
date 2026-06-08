import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cetwzfuzcmuigbmtokah.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldHd6ZnV6Y211aWdibXRva2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc4NzYsImV4cCI6MjA5NDE3Mzg3Nn0.HQeevcm3vxepQKjuYw_2eJdZS__huh8fytej78N1dik";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);