# Yang Jersey – Retro Football Shirt Catalog

Source: https://yang-jersey.x.yupoo.com/categories/3903592
Total albums on the site: **1,388** across 12 pages.

## What's in this folder

| File | What it is |
|---|---|
| `retro_albums_PAGE1_SAMPLE.csv` | First 120 albums (page 1) — already scraped, ready to use |
| `retro_albums_PAGE1_SAMPLE.json` | Same data as JSON |
| `yupoo_scrape_local.py` | Self-contained script to scrape all 12 pages on your own machine |
| `parse.py` | The parser used for the page-1 sample (markdown-based) |

## Why only page 1 here

The web tool I have access to in chat couldn't pull all 12 pages cleanly — each
fetch returns ~50K tokens dominated by the site's navigation sidebar before
reaching the album list, which made fetching the remaining 11 pages wasteful
and unreliable. The local script below has no such constraint.

## How to get the full 1,388-album catalog

Run this on your own machine (Mac, Linux, or WSL on Windows). Takes about 30
seconds:

```bash
pip install requests beautifulsoup4
python3 yupoo_scrape_local.py
```

This will produce `retro_albums.csv` and `retro_albums.json` with every album
across all 12 pages — title, album URL, photo count, locked status, and cover
image.

## CSV columns

- `album_id` — numeric ID from `/albums/<ID>` (locked albums get a `LOCKED_*` placeholder)
- `title` — jersey name as shown on the site
- `album_url` — direct link to the album (empty for password-locked albums)
- `photo_count` — number of photos in the album
- `locked` — `True` if the album is password-protected
- `cover_image` — thumbnail URL
- `source_page` — which page (1–12) the album appeared on

## Notes

- About 20 of the 120 albums on page 1 were locked (no public URL). Expect a
  similar proportion across all pages — these are password-protected wholesale
  items.
- Album URLs of the form `https://yang-jersey.x.yupoo.com/albums/<ID>` open
  the album page where you can see all photos for that jersey.
- If you later want a deeper scrape (every image URL inside every album), the
  script can be extended — let me know.
