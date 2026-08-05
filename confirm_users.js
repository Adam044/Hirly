
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function confirmAllUsers() {
    console.log('Fetching all users from Supabase Auth...');
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
        console.error('Error listing users:', error);
        return;
    }
    
    console.log(`Found ${users.length} users. Confirming unconfirmed ones...`);
    
    for (const user of users) {
        if (!user.email_confirmed_at) {
            console.log(`Confirming user: ${user.email}`);
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { email_confirm: true }
            );
            
            if (updateError) {
                console.error(`Failed to confirm ${user.email}:`, updateError.message);
            }
        }
    }
    
    console.log('All users processed.');
}

confirmAllUsers();
