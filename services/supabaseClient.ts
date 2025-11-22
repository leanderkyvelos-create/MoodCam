import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zsutdgroxwrlbuevitqm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXRkZ3JveHdybGJ1ZXZpdHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTYxNzgsImV4cCI6MjA3OTMzMjE3OH0.U5w0EnjgfwXWmT1VZRzOpoAI-j5gAnl4PJUcs00KDg4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);