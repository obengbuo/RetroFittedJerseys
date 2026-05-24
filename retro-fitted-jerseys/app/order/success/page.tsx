import { stripe } from "@/app/lib/stripe";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let session = null;
  let lineItems = null;

  if (session_id) {
    try {
      session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items"],
      });
      lineItems = session.line_items?.data ?? [];
    } catch {
      // Session not found — show generic success
    }
  }

  const email = session?.customer_details?.email;
  const total = session?.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : null;
  const orderId = session_id?.slice(-8).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle size={72} className="text-green-500" />
      </div>

      <h1 className="text-3xl font-black text-cream mb-3">Order Confirmed!</h1>
      <p className="text-muted text-lg mb-8">
        {email
          ? `A receipt has been sent to ${email}.`
          : "Thank you for your order. You'll receive a confirmation email shortly."}
      </p>

      {/* Order details */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-8 text-left space-y-4">
        {orderId && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Order ID</span>
            <span className="text-cream font-mono">#{orderId}</span>
          </div>
        )}
        {total && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Total</span>
            <span className="text-cream font-bold">${total}</span>
          </div>
        )}
        {lineItems && lineItems.length > 0 && (
          <div>
            <p className="text-muted text-sm mb-3">Items ordered:</p>
            <div className="space-y-2">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm bg-surface-2 rounded-lg p-3"
                >
                  <span className="text-cream">{item.description}</span>
                  <span className="text-muted">
                    ×{item.quantity} — $
                    {((item.amount_total ?? 0) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mb-8">
        <p className="text-cream text-sm">
          🎽 Your retro jersey is being prepared for dispatch. Estimated delivery:
          7–14 business days.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Keep Shopping <ArrowRight size={18} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-border hover:border-cream text-cream px-8 py-3 rounded-lg transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
