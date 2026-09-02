# Will You Marry Me? (Legally Binding Survey)

A funny, mobile-phone-shaped proposal website. Every time they press **No**, the
**Yes** button gets bigger and the No button gets more desperate. When they finally
press Yes they must justify themselves with a radio button, and the thank-you screen
tells them exactly how many tries it took. Every click is pushed to Supabase.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The three screens (question, reason, thank you) inside a phone frame |
| `style.css` | Phone frame, button growth, form and receipt styling |
| `app.js` | Button logic, copy, confetti, Supabase inserts |
| `supabase-config.js` | Your Supabase URL, anon key and table name |
| `supabase/schema.sql` | Table, Row Level Security policy and a summary view |

## Setup

1. Create a Supabase project at https://supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`.
3. In Project Settings -> API, copy the **Project URL** and **anon public** key
   into `supabase-config.js`.
4. Serve the folder over HTTP (any static host works):

   ```bash
   python3 -m http.server 8080
   ```

   Then open http://localhost:8080 on your phone or in a browser.

If `supabase-config.js` is left with the placeholder values, the site still works
and logs every response to the browser console instead.

## What gets recorded

One row per click in `proposal_responses`:

| Column | Meaning |
| --- | --- |
| `session_id` | One random id per page load, so you can group one person's clicks |
| `event_type` | `no`, `yes`, or `reason` |
| `attempt_number` | How many times No had been pressed at that moment |
| `button_label` | What the button said when it was pressed |
| `reason` | The radio option chosen (only on `reason` rows) |
| `user_agent` | Browser string, for forensic purposes |

The `proposal_summary` view gives one line per session: how many refusals, whether
they said yes, and why.

## Security note

The anon key is public by design. The Row Level Security policy in the schema lets
the anon role **insert only**. Reading the responses requires the dashboard or the
service role key, which must never be put in this site.

## Deploy to Cloudflare

This is a static site with no build step. It deploys as a Cloudflare Worker
serving static assets (configured in `wrangler.toml`).

**Option A: Git integration**

1. Cloudflare dashboard -> Workers & Pages -> Create -> Import a repository.
2. Pick the `roshan-teeluck/survey` repository.
3. Build settings:
   - Build command: *(leave empty)*
   - Deploy command: `npx wrangler deploy`
   - Root directory: *(leave empty)*
4. Save and Deploy. Every push to `main` redeploys automatically.

**Option B: from the terminal**

```bash
npx wrangler login
npx wrangler deploy
```

`_headers` sets security headers including a Content Security Policy that
allows only the Supabase JS CDN and your Supabase project. `.assetsignore`
keeps the README, SQL and config files out of the public upload.
