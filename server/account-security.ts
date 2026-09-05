import type { SupabaseClient } from "@supabase/supabase-js";

const blockedStatuses = new Set(["suspended", "banned"]);

export function isBlockedAccountStatus(status: unknown) {
  return blockedStatuses.has(
    String(status ?? "")
      .trim()
      .toLowerCase(),
  );
}

export async function assertAccountCanPurchase(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw Object.assign(new Error("Unable to verify account status"), { statusCode: 500 });
  }

  if (isBlockedAccountStatus(data?.status)) {
    throw Object.assign(new Error("This account cannot place orders. Please contact support."), {
      statusCode: 403,
    });
  }
}
