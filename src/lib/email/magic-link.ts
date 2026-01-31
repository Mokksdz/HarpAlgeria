import nodemailer from "nodemailer";

export async function sendMagicLinkEmail(
  email: string,
  link: string,
  _guestKey?: string,
) {
  // Validate SMTP configuration
  if (!process.env.SMTP_HOST) {
    console.error(
      "[Magic Link] SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables.",
    );
    throw new Error("Email service not configured");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const expMin = process.env.MAGIC_LINK_EXP_MIN || "15";
  const fromAddress =
    process.env.SMTP_FROM || `"Harp" <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: "Voici votre lien de connexion HARP",
    text: `Bonjour,

Cliquez sur ce lien pour vous connecter à Harp (valable ${expMin} minutes) :
${link}

Si vous n'avez pas demandé ce lien, ignorez cet email.

À bientôt,
L'équipe Harp`,
    html: `
<!doctype html>
<html>
  <body style="font-family:Inter,Arial,sans-serif;color:#333;margin:0;padding:0;background:#f9f7f2;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f2;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
            <tr>
              <td align="center" style="padding:32px 0 16px;background:#5D4E37;">
                <h1 style="margin:0;color:#fff;font-size:28px;font-weight:300;letter-spacing:4px;">HARP</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#333;">Bonjour,</p>
                <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
                  Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Harp. Ce lien expire dans <strong>${expMin} minutes</strong>.
                </p>
                <p style="text-align:center;margin:32px 0;">
                  <a href="${link}" style="display:inline-block;padding:14px 40px;border-radius:50px;text-decoration:none;background:#5D4E37;color:#fff;font-weight:600;font-size:15px;letter-spacing:0.5px;">Se connecter</a>
                </p>
                <p style="margin:28px 0 0;font-size:13px;color:#999;text-align:center;">
                  Si vous n'avez pas demandé ce lien, ignorez simplement cet email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9f7f2;text-align:center;">
                <p style="margin:0;font-size:12px;color:#999;">Harp — Une élégance qui résonne</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });

  console.log(`[Magic Link] Email sent successfully to ${email}`);
}
