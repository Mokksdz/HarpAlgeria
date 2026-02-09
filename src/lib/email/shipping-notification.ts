import { Resend } from "resend";

interface ShippingNotificationData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingNumber: string;
  deliveryProvider: string;
  estimatedDelivery?: string;
}

export async function sendShippingNotificationEmail(
  data: ShippingNotificationData,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[Shipping Notification] RESEND_API_KEY not configured — skipping email",
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM || "Harp <noreply@harpalgeria.com>";

  const trackingUrl =
    data.deliveryProvider === "Yalidine"
      ? `https://suivi.yalidine.com/?tracking=${data.trackingNumber}`
      : `https://zrexpress.com/suivi/${data.trackingNumber}`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";
  const internalTrackingUrl = `${baseUrl}/suivi?tracking=${data.trackingNumber}`;

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
              <td style="background:#166534;padding:24px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;">&#128230; Votre colis est en route !</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:28px;">
                <p style="font-size:16px;">Bonjour <strong>${data.customerName}</strong>,</p>
                <p style="color:#555;line-height:1.6;">Bonne nouvelle ! Votre commande <strong>#${data.orderNumber}</strong> a &eacute;t&eacute; exp&eacute;di&eacute;e via <strong>${data.deliveryProvider}</strong>.</p>

                <!-- Tracking -->
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
                  <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">N&deg; de suivi</p>
                  <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#166534;letter-spacing:2px;">${data.trackingNumber}</p>
                  <a href="${internalTrackingUrl}" style="display:inline-block;padding:12px 28px;border-radius:10px;text-decoration:none;background:#166534;color:#fff;font-weight:600;font-size:14px;">Suivre mon colis</a>
                </div>

                ${data.estimatedDelivery ? `<p style="text-align:center;color:#166534;font-weight:600;">&#9201; Livraison estim&eacute;e : ${data.estimatedDelivery}</p>` : ""}

                <div style="background:#f9f6f2;border-radius:12px;padding:16px;margin:20px 0;">
                  <p style="margin:0;font-size:13px;color:#5D4E37;">
                    &#128161; <strong>Conseil</strong> : Pr&eacute;parez le montant exact en esp&egrave;ces pour faciliter la livraison. Le livreur vous appellera avant de passer.
                  </p>
                </div>

                <p style="color:#888;font-size:13px;line-height:1.5;margin-top:24px;">
                  Une question ? Contactez-nous sur WhatsApp au <a href="https://wa.me/213561777397" style="color:#5D4E37;">+213 561 777 397</a>.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f9f6f2;padding:20px;text-align:center;border-top:1px solid #eee;">
                <p style="margin:0;font-size:12px;color:#999;">Harp &mdash; Une &eacute;l&eacute;gance qui r&eacute;sonne</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Bonjour ${data.customerName},

Votre commande #${data.orderNumber} a été expédiée !

Transporteur: ${data.deliveryProvider}
N° de suivi: ${data.trackingNumber}
Suivre: ${internalTrackingUrl}
${data.estimatedDelivery ? `Livraison estimée: ${data.estimatedDelivery}` : ""}

Préparez le montant exact en espèces pour la livraison.
WhatsApp: +213 561 777 397

Harp — Une élégance qui résonne`;

  try {
    const { data: result, error } = await resend.emails.send({
      from: fromEmail,
      to: data.customerEmail,
      subject: `📦 Commande #${data.orderNumber} expédiée — Harp`,
      text,
      html,
    });

    if (error) {
      console.error(
        "[Shipping Notification] Resend error:",
        JSON.stringify(error),
      );
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log(
      `[Shipping Notification] Email sent to ${data.customerEmail} (id: ${result?.id})`,
    );
  } catch (err) {
    console.error("[Shipping Notification] Failed to send email:", err);
    throw err;
  }
}
