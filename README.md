# ! DimV Studio — Website + Owner Dashboard

A responsive, dark futuristic portfolio/storefront for a Roblox development studio. Built with React + Vite + Supabase, intended for static deployment on Netlify and manageable from an Android phone.

## Included
- Public landing page, services, portfolio, products, and contact section.
- Login using Supabase Auth; dashboard is visible only when the signed-in user has `owner` or `admin` in `user_profiles.role`.
- CRUD for portfolio and products, JSONB site settings, and image uploads to Storage bucket `dimv-asset`.
- Indonesian/English navigation toggle and mobile layout.
- GIF avatar copied into `public/gift-avatar.gif` from the provided conversation asset.
- Supabase RLS/Storage policy script at `supabase/setup.sql`.

## 1. Supabase setup (do this before publishing)
1. Open your existing Supabase project.
2. In **Project Settings → API Keys** (or **Connect → API Keys**), copy the **Project URL** and the **Publishable key**. The key starts with `sb_publishable_` on the newer key screen. Do not use or expose a Secret key / `service_role` key.
3. In the project files, copy `.env.example` to `.env.local`, then fill in:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   ```

   For Netlify, set these same two values under **Site configuration → Environment variables**. Vite variables are public in the built website; publishable keys are designed for this, but access must be controlled by RLS policies.
4. Verify these four existing tables and columns match the database you shared: `portfolio`, `products`, `site_settings`, and `user_profiles`. The website uses the columns in your schema.
5. In **Storage → Buckets**, create a bucket named exactly `dimv-asset`. Set it to **Public** only because the site displays public project/product images. Do not upload private documents to this bucket.
6. Open **SQL Editor**, paste the contents of `supabase/setup.sql`, and click **Run**. The script enables RLS and creates policies for public reads of published content and owner/admin writes. Review any existing policies first if your project has custom access rules.
7. In **Authentication → Users**, make sure your owner account exists and is confirmed. In `user_profiles`, make sure the row's `user_id` equals that user's Auth UID and `role` is exactly `owner`. The profile row should contain the correct email if you use it.
8. Do not add public sign-up to this site. Owner/admin accounts should be created by you in Supabase Auth.

### Important notes about policies
- The frontend never needs a Supabase Secret key. Do not place one in `.env.local`, Netlify variables prefixed with `VITE_`, source code, screenshots, or chat.
- Public portfolio/product queries only show `is_published = true`; signed-in owner/admin can view and manage all rows.
- `site_settings` is public-readable because it may contain public site configuration. Never store passwords, private tokens, payment credentials, or secrets there.
- If you already have custom policies, check them before applying this script. Policies combine in ways that may be more permissive than intended if older policies remain.

## 2. Run locally (computer)
```bash
npm install
cp .env.example .env.local
# edit .env.local with your project URL and publishable key
npm run dev
```
Open the local URL shown by Vite. To create a production build:
```bash
npm run build
```
The output folder is `dist/`.

## 3. Publish using Netlify from a phone
1. Upload this ZIP to a repository on GitHub (extract it first; upload the project files, not the ZIP itself).
2. Open Netlify and choose **Add new site → Import an existing project**.
3. Connect GitHub and select the repository.
4. Set build command to `npm run build` and publish directory to `dist`. `netlify.toml` already contains these values.
5. Before deploying, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under Netlify's environment variables.
6. Deploy the site. Open the Netlify URL and test portfolio/products, then test owner login.
7. After changing environment variables, trigger a fresh deploy so the new values are included in the build.

## 4. Customize the website
- The current supplied GIF is at `public/gift-avatar.gif`; replace it with your chosen logo/GIF using the same filename to keep the design connected.
- Edit default service cards in `src/App.tsx` in the `services` array.
- Edit page layout and colors in `src/style.css` (the main accent is `--accent`).
- Configure `discord_url`, `description`, `contact_text`, `studio_name`, and `tagline` through `site_settings` or the dashboard. `site_settings.setting_value` is JSONB, so string values must be valid JSON strings when entered in the dashboard; for example `"https://discord.gg/your-invite"` including the quotation marks. The dashboard also accepts plain text and saves it as a string when it is not valid JSON.

## 5. Troubleshooting
- **Preview mode warning:** `.env.local` is missing or values are placeholders. Configure env vars and restart/redeploy.
- **Login works but dashboard does not open:** verify the Auth user's UID matches `user_profiles.user_id` and role is `owner` or `admin`.
- **Permission denied / RLS error:** run/review `supabase/setup.sql` and inspect policies in Supabase.
- **Image upload fails:** check the `dimv-asset` bucket name and Storage policies. Image uploads require owner/admin role.
- **No rows in portfolio/products:** the site uses your real Supabase data once the connection works. Add records in the dashboard; the included sample content is only a fallback preview and cannot be saved.
- **Website not updated after deploy:** redeploy after changing environment variables or repository code.

## Security checklist
- [ ] Only Publishable key is used in browser configuration.
- [ ] No `service_role` / Secret key in frontend files or Netlify `VITE_` variables.
- [ ] RLS enabled on all four tables.
- [ ] `user_profiles.role` is `owner` only for trusted owner account(s).
- [ ] Storage bucket contains only images intended for public viewing.
- [ ] Public site settings contain no confidential data.
