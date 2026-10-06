# Rogue&Co Storefront

A prototype storefront for **Rogue&Co**, a brand of artist-drawn graphic tees, shirts, jeans and European linen.
It's a static website that also installs as an app on phones and desktops, and it's ready to deploy on Netlify.

## What's in the folder

```
Rogue-co_app/
├── netlify.toml            ← tells Netlify what to publish, plus caching and security headers
└── site/                   ← everything Netlify serves to visitors
    ├── index.html          ← the storefront page (the structure and words)
    ├── 404.html            ← shown when someone visits a link that doesn't exist
    ├── css/styles.css      ← all the styling (colors, fonts, layout)
    ├── js/main.js          ← interactive parts: menu, calculator, pricing toggle, lookbook player
    ├── js/auth.js          ← customer accounts: sign up, sign in, sign out, password reset (Supabase)
    ├── js/vendor/          ← the Supabase library, bundled so the site doesn't depend on a CDN
    ├── sw.js               ← service worker: lets the site work offline and install as an app
    ├── manifest.webmanifest← app name, colors and icons for "Add to Home Screen"
    ├── favicon.svg         ← browser-tab icon
    ├── icons/              ← app icons for phones and desktops
    └── images/             ← product and lifestyle photos
```

There is no build step. The files in `site/` are exactly what gets published.

## Deploy to Netlify

### Option A: connect the GitHub repo (recommended, auto-deploys on every push)

1. Log in at [app.netlify.com](https://app.netlify.com).
2. Click **Add new site → Import an existing project → GitHub**, then pick `Rogue-co_app`.
3. Pick the branch to deploy. Netlify reads `netlify.toml`, so leave **Build command** empty and **Publish directory** as `site`.
4. Click **Deploy**. You get a URL like `https://your-site-name.netlify.app` in under a minute.

### Option B: drag and drop (no Git needed)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the **`site`** folder onto the page.

With drag and drop the `netlify.toml` headers aren't applied, but the site works the same.

### Option C: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod      # run from the repo root; it reads netlify.toml
```

## Preview on your own computer

```bash
npx serve site
```

Then open the address it prints (usually http://localhost:3000).

## Accounts (sign up / sign in)

Customers can create an account and sign in with email and password. This uses **Supabase Auth** (project "Rahul").

- **Where it lives:** `site/js/auth.js` (the logic) and the `<dialog id="authDialog">` block near the top of `site/index.html` (the form).
- **What's included:** sign up (with first name), sign in, sign out, "forgot password" emails, and setting a new password from that email.
- **Where users are stored:** Supabase dashboard → **Authentication → Users**. No database tables are needed for login.
- The Supabase URL and *publishable* key in `auth.js` are meant to be public. Never put the `service_role` / secret key in this site.

### One-time Supabase setup (required for the email links to work)

In the Supabase dashboard → **Authentication → URL Configuration**:

1. **Site URL:** your live Netlify address, e.g. `https://rogueco-store.netlify.app`
2. **Redirect URLs:** add the same address followed by `/**` (e.g. `https://rogueco-store.netlify.app/**`), plus `http://localhost:3000/**` if you test locally.

Without this, the "confirm your email" and "reset password" links send people to `localhost` instead of your store.

### Good to know

- **Email confirmation** is on by default: new users must click a link in their inbox before they can sign in. You can turn it off under **Authentication → Sign In / Providers → Email → Confirm email**.
- **Email limits:** Supabase's built-in email sender is for testing and only sends a few emails per hour. Before real customers sign up, connect your own email provider under **Authentication → Emails → SMTP Settings** (e.g. Resend, SendGrid, Amazon SES).

## Making changes

- **Text and sections:** edit `site/index.html`.
- **Colors and fonts:** the brand colors are variables at the top of `site/css/styles.css` (`--primary`, `--accent`, and so on).
- **Photos:** replace a file in `site/images/` with one of the same name.
- **After any change,** open `site/sw.js` and bump `CACHE` (for example `rogueco-v1` → `rogueco-v2`). Otherwise visitors who installed the app may keep seeing the old version.

## Notes

- This is a prototype. The email forms check the address but don't send anything, and there's no real checkout.
- Reviews and figures in the "Drop stories" section are labelled as sample content.
- Photos are from Unsplash.
