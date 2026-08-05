
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

async function runTest() {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`Creating test user: ${testEmail}`);
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
    });
    
    if (createError) {
        console.error('Create User Error:', createError.message);
        return;
    }
    
    console.log('User created successfully. ID:', createData.user.id);
    
    console.log('Attempting login with signInWithPassword...');
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });
    
    if (loginError) {
        console.error('Login Error:', loginError.message);
    } else {
        console.log('Login Successful! Session returned.');
    }
    
    // Cleanup
    console.log('Cleaning up test user...');
    await supabaseAdmin.auth.admin.deleteUser(createData.user.id);
}

runTest();
