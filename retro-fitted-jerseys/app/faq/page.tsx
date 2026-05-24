import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  {
    q: "Are these official licensed products?",
    a: "Our jerseys are high-quality retro-style recreations made by specialist manufacturers. They are not official licensed merchandise from the clubs or federations.",
  },
  {
    q: "What sizes do you carry?",
    a: "All jerseys are available in S, M, L, XL, and XXL. Sizing follows standard international measurements — please refer to our Size Guide for measurements.",
  },
  {
    q: "How long does shipping take?",
    a: "Orders typically ship within 3–5 business days. International delivery takes 7–14 business days depending on your location.",
  },
  {
    q: "Can I return or exchange a jersey?",
    a: "Yes. We accept returns within 30 days of delivery for unworn items in original condition. Exchanges for a different size are free of charge.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex), as well as Apple Pay and Google Pay, processed securely through Stripe.",
  },
  {
    q: "Are the photos on the site the actual product?",
    a: "Yes — every image is of the actual jersey sourced directly from our supplier catalog. Colours may vary slightly due to screen calibration.",
  },
  {
    q: "Do you restock sold-out jerseys?",
    a: "Most styles are made-to-order so stock is rarely a limiting factor. If a specific jersey is unavailable, email us and we'll check availability.",
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-black text-cream mb-2">FAQ</h1>
      <p className="text-muted mb-10">Frequently asked questions about our jerseys and service.</p>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group bg-surface border border-border rounded-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-cream font-medium select-none hover:text-brand transition-colors">
              {faq.q}
              <span className="text-muted group-open:rotate-45 transition-transform text-xl leading-none ml-4 shrink-0">+</span>
            </summary>
            <div className="px-6 pb-4 text-muted text-sm leading-relaxed border-t border-border pt-4">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
