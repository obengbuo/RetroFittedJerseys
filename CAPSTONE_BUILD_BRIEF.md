# Retro Fitted Jerseys — Capstone Build Brief

## Project context

**Retro Fitted Jerseys** is a capstone project for Stone (Obeng Kwaku Buo): a working e-commerce storefront for retro football shirts, sourced from a Yupoo wholesale catalog (Yang Jersey). The site must look and behave like a real production store — the grader will load it, browse products, add to cart, and complete a checkout using a Stripe test card.

This is a **graded school project**, not a live business but could be a live business so create like it's a live business. The grader cares about technical execution, polish, and a clean engineering story.

**Deadline:** 14 days from project start.
**Working directory:** `C:\\Users\\kbuo1\\OneDrive\\Documents\\DevOps\\RETROFITTEDJERSEYS`
**Brand name:** Retro Fitted Jerseys
**Target domain:** `retrofittedjerseys.com` or similar (Stone will register)

## What "done" looks like

A grader visits the deployed URL and can:

1. Land on a polished homepage with hero + featured retro jerseys
2. Browse a catalog filterable by team, decade, and kit type
3. Open a product detail page with multiple photos, size selector, and price
4. Add items to a cart, view the cart, proceed to checkout
5. Complete checkout using test card `4242 4242 4242 4242`
6. See an order confirmation page with order details
7. Receive Stripe's automatic email receipt (in test mode)

Everything else is bonus. Stone's grade is determined by these 7 steps working end-to-end with no errors.

## Stack

* **Frontend / backend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
* **Data:** Static `products.json` committed to the repo. No database for v1 — Stone will mention "easy migration path to Postgres" in the presentation, but does not build it.
* **Payments:** Stripe Checkout (hosted, not Elements). Test mode only.
* **Order persistence:** Stripe webhook writes to a local SQLite file (`orders.db`) or a JSON file. Just needs to demonstrate the webhook flow works.
* **Image hosting:** Vercel can serve images directly from `public/`. For \~50 products × \~5 photos each, this is fine. No Cloudinary needed.
* **Deployment:** Vercel free tier, custom domain pointed at it.
* **Repo:** Git, pushed to GitHub. Public or private — Stone's call.

## Existing assets

The working directory already contains:

* `yupoo\_scrape\_full\_v2.py` — scraper, currently broken on pagination and album 404s
* `debug\_category\_page1.html` — raw HTML from a failed scrape run; read this to diagnose
* `retro\_albums.csv`, `retro\_albums\_full.json` — All albums, already parsed. 
* `AGENT\_BRIEF.md` — earlier brief for finishing the scraper 

## The build, by week

### Week 1: Data + storefront skeleton

#### Day 1 — Scraper triage

Goal: get usable product data.

1. Read `debug\_category\_page1.html`. Find why pagination detection returns "1 total pages" and why album URLs 404. Likely culprits: JS-rendered pagination, missing cookies, Referer requirement, or a query param suffix like `?uid=1\&isSubCate=false\&referrercate=3903592`.
2. Fix `yupoo\_scrape\_full\_v2.py` if possible. **Timebox to 4 hours.** If it's not working by then, stop. The 120-album sample is sufficient for the capstone — declare victory and move on. The grader will not count products.
3. Either way, end Day 1 with a working `retro\_albums.csv` (full or partial) that has: album\_id, title, photos array, photo count.

#### Day 2 — Transform script

Build `transform.py` that converts the scraped CSV into a clean `products.json` for the Next.js app to consume.

Required output schema:

```json
{
  "id": "1986-mexico-home",
  "slug": "1986-mexico-home-retro",
  "title": "1986 Mexico Home Retro Jersey",
  "year": 1986,
  "decade": "1980s",
  "team": "Mexico",
  "league\_or\_country": "Mexico",
  "kit\_type": "home",
  "sleeve": "short",
  "price\_usd": 79.99,
  "compare\_at\_price\_usd": 119.99,
  "in\_stock": true,
  "available\_sizes": \["S", "M", "L", "XL", "XXL"],
  "description": "Templated description — see below",
  "images": \["/products/1986-mexico-home/1.jpg", "..."],
  "featured": false,
  "tags": \["mexico", "1980s", "home", "national-team", "world-cup"]
}
```

Transform logic:

* Parse `year`, `team`, `kit\_type`, `sleeve` from the title using regex
* Generate `slug` from year + team + kit\_type
* Pricing: random retail in $59-$99 range, with `compare\_at\_price` \~50% higher to show a "sale" — this is for visual appeal; Stone can tune later
* Mark 8-12 products as `featured: true` for the homepage
* Generate a templated `description` for each:

```
  Authentic retro-style {team} {year} {kit\_type} jersey. Faithful recreation of the iconic kit worn during the {decade}, featuring period-correct details and crest design. Premium polyester construction with authentic stitching. Available in sizes S through XXL.
  ```

* Download all referenced photos to `public/products/<slug>/N.jpg` and rewrite image paths to local
* Filter out locked albums and albums with 0 photos

Output: `app/data/products.json` ready for Next.js to import.

#### Day 3 — Next.js scaffold + design system

1. `npx create-next-app@latest retro-fitted-jerseys --typescript --tailwind --app --eslint`
2. Install: `npm i lucide-react clsx tailwind-merge`
3. Set up shadcn/ui: `npx shadcn-ui@latest init`, install `button`, `card`, `input`, `select`, `dialog`, `sheet`, `badge`
4. Pick a design direction: dark, retro-sport aesthetic. Reference: classicfootballshirts.com for inspiration. Stone will likely want a black/cream/red palette — classic football poster vibes.
5. Build core layout: `app/layout.tsx` with navbar (logo, nav links, cart icon with count) and footer (links, copyright)
6. Deploy to Vercel **today**. Even if it's just the layout. Deployment as a deadline-day surprise is how capstones die.

#### Day 4 — Catalog pages

1. `app/page.tsx` (homepage): hero section with brand statement, featured products grid (8-12 cards), "Shop by Decade" tiles, footer CTA
2. `app/shop/page.tsx` (catalog): grid of all products with sidebar filters
3. Filters work client-side via URL search params: `?team=arsenal\&decade=1990s\&kit=home`
4. Product cards show: photo, title, year, price (with compare-at strikethrough)

#### Day 5 — Product detail page

`app/product/\[slug]/page.tsx`:

* Image gallery (main image + thumbnails, click to swap)
* Title, year, team, price
* Size selector (pills, with sold-out states for fake variety)
* "Add to Cart" button
* Description, materials, "Authenticity \& Quality" reassurance section
* "Related Products" — 4 random products with same `decade` or `team`
* Use `generateStaticParams` to pre-render all product pages at build time (this is your SSG brag for the presentation)

### Week 2: Commerce + polish + ship

#### Day 6 — Cart state

1. Cart state in Zustand (lighter than Redux, fits in 30 lines): `app/lib/cart-store.ts`
2. Persist to localStorage so refresh doesn't empty the cart
3. Cart drawer component (slides from right), shows line items with photo/title/size/quantity/remove
4. Cart total, item count badge on navbar
5. `app/cart/page.tsx` with full cart view + "Proceed to Checkout" button

#### Day 7-8 — Stripe Checkout

1. `npm i stripe @stripe/stripe-js`
2. Stripe test mode keys in `.env.local`: `STRIPE\_SECRET\_KEY`, `NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY`, `STRIPE\_WEBHOOK\_SECRET`
3. `app/api/checkout/route.ts`: POST endpoint that creates a Stripe Checkout Session with the cart items (use `line\_items` with `price\_data` since these are dynamic, not pre-created Stripe products). Set `success\_url` to `/order/success?session\_id={CHECKOUT\_SESSION\_ID}` and `cancel\_url` to `/cart`.
4. `app/api/webhooks/stripe/route.ts`: POST endpoint that verifies Stripe signature and handles `checkout.session.completed`. Writes order to `orders.db` (SQLite via `better-sqlite3`) with: session ID, line items, customer email, total, timestamp.
5. `app/order/success/page.tsx`: server component that retrieves the session via Stripe API and displays a clean confirmation page: order ID, items purchased, total, "we'll email you shortly" reassurance copy.
6. Test the full flow: cart → checkout → test card → webhook fires → success page → check `orders.db` has the row.

Use `stripe-cli` (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) for local webhook testing.

#### Day 9 — Real photography + copy polish

1. Pick the 50 best products. Re-process their images: download from Yupoo at full resolution, run through a quick `sharp` script to resize to 1200×1200 and 600×600 variants, place in `public/products/<slug>/`.
2. Write actual copy for: About page, FAQ, Shipping \& Returns, Size Guide. ChatGPT/Claude can draft these; Stone reviews and tweaks for voice.
3. Add Open Graph tags for social previews (Vercel makes this easy with `metadata` in layout).

#### Day 10 — Search + mobile

1. Add a search bar in the navbar. Client-side filter against title/team/year. Use `cmdk` for a slick command-palette feel if there's time.
2. Mobile audit: every page on a 375px viewport. Fix anything that's broken. Cart drawer especially.
3. Loading states: skeleton screens on the catalog page, button spinners on "Add to Cart" and "Checkout".

#### Day 11 — Domain + production check

1. Stone buys domain at Namecheap (\~$12). Point at Vercel via DNS.
2. Vercel project → Settings → Domains → add the custom domain.
3. Production env vars set in Vercel dashboard: live (test-mode) Stripe keys, webhook secret.
4. Verify webhook works in production: Stripe Dashboard → Developers → Webhooks → add endpoint `https://retrofittedjerseys.com/api/webhooks/stripe`.
5. Do a full end-to-end test on the production URL: real (test) card, real webhook delivery, real success page.

#### Day 12 — Buffer

Reserved for what breaks. Something will break. If nothing breaks, build ONE flourish:

* Animated hero (Framer Motion)
* "Recently viewed" rail using localStorage
* Newsletter signup that goes nowhere but looks legit
* A blog post or two about retro shirt history (drives the "this looks real" perception hard)

#### Day 13 — Presentation prep

1. Write `README.md` for the GitHub repo. Sections: stack, architecture decisions, scraping approach, Stripe integration, deployment, "what I'd do next" (Postgres migration, real inventory, etc.)
2. Demo script: a 90-second walkthrough Stone can do live. Land on homepage → click featured product → add to cart → checkout → complete with test card → show order confirmation. Practice it.
3. Slide deck if required. Architecture diagram, key engineering decisions, screenshots.

#### Day 14 — Submission

1. Final deploy
2. Verify URL works from a fresh browser / incognito / phone
3. Submit

## Architectural decisions to defend in presentation

When the grader asks "why X over Y?", Stone should have answers ready:

* **Why Next.js + JSON over Shopify?** Custom control, demonstrates full-stack skill, faster page loads via SSG, no per-transaction fees, portfolio piece. Shopify is a no-code tool; this is engineering.
* **Why JSON over Postgres?** YAGNI. 50 products, read-only catalog, static at build time. Migration path: swap `import products from './data/products.json'` for `await prisma.product.findMany()`. One-line change.
* **Why Stripe Checkout over Elements?** Hosted Checkout is PCI-compliant out of the box, mobile-optimized, supports Apple Pay/Google Pay automatically, faster to build. Elements would be 3 extra days for marginal benefit.
* **Why no user accounts?** Out of scope for v1. Guest checkout is the standard for first purchases in real e-commerce anyway (per Baymard Institute research). Account creation comes after Stripe customer object exists from first order — that's the natural upgrade path.
* **Why scraped data?** Real-world product catalogs come from suppliers, not from manual entry. The scraper demonstrates ETL skills; the transform demonstrates schema design.

## File structure target

```
retro-fitted-jerseys/
├── app/
│   ├── layout.tsx              # Navbar, footer, providers
│   ├── page.tsx                # Homepage
│   ├── shop/page.tsx           # Catalog with filters
│   ├── product/\[slug]/page.tsx # Product detail
│   ├── cart/page.tsx           # Full cart view
│   ├── order/success/page.tsx  # Post-checkout confirmation
│   ├── about/page.tsx
│   ├── faq/page.tsx
│   ├── shipping/page.tsx
│   ├── api/
│   │   ├── checkout/route.ts
│   │   └── webhooks/stripe/route.ts
│   ├── components/             # Reusable UI
│   ├── lib/
│   │   ├── cart-store.ts       # Zustand cart
│   │   ├── stripe.ts           # Stripe client init
│   │   └── db.ts               # SQLite for orders
│   └── data/
│       └── products.json
├── public/
│   └── products/<slug>/N.jpg
├── scripts/
│   ├── transform.py            # CSV → products.json
│   └── download-images.py      # Yupoo → public/products
├── orders.db                   # SQLite, gitignored
├── .env.local                  # Stripe keys, gitignored
└── README.md
```

## Feature additions (post-Day-8 updates)

### Pricing tiers (fixed, not random)
- **1990s and below (year ≤ 1999):** $65.99 retail / $94.99 compare-at
- **2000–2019:** $59.99 retail / $88.99 compare-at
- **2020–present:** $41.99 retail / $70.99 compare-at

### Catalogue organisation
- Jerseys sorted alphabetically within each year grouping.
- Shop page grouped by country/league by default (e.g. "England", "Spain", "Brazil").
- National-team jerseys (Brazil national, Spain national, etc.) go under **"International / National Teams"** regardless of country.
- Sidebar filter: **league/country filter** replaces the old team filter. Leagues shown: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Primeira Liga, Scottish Premiership, Süper Lig, South America, International / National Teams, and others derived from data.

### Jersey customisation (product detail page)
Each add-on is **+$3.00** and optional; customers can mix and match.

| Add-on | Input | Constraint |
|---|---|---|
| Custom name | Text field | Max 12 characters, letters + numbers |
| Custom number | Number field | Integer 1–99 only |
| League / tournament patch | Dropdown | See list below |

**Patch options:**
1. UEFA Champions League
2. UEFA Europa League
3. FIFA World Cup
4. UEFA European Championship (Euro)
5. Copa América
6. FA Cup
7. Premier League
8. La Liga
9. Serie A
10. Bundesliga
11. Ligue 1

Each selected add-on appears as a **separate $3.00 line item** in the Stripe Checkout receipt.
The cart drawer and cart page must also display customisations per line item.

## Failure modes to anticipate

* **Scraper still broken on Day 1.** Don't waste more than 4 hours. Use the 120-album sample. Move on.
* **Stripe webhook signature verification failing.** This is the #1 thing that breaks. Use `stripe-cli` to forward locally; the CLI prints the signing secret to use.
* **Photos too large, Vercel deploy slow.** Resize everything to ≤1200px wide. Run through `sharp` or `tinypng`.
* **localStorage cart not hydrating on first render.** Common Next.js SSR/CSR mismatch. Wrap cart UI in `useEffect` mount check or use `next/dynamic` with `ssr: false` for the cart drawer.
* **Domain DNS hasn't propagated.** Buy the domain on Day 9, not Day 13.

## Acceptance criteria

* Site loads at custom domain with no console errors
* Homepage, catalog, ≥1 product detail page render correctly
* Cart adds, removes, persists across refresh
* Stripe test checkout completes successfully end-to-end
* Webhook fires and writes order to `orders.db`
* Order confirmation page displays real order details
* Mobile-responsive (passes basic 375px viewport test)
* README documents stack, decisions, and run instructions
* Repo is clean: no committed `.env.local`, no node\_modules, no `orders.db`

## What to report back

When stuck or done, summarize:

1. What's deployed (URL + commit hash)
2. What works end-to-end vs. what's stubbed
3. Any blockers needing Stone's decision (domain choice, design taste calls, etc.)
4. Time burned vs. remaining

Don't ask permission for normal next steps. Read this brief, get going, iterate. Ping Stone only when you need a decision he uniquely can make (brand voice, color palette, content copy).

