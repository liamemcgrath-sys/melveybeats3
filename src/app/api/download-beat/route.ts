import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // 1. Stripe client
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json(
        { error: "Stripe secret key missing" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2026-05-27.dahlia",
    });

    // 2. Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json(
        { error: "Supabase environment variables missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    // 3. Extract session ID
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // 4. Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not verified" },
        { status: 403 }
      );
    }

    // 5. Extract metadata
    const beatId = session.metadata?.beatId;
    const fullAudioPath = session.metadata?.fullAudioPath;

    if (!beatId || !fullAudioPath) {
      return NextResponse.json(
        { error: "Missing beat metadata" },
        { status: 400 }
      );
    }

    // 6. Generate signed URL
    const { data, error } = await supabase.storage
      .from("beats")
      .createSignedUrl(fullAudioPath, 60 * 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.signedUrl });

  } catch (err) {
    console.error("Download-beat error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
