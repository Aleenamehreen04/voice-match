import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amltpcingepvlcprmgba.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbHRwY2luZ2VwdmxjcHJtZ2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDUyNDUsImV4cCI6MjA5MjAyMTI0NX0.GSDqv8YB8BZ_JmGBCg7EqIeN9_UJ5mV2U2IA0MZxAr8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const storeAISkills = async (studentId, skills, category) => {
  const { data, error } = await supabase
    .from('students')
    .update({
      ai_skills: skills,
      ai_category: category
    })
    .eq('id', studentId);
  
  if (error) console.error('Error storing AI skills:', error);
  return data;
};