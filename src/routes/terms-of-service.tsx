import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";

export const Route = createFileRoute("/terms-of-service")({ component: TermsOfServicePage });

function TermsOfServicePage() {
  return (
    <PolicyPage
      eyebrow="Store Terms"
      title="Terms of Service"
      description="These terms explain the rules that apply when using the GXZ Health and Wellness website or purchasing from the online store."
      path="/terms-of-service"
      sections={[
        {
          title: "Using this website",
          content: (
            <p>
              By accessing this website or placing an order, you agree to use the site lawfully and
              to provide accurate information. You may not interfere with site security, attempt
              unauthorized access, misuse another person's account, or use the site for fraudulent
              activity.
            </p>
          ),
        },
        {
          title: "Product information and responsible use",
          content: (
            <>
              <p>
                Product descriptions, images, prices, and availability may be updated. We work to
                present information accurately, but colors, packaging, and minor details can vary.
              </p>
              <p>
                Website content is provided for general product education and is not medical advice,
                diagnosis, or treatment. Follow product instructions and consult a qualified
                professional when medical guidance is needed.
              </p>
            </>
          ),
        },
        {
          title: "Orders, pricing, and payment",
          content: (
            <p>
              An order is not final until payment is accepted and the order is confirmed. We may
              cancel or limit an order when information is incomplete, inventory is unavailable, a
              pricing error occurred, or fraud or misuse is suspected. Applicable discounts and
              shipping charges are shown before payment.
            </p>
          ),
        },
        {
          title: "Shipping, returns, and refunds",
          content: (
            <p>
              Shipping and delivery are subject to the terms shown in our{" "}
              <Link to="/shipping-policy" className="text-gold hover:underline">
                Shipping Policy
              </Link>
              . Returns and refunds are governed by our{" "}
              <Link to="/returns" className="text-gold hover:underline">
                Refund & Return Policy
              </Link>
              . Please review both before ordering.
            </p>
          ),
        },
        {
          title: "Accounts and communications",
          content: (
            <p>
              You are responsible for protecting your sign-in information and for activity under
              your account. Transactional messages may be sent for account security, orders,
              payments, shipping, and customer support. Marketing messages are optional.
            </p>
          ),
        },
        {
          title: "Intellectual property",
          content: (
            <p>
              The GXZ Health and Wellness name, branding, site design, original text, graphics, and
              other original materials may not be copied, republished, or commercially exploited
              without permission, except where law allows.
            </p>
          ),
        },
        {
          title: "Disclaimer and limitation",
          content: (
            <p>
              The site is provided on an as-available basis. To the extent allowed by applicable
              law, GXZ Health and Wellness is not responsible for indirect or consequential losses
              caused by use of the site, carrier delays, third-party services, or improper product
              use. Nothing in these terms removes rights that cannot legally be excluded.
            </p>
          ),
        },
        {
          title: "Changes to these terms",
          content: (
            <p>
              These terms may be updated as the store changes. Continued use after an update means
              the revised terms apply from the published effective date.
            </p>
          ),
        },
      ]}
    />
  );
}
