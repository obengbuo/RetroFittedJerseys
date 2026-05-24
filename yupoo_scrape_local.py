#!/usr/bin/env python3
"""
Yang Jersey retro-shirt catalog scraper.

Fetches every page of https://yang-jersey.x.yupoo.com/categories/3903592
and writes retro_albums.csv + retro_albums.json with one row per album.

Requires:  pip install requests beautifulsoup4
Run:       python3 yupoo_scrape.py
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


BASE = "https://yang-jersey.x.yupoo.com/categories/3903592"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch_page(page_num: int) -> str:
    url = f"{BASE}?page={page_num}"
    print(f"  Fetching page {page_num}: {url}", file=sys.stderr)
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.text


def detect_total_pages(html: str) -> int:
    """Find '共N页' or fall back to scanning ?page=N links."""
    m = re.search(r"共\s*(\d+)\s*页", html)
    if m:
        return int(m.group(1))
    nums = [int(n) for n in re.findall(r"\?page=(\d+)", html)]
    return max(nums) if nums else 1


def parse_albums(html: str, page_num: int):
    """Extract album entries from a category page."""
    soup = BeautifulSoup(html, "html.parser")
    albums = []
    seen = set()

    # Each album is a <div class="album__main"> wrapping an <a href="/albums/NNN">
    # plus a <span class="album__title"> with the name and a count badge.
    # Locked albums have no <a>; the title appears as plain text.
    # We look for any <div class="album__main"> first; fallback to scanning
    # all /albums/ links if class structure changes.

    for card in soup.select("div.album__main, .showalbumheader__gallerysubtitle, .image__imgbox"):
        # Best-effort title
        title_el = card.find(class_=re.compile(r"album__title|title"))
        title = title_el.get_text(strip=True) if title_el else ""
        # Find an <a> linking to /albums/
        link = card.find("a", href=re.compile(r"/albums/\d+"))
        album_url = ""
        album_id = ""
        if link:
            album_url = link["href"]
            if album_url.startswith("/"):
                album_url = "https://yang-jersey.x.yupoo.com" + album_url
            id_match = re.search(r"/albums/(\d+)", album_url)
            if id_match:
                album_id = id_match.group(1)
        # Photo count is usually a small badge
        count_el = card.find(class_=re.compile(r"count|num"))
        try:
            photo_count = int(re.search(r"\d+", count_el.get_text()).group()) if count_el else 0
        except (AttributeError, ValueError):
            photo_count = 0
        locked = bool(card.find(class_=re.compile(r"lock"))) or not album_url
        cover_el = card.find("img")
        cover = cover_el.get("data-original") or cover_el.get("src") if cover_el else ""

        key = album_id or f"LOCKED_{title[:40]}_{page_num}_{len(albums)}"
        if key in seen or not title:
            continue
        seen.add(key)
        albums.append({
            "album_id": album_id or key,
            "title": title,
            "album_url": album_url,
            "photo_count": photo_count,
            "locked": locked,
            "cover_image": cover,
            "source_page": page_num,
        })

    # Fallback: if the structured selector found nothing (markup changed), use a
    # crude scan for every /albums/NNN link and pull title from its title attr.
    if not albums:
        for a in soup.find_all("a", href=re.compile(r"/albums/\d+")):
            href = a["href"]
            if href.startswith("/"):
                href = "https://yang-jersey.x.yupoo.com" + href
            aid = re.search(r"/albums/(\d+)", href).group(1)
            if aid in seen:
                continue
            seen.add(aid)
            title = a.get("title") or a.get_text(strip=True)
            if not title or title.isdigit():
                continue
            albums.append({
                "album_id": aid,
                "title": title,
                "album_url": href.split("?")[0],
                "photo_count": 0,
                "locked": False,
                "cover_image": "",
                "source_page": page_num,
            })

    return albums


def main():
    print("Fetching page 1 to detect pagination...", file=sys.stderr)
    first = fetch_page(1)
    total_pages = detect_total_pages(first)
    print(f"  Detected {total_pages} total pages", file=sys.stderr)

    all_albums = []
    all_albums.extend(parse_albums(first, 1))
    print(f"  page 1: {len(all_albums)} albums", file=sys.stderr)

    for n in range(2, total_pages + 1):
        time.sleep(0.5)  # be polite
        try:
            html = fetch_page(n)
            page_albums = parse_albums(html, n)
            print(f"  page {n}: +{len(page_albums)} albums", file=sys.stderr)
            all_albums.extend(page_albums)
        except Exception as e:
            print(f"  page {n}: ERROR {e}", file=sys.stderr)

    # De-dupe across pages
    unique = {}
    for a in all_albums:
        unique.setdefault(a["album_id"], a)
    all_albums = list(unique.values())

    out = Path(".")
    (out / "retro_albums.json").write_text(json.dumps(all_albums, indent=2, ensure_ascii=False))
    with open(out / "retro_albums.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["album_id", "title", "album_url", "photo_count", "locked", "cover_image", "source_page"])
        w.writeheader()
        w.writerows(all_albums)

    print(f"\nDONE. {len(all_albums)} unique albums.", file=sys.stderr)
    print(f"  Unlocked: {sum(1 for a in all_albums if not a['locked'])}", file=sys.stderr)
    print(f"  Locked:   {sum(1 for a in all_albums if a['locked'])}", file=sys.stderr)
    print(f"  Output:   retro_albums.csv, retro_albums.json", file=sys.stderr)


if __name__ == "__main__":
    main()
