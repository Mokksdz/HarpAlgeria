import { Resend } from "resend";

interface OrderItem {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingPrice: number;
  total: number;
  deliveryProvider: string;
  deliveryType: string;
  customerAddress: string;
  customerCity: string;
  customerWilaya: string;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[Order Confirmation] RESEND_API_KEY not configured — skipping email",
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM || "Harp <noreply@harpalgeria.com>";

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f1f1f1;font-size:14px;">
          ${item.productName}<br/>
          <span style="color:#888;font-size:12px;">${item.size} / ${item.color}</span>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #f1f1f1;text-align:center;font-size:14px;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f1f1f1;text-align:right;font-size:14px;font-weight:600;">${(item.price * item.quantity).toLocaleString("fr-FR")} DZD</td>
      </tr>`,
    )
    .join("");

  const html = `
<!doctype html>
<html>
  <body style="font-family:Inter,Arial,sans-serif;color:#333;margin:0;padding:0;background:#f9f9f8;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
            <!-- Header -->
            <tr>
              <td style="background:#5D4E37;padding:24px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;">Harp</h1>
                <p style="margin:8px 0 0;color:#D4C4B0;font-size:13px;">Confirmation de commande</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:28px;">
                <p style="font-size:16px;">Bonjour <strong>${data.customerName}</strong>,</p>
                <p style="color:#555;line-height:1.6;">Merci pour votre commande ! Nous la pr&eacute;parons avec soin et elle sera exp&eacute;di&eacute;e tr&egrave;s prochainement.</p>

                <!-- Order Number -->
                <div style="background:#f9f6f2;border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">N&deg; de commande</p>
                  <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#5D4E37;">${data.orderNumber}</p>
                </div>

                <!-- Items -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                  <thead>
                    <tr style="border-bottom:2px solid #5D4E37;">
                      <th style="padding:8px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;">Article</th>
                      <th style="padding:8px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;">Qt&eacute;</th>
                      <th style="padding:8px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;">Prix</th>
                    </tr>
                  </thead>
                  <tbody>${itemRows}</tbody>
                </table>

                <!-- Totals -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 20px;">
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#666;">Sous-total</td>
                    <td style="padding:6px 0;text-align:right;font-size:14px;">${data.subtotal.toLocaleString("fr-FR")} DZD</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#666;">Livraison (${data.deliveryProvider})</td>
                    <td style="padding:6px 0;text-align:right;font-size:14px;">${data.shippingPrice.toLocaleString("fr-FR")} DZD</td>
                  </tr>
                  <tr style="border-top:2px solid #5D4E37;">
                    <td style="padding:12px 0 0;font-size:16px;font-weight:700;">Total</td>
                    <td style="padding:12px 0 0;text-align:right;font-size:16px;font-weight:700;color:#5D4E37;">${data.total.toLocaleString("fr-FR")} DZD</td>
                  </tr>
                </table>

                <!-- Delivery Info -->
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0;">
                  <p style="margin:0 0 8px;font-weight:600;color:#166534;font-size:14px;">&#128230; Livraison</p>
                  <p style="margin:0;font-size:13px;color:#166534;">
                    ${data.deliveryType === "DESK" ? "Point Relais" : "&Agrave; domicile"} &mdash; ${data.deliveryProvider}<br/>
                    ${data.customerAddress}, ${data.customerCity}, Wilaya ${data.customerWilaya}<br/>
                    <strong>D&eacute;lai estim&eacute; : 24-72h</strong>
                  </p>
                </div>

                <!-- Payment -->
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:20px 0;">
                  <p style="margin:0;font-weight:600;color:#92400e;font-size:14px;">&#128176; Paiement &agrave; la livraison (COD)</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#92400e;">Pr&eacute;parez ${data.total.toLocaleString("fr-FR")} DZD en esp&egrave;ces.</p>
                </div>

                <p style="color:#888;font-size:13px;line-height:1.5;margin-top:24px;">
                  Vous recevrez un email de suivi d&egrave;s que votre colis sera exp&eacute;di&eacute;.
                  Pour toute question, contactez-nous sur WhatsApp au <a href="https://wa.me/213561777397" style="color:#5D4E37;">+213 561 777 397</a>.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f9f6f2;padding:20px;text-align:center;border-top:1px solid #eee;">
                <p style="margin:0;font-size:12px;color:#999;">Harp &mdash; Une &eacute;l&eacute;gance qui r&eacute;sonne</p>
                <p style="margin:4px 0 0;font-size:11px;color:#bbb;">Alger, Alg&eacute;rie</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Bonjour ${data.customerName},

Merci pour votre commande #${data.orderNumber} !

Articles:
${data.items.map((i) => `- ${i.productName} (${i.size}/${i.color}) x${i.quantity} — ${(i.price * i.quantity).toLocaleString("fr-FR")} DZD`).join("\n")}

Sous-total: ${data.subtotal.toLocaleString("fr-FR")} DZD
Livraison: ${data.shippingPrice.toLocaleString("fr-FR")} DZD
Total: ${data.total.toLocaleString("fr-FR")} DZD

Livraison ${data.deliveryType === "DESK" ? "Point Relais" : "À domicile"} via ${data.deliveryProvider}
${data.customerAddress}, ${data.customerCity}, Wilaya ${data.customerWilaya}
Délai estimé: 24-72h
Paiement à la livraison (COD)

WhatsApp: +213 561 777 397
Harp — Une élégance qui résonne`;

  try {
    const { data: result, error } = await resend.emails.send({
      from: fromEmail,
      to: data.customerEmail,
      subject: `Commande #${data.orderNumber} confirmée — Harp`,
      text,
      html,
    });

    if (error) {
      console.error(
        "[Order Confirmation] Resend error:",
        JSON.stringify(error),
      );
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log(
      `[Order Confirmation] Email sent to ${data.customerEmail} (id: ${result?.id})`,
    );
  } catch (err) {
    console.error("[Order Confirmation] Failed to send email:", err);
    throw err;
  }
}
