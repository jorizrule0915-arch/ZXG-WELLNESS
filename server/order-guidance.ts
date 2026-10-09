type OrderGuidanceItem = {
  product_slug?: string | null;
};

const ACCESSORY_SLUGS = new Set(["pen", "cartridge", "needles", "syringe"]);

function includesAccessory(items: OrderGuidanceItem[]) {
  return items.some((item) => item.product_slug && ACCESSORY_SLUGS.has(item.product_slug));
}

export function buildOrderGuidanceHtml(items: OrderGuidanceItem[]) {
  if (!includesAccessory(items)) return "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-collapse:collapse;border:1px solid #e5e7eb;background-color:#faf8f2;">
      <tr>
        <td style="padding:20px;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 6px 0;font-size:12px;line-height:18px;color:#8a6f24;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Getting started</p>
          <h2 style="margin:0 0 10px 0;font-size:17px;line-height:23px;color:#111827;font-weight:bold;">Review the accessory setup guide</h2>
          <p style="margin:0 0 14px 0;font-size:13px;line-height:21px;color:#4b5563;">See how the reusable pen, compatible cartridges, and single-use pen needles fit together. The guide also covers preparation, handling, and replacement basics.</p>
          <a href="https://www.gxzhealthandwellness.com/how-to-use" style="display:inline-block;padding:11px 18px;background-color:#c9a84c;color:#111111;text-decoration:none;font-size:12px;line-height:16px;font-weight:bold;">View the Setup Guide</a>
          <p style="margin:14px 0 0 0;font-size:12px;line-height:19px;color:#6b7280;">When you need replacements, compatible cartridges and pen needles remain available in the GXZ collection.</p>
        </td>
      </tr>
    </table>`;
}

export function buildOrderGuidanceText(items: OrderGuidanceItem[]) {
  if (!includesAccessory(items)) return "";

  return `\n\nGetting started:\nReview the reusable pen accessory setup guide: https://www.gxzhealthandwellness.com/how-to-use\nCompatible replacement cartridges and pen needles are available in the GXZ collection.`;
}
