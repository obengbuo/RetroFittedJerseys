import { NextRequest } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { insertOrder } from "@/app/lib/db";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      insertOrder({
        session_id: session.id,
        customer_email: session.customer_details?.email ?? "",
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        line_items: lineItems.data,
      });
      console.log(`Order recorded: ${session.id}`);
    } catch (err) {
      console.error("Failed to record order:", err);
    }
  }

  return Response.json({ received: true });
}
