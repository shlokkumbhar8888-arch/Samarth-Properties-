# SAMARTH PROPERTIES — Complete Project Structure
# Version 2.0

```
samarth-properties/
│
├── 📁 frontend/                          # Public-facing website (Netlify)
│   ├── index.html                        # Homepage
│   ├── sitemap.xml                       # SEO sitemap
│   ├── robots.txt                        # SEO robots
│   ├── 404.html                          # Custom 404 page
│   ├── 📁 pages/
│   │   ├── projects.html                 # All projects listing
│   │   ├── project-detail.html           # Single project page (uses ?slug=)
│   │   ├── about.html                    # About us
│   │   ├── contact.html                  # Contact page
│   │   ├── blog.html                     # Blog listing
│   │   └── blog-detail.html              # Blog post (uses ?slug=)
│   └── 📁 assets/
│       ├── 📁 css/
│       │   ├── main.css                  # CSS variables + reset + global
│       │   ├── components.css            # Reusable UI components
│       │   └── animations.css            # All animations + transitions
│       ├── 📁 js/
│       │   ├── config.js                 # API URL + app constants
│       │   ├── api.js                    # Fetch wrappers + error handling
│       │   ├── main.js                   # Nav, footer, toast, WhatsApp FAB
│       │   ├── home.js                   # Homepage: hero, stats, projects
│       │   ├── projects.js               # Filter, search, compare
│       │   ├── project-detail.js         # Gallery, enquiry, maps, share
│       │   ├── blog.js                   # Blog listing + category filter
│       │   ├── blog-detail.js            # Blog post rendering
│       │   ├── contact.js                # Contact form + appointment form
│       │   └── analytics.js             # Internal page view tracking
│       ├── 📁 images/                    # Static images: logo, og-image
│       └── 📁 fonts/                     # Local font files (if self-hosted)
│
├── 📁 admin/                             # Admin panel (secret URL)
│   ├── login.html                        # Admin login
│   ├── index.html                        # Dashboard
│   └── 📁 pages/
│       ├── projects.html                 # Projects list
│       ├── project-form.html             # Add/Edit project
│       ├── appointments.html             # Appointments management
│       ├── enquiries.html                # Enquiries/Leads management
│       ├── testimonials.html             # Testimonials management
│       ├── blogs.html                    # Blog list
│       ├── blog-form.html                # Blog editor (rich text)
│       ├── team.html                     # Team management
│       ├── media.html                    # Media library
│       ├── content.html                  # Site content CMS editor
│       ├── analytics.html                # Analytics dashboard
│       └── settings.html                 # Admin settings
│
├── 📁 config-panel/                      # Config panel (second secret URL)
│   ├── login.html                        # Config login
│   ├── index.html                        # Config dashboard
│   └── 📁 pages/
│       ├── database.html                 # Database/Supabase config
│       ├── email.html                    # Email/SMTP config
│       ├── security.html                 # Security settings
│       ├── analytics-config.html         # Analytics config (GA4, Pixel)
│       ├── whatsapp.html                 # WhatsApp configuration
│       ├── integrations.html             # Third-party integrations
│       └── theme.html                    # Theme/Branding config
│
├── 📁 backend/                           # Node.js + Express API (Render)
│   ├── package.json
│   ├── .env.example
│   ├── .env                              # gitignored
│   ├── .gitignore
│   └── 📁 src/
│       ├── server.js                     # Express entry point
│       ├── 📁 config/
│       │   ├── supabase.js               # Supabase client (anon + service)
│       │   └── constants.js              # App constants
│       ├── 📁 routes/
│       │   ├── public.js                 # Public routes (no auth)
│       │   ├── admin.js                  # Admin routes (JWT required)
│       │   ├── config.js                 # Config routes (JWT + config role)
│       │   └── media.js                  # File upload routes
│       ├── 📁 controllers/
│       │   ├── auth.controller.js
│       │   ├── projects.controller.js
│       │   ├── appointments.controller.js
│       │   ├── enquiries.controller.js
│       │   ├── testimonials.controller.js
│       │   ├── blogs.controller.js
│       │   ├── team.controller.js
│       │   ├── media.controller.js
│       │   ├── content.controller.js
│       │   ├── analytics.controller.js
│       │   └── config.controller.js
│       ├── 📁 middleware/
│       │   ├── auth.middleware.js        # JWT verification
│       │   ├── role.middleware.js        # Role-based access
│       │   ├── rateLimit.middleware.js   # Rate limiting
│       │   ├── validate.middleware.js    # Input validation
│       │   └── audit.middleware.js       # Audit log writer
│       └── 📁 utils/
│           ├── create-admin.js           # Admin creation CLI
│           ├── response.js               # Standardized responses
│           ├── email.js                  # Nodemailer helper
│           ├── media.js                  # Sharp processing
│           └── slug.js                   # URL slug generator
│
├── 📁 database/
│   ├── 📁 migrations/
│   │   ├── 001_schema.sql               # All 14 tables + indexes + triggers
│   │   └── 004_storage.sql              # Supabase storage buckets
│   ├── 📁 policies/
│   │   └── 002_rls_policies.sql         # Row Level Security
│   └── 📁 seeds/
│       └── 003_seed.sql                 # Default content + config
│
└── 📁 docs/
    ├── STRUCTURE.md                      # This file
    ├── PHASE1_SETUP.md                   # Database setup guide
    ├── API.md                            # API documentation
    └── DEPLOYMENT.md                     # Netlify + Render deployment
```

## Database Tables (14 total)

| Table | Purpose | RLS |
|-------|---------|-----|
| admin_users | Admin accounts | service_role only |
| site_content | CMS content | public read |
| projects | Property listings | public read (visible=true) |
| appointments | Site visit bookings | public insert only |
| enquiries | Lead enquiries | public insert only |
| testimonials | Client reviews | public read (visible=true) |
| blogs | Blog posts | public read (published only) |
| team | Staff profiles | public read (visible=true) |
| media_library | Uploaded files | public read |
| visitor_analytics | Page tracking | public insert only |
| config_settings | App configuration | service_role only |
| audit_logs | Admin activity | service_role only |
| login_attempts | Brute force tracking | service_role only |
| brochure_downloads | Lead before download | public insert only |

## Storage Buckets (5)

| Bucket | Max Size | Types |
|--------|---------|-------|
| projects | 50MB | jpg, png, webp, gif, pdf |
| team | 10MB | jpg, png, webp |
| blogs | 20MB | jpg, png, webp, gif |
| testimonials | 5MB | jpg, png, webp |
| media | 50MB | images, video, pdf |
