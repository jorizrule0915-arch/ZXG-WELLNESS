import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";

export const Route = createFileRoute("/privacy-policy")({ component: PrivacyPolicyPage });

function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy & Data"
      title="Privacy Policy"
      description="This policy explains what information GXZ Health and Wellness collects, why it is used, and the choices available to customers and visitors."
      path="/privacy-policy"
      sections={[
        {
          title: "Information we collect",
          content: (
            <>
              <p>
                We may collect information you provide when you place an order, create an account,
                join the newsletter, or contact customer support. This can include your name, email
                address, shipping address, order details, and messages sent to us.
              </p>
              <p>
                We may also receive basic device, browser, page-visit, and referral information
                through security, hosting, and analytics tools.
              </p>
            </>
          ),
        },
        {
          title: "Payments",
          content: (
            <p>
              Payments are handled by an independent payment processor. GXZ Health and Wellness does
              not store your complete payment-card number or security code on its own servers. The
              payment provider processes that information under its own privacy and security
              practices.
            </p>
          ),
        },
        {
          title: "How information is used",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Process, confirm, fulfill, and support orders.</li>
              <li>Provide account, shipping, delivery, and customer-service updates.</li>
              <li>Respond to questions and maintain site security.</li>
              <li>Send marketing email only when permission has been provided.</li>
              <li>Understand site performance and improve the shopping experience.</li>
            </ul>
          ),
        },
        {
          title: "When information is shared",
          content: (
            <p>
              Information may be shared with service providers that help operate the store, such as
              payment, hosting, database, email, analytics, and shipping providers. We may also
              disclose information when required by law, to prevent fraud or abuse, or to protect
              customers and the business. We do not sell personal information.
            </p>
          ),
        },
        {
          title: "Cookies and analytics",
          content: (
            <p>
              The site may use essential browser storage for account, cart, security, and preference
              functions. Optional analytics are used only as configured by the site and applicable
              consent settings. You can limit cookies through your browser, although some store
              features may then work differently.
            </p>
          ),
        },
        {
          title: "Data choices and retention",
          content: (
            <p>
              You may request access, correction, or deletion of eligible personal information, or
              unsubscribe from marketing messages at any time. Order and transaction records may be
              retained when needed for customer service, fraud prevention, accounting, or legal
              obligations.
            </p>
          ),
        },
        {
          title: "Security and children",
          content: (
            <p>
              We use reasonable technical and administrative safeguards, but no online system can
              guarantee absolute security. This store is not directed to children under 13, and we
              do not knowingly collect personal information from children under 13.
            </p>
          ),
        },
        {
          title: "Policy updates",
          content: (
            <p>
              We may update this policy as the store or its service providers change. The date at
              the top of this page shows the latest published revision.
            </p>
          ),
        },
      ]}
    />
  );
}
