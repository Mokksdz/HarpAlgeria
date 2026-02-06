import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || "Harp <noreply@harpalgeria.com>";

/**
 * Send J+3 review request email
 */
export async function sendReviewRequestEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  productId: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `${params.customerName}, comment trouvez-vous votre ${params.productName} ?`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FDFBF7;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${baseUrl}/logo.svg" alt="Harp" width="120" style="margin-bottom: 20px;" />
          </div>

          <h1 style="font-family: Georgia, serif; font-size: 24px; color: #3D2314; text-align: center; margin-bottom: 10px;">
            Comment trouvez-vous votre achat ?
          </h1>

          <p style="color: #666; text-align: center; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
            Bonjour ${params.customerName},<br/>
            Nous esp&eacute;rons que vous adorez votre <strong>${params.productName}</strong> !<br/>
            Votre avis compte beaucoup pour nous et pour les autres clientes.
          </p>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${baseUrl}/product/${params.productId}#reviews"
               style="display: inline-block; background-color: #3D2314; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-radius: 30px;">
              Donner mon avis
            </a>
          </div>

          <p style="color: #999; text-align: center; font-size: 12px; margin-bottom: 20px;">
            Recevez <strong>150 points fid&eacute;lit&eacute;</strong> pour un avis avec photo !
          </p>

          <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 30px 0;" />

          <p style="color: #999; text-align: center; font-size: 11px;">
            Commande #${params.orderNumber}<br/>
            &copy; Harp &mdash; Une &eacute;l&eacute;gance qui r&eacute;sonne
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("[Post-Purchase] Failed to send review email:", error);
    return { success: false, error };
  }
}

/**
 * Send J+14 loyalty/comeback email
 */
export async function sendComebackEmail(params: {
  to: string;
  customerName: string;
  loyaltyPoints?: number;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `${params.customerName}, vous nous manquez ! D&eacute;couvrez nos nouveaut&eacute;s`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FDFBF7;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${baseUrl}/logo.svg" alt="Harp" width="120" style="margin-bottom: 20px;" />
          </div>

          <h1 style="font-family: Georgia, serif; font-size: 24px; color: #3D2314; text-align: center; margin-bottom: 10px;">
            De retour chez Harp ?
          </h1>

          <p style="color: #666; text-align: center; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Bonjour ${params.customerName},<br/>
            Nous avons pens&eacute; &agrave; vous ! D&eacute;couvrez nos derni&egrave;res cr&eacute;ations.
          </p>

          ${params.loyaltyPoints ? `
          <div style="background: linear-gradient(135deg, #3D2314 0%, #8B6914 100%); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <p style="color: #E8DDD0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">
              Vos points fid&eacute;lit&eacute;
            </p>
            <p style="color: white; font-size: 28px; font-weight: bold; margin: 0;">
              ${params.loyaltyPoints.toLocaleString()} pts
            </p>
          </div>
          ` : ""}

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${baseUrl}/shop"
               style="display: inline-block; background-color: #3D2314; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-radius: 30px;">
              D&eacute;couvrir les nouveaut&eacute;s
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 30px 0;" />

          <p style="color: #999; text-align: center; font-size: 11px;">
            &copy; Harp &mdash; Une &eacute;l&eacute;gance qui r&eacute;sonne
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("[Post-Purchase] Failed to send comeback email:", error);
    return { success: false, error };
  }
}
