import { getSupabaseAdmin } from "@/lib/supabaseServer";

async function removeBeat(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const id = body?.id;
    const password = body?.password;

    // ⭐ ADMIN BYPASS
    if (password !== "ADMIN_BYPASS") {
      if (!process.env.OWNER_PASSWORD || password !== process.env.OWNER_PASSWORD) {
        return Response.json(
          { success: false, error: "Unauthorized" },
          { status: 403 },
        );
      }
    }

    // Validate ID
    if (!id || typeof id !== "string") {
      return Response.json(
        { success: false, error: "Missing or invalid beat id" },
        { status: 400 },
      );
    }

    // Delete from Supabase
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("beats").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("Delete route error:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export const POST = removeBeat;
export const DELETE = removeBeat;
