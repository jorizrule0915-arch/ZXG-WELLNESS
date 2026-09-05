import { build } from "esbuild";
import { readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const outputDirectory = join(tmpdir(), "gxz-security-regression");
await mkdir(outputDirectory, { recursive: true });
const outfile = join(outputDirectory, `account-security-${Date.now()}.mjs`);
await build({
  entryPoints: [join(process.cwd(), "server", "account-security.ts")],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  logLevel: "silent",
});

const accountSecurity = await import(`file:///${outfile.replace(/\\/g, "/")}`);
assert(accountSecurity.isBlockedAccountStatus("suspended"), "Suspended accounts must be blocked.");
assert(accountSecurity.isBlockedAccountStatus("BANNED"), "Banned accounts must be blocked.");
assert(!accountSecurity.isBlockedAccountStatus("active"), "Active accounts must remain allowed.");

const vercelConfig = JSON.parse(await readFile(join(process.cwd(), "vercel.json"), "utf8"));
const globalHeaders = vercelConfig.headers.find((entry) => entry.source === "/(.*)")?.headers ?? [];
const csp = globalHeaders.find((header) => header.key === "Content-Security-Policy")?.value ?? "";
assert(csp.includes("object-src 'none'"), "CSP must block browser plug-in content.");
assert(csp.includes("frame-ancestors 'none'"), "CSP must prevent framing.");

const migration = await readFile(
  join(process.cwd(), "supabase", "migrations", "20260901000000_prevent_stripe_order_replay.sql"),
  "utf8",
);
assert(
  migration.includes("add column if not exists stripe_payment_intent_id text"),
  "The replay migration must also repair databases missing the older payment-intent column.",
);
assert(
  migration.includes("orders_stripe_checkout_session_id_unique"),
  "Checkout Session IDs must have a unique database index.",
);
assert(
  migration.includes("create or replace function public.create_paid_order"),
  "Order and item creation must run in one database transaction.",
);

const orderApi = await readFile(join(process.cwd(), "api", "orders.ts"), "utf8");
assert(
  orderApi.includes('supabase.rpc("create_paid_order"'),
  "The order API must use the atomic paid-order database function.",
);
assert(orderApi.includes("alreadyCreated: true"), "Duplicate submissions must be idempotent.");

const welcomeApi = await readFile(join(process.cwd(), "api", "welcome-email.ts"), "utf8");
assert(!welcomeApi.includes("listUsers("), "Welcome email must not scan the auth user directory.");

const adminApi = await readFile(join(process.cwd(), "api", "admin-data.ts"), "utf8");
assert(
  adminApi.includes('ban_duration: status === "active" ? "none" : "876000h"'),
  "Suspended and banned profiles must also be blocked in Supabase Auth.",
);

process.stdout.write(
  "Security regression tests passed: account status, Stripe replay protection, CSP, and signup privacy.\n",
);
