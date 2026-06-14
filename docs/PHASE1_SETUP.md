# PHASE 1 — Database & Backend Setup Guide
# Samarth Properties v2.0

---

## STEP 1 — Create Supabase Project

1. Go to **https://supabase.com** → Sign up
2. Click **"New Project"**
3. Fill in:
   - **Organization**: "Samarth Properties"
   - **Project name**: `samarth-properties`
   - **Database password**: Strong password → SAVE IT
   - **Region**: `South Asia (Mumbai ap-south-1)` ← closest to India
4. Click **"Create new project"** → Wait 2–3 minutes

---

## STEP 2 — Get Your API Keys

1. Supabase project → **Settings → API**
2. Copy and save these 3 values:
   ```
   Project URL:          https://xxxxxxxxxxxx.supabase.co
   anon public key:      eyJhbGci...
   service_role key:     eyJhbGci...  ← KEEP SECRET
   ```

---

## STEP 3 — Run Schema (creates all 14 tables)

1. Supabase → **SQL Editor → New query**
2. Open: `database/migrations/001_schema.sql`
3. Copy ALL → Paste → Click **Run**
4. Expected: `Success. No rows returned`
5. Verify in **Table Editor** — you should see 14 tables

---

## STEP 4 — Apply Row Level Security

1. SQL Editor → **New query**
2. Open: `database/policies/002_rls_policies.sql`
3. Copy ALL → Paste → **Run**
4. Verify: **Authentication → Policies** — policies on all tables

---

## STEP 5 — Insert Seed Data

1. SQL Editor → **New query**
2. Open: `database/seeds/003_seed.sql`
3. Copy ALL → Paste → **Run**
4. Verify:
   - `site_content` → 40+ rows
   - `config_settings` → 20+ rows

---

## STEP 6 — Setup Storage Buckets

1. SQL Editor → **New query**
2. Open: `database/migrations/004_storage.sql`
3. Copy ALL → Paste → **Run**
4. Verify: **Storage** sidebar → 5 buckets:
   - projects, team, blogs, testimonials, media

---

## STEP 7 — Setup Backend Environment

```bash
cd samarth-properties/backend
cp .env.example .env
```

Fill in `.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=<generate below>
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## STEP 8 — Install Backend Dependencies

```bash
cd samarth-properties/backend
npm install
```

Packages installed: express, @supabase/supabase-js, bcryptjs, jsonwebtoken,
helmet, cors, compression, express-rate-limit, express-validator,
multer, sharp, nodemailer, slugify, morgan, uuid, dotenv, nodemon

---

## STEP 9 — Create Admin User

```bash
cd samarth-properties/backend
node src/utils/create-admin.js
```

Follow prompts:
```
Enter admin username: superadmin
Enter admin email: admin@samarthproperties.co.in
Enter admin password: [8+ chars, mixed case + numbers]
Enter role (superadmin/admin/config): superadmin
```

---

## ✅ VERIFICATION CHECKLIST

### Database Tables
- [ ] `admin_users` — 1 row (your admin)
- [ ] `site_content` — 40+ rows
- [ ] `config_settings` — 20+ rows
- [ ] `projects` — empty
- [ ] `appointments` — empty
- [ ] `enquiries` — empty
- [ ] `testimonials` — empty
- [ ] `blogs` — empty
- [ ] `team` — empty
- [ ] `media_library` — empty
- [ ] `visitor_analytics` — empty
- [ ] `audit_logs` — empty
- [ ] `login_attempts` — empty
- [ ] `brochure_downloads` — empty

### Storage Buckets
- [ ] `projects` bucket — public
- [ ] `team` bucket — public
- [ ] `blogs` bucket — public
- [ ] `testimonials` bucket — public
- [ ] `media` bucket — public

### Row Level Security
- [ ] `projects` — public read + service_role all
- [ ] `site_content` — public read + service_role all
- [ ] `appointments` — public insert + service_role all
- [ ] `enquiries` — public insert + service_role all
- [ ] `admin_users` — service_role only
- [ ] `config_settings` — service_role only
- [ ] `brochure_downloads` — public insert + service_role all

### Backend
- [ ] `.env` created and filled
- [ ] `npm install` success
- [ ] Admin user created

### Views
- [ ] `dashboard_stats` view exists in Supabase

---

## DATABASE RELATIONSHIPS

```
admin_users (1)
    ├──< projects (many)
    ├──< appointments (many)
    ├──< enquiries (many)
    ├──< testimonials (many)
    ├──< blogs (many)
    ├──< team (many)
    ├──< site_content (many)
    ├──< config_settings (many)
    ├──< media_library (many)
    └──< audit_logs (many)

projects (1)
    ├──< appointments (many)
    ├──< enquiries (many)
    ├──< testimonials (many)
    └──< brochure_downloads (many)
```

---

## ⚠️ SECURITY REMINDERS

1. **Never share** `service_role` key — bypasses all RLS
2. **Never commit** `.env` to GitHub — add to `.gitignore`
3. **Change** `ADMIN_PANEL_PATH` and `CONFIG_PANEL_PATH` from defaults
4. **Use strong password** for admin user
5. **Enable 2FA** on your Supabase account

---

## ➡️ NEXT STEP

Once all checklist items are ✅, reply:

**"Phase 1 complete, start Phase 2"**

Phase 2 builds the complete Node.js + Express backend API with all routes,
controllers, middleware, authentication, and file upload handling.
