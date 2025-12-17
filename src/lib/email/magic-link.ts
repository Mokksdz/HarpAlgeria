import nodemailer from "nodemailer";

export async function sendMagicLinkEmail(
  email: string,
  link: string,
  _guestKey?: string,
) {
  // Magic link email being sent to user

  if (
    process.env.EMAIL_PROVIDER === "nodemailer" ||
    process.env.NODE_ENV === "development"
  ) {
    // In dev, we might just log it, or use a real SMTP if configured
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const expMin = process.env.MAGIC_LINK_EXP_MIN || "15";

      await transporter.sendMail({
        from: '"Harp" <contact@harpalgeria.com>',
        to: email,
        subject: "Voici votre lien de connexion HARP",
        text: `
Objet: Voici votre lien de connexion HARP

Bonjour,

Cliquez sur ce lien pour vous connecter à Harp (valable ${expMin} minutes) :
${link}

Si vous n'avez pas demandé ce lien, ignorez cet email.

À bientôt,
L'équipe Harp
            `,
        html: `
<!doctype html>
<html>
  <body style="font-family:Inter,Arial,sans-serif;color:#333;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 0;">
          <h2 style="margin:0;color:#5D4E37">Harp — Magic Link</h2>
        </td>
      </tr>
      <tr>
        <td align="center">
          <div style="max-width:680px;background:#fff;padding:28px;border-radius:12px;border:1px solid #eee;">
            <p>Bonjour,</p>
            <p>Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Harp. Ce lien expire dans ${expMin} minutes.</p>
            <p style="text-align:center;margin:28px 0;">
              <a href="${link}" style="display:inline-block;padding:12px 22px;border-radius:10px;text-decoration:none;background:#5D4E37;color:#fff;font-weight:600;">Se connecter</a>
            </p>
            <p style="font-size:13px;color:#666">Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
            <hr style="border:none;border-top:1px solid #f1f1f1;margin:20px 0;">
            <p style="font-size:12px;color:#999">Harp — Une élégance qui résonne</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
            `,
      });
    }
  }
}
