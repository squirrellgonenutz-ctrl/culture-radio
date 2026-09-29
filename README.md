# Culture Radio

A mobile-first, installable radio player for Car Culture Garage. Carbon black, metallic grey and electric blue; eight direct UK underground radio streams; separate email/password accounts and private favourites.

## Run locally

Serve this directory over HTTP (for example, `python -m http.server 4173`), then open `http://localhost:4173`. Do not open `index.html` as a local file. There is no build step. The Supabase browser SDK is pinned and vendored locally for offline reopening.

## GitHub Pages

This is a separate repository: `squirrellgonenutz-ctrl/culture-radio`.

In **Settings → Pages**, choose **Deploy from a branch**, **main**, **/(root)**, then **Save**. The intended live address is:

https://squirrellgonenutz-ctrl.github.io/culture-radio/

All asset, manifest and service worker paths are relative so the app works under the repository subdirectory. Pages publishes after commits to main. Do not treat the URL as live until the Pages deployment succeeds.

## Accounts

1. Create a free Supabase project.
2. Run `supabase/schema.sql` once in its SQL editor. The table uses row-level security: users can select, insert and delete only their own favourites. Anonymous requests have no table privileges.
3. Put the project URL and **publishable** key in `config.js`. These values are intentionally public. Never use a service-role key, secret key, database password or personal access token in the app/repository.
4. Set Auth → URL Configuration → Site URL to the live Pages URL above. Add that exact URL to Redirect URLs. Add the localhost preview URL only for development.
5. Keep email confirmations enabled. For general user signup and password resets, configure custom SMTP in Supabase. The built-in email sender only sends to project team addresses, with strict rate limits. Until SMTP is configured, test using the project owner's email; other users cannot reliably create or recover accounts.

The app provides sign in, sign up, email confirmation handling, password-reset email, recovery-password form, persistent sessions and local sign out. Passwords are sent directly to Supabase; application code never stores passwords. Supabase maintains its session in browser storage. Favourites are cached separately by user ID; offline changes are queued and synced when online. Signing out stops playback and clears the visible collection. This is account privacy, not DRM: the static app code and public station streams remain public.

## Install on Samsung

Open the live HTTPS address in Samsung Internet or Chrome. Tap **Install app**; if the browser doesn't show its install prompt, use its menu to add the app to the Home screen. Samsung Internet may call this **Add page to → Home screen**; Chrome may show **Add to Home screen → Install**. Sign in on the phone with your Culture Radio account, then launch from its new icon.

For the Focus ST, pair the phone over Bluetooth, select Bluetooth audio on the stereo, and start your station while parked. Media Session provides station artwork, play/pause and previous/next handlers where supported. This is not an Android Auto application. Actual background playback and steering-wheel controls depend on Samsung browser, Android power settings and the stereo; these require a physical phone/car check.

## Player behaviour

- No autoplay on first opening. Selecting a station starts it. Pause disconnects the stream; play returns to the live broadcast.
- Previous/next wrap through the visible search/genre/favourites collection; if it is empty they use all stations.
- Clear loading, buffering, unavailable and offline states. Two bounded retries; manually pressing play starts a fresh attempt. Pausing, switching station or signing out cancels pending retries.
- Search and genre filtering. The Trance filter intentionally has no dedicated station in V1; it explains this rather than inventing a match.
- Now Playing shows the station and artwork. It does not claim live track/DJ metadata.
- Offline caches only the application shell and local artwork, never live streams, account API responses or audio recordings. An existing saved session can reopen the shell offline; new sign-ins need internet.
- The service worker scopes its cache to this repository. New versions wait until old app windows close, avoiding updates that interrupt playback. Bump `VERSION` in `sw.js` after shell, SDK, config or catalogue edits.

## Station maintenance and verification

Edit `stations.js` to change streams or genres; artwork is in `assets/`. See [station sources and checks](docs/STATIONS.md) and [verification record](docs/TESTING.md). A stream passing a check today may still become unavailable later. Select Radio is deliberately excluded.

Station branding belongs to its respective owners and is used to identify the streams; no affiliation is implied. The Supabase SDK is MIT licensed; its license is in `vendor/LICENSE.supabase.txt`.
