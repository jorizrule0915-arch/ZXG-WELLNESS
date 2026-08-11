import { build } from "esbuild";
import { Readable } from "node:stream";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Stripe from "stripe";

process.env.NODE_ENV = "production";
process.env.VERCEL_ENV = "production";
process.env.STRIPE_SECRET_KEY = "sk_test_smoke_test_only";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_smoke_test_only";
process.env.RESEND_API_KEY = "re_smoke_test_only";

const outputDirectory = join(tmpdir(), "zxg-smoke-api");
await mkdir(outputDirectory, { recursive: true });

async function bundleEntry(entryPath, name) {
  const outfile = join(outputDirectory, `${name}-${Date.now()}-${Math.random()}.mjs`);
  await build({
    entryPoints: [join(process.cwd(), ...entryPath)],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    logLevel: "silent",
  });
  return import(`file:///${outfile.replace(/\\/g, "/")}`);
}

function bundleApi(name) {
  return bundleEntry(["api", `${name}.ts`], name);
}

function request({ method = "POST", origin, body, rawBody = "" } = {}) {
  const req = Readable.from(rawBody ? [Buffer.from(rawBody)] : []);
  req.method = method;
  req.body = body;
  req.headers = {
    host: "www.gxzhealthandwellness.com",
    ...(origin ? { origin } : {}),
  };
  req.socket = { remoteAddress: "127.0.0.1" };
  return req;
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    send(payload) {
      this.payload = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const contact = await bundleApi("contact");
{
  const res = response();
  await contact.default(request({ body: { name: "A", email: "bad", message: "short" } }), res);
  assert(res.statusCode === 400, "Contact validation should reject invalid input.");
}
{
  const res = response();
  await contact.default(
    request({
      body: {
        name: "Bot Example",
        email: "bot@example.com",
        message: "This message is long enough.",
        company: "spam.example",
      },
    }),
    res,
  );
  assert(res.statusCode === 200, "Contact honeypot should safely accept without delivery.");
}
{
  const res = response();
  await contact.default(
    request({
      origin: "https://malicious.example",
      body: {
        name: "Valid Name",
        email: "valid@example.com",
        message: "This message is long enough.",
      },
    }),
    res,
  );
  assert(res.statusCode === 403, "Contact API should reject unapproved browser origins.");
}

const newsletter = await bundleApi("newsletter");
{
  const res = response();
  await newsletter.default(request({ body: { email: "valid@example.com", consent: false } }), res);
  assert(res.statusCode === 400, "Newsletter should require explicit consent.");
}

const trackingEmail = await bundleEntry(["server", "tracking-email.ts"], "tracking-email");
{
  const trackingUrl = trackingEmail.officialTrackingUrl("USPS", "9400 1000");
  assert(
    trackingUrl === "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400%201000",
    "Tracking should use the selected carrier's official page.",
  );

  const order = {
    id: "3fcd5e4e-0000-0000-0000-000000000000",
    email: "customer@example.com",
    shipping_name: "Customer Example",
    tracking_carrier: "USPS",
    tracking_number: "94001000",
    tracking_status: "in_transit",
    shipment_note: "Package arrived at the regional facility.",
    tracking_location: "Albuquerque, NM",
    tracking_updated_at: "2026-08-11T15:30:00.000Z",
  };
  const html = trackingEmail.buildTrackingEmailHtml(order);
  assert(html.includes("Track My Order"), "Tracking email should include its action button.");
  assert(html.includes("Albuquerque, NM"), "Tracking email should include the current location.");
  assert(html.includes("Package arrived"), "Tracking email should include the latest update.");

  const originalFetch = globalThis.fetch;
  const deliveries = [];
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("api.resend.com/emails")) {
      deliveries.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ id: `email_tracking_${deliveries.length}` }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };
  const result = await trackingEmail.sendTrackingUpdateEmails(order);
  globalThis.fetch = originalFetch;
  assert(result.customerEmailId, "Customer delivery must have a provider confirmation ID.");
  assert(result.adminEmailId, "Admin delivery must have a provider confirmation ID.");
  assert(deliveries.length === 2, "Tracking should send to the customer and admin recipients.");
  assert(
    result.recipients.includes("customer@example.com") && result.recipients.length >= 3,
    "Tracking recipients should include the customer, coder, and Gary.",
  );
}
{
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("api.resend.com/emails")) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };
  let rejectedUnconfirmedDelivery = false;
  try {
    await trackingEmail.sendTrackingUpdateEmails({
      id: "3fcd5e4e-0000-0000-0000-000000000000",
      email: "customer@example.com",
      tracking_carrier: "UPS",
      tracking_number: "1Z999",
    });
  } catch {
    rejectedUnconfirmedDelivery = true;
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert(
    rejectedUnconfirmedDelivery,
    "Tracking must not report success without an email provider confirmation ID.",
  );
}

const webhook = await bundleApi("stripe-webhook");
{
  assert(webhook.config?.api?.bodyParser === false, "Stripe body parsing must be disabled.");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const originalFetch = globalThis.fetch;
  let notificationAttempted = false;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("api.resend.com/emails")) {
      notificationAttempted = true;
      return new Response(JSON.stringify({ id: "email_smoke" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };
  const rawBody = JSON.stringify({
    id: "evt_smoke",
    object: "event",
    api_version: "2026-04-22.dahlia",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "pi_smoke",
        object: "payment_intent",
        amount_received: 2000,
        currency: "usd",
        receipt_email: "smoke@example.com",
        metadata: { cartTotal: "20.00", shipping: "0", discount: "0" },
        status: "succeeded",
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "payment_intent.succeeded",
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: rawBody,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  const req = request({ rawBody });
  req.headers["stripe-signature"] = signature;
  const res = response();
  await webhook.default(req, res);
  globalThis.fetch = originalFetch;
  assert(res.statusCode === 200, "Stripe should accept a correctly signed raw event.");
  assert(res.payload?.received === true, "Stripe should acknowledge a valid event.");
  assert(notificationAttempted, "A successful payment should trigger the notification flow.");
}

process.stdout.write(
  "API smoke tests passed: contact, newsletter consent, CORS, tracking email confirmation, carrier links, and Stripe payment signature.\n",
);
