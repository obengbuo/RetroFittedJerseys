import { NextRequest } from "next/server";
import { stripe } from "@/app/lib/stripe";
import type { CartItem } from "@/app/lib/cart-store";

export async function POST(req: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await req.json();

    if (!items?.length) {
      return Response.json({ error: "No items in cart" }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems: any[] = [];

    for (const item of items) {
      // Base jersey line item
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.title} — Size ${item.size}`,
            images: [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      });

      // Separate $3.00 line items per customization add-on
      const c = item.customization;
      if (c?.name) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Custom Name: ${c.name.toUpperCase()} (${item.title})`,
              images: [],
            },
            unit_amount: 300,
          },
          quantity: item.quantity,
        });
      }
      if (c?.number) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Custom Number: #${c.number} (${item.title})`,
              images: [],
            },
            unit_amount: 300,
          },
          quantity: item.quantity,
        });
      }
      if (c?.patch) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Patch: ${c.patch} (${item.title})`,
              images: [],
            },
            unit_amount: 300,
          },
          quantity: item.quantity,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_creation: "always",
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
