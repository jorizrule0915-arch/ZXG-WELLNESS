import { useState, type FormEvent } from "react";

export function NewsletterSignup() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          consent: formData.get("consent") === "on",
          website: formData.get("website"),
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || "Subscription failed.");

      form.reset();
      setStatus("sent");
      setMessage("You’re on the list. Watch your inbox for GXZ updates.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Subscription failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} aria-busy={status === "sending"} className="mt-5 max-w-md">
      <div className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="newsletter-website">Website</label>
        <input id="newsletter-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="min-w-0 flex-1 border border-gold/25 bg-obsidian px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-gold"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-gold px-5 py-3 text-[10px] font-semibold uppercase tracking-luxury text-obsidian hover:bg-gold-light disabled:opacity-60"
        >
          {status === "sending" ? "Joining…" : "Join"}
        </button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <input name="consent" type="checkbox" required className="mt-1 accent-[#c9a84c]" />
        <span>
          I agree to receive GXZ Health and Wellness news and offers. Unsubscribe at any time.
        </span>
      </label>
      {message && (
        <p
          role={status === "error" ? "alert" : "status"}
          className={`mt-3 text-xs ${status === "error" ? "text-red-300" : "text-gold"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
