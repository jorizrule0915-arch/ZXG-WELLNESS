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

const outputDirectory = join(tmpdir(), "zxg-smoke-api");
await mkdir(outputDirectory, { recursive: true });

async function bundleApi(name) {
  const outfile = join(outputDirectory, `${name}-${Date.now()}-${Math.random()}.mjs`);
  await build({
    entryPoints: [join(process.cwd(), "api", `${name}.ts`)],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    logLevel: "silent",
  });
  return import(`file:///${outfile.replace(/\\/g, "/")}`);
}

function request({ method = "POST", origin, body, rawBody = "" } = {}) {
  const req = Readable.from(rawBody ? [Buffer.from(rawBody)] : []);
  req.method = method;
  req.body = body;
  req.headers = {
    host: "www.zxgwellness.com",
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

const webhook = await bundleApi("stripe-webhook");
{
  assert(webhook.config?.api?.bodyParser === false, "Stripe body parsing must be disabled.");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = JSON.stringify({
    id: "evt_smoke",
    object: "event",
    api_version: "2026-04-22.dahlia",
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: "cus_smoke", object: "customer" } },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "customer.created",
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: rawBody,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  const req = request({ rawBody });
  req.headers["stripe-signature"] = signature;
  const res = response();
  await webhook.default(req, res);
  assert(res.statusCode === 200, "Stripe should accept a correctly signed raw event.");
  assert(res.payload?.received === true, "Stripe should acknowledge a valid event.");
}

process.stdout.write(
  "API smoke tests passed: contact, newsletter consent, CORS, Stripe signature.\n",
);
