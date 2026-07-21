import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amltpcingepvlcprmgba.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbHRwY2luZ2VwdmxjcHJtZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDUyNDUsImV4cCI6MjA5MjAyMTI0NX0.GSDqv8YB8BZ_JmGBCg7EqIeN9_UJ5mV2U2IA0MZxAr8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);