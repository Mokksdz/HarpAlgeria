import { Resend } from "resend";

interface TrackingUpdateData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingNumber: string;
  deliveryProvider: string;
  newStatus: string;
  harpStatus: string;
}

// Map Harp status to email content
function getStatusContent(harpStatus: string, newStatus: string) {
  switch (harpStatus) {
    case "SHIPPED":
      return {
        emoji: "&#128666;",
        title: "Votre colis est en route !",
        message: `Votre colis est pass&eacute; au statut <strong>${newStatus}</strong>. Il est en cours d'acheminement vers vous.`,
        color: "#2563eb",
        bgColor: "#eff6ff",
        borderColor: "#bfdbfe",
      };
    case "DELIVERED":
      return {
        emoji: "&#9989;",
        title: "Votre colis a &eacute;t&eacute; livr&eacute; !",
        message: "Votre commande a &eacute;t&eacute; livr&eacute;e avec succ&egrave;s. Nous esp&eacute;rons que vous appr&eacute;cierez vos articles !",
        color: "#166534",
        bgColor: "#f0fdf4",
        borderColor: "#bbf7d0",
      };
    case "CANCELLED":
      return {
        emoji: "&#9888;&#65039;",
        title: "Probl&egrave;me de livraison",
        message: `Statut actuel : <strong>${newStatus}</strong>. Notre &eacute;quipe va vous recontacter pour r&eacute;soudre ce probl&egrave;me.`,
        color: "#dc2626",
        bgColor: "#fef2f2",
        borderColor: "#fecaca",
      };
    default:
      return {
        emoji: "&#128230;",
        title: "Mise &agrave; jour de votre colis",
        message: `Nouveau statut : <strong>${newStatus}</strong>.`,
        color: "#d97706",
        bgColor: "#fffbeb",
        borderColor: "#fde68a",
      };
  }
}

export async function sendTrackingUpdateEmail(data: TrackingUpdateData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Tracking Update] RESEND_API_KEY not configured — skipping email");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM || "Harp <noreply@harpalgeria.com>";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";
  const trackingUrl = `${baseUrl}/suivi?tracking=${data.trackingNumber}`;
  const content = getStatusContent(data.harpStatus, data.newStatus);

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
              <td style="background:${content.color};padding:24px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;">${content.emoji} ${content.title}</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:28px;">
                <p style="font-size:16px;">Bonjour <strong>${data.customerName}</strong>,</p>
                <p style="color:#555;line-height:1.6;">Mise &agrave; jour pour votre commande <strong>#${data.orderNumber}</strong> via <strong>${data.deliveryProvider}</strong>.</p>

                <!-- Status -->
                <div style="background:${content.bgColor};border:1px solid ${content.borderColor};border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
                  <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Statut actuel</p>
                  <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${content.color};">${data.newStatus}</p>
                  <p style="margin:0 0 16px;font-size:13px;color:#666;">${content.message}</p>
                  <a href="${trackingUrl}" style="display:inline-block;padding:12px 28px;border-radius:10px;text-decoration:none;background:${content.color};color:#fff;font-weight:600;font-size:14px;">Suivre mon colis</a>
                </div>

                <!-- Tracking Number -->
                <div style="text-align:center;margin:16px 0;">
                  <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">N&deg; de suivi</span>
                  <p style="font-size:18px;font-weight:700;color:#333;letter-spacing:2px;font-family:monospace;">${data.trackingNumber}</p>
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

  const subjectMap: Record<string, string> = {
    SHIPPED: `Votre colis #${data.orderNumber} est en route`,
    DELIVERED: `Colis #${data.orderNumber} livr\u00e9 avec succ\u00e8s`,
    CANCELLED: `Probl\u00e8me livraison #${data.orderNumber}`,
  };
  const subject = subjectMap[data.harpStatus] || `Mise \u00e0 jour colis #${data.orderNumber}`;

  const text = `Bonjour ${data.customerName},

Mise \u00e0 jour pour votre commande #${data.orderNumber} (${data.deliveryProvider}).

Statut: ${data.newStatus}
N\u00b0 de suivi: ${data.trackingNumber}
Suivre: ${trackingUrl}

WhatsApp: +213 561 777 397

Harp \u2014 Une \u00e9l\u00e9gance qui r\u00e9sonne`;

  try {
    const { data: result, error } = await resend.emails.send({
      from: fromEmail,
      to: data.customerEmail,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("[Tracking Update] Resend error:", JSON.stringify(error));
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log(`[Tracking Update] Email sent to ${data.customerEmail} (id: ${result?.id})`);
  } catch (err) {
    console.error("[Tracking Update] Failed to send email:", err);
    throw err;
  }
}
