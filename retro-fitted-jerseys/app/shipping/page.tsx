import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping & Returns" };

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-black text-cream mb-2">Shipping &amp; Returns</h1>
      <p className="text-muted mb-10">Everything you need to know about delivery and returns.</p>

      <div className="space-y-10 text-muted leading-relaxed">
        <section>
          <h2 className="text-cream text-xl font-bold mb-4">Shipping</h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className="text-left px-4 py-3 text-cream font-semibold">Region</th>
                  <th className="text-left px-4 py-3 text-cream font-semibold">Estimated Time</th>
                  <th className="text-left px-4 py-3 text-cream font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { region: "United States", time: "7–10 business days", cost: "$9.99" },
                  { region: "United Kingdom", time: "7–12 business days", cost: "$12.99" },
                  { region: "Europe", time: "8–14 business days", cost: "$14.99" },
                  { region: "Rest of World", time: "10–18 business days", cost: "$18.99" },
                ].map((row) => (
                  <tr key={row.region}>
                    <td className="px-4 py-3 text-cream">{row.region}</td>
                    <td className="px-4 py-3">{row.time}</td>
                    <td className="px-4 py-3 text-brand font-medium">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm">
            All orders are dispatched within 3–5 business days. A tracking number
            will be emailed once your order ships.
          </p>
        </section>

        <section>
          <h2 className="text-cream text-xl font-bold mb-4">Returns</h2>
          <ul className="space-y-3 text-sm">
            {[
              "Returns accepted within 30 days of delivery.",
              "Items must be unworn, unwashed, and in original condition.",
              "Exchanges for a different size are free — we'll cover return shipping.",
              "Refunds are processed within 5–7 business days of receiving the return.",
              "To initiate a return, email us with your order ID.",
            ].map((point) => (
              <li key={point} className="flex gap-2">
                <span className="text-brand mt-0.5">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-cream text-xl font-bold mb-4">Order Issues</h2>
          <p className="text-sm">
            If your order arrives damaged or incorrect, please contact us within 7
            days of delivery. We will send a replacement at no cost to you.
          </p>
        </section>
      </div>
    </div>
  );
}
