#!/usr/bin/env python3
"""
transform.py — Convert retro_albums_full.json → products.json for the Next.js app.

Usage:
    python scripts/transform.py [--app-dir retro-fitted-jerseys] [--limit N] [--no-copy]

Outputs:
    <app-dir>/app/data/products.json
    <app-dir>/public/products/<slug>/1.jpg  (copies from photos/<album_id>/)
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

# ── Pricing tiers ─────────────────────────────────────────────────────────────

def get_price(year) -> tuple[float, float]:
    """Return (price, compare_at) based on year tier."""
    if year is None or year < 2000:
        return 65.99, 94.99   # 1990s and below
    elif year < 2020:
        return 59.99, 88.99   # 2000–2019
    else:
        return 41.99, 70.99   # 2020–present

# ── Lookup tables ─────────────────────────────────────────────────────────────

# Known national teams — these go into "International / National Teams" group
NATIONAL_TEAMS = {
    "argentina", "brazil", "england", "france", "germany", "italy",
    "netherlands", "portugal", "spain", "mexico", "japan", "south korea",
    "nigeria", "senegal", "cameroon", "usa", "united states", "croatia",
    "denmark", "sweden", "norway", "belgium", "russia", "ukraine",
    "colombia", "chile", "uruguay", "peru", "ecuador", "paraguay",
    "ghana", "ivory coast", "morocco", "yugoslavia", "czechoslovakia",
    "soviet union", "west germany", "republic of ireland", "ireland",
    "scotland", "wales", "austria", "switzerland", "turkey", "poland",
    "hungary", "romania", "bulgaria", "czech republic", "slovakia",
    "australia", "new zealand", "south africa", "egypt", "algeria",
    "saudi arabia", "iran", "china", "costa rica", "honduras", "panama",
    "jamaica", "trinidad", "bolivia",
}

# Club team → league/country (used for both league_or_country and group)
LEAGUE_LOOKUP = {
    # Premier League clubs → England
    "manchester united": "Premier League", "man united": "Premier League",
    "manchester city": "Premier League", "man city": "Premier League",
    "arsenal": "Premier League", "chelsea": "Premier League",
    "liverpool": "Premier League", "tottenham": "Premier League",
    "spurs": "Premier League", "newcastle": "Premier League",
    "leeds united": "Premier League", "leeds": "Premier League",
    "aston villa": "Premier League", "everton": "Premier League",
    "west ham": "Premier League", "west ham united": "Premier League",
    "blackburn": "Premier League", "leicester": "Premier League",
    "southampton": "Premier League", "nottingham forest": "Premier League",
    "ipswich": "Premier League", "crystal palace": "Premier League",
    "sheffield wednesday": "Premier League", "coventry": "Premier League",
    "bolton": "Premier League", "fulham": "Premier League",
    "charlton": "Premier League", "middlesbrough": "Premier League",
    "sunderland": "Premier League", "wigan": "Premier League",
    # La Liga clubs → Spain
    "barcelona": "La Liga", "real madrid": "La Liga", "atletico madrid": "La Liga",
    "atletico": "La Liga", "valencia": "La Liga", "sevilla": "La Liga",
    "villarreal": "La Liga", "real sociedad": "La Liga", "athletic bilbao": "La Liga",
    "deportivo": "La Liga", "real zaragoza": "La Liga", "racing santander": "La Liga",
    "celta vigo": "La Liga", "mallorca": "La Liga", "betis": "La Liga",
    "real betis": "La Liga", "getafe": "La Liga", "osasuna": "La Liga",
    "lvp": "La Liga",  # Valencia CF retro kits branded as "LVP"
    # Serie A clubs → Italy
    "juventus": "Serie A", "ac milan": "Serie A", "ac": "Serie A",
    "inter milan": "Serie A", "inter": "Serie A", "roma": "Serie A",
    "lazio": "Serie A", "napoli": "Serie A", "fiorentina": "Serie A",
    "sampdoria": "Serie A", "parma": "Serie A", "udinese": "Serie A",
    "atalanta": "Serie A", "torino": "Serie A", "cagliari": "Serie A",
    "venezia": "Serie A", "bologna": "Serie A", "verona": "Serie A",
    # Bundesliga clubs → Germany
    "bayern munich": "Bundesliga", "borussia dortmund": "Bundesliga",
    "bvb": "Bundesliga", "schalke": "Bundesliga", "werder bremen": "Bundesliga",
    "hamburg": "Bundesliga", "borussia monchengladbach": "Bundesliga",
    "kaiserslautern": "Bundesliga", "bayer leverkusen": "Bundesliga",
    "vfb stuttgart": "Bundesliga", "wolfsburg": "Bundesliga",
    "eintracht frankfurt": "Bundesliga", "hoffenheim": "Bundesliga",
    # Ligue 1 clubs → France
    "psg": "Ligue 1", "paris saint germain": "Ligue 1", "marseille": "Ligue 1",
    "lyon": "Ligue 1", "monaco": "Ligue 1", "saint etienne": "Ligue 1",
    "bordeaux": "Ligue 1", "lens": "Ligue 1", "nantes": "Ligue 1",
    "lille": "Ligue 1", "rennes": "Ligue 1", "nice": "Ligue 1",
    # Eredivisie clubs → Netherlands
    "ajax": "Eredivisie", "psv": "Eredivisie", "feyenoord": "Eredivisie",
    "eindhoven": "Eredivisie", "az alkmaar": "Eredivisie",
    # Primeira Liga clubs → Portugal
    "benfica": "Primeira Liga", "porto": "Primeira Liga", "sporting": "Primeira Liga",
    "braga": "Primeira Liga",
    # Scottish Premiership
    "celtic": "Scottish Premiership", "rangers": "Scottish Premiership",
    "hearts": "Scottish Premiership", "hibernian": "Scottish Premiership",
    # Süper Lig
    "galatasaray": "Süper Lig", "fenerbahce": "Süper Lig",
    "besiktas": "Süper Lig", "trabzonspor": "Süper Lig",
    # Belgian
    "anderlecht": "Belgian Pro League", "club brugge": "Belgian Pro League",
    # Argentine clubs → Argentina (clubs, not national team)
    "boca juniors": "Argentine Liga", "river plate": "Argentine Liga",
    "san lorenzo": "Argentine Liga", "independiente": "Argentine Liga",
    "racing club": "Argentine Liga", "estudiantes": "Argentine Liga",
    "velez sarsfield": "Argentine Liga",
    # Brazilian clubs → Brazil (clubs)
    "flamengo": "Brazilian Série A", "corinthians": "Brazilian Série A",
    "palmeiras": "Brazilian Série A", "santos": "Brazilian Série A",
    "sao paulo": "Brazilian Série A", "cruzeiro": "Brazilian Série A",
    "fluminense": "Brazilian Série A", "gremio": "Brazilian Série A",
    "internacional": "Brazilian Série A", "atletico mineiro": "Brazilian Série A",
    "vasco": "Brazilian Série A",
    # Uruguay clubs
    "penarol": "Uruguayan Liga", "nacional": "Uruguayan Liga",
    # Other South America
    "olimpia": "South American Club", "libertad": "South American Club",
    "colo colo": "South American Club", "universidad de chile": "South American Club",
    "nacional medellin": "South American Club",
}

# Map league → display group (country name for clubs)
LEAGUE_TO_GROUP = {
    "Premier League": "England",
    "La Liga": "Spain",
    "Serie A": "Italy",
    "Bundesliga": "Germany",
    "Ligue 1": "France",
    "Eredivisie": "Netherlands",
    "Primeira Liga": "Portugal",
    "Scottish Premiership": "Scotland",
    "Süper Lig": "Turkey",
    "Belgian Pro League": "Belgium",
    "Argentine Liga": "Argentina",
    "Brazilian Série A": "Brazil",
    "Uruguayan Liga": "Uruguay",
    "South American Club": "South America",
    "International": "Other",
}

# Ordered by length (longest first) so "West Ham United" matches before "West Ham"
KNOWN_TEAMS = sorted(LEAGUE_LOOKUP.keys(), key=len, reverse=True)

# Words to strip when cleaning team names
NOISE = re.compile(
    r"\b(retro|vintage|classic|special edition|anniversary|"
    r"football|soccer|futbol|jersey|shirt|kit|"
    r"s-xxl|s-xl|xl|xxl|s/m|"
    r"long sleeve[s]?|short sleeve[s]?|long|"
    r"away|home|third|goalkeeper|gk|training|"
    r"bringback|bring back|"
    r"adidas|nike|puma|umbro|kappa|le coq sportif|"
    r"world cup|euro|copa america|champions league|"
    r"[0-9]{4}(?:/[0-9]{2})?)\b",
    re.I,
)

KIT_TYPES = {
    "goalkeeper": "goalkeeper", "gk": "goalkeeper",
    "training suit": "training", "training": "training",
    "third": "third",
    "away": "away",
    "home": "home",
}

# ── Parsing helpers ───────────────────────────────────────────────────────────

def extract_year(title: str):
    m = re.search(r"\b((?:19|20)\d{2})(?:/\d{2})?\b", title)
    if m:
        y = int(m.group(1))
        return y, f"{(y // 10) * 10}s"
    return None, None


def extract_kit_type(title: str) -> str:
    tl = title.lower()
    for kw, kt in KIT_TYPES.items():
        if re.search(r"\b" + re.escape(kw) + r"\b", tl):
            return kt
    return "home"


def extract_sleeve(title: str) -> str:
    tl = title.lower()
    if re.search(r"\blong[\s\-]?sleeve[ds]?\b", tl):
        return "long"
    return "short"


def extract_team(title: str) -> str:
    tl = title.lower()
    for team in KNOWN_TEAMS:
        if re.search(r"\b" + re.escape(team) + r"\b", tl):
            return " ".join(w.capitalize() for w in team.split())
    # Fallback: strip noise
    cleaned = NOISE.sub(" ", title)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    cleaned = re.sub(r"^[\s\-/|]+|[\s\-/|]+$", "", cleaned)
    return cleaned[:60] if cleaned else "Unknown"


def lookup_league(team: str) -> str:
    return LEAGUE_LOOKUP.get(team.lower(), "International")


def get_group(team: str, league: str) -> str:
    """Display group: country name for clubs, special bucket for national teams."""
    if team.lower() in NATIONAL_TEAMS:
        return "International / National Teams"
    return LEAGUE_TO_GROUP.get(league, league or "Other")


def make_slug(year, team: str, kit_type: str, suffix: int = 0) -> str:
    base = f"{year or 'retro'}-{team}-{kit_type}"
    base = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    base = re.sub(r"-{2,}", "-", base)
    if suffix:
        base = f"{base}-{suffix}"
    return base[:80]


def make_description(team: str, year, kit_type: str, decade: str, sleeve: str) -> str:
    decade_str = decade or "the era"
    sleeve_str = "long-sleeve " if sleeve == "long" else ""
    kit_label = {"home": "home", "away": "away", "third": "third",
                 "goalkeeper": "goalkeeper", "training": "training"}.get(kit_type, "home")
    return (
        f"Authentic retro-style {sleeve_str}{team} {year or ''} {kit_label} jersey. "
        f"Faithful recreation of the iconic kit worn during {decade_str}, featuring "
        f"period-correct details and crest design. Premium polyester construction "
        f"with authentic stitching. Available in sizes S through XXL."
    ).strip()


def make_tags(team: str, decade: str, kit_type: str, league: str) -> list[str]:
    tags = []
    for w in team.lower().split():
        if len(w) > 2:
            tags.append(w)
    if decade:
        tags.append(decade)
    tags.append(kit_type)
    for w in league.lower().replace(" ", "-").split("-"):
        if len(w) > 2:
            tags.append(w)
    return list(dict.fromkeys(tags))


# ── Main transform ────────────────────────────────────────────────────────────

def transform(albums, photos_src: Path, app_dir: Path,
              limit: int = None, copy_images: bool = True) -> list[dict]:
    usable = [a for a in albums if not a.get("locked") and a.get("photos")]
    if limit:
        usable = usable[:limit]
    print(f"Transforming {len(usable)} albums …")

    public_products = app_dir / "public" / "products"
    public_products.mkdir(parents=True, exist_ok=True)

    slugs_seen: dict[str, int] = {}
    products = []

    usable_sorted = sorted(usable, key=lambda a: len(a.get("photos", [])), reverse=True)
    featured_ids = {a["album_id"] for a in usable_sorted[:12]}

    for a in usable:
        title = a["title"]
        year, decade = extract_year(title)
        kit_type = extract_kit_type(title)
        sleeve = extract_sleeve(title)
        team = extract_team(title)
        league = lookup_league(team)
        group = get_group(team, league)
        price, compare_price = get_price(year)

        base_slug = make_slug(year, team, kit_type)
        count = slugs_seen.get(base_slug, 0)
        slugs_seen[base_slug] = count + 1
        slug = make_slug(year, team, kit_type, count) if count else base_slug

        album_photos_dir = photos_src / str(a["album_id"])
        image_paths = []
        if copy_images and album_photos_dir.exists():
            dest_dir = public_products / slug
            dest_dir.mkdir(parents=True, exist_ok=True)
            for n, src_file in enumerate(sorted(album_photos_dir.iterdir()), 1):
                ext = src_file.suffix.lower() or ".jpg"
                dest_file = dest_dir / f"{n}{ext}"
                if not dest_file.exists():
                    shutil.copy2(src_file, dest_file)
                image_paths.append(f"/products/{slug}/{n}{ext}")
        else:
            if album_photos_dir.exists():
                for n, src_file in enumerate(sorted(album_photos_dir.iterdir()), 1):
                    ext = src_file.suffix.lower() or ".jpg"
                    image_paths.append(f"/products/{slug}/{n}{ext}")

        if not image_paths:
            continue

        clean_title = title
        for suffix in [" Retro Jersey S-XXL", " Retro Soccer jersey S-XXL",
                       " Retro football jersey S-XXL", " Vintage football jersey S-XXL",
                       " retro football jersey S-XXL", " S-XXL"]:
            clean_title = clean_title.replace(suffix, "")
        clean_title = clean_title.strip()

        products.append({
            "id": slug,
            "slug": slug,
            "album_id": a["album_id"],
            "title": clean_title,
            "year": year,
            "decade": decade,
            "team": team,
            "league_or_country": league,
            "group": group,
            "kit_type": kit_type,
            "sleeve": sleeve,
            "price_usd": price,
            "compare_at_price_usd": compare_price,
            "in_stock": True,
            "available_sizes": ["S", "M", "L", "XL", "XXL"],
            "description": make_description(team, year, kit_type, decade, sleeve),
            "images": image_paths,
            "featured": a["album_id"] in featured_ids,
            "tags": make_tags(team, decade or "", kit_type, league),
        })

        if len(products) % 100 == 0:
            print(f"  {len(products)} products processed …")

    # Sort: by group → year → title (alphabetical within year)
    products.sort(key=lambda p: (
        p["group"],
        p["year"] or 0,
        p["title"].lower(),
    ))

    return products


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-dir", default="retro-fitted-jerseys")
    parser.add_argument("--source-json", default="retro_albums_full.json")
    parser.add_argument("--photos-dir", default="photos")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--no-copy", action="store_true")
    args = parser.parse_args()

    root = Path(__file__).parent.parent
    app_dir = root / args.app_dir
    photos_src = root / args.photos_dir
    json_path = root / args.source_json

    if not json_path.exists():
        sys.exit(f"Not found: {json_path}")

    albums = json.loads(json_path.read_text(encoding="utf-8"))
    print(f"Loaded {len(albums)} albums from {json_path.name}")

    products = transform(albums, photos_src, app_dir,
                         limit=args.limit,
                         copy_images=not args.no_copy)

    out_dir = app_dir / "app" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "products.json"
    out_path.write_text(json.dumps(products, indent=2, ensure_ascii=False),
                        encoding="utf-8")

    print(f"\nDone! {len(products)} products written to {out_path}")
    groups = sorted({p["group"] for p in products})
    print(f"  Groups ({len(groups)}): {', '.join(groups)}")
    prices = sorted({p["price_usd"] for p in products})
    print(f"  Price tiers: {prices}")
    print(f"  Featured: {sum(1 for p in products if p['featured'])}")
    print("\nSample:")
    for p in products[:3]:
        print(f"  [{p['group']}] {p['year']} {p['team']} — ${p['price_usd']} | {p['slug']}")


if __name__ == "__main__":
    main()
