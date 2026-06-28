import Stripe from "stripe";
import { toDisplayBeat } from "@/lib/beats";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

function isLikelyStripeSecret(value: string | undefined) {
  return Boolean(
    value &&
      value !== "your_stripe_key" &&
      value !== "" &&
      /^(sk|rk)_(live|test)_[A-Za-z0-9]+/.test(value),
  );
}

let stripe: Stripe | null = null;

if (stripeSecretKey && isLikelyStripeSecret(stripeSecretKey)) {
  try {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
  } catch (error) {
    console.error("Stripe initialization failed:", error);
  }
}

function getBaseUrl(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");

  if (forwardedProto && (forwardedHost || host)) {
    return `${forwardedProto}://${forwardedHost || host}`;
  }

  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const beatId = body?.beatId;
  const baseUrl = getBaseUrl(req);

  if (!beatId || typeof beatId !== "string") {
    return Response.json({ error: "Missing beat id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: dbBeat, error } = await supabase
    .from("beats")
    .select("*")
    .eq("id", beatId)
    .single();

  if (error || !dbBeat) {
    return Response.json({ error: "Beat not found" }, { status: 404 });
  }

  // Convert DB row → DisplayBeat
  const beat = toDisplayBeat(dbBeat);
  const unitAmount = Math.max(100, Math.round(beat.price * 100));

  if (!stripe) {
    return Response.json(
      {
        mode: "demo",
        url: `${baseUrl}/success?mode=demo`,
        message:
          "Stripe is not configured yet, so checkout used the local demo fallback.",
      },
      { status: 200 },
    );
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: beat.title,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cancel`,
    metadata: {
      beatId: beat.id,
      beatTitle: beat.title,
      fullAudioPath: beat.fullAudioPath,
    },
  });

  return Response.json({ url: session.url, sessionId: session.id });
}
