# Auth email templates

Branded HTML for the Supabase auth emails. Supabase doesn't read these files
automatically on a hosted project, so paste each one into the dashboard.

Every link points at `/auth/confirm` in the app, which verifies the token,
signs the user in and sends them on to the right page.

## 1. URL configuration (required, this is what fixes confirmation links)

Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://www.clubsranked.co.uk`
- **Redirect URLs:** add
  - `https://www.clubsranked.co.uk/**`
  - `https://pro-clubs-ranked-2.vercel.app/**` (Vercel URL)
  - `http://localhost:3000/**` (local dev)

## 2. Templates

Supabase dashboard → **Authentication → Emails → Templates**. For each one,
set the subject and paste the whole HTML file into the body:

| Template       | Subject                              | File                  |
| -------------- | ------------------------------------ | --------------------- |
| Confirm signup | Confirm your Clubs Ranked account    | `confirm-signup.html` |
| Reset password | Reset your Clubs Ranked password     | `reset-password.html` |
| Change email   | Confirm your new Clubs Ranked email  | `change-email.html`   |

## 3. Custom SMTP (recommended before launch)

Supabase's built-in sender is rate limited to a handful of emails per hour
and sends from a generic address. Under **Authentication → Emails → SMTP
Settings**, connect a provider (e.g. Resend, Postmark, SendGrid) and set the
sender to something like `Clubs Ranked <no-reply@clubsranked.co.uk>`.
