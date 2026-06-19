import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

// IMPORTANT: service role key required for signed URLs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  // 1. Verify Stripe session
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session || session.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Payment not verified" },
      { status: 403 }
    );
  }

  // 2. Get beat info from metadata
  const beatId = session.metadata?.beatId;
  const fullAudioPath = session.metadata?.fullAudioPath;

  if (!beatId || !fullAudioPath) {
    return NextResponse.json(
      { error: "Missing beat metadata" },
      { status: 400 }
    );
  }

  // 3. Generate signed URL for full beat
  const { data, error } = await supabase.storage
    .from("beats")
    .createSignedUrl(fullAudioPath, 60 * 60); // 1 hour

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
