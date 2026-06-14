import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseAdmin as createSupabaseAdmin,
  enforceRateLimit,
  requireUser,
  sendApiError,
  setJsonHeaders,
} from "../server/security";
import { sendOrderConfirmationEmail } from "../server/order-email";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setJsonHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    enforceRateLimit(req, "send-confirmation", { limit: 10, windowMs: 60_000 });
    const { user } = await requireUser(req);
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const supabase = createSupabaseAdmin();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.user_id !== user.id) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) return res.status(403).json({ error: "Forbidden" });
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      return res.status(500).json({ error: "Failed to fetch order items" });
    }

    await sendOrderConfirmationEmail({
      ...order,
      items: items || [],
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("send-confirmation error:", error);
    return sendApiError(res, error);
  }
}
