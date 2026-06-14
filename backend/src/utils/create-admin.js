// ============================================================
// SAMARTH PROPERTIES — Admin User Creation Script
// File: backend/src/utils/create-admin.js
// Run: node src/utils/create-admin.js
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => rl.question(prompt, resolve));
}

async function createAdmin() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   SAMARTH PROPERTIES - Admin Setup       ║');
    console.log('╚══════════════════════════════════════════╝\n');

    try {
        const username = await question('Enter admin username: ');
        const email = await question('Enter admin email: ');
        const password = await question('Enter admin password (min 8 chars): ');
        const role = await question('Enter role (superadmin/admin/config) [default: admin]: ') || 'admin';

        if (password.length < 8) {
            console.error('❌ Password must be at least 8 characters');
            process.exit(1);
        }

        if (!['superadmin', 'admin', 'config'].includes(role)) {
            console.error('❌ Invalid role. Must be superadmin, admin, or config');
            process.exit(1);
        }

        console.log('\n⏳ Creating admin user...');

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const { data, error } = await supabase
            .from('admin_users')
            .insert({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password_hash: passwordHash,
                role: role.trim()
            })
            .select('id, username, email, role, created_at')
            .single();

        if (error) {
            if (error.code === '23505') {
                console.error('❌ Username or email already exists');
            } else {
                console.error('❌ Error creating admin:', error.message);
            }
            process.exit(1);
        }

        console.log('\n✅ Admin user created successfully!');
        console.log('─────────────────────────────────');
        console.log(`ID:       ${data.id}`);
        console.log(`Username: ${data.username}`);
        console.log(`Email:    ${data.email}`);
        console.log(`Role:     ${data.role}`);
        console.log(`Created:  ${data.created_at}`);
        console.log('─────────────────────────────────');
        console.log(`\n🔐 Admin Panel: http://localhost:5000/${process.env.ADMIN_PANEL_PATH}`);
        console.log('⚠️  Keep your credentials safe!\n');

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

createAdmin();
