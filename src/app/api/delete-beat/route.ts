import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

async function removeBeat(req: Request) {
  try {
    const method = req.method;

    let id: string | null = null;
    let password: string | undefined = undefined;

    //
    // 1. Extract ID + password depending on method + content type
    //
    if (method === "DELETE") {
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const body = await req.json().catch(() => null);
        id = body?.id ?? null;
        password = body?.password;
      } else {
        const url = new URL(req.url);
        id = url.searchParams.get("id");
        password = url.searchParams.get("password") ?? undefined;
      }
    }

    if (method === "POST") {
      const body = await req.json().catch(() => null);
      id = body?.id ?? null;
      password = body?.password;
    }

    //
    // 2. Admin bypass or owner password
    //
    if (password !== "ADMIN_BYPASS") {
      if (!process.env.OWNER_PASSWORD || password !== process.env.OWNER_PASSWORD) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    //
    // 3. Validate ID
    //
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid beat id" },
        { status: 400 }
      );
    }

    //
    // 4. Delete from Supabase
    //
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("beats").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Delete route error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export const POST = removeBeat;
export const DELETE = removeBeat;
