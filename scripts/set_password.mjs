import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xolxpitvjruekwbezkwl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvbHhwaXR2anJ1ZWt3YmV6a3dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwOTM2NCwiZXhwIjoyMDg4NDg1MzY0fQ.rYCv4CHe_DDUQghCuITKbLU0sJkmbHPEEtfYIXk4nDI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetPasswords() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  const admins = data.users.filter(u => u.app_metadata?.role);
  
  for (const user of admins) {
    console.log(`Setting password for ${user.email} (Role: ${user.app_metadata?.role})`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'password123'
    });
    if (updateError) {
      console.error(`Failed to update ${user.email}:`, updateError);
    } else {
      console.log(`Success for ${user.email}`);
    }
  }
}

resetPasswords();
