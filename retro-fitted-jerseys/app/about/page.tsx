import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-black text-cream mb-2">About Us</h1>
      <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-10">
        The story behind Retro Fitted Jerseys
      </p>

      <div className="prose prose-invert max-w-none space-y-6 text-muted leading-relaxed">
        <p>
          Football shirts carry memories like nothing else in sport. The colour of the
          fabric, the badge on the chest, the sponsor on the front — each element
          telegraphs a precise moment in time. At{" "}
          <strong className="text-cream">Retro Fitted Jerseys</strong>, we&apos;ve built
          the most comprehensive catalog of classic football kits available anywhere.
        </p>
        <p>
          We source directly from specialist manufacturers who understand the craft:
          authentic polyester weaves, period-correct crests, accurate colourways. Every
          jersey in our catalog is a faithful recreation of the original — not a
          generic retro pastiche.
        </p>
        <h2 className="text-cream text-xl font-bold mt-8">Why we exist</h2>
        <p>
          The 1980s, 1990s, and early 2000s produced some of the most iconic kits the
          game has ever seen. Umbro diamonds, Adidas three-stripe shoulders, Kappa
          press-stud collars — these weren&apos;t just shirts; they were cultural artifacts.
          We believe those kits deserve to live on, worn by fans who actually remember
          them and discovered by a new generation who should.
        </p>
        <h2 className="text-cream text-xl font-bold mt-8">Our catalog</h2>
        <p>
          Over 1,300 jerseys spanning 14 decades and 100+ teams across six continents.
          From 1970 West Germany to 2010 Barcelona, from Cameroon&apos;s sleeveless 2002
          kit to the 1994 Colombia home — if it mattered to the game, it&apos;s in our
          catalog.
        </p>
      </div>

      <div className="mt-12 flex gap-4">
        <Link
          href="/shop"
          className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Shop the Catalog
        </Link>
        <Link
          href="/faq"
          className="border border-border hover:border-cream text-cream px-6 py-3 rounded-lg transition-colors"
        >
          FAQ
        </Link>
      </div>
    </div>
  );
}
