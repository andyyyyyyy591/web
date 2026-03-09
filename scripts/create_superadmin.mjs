import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xolxpitvjruekwbezkwl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvbHhwaXR2anJ1ZWt3YmV6a3dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwOTM2NCwiZXhwIjoyMDg4NDg1MzY0fQ.rYCv4CHe_DDUQghCuITKbLU0sJkmbHPEEtfYIXk4nDI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createSuperAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'superadmin@gmail.com',
    password: 'password123',
    email_confirm: true,
    app_metadata: { role: 'admin' },
  });
  if (error) {
    console.error('Error creating super admin:', error);
  } else {
    console.log('Super admin created:', data.user.email);
  }
}

createSuperAdmin();
