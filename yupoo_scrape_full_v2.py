#!/usr/bin/env python3
"""
Yang Jersey retro-shirt catalog scraper — v2.

Fixes applied:
  - Pagination: parses "1 / 12" from categories__box-right-pagination-span
    (the old ?page=N regex only found the single "next page" link → max=2).
  - Album URLs: uses the full href/data-href including query params
    (?uid=1&isSubCate=false&referrercate=3903592). Stripping them caused 404.
  - Album parsing: title comes from div.album__title, not the <a> title attr.
  - Locked detection: locked albums have data-href (not href) and
    title="加密相册"; they still get an album_url so they can be fetched if
    credentials are added later.

Outputs:
  retro_albums.csv         flat catalog (one row per album)
  retro_albums_full.json   rich JSON with description + photos[] per album

Requires:  pip install requests beautifulsoup4
"""
import argparse
import csv
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Install dependencies first:  pip install requests beautifulsoup4")


CATEGORY_BASE = "https://yang-jersey.x.yupoo.com/categories/3903592"
SITE = "https://yang-jersey.x.yupoo.com"
SLEEP_BETWEEN_REQUESTS = 0.6   # polite default; jitter added in fetch()

session = requests.Session()
session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
})


# ---------- HTTP helpers ----------

def warm_up():
    """Hit the homepage once so the session collects any cookies the site sets."""
    try:
        r = session.get(SITE, timeout=30)
        print(f"  warm-up: {r.status_code} ({len(r.content)} bytes)", file=sys.stderr)
    except Exception as e:
        print(f"  (warm-up request failed, continuing: {e})", file=sys.stderr)


def fetch(url: str, referer: str = None, retries: int = 3) -> str:
    headers = {}
    if referer:
        headers["Referer"] = referer
    for attempt in range(1, retries + 1):
        try:
            r = session.get(url, headers=headers, timeout=30)
            if r.status_code == 429 or r.status_code >= 500:
                wait = 2 ** attempt
                print(f"  HTTP {r.status_code} on {url} — waiting {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            if attempt == retries:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Failed to fetch {url} after {retries} attempts")


# ---------- Stage 1: category pages ----------

def detect_total_pages(html: str) -> int:
    """
    Yupoo serves a pagination span: <span ...>1 / 12</span>
    Parse the denominator from that.  Fall back to counting individual
    page-number links in the bottom pagination nav.
    """
    # Primary: "1 / 12" span
    m = re.search(r"categories__box-right-pagination-span[^>]*>[^<]*(\d+)\s*/\s*(\d+)", html)
    if m:
        return int(m.group(2))

    # Secondary: bottom nav page-number links  href="/categories/3903592?page=N"
    nums = [int(n) for n in re.findall(r"[?&]page=(\d+)", html)]
    if nums:
        return max(nums)

    return 1


def parse_category_page(html: str, page_num: int):
    """
    Each album is a div.categories__children containing:
      - <a class="album__main" href="..."> or data-href="..." (locked)
      - <div class="album__title">Title text</div>
    Locked albums have title="加密相册" on the <a> and use data-href.
    """
    soup = BeautifulSoup(html, "html.parser")
    albums = []
    seen = set()

    for child in soup.find_all("div", class_="categories__children"):
        a_tag = child.find("a", class_="album__main")
        if not a_tag:
            continue

        # Determine if locked (no real href, uses data-href; title="加密相册")
        href = a_tag.get("href", "")
        data_href = a_tag.get("data-href", "")
        raw_url = href or data_href
        if not raw_url:
            continue

        # Full URL: keep query params intact (uid/isSubCate/referrercate needed)
        if raw_url.startswith("/"):
            album_url = SITE + raw_url
        else:
            album_url = raw_url

        # Extract numeric album_id
        aid_match = re.search(r"/albums/(\d+)", raw_url)
        if not aid_match:
            continue
        aid = aid_match.group(1)
        if aid in seen:
            continue
        seen.add(aid)

        # Title: prefer the div.album__title sibling
        title_div = child.find("div", class_=re.compile(r"album__title"))
        if title_div:
            title = title_div.get_text(strip=True)
        else:
            title = a_tag.get("title", "").strip()

        # Locked when there's a lock image inside or title attr is "加密相册"
        is_locked = bool(
            a_tag.find("img", class_="album__lock")
            or a_tag.get("title") == "加密相册"
            or (not href and data_href)
        )

        # Cover image (useful for locked albums)
        cover_img = a_tag.find("img", class_="album__img")
        cover = ""
        if cover_img:
            cover = (cover_img.get("data-src")
                     or cover_img.get("src")
                     or cover_img.get("data-original")
                     or "")

        albums.append({
            "album_id": aid,
            "title": title,
            "album_url": album_url,
            "locked": is_locked,
            "cover_image": cover,
            "source_page": page_num,
        })

    return albums


def crawl_category(debug: bool = False):
    print("Stage 1: crawling category listing", file=sys.stderr)
    page1_url = f"{CATEGORY_BASE}?page=1"
    page1 = fetch(page1_url, referer=SITE)

    if debug:
        Path("debug_category_page1.html").write_text(page1, encoding="utf-8")
        print("  (saved debug_category_page1.html)", file=sys.stderr)

    total_pages = detect_total_pages(page1)
    print(f"  {total_pages} total pages detected", file=sys.stderr)

    all_albums = parse_category_page(page1, 1)
    print(f"  page 1: {len(all_albums)} albums", file=sys.stderr)

    for n in range(2, total_pages + 1):
        time.sleep(SLEEP_BETWEEN_REQUESTS)
        try:
            url = f"{CATEGORY_BASE}?page={n}"
            html = fetch(url, referer=page1_url)
            page_albums = parse_category_page(html, n)
            print(f"  page {n}: +{len(page_albums)} albums", file=sys.stderr)
            all_albums.extend(page_albums)
        except Exception as e:
            print(f"  page {n}: ERROR {e}", file=sys.stderr)

    unique = {}
    for a in all_albums:
        unique.setdefault(a["album_id"], a)
    return list(unique.values())


# ---------- Stage 2: per-album detail ----------

def parse_album_page(html: str):
    soup = BeautifulSoup(html, "html.parser")

    desc_parts = []
    for sel in [
        ".showalbumheader__gallerysubtitle",
        ".album__description",
        ".showalbumheader__gallerytitle",
        ".description",
    ]:
        for el in soup.select(sel):
            txt = el.get_text(" ", strip=True)
            if txt and txt not in desc_parts:
                desc_parts.append(txt)
    description = "\n".join(desc_parts).strip()

    # Photos: any photo.yupoo.com/yang-jersey/ image, upgraded to /big
    photos = []
    seen = set()
    for img in soup.find_all("img"):
        src = (img.get("data-original")
               or img.get("data-src")
               or img.get("src")
               or "")
        if "photo.yupoo.com/yang-jersey/" not in src:
            continue
        if "icon-lock" in src:
            continue
        big = re.sub(r"/(small|medium)\.(jpe?g|png)$", r"/big.\2", src)
        if big in seen:
            continue
        seen.add(big)
        photos.append(big)

    return description, photos


def enrich_albums(albums, limit=None, debug: bool = False):
    print(f"\nStage 2: fetching album bodies for descriptions + photos",
          file=sys.stderr)
    todo = [a for a in albums if not a["locked"]]
    if limit:
        todo = todo[:limit]
        print(f"  (limited to first {limit} for testing)", file=sys.stderr)
    else:
        print(f"  ({len(todo)} unlocked albums to fetch)", file=sys.stderr)

    for i, a in enumerate(todo, 1):
        time.sleep(SLEEP_BETWEEN_REQUESTS)
        referer = f"{CATEGORY_BASE}?page={a.get('source_page', 1)}"
        try:
            html = fetch(a["album_url"], referer=referer)
            if debug and i == 1:
                Path("debug_album_first.html").write_text(html, encoding="utf-8")
                print("  (saved debug_album_first.html)", file=sys.stderr)
            desc, photos = parse_album_page(html)
            a["description"] = desc
            a["photos"] = photos
            a["photo_count"] = len(photos)
            if i % 25 == 0 or i == len(todo):
                print(f"  {i}/{len(todo)} albums fetched", file=sys.stderr)
        except Exception as e:
            a["description"] = ""
            a["photos"] = []
            a["photo_count"] = 0
            a["fetch_error"] = str(e)
            print(f"  {i}/{len(todo)}: ERROR on {a['album_id']}: {e}",
                  file=sys.stderr)

    # Fill in defaults for locked albums
    for a in albums:
        if a["locked"]:
            a.setdefault("description", "")
            a.setdefault("photos", [])
            a.setdefault("photo_count", 0)

    return albums


# ---------- Stage 3: photo download ----------

def _download_one(args):
    """Worker: download a single photo. Returns (dest_path, ok, error_msg)."""
    url, dest, referer = args
    if dest.exists():
        return dest, True, "already exists"
    try:
        r = session.get(url, timeout=60, stream=True,
                        headers={"Referer": referer})
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
        return dest, True, ""
    except Exception as e:
        return dest, False, str(e)


def download_photos(albums, photos_dir: Path, workers: int = 4):
    """Download all photos from the JSON into photos/<album_id>/<n>.jpg."""
    tasks = []
    for a in albums:
        if not a.get("photos"):
            continue
        aid = a["album_id"]
        referer = a.get("album_url", SITE)
        for n, url in enumerate(a["photos"], 1):
            ext = url.rsplit(".", 1)[-1] if "." in url.rsplit("/", 1)[-1] else "jpg"
            dest = photos_dir / str(aid) / f"{n:03d}.{ext}"
            tasks.append((url, dest, referer))

    total = len(tasks)
    done = skipped = failed = 0
    print(f"\nStage 3: downloading {total} photos with {workers} workers",
          file=sys.stderr)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_download_one, t): t for t in tasks}
        for i, fut in enumerate(as_completed(futures), 1):
            _, ok, msg = fut.result()
            if msg == "already exists":
                skipped += 1
            elif ok:
                done += 1
            else:
                failed += 1
            if i % 500 == 0 or i == total:
                print(f"  {i}/{total}  saved={done}  skipped={skipped}  errors={failed}",
                      file=sys.stderr)

    print(f"\nDownload complete: {done} saved, {skipped} skipped, {failed} errors",
          file=sys.stderr)


# ---------- Main ----------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog-only", action="store_true",
                        help="Skip stage 2 (album detail fetch)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Fetch at most N album pages (for testing)")
    parser.add_argument("--debug", action="store_true",
                        help="Save raw HTML of first category page + first album")
    parser.add_argument("--download-photos", action="store_true",
                        help="Stage 3: download all photos into photos/<album_id>/")
    parser.add_argument("--photos-dir", type=Path, default=Path("photos"),
                        help="Root folder for downloaded photos (default: ./photos)")
    parser.add_argument("--workers", type=int, default=4,
                        help="Parallel download threads (default: 4)")
    args = parser.parse_args()

    # --download-photos: load existing JSON, skip re-scraping
    if args.download_photos:
        json_path = Path("retro_albums_full.json")
        if not json_path.exists():
            sys.exit("retro_albums_full.json not found — run without --download-photos first")
        albums = json.loads(json_path.read_text(encoding="utf-8"))
        print(f"Loaded {len(albums)} albums from {json_path}", file=sys.stderr)
        download_photos(albums, args.photos_dir, workers=args.workers)
        return

    warm_up()
    albums = crawl_category(debug=args.debug)
    unlocked = sum(1 for a in albums if not a["locked"])
    locked = sum(1 for a in albums if a["locked"])
    print(f"\nStage 1 complete: {len(albums)} albums total "
          f"({unlocked} unlocked, {locked} locked)", file=sys.stderr)

    if not args.catalog_only:
        albums = enrich_albums(albums, limit=args.limit, debug=args.debug)

    out = Path(".")
    (out / "retro_albums_full.json").write_text(
        json.dumps(albums, indent=2, ensure_ascii=False), encoding="utf-8")

    csv_fields = ["album_id", "title", "album_url", "photo_count",
                  "locked", "description", "source_page"]
    csv_path = out / "retro_albums.csv"
    # If the file is locked (e.g. open in Excel), fall back to a temp name
    try:
        csv_path.open("a").close()
    except PermissionError:
        csv_path = out / "retro_albums_new.csv"
        print(f"  retro_albums.csv is locked — writing to retro_albums_new.csv instead",
              file=sys.stderr)
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        w.writeheader()
        for a in albums:
            w.writerow(a)

    print(f"\nDONE.", file=sys.stderr)
    print(f"  retro_albums.csv         ({len(albums)} rows)", file=sys.stderr)
    print(f"  retro_albums_full.json", file=sys.stderr)


if __name__ == "__main__":
    main()
