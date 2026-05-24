# Yang Jersey Retro Scraper — Agent Brief

## Mission

Finish a Python scraper for the Yang Jersey Yupoo store (retro football shirts category) so it reliably pulls **every album** with title, photos, and any description text.

- **Source:** https://yang-jersey.x.yupoo.com/categories/3903592
- **Expected total:** ~1,388 albums across 12 pages
- **Working directory:** `C:\Users\kbuo1\OneDrive\Documents\DevOps\RETROFITTEDJERSEYS`
- **Venv:** `.venv` already exists at the working directory; activate before running anything

## Current state

`yupoo_scrape_full_v2.py` runs but has two unresolved problems:

1. **Pagination broken.** Reports "1 total pages detected" and returns 101 albums. The real site has 12 pages × ~120 albums = ~1,388. The current detector counts `?page=N` links in the raw HTML, and apparently those aren't present in what `requests` receives.
2. **Album pages 404.** Every per-album fetch (e.g. `/albums/234997576`) returns 404, even though the same URLs load fine in a browser. Adding `Referer` and a session cookie warm-up against the homepage did not fix it.

A debug file `debug_category_page1.html` exists from the last run — **read this first**. It shows exactly what Yupoo serves to `requests`.

## Your job

1. Open `debug_category_page1.html` and figure out:
   - Where pagination info actually lives in the HTML (look for `page`, `total`, `共`, `data-`, JSON blobs in `<script>` tags, etc.)
   - Whether the album anchor tags contain enough URL info, or whether the real album URLs need extra query parameters
2. Run a quick probe to reproduce the 404, then diagnose:
   ```powershell
   Invoke-WebRequest -Uri "https://yang-jersey.x.yupoo.com/albums/234997576" -UserAgent "Mozilla/5.0" -Headers @{Referer="https://yang-jersey.x.yupoo.com/categories/3903592"}
   ```
   Compare what works vs. what doesn't. Likely causes to investigate in order:
   - Missing cookies (try a real browser → copy cookies → reuse)
   - URL needs `?uid=1&isSubCate=false&referrercate=3903592` suffix (the form used on the live site)
   - Yupoo blocks the User-Agent or requires a session token from a JS-set cookie
   - Album content is fetched via an XHR endpoint, not the HTML URL
3. Fix the script. Acceptable approaches in preference order:
   - Keep using `requests` if a header/cookie/URL tweak resolves both issues
   - Switch to `httpx` if there's a TLS fingerprint issue
   - Fall back to **Playwright** (sync API, headless Chromium) if the site truly requires JS. The agent should `pip install playwright` and `playwright install chromium` if it goes this route.
4. Re-run with `--limit 5 --debug` until output looks right, then do the full run.

## Acceptance criteria

- `python yupoo_scrape_full_v2.py` (or replacement) produces:
  - `retro_albums.csv` with **at least 1,300** rows
  - `retro_albums_full.json` where unlocked albums have **non-empty `photos` arrays** (a jersey album should have 4–10 photo URLs)
  - The `description` field is populated wherever the album page actually has body text (it's okay if many are empty — the goal is to capture what exists, not to invent content)
- Re-running is idempotent: existing rows are not corrupted; partial runs can resume

## Constraints

- Add a per-request sleep of 0.4–1.0s and a retry-with-backoff on 429/5xx. Be polite — this is one merchant's site, not a search engine.
- Do not hardcode session cookies into the committed script; if cookies are needed, load them from a local `cookies.txt` or environment variable so the file stays shareable.
- Windows / PowerShell environment. Use `pathlib`, write files with `encoding="utf-8"`, no Unix-only shell calls.
- Keep dependencies minimal: `requests` + `beautifulsoup4` is preferred; only add Playwright if `requests` genuinely can't get past the protection.

## Files in the folder

- `yupoo_scrape_full_v2.py` — current best attempt; modify or replace
- `yupoo_scrape_full.py`, `yupoo_scrape_local.py` — earlier attempts, fine to delete
- `retro_albums_PAGE1_SAMPLE.csv` / `.json` — 120-row sample from an earlier partial run; keep as reference
- `debug_category_page1.html` — **start here**

## Stretch goals (only after the basic scrape works)

- Add a `--download-photos` flag that pulls the actual JPEGs into `photos/<album_id>/<n>.jpg` so the user has a local archive, not just URLs
- Detect locked albums properly (cover image hash, photo count) and record them in a separate `locked_albums.csv`
- Add a small CLI to filter the resulting CSV by team or year, e.g. `python filter.py --team "Arsenal" --year 1990s`

## What to report back

When you're done (or stuck), summarize in a single message:
- What the actual problem was (cookie? URL format? JS rendering?)
- Final row count in the CSV
- One example album with its description and first photo URL so the user can sanity-check
- Anything weird you noticed (e.g. albums that have no photos, duplicate titles)

Don't ask permission for normal next steps — read the debug file, try a fix, run, iterate. Only ask the user if you genuinely need a decision (e.g. "Playwright requires a 200MB Chromium download — proceed?").
