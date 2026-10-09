import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";

export const Route = createFileRoute("/shipping-policy")({ component: ShippingPolicyPage });

function ShippingPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Delivery Information"
      title="Shipping Policy"
      description="Review shipping charges, order preparation, tracking, delivery responsibilities, and what to do when a shipment needs attention."
      path="/shipping-policy"
      sections={[
        {
          title: "Shipping charges",
          content: (
            <>
              <p>
                Standard shipping is $10. Orders with a merchandise subtotal of $50 or more qualify
                for free shipping.
              </p>
              <p>
                The final shipping charge is displayed in the cart and during checkout before
                payment is submitted.
              </p>
            </>
          ),
        },
        {
          title: "Order preparation",
          content: (
            <p>
              Orders are prepared after payment is confirmed. Preparation and carrier transit time
              are separate. If an item becomes unavailable or additional information is required,
              customer support will contact the email address used for the order.
            </p>
          ),
        },
        {
          title: "Delivery estimates",
          content: (
            <p>
              Delivery timing depends on the destination, selected carrier, weather, holidays, and
              other carrier conditions. Any date shown in tracking is an estimate rather than a
              guarantee. Contact support before ordering if delivery timing is important.
            </p>
          ),
        },
        {
          title: "Tracking",
          content: (
            <p>
              When tracking is available, it is added to the customer's account and may also be sent
              by email. A new tracking number can take a short time to appear on the carrier's
              website.
            </p>
          ),
        },
        {
          title: "Address accuracy",
          content: (
            <p>
              Customers are responsible for entering a complete and accurate delivery address.
              Contact us as soon as possible if a correction is needed. Once a parcel has been
              transferred to the carrier, an address change may no longer be possible.
            </p>
          ),
        },
        {
          title: "Delayed, missing, or damaged shipments",
          content: (
            <p>
              Review the carrier tracking first, then contact us with your order number and relevant
              details. For damaged items, keep the packaging and include clear photographs when
              possible. Eligibility for replacement, return, or refund is explained in the{" "}
              <Link to="/returns" className="text-gold hover:underline">
                Refund & Return Policy
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
