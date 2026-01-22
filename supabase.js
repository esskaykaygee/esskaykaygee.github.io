import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://vjphchkilwszuougxldc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcGhjaGtpbHdzenVvdWd4bGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDMxNTUsImV4cCI6MjA4NDYxOTE1NX0.RdpL5UUsTdkKl7poH6e8aQ_eSdHVqfy9nLzJNWd0Lww";

export const supabase = createClient(supabaseUrl, supabaseKey);
