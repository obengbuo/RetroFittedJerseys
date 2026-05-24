#!/usr/bin/env python3
"""
Yang Jersey retro-shirt catalog scraper — FULL VERSION with descriptions.

Two-pass:
  1. Crawl all 12 pages of the retro category to get every album (title, URL,
     photo count, locked status, cover image).
  2. Visit each album page to extract: description/caption text, all photo
     URLs, and any other body content.

Outputs:
  retro_albums.csv         - flat catalog (one row per album)
  retro_albums_full.json   - rich JSON with per-album description + photos[]

Requires:  pip install requests beautifulsoup4
Run:       python3 yupoo_scrape_full.py
"""
import csv
import json
import re
import sys
import time
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Install dependencies first:  pip install requests beautifulsoup4")


CATEGORY_URL = "https://yang-jersey.x.yupoo.com/categories/3903592"
SITE = "https://yang-jersey.x.yupoo.com"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://yang-jersey.x.yupoo.com/",
}
SLEEP_BETWEEN_REQUESTS = 0.4  # seconds; be polite


def fetch(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.text


# ---------- Stage 1: category pages ----------

def detect_total_pages(html: str) -> int:
    m = re.search(r"共\s*(\d+)\s*页", html)
    if m:
        return int(m.group(1))
    nums = [int(n) for n in re.findall(r"\?page=(\d+)", html)]
    return max(nums) if nums else 1


def parse_category_page(html: str, page_num: int):
    soup = BeautifulSoup(html, "html.parser")
    albums = []
    seen = set()

    # Each album entry on the listing has an <a href="/albums/NNN"> with a
    # title attribute. We don't filter on a specific class because Yupoo
    # changes them; any /albums/NNN link in the main content area is an album.
    for a in soup.find_all("a", href=re.compile(r"/albums/\d+")):
        href = a["href"]
        aid_match = re.search(r"/albums/(\d+)", href)
        if not aid_match:
            continue
        aid = aid_match.group(1)
        if aid in seen:
            continue
        title = a.get("title") or a.get_text(strip=True)
        if not title or title.isdigit():
            continue
        seen.add(aid)
        albums.append({
            "album_id": aid,
            "title": title.strip(),
            "album_url": f"{SITE}/albums/{aid}",
            "locked": False,
            "source_page": page_num,
        })

    # Locked albums: find <div> blocks containing a lock icon + a title text.
    for div in soup.find_all(["div", "li"], class_=re.compile(r"album|image", re.I)):
        if div.find(class_=re.compile(r"lock", re.I)) or div.find("img", src=re.compile(r"icon-lock")):
            title_el = div.find(class_=re.compile(r"title", re.I))
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            if not title:
                continue
            cover_el = div.find("img")
            cover = ""
            if cover_el:
                cover = cover_el.get("data-original") or cover_el.get("src") or ""
            key = f"LOCKED_{title[:50]}"
            if key in seen:
                continue
            seen.add(key)
            albums.append({
                "album_id": key,
                "title": title,
                "album_url": "",
                "locked": True,
                "cover_image": cover,
                "source_page": page_num,
            })

    return albums


def crawl_category():
    print("Stage 1: crawling category listing", file=sys.stderr)
    page1 = fetch(f"{CATEGORY_URL}?page=1")
    total_pages = detect_total_pages(page1)
    print(f"  {total_pages} total pages", file=sys.stderr)

    all_albums = parse_category_page(page1, 1)
    print(f"  page 1: {len(all_albums)} albums", file=sys.stderr)

    for n in range(2, total_pages + 1):
        time.sleep(SLEEP_BETWEEN_REQUESTS)
        try:
            html = fetch(f"{CATEGORY_URL}?page={n}")
            page_albums = parse_category_page(html, n)
            print(f"  page {n}: +{len(page_albums)} albums", file=sys.stderr)
            all_albums.extend(page_albums)
        except Exception as e:
            print(f"  page {n}: ERROR {e}", file=sys.stderr)

    # De-dupe
    unique = {}
    for a in all_albums:
        unique.setdefault(a["album_id"], a)
    return list(unique.values())


# ---------- Stage 2: per-album detail ----------

def parse_album_page(html: str):
    """Pull description text and photo URLs from an album page."""
    soup = BeautifulSoup(html, "html.parser")

    # Description: Yupoo puts seller notes in .showalbumheader__gallerysubtitle,
    # .album__description, .description, or sometimes plain <p> inside the
    # main album container.
    desc_parts = []
    for sel in [
        ".showalbumheader__gallerysubtitle",
        ".album__description",
        ".showalbum__children__horizontal",
        ".description",
        ".showalbumheader__gallerytitle",
    ]:
        for el in soup.select(sel):
            txt = el.get_text(" ", strip=True)
            if txt and txt not in desc_parts:
                desc_parts.append(txt)
    description = "\n".join(desc_parts).strip()

    # Photo URLs: all <img> tags pointing at photo.yupoo.com
    photos = []
    seen = set()
    for img in soup.find_all("img"):
        src = img.get("data-original") or img.get("data-src") or img.get("src") or ""
        if "photo.yupoo.com/yang-jersey/" not in src:
            continue
        # Skip locked-icon decorations
        if "icon-lock" in src:
            continue
        # Prefer the largest size by swapping small/medium -> big where present
        big = re.sub(r"/(small|medium)\.(jpe?g|png)$", r"/big.\2", src)
        if big in seen:
            continue
        seen.add(big)
        photos.append(big)

    return description, photos


def enrich_albums(albums, limit=None):
    print(f"\nStage 2: fetching {len(albums)} album bodies for descriptions + photos",
          file=sys.stderr)
    todo = [a for a in albums if not a["locked"]]
    if limit:
        todo = todo[:limit]
        print(f"  (limited to first {limit} for testing)", file=sys.stderr)

    for i, a in enumerate(todo, 1):
        time.sleep(SLEEP_BETWEEN_REQUESTS)
        try:
            html = fetch(a["album_url"])
            desc, photos = parse_album_page(html)
            a["description"] = desc
            a["photos"] = photos
            a["photo_count"] = len(photos)
            if i % 25 == 0 or i == len(todo):
                print(f"  {i}/{len(todo)} albums fetched", file=sys.stderr)
        except Exception as e:
            a["description"] = ""
            a["photos"] = []
            a["fetch_error"] = str(e)
            print(f"  {i}/{len(todo)}: ERROR on {a['album_id']}: {e}", file=sys.stderr)

    # Mark locked albums with empty fields for consistent schema
    for a in albums:
        if a["locked"]:
            a.setdefault("description", "")
            a.setdefault("photos", [])
            a.setdefault("photo_count", 0)

    return albums


# ---------- Main ----------

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog-only", action="store_true",
                        help="Skip per-album detail fetch (Stage 2)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Only fetch the first N album bodies (for testing)")
    args = parser.parse_args()

    albums = crawl_category()
    print(f"\nStage 1 complete: {len(albums)} albums total "
          f"({sum(1 for a in albums if not a['locked'])} unlocked, "
          f"{sum(1 for a in albums if a['locked'])} locked)", file=sys.stderr)

    if not args.catalog_only:
        albums = enrich_albums(albums, limit=args.limit)

    # Write outputs
    out = Path(".")
    (out / "retro_albums_full.json").write_text(
        json.dumps(albums, indent=2, ensure_ascii=False))

    csv_fields = ["album_id", "title", "album_url", "photo_count", "locked",
                  "description", "source_page"]
    with open(out / "retro_albums.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        w.writeheader()
        for a in albums:
            w.writerow(a)

    print(f"\nDONE.", file=sys.stderr)
    print(f"  retro_albums.csv         flat catalog ({len(albums)} rows)", file=sys.stderr)
    print(f"  retro_albums_full.json   full data including per-album photos + description",
          file=sys.stderr)


if __name__ == "__main__":
    main()