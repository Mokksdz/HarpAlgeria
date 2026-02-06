import { Resend } from "resend";
import nodemailer from "nodemailer";

function buildHtml(link: string, expMin: string) {
  return `
<!doctype html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Connexion Harp</title>
    <!--[if mso]>
    <style>
      table { border-collapse: collapse; }
      td { font-family: Arial, sans-serif; }
    </style>
    <![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:#F5F0E8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

    <!-- Outer wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E8;min-height:100vh;">
      <tr>
        <td align="center" style="padding:48px 16px 40px;">

          <!-- Main card -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(93,78,55,0.08),0 1px 3px rgba(93,78,55,0.04);">

            <!-- Header with brand -->
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#5D4E37 0%,#7A6B54 100%);padding:44px 40px 40px;">
                <!-- Decorative line above logo -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="width:40px;height:1px;background-color:rgba(196,168,130,0.4);"></td>
                    <td style="width:16px;"></td>
                    <td style="width:6px;height:6px;border-radius:50%;background-color:#C4A882;"></td>
                    <td style="width:16px;"></td>
                    <td style="width:40px;height:1px;background-color:rgba(196,168,130,0.4);"></td>
                  </tr>
                </table>
                <h1 style="margin:20px 0 0;padding:0;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:32px;font-weight:300;letter-spacing:8px;line-height:1;">HARP</h1>
                <p style="margin:10px 0 0;padding:0;color:#C4A882;font-size:11px;font-weight:400;letter-spacing:3px;text-transform:uppercase;">Maison de mode</p>
              </td>
            </tr>

            <!-- Subtle gold divider -->
            <tr>
              <td style="height:3px;background:linear-gradient(90deg,#ffffff 0%,#D4C5A9 30%,#C4A882 50%,#D4C5A9 70%,#ffffff 100%);"></td>
            </tr>

            <!-- Body content -->
            <tr>
              <td style="padding:48px 44px 40px;">
                <h2 style="margin:0 0 8px;padding:0;color:#5D4E37;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:20px;font-weight:500;letter-spacing:0.3px;">Votre lien de connexion</h2>
                <p style="margin:0 0 32px;padding:0;color:#9A8E7E;font-size:14px;font-weight:400;line-height:1.2;">Accédez à votre espace personnel</p>

                <p style="margin:0 0 12px;padding:0;color:#6B5D4D;font-size:15px;font-weight:400;line-height:1.7;">
                  Bonjour,
                </p>
                <p style="margin:0 0 36px;padding:0;color:#6B5D4D;font-size:15px;font-weight:400;line-height:1.7;">
                  Nous avons reçu une demande de connexion à votre compte Harp. Utilisez le bouton ci&#8209;dessous pour accéder à votre espace en toute sécurité.
                </p>

                <!-- CTA Button -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="padding:4px 0 36px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="border-radius:60px;background:linear-gradient(135deg,#5D4E37 0%,#6B5A43 100%);box-shadow:0 4px 16px rgba(93,78,55,0.25),0 1px 4px rgba(93,78,55,0.15);">
                            <a href="${link}" target="_blank" style="display:inline-block;padding:16px 52px;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;line-height:1.4;">Se connecter</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Expiration notice -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:20px 24px;background-color:#FAF8F4;border-radius:12px;border:1px solid #EDE8DF;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="vertical-align:top;padding-right:14px;">
                            <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;font-size:12px;">&#9202;</span>
                          </td>
                          <td style="vertical-align:top;">
                            <p style="margin:0;padding:0;color:#8A7D6B;font-size:13px;line-height:1.6;">
                              Ce lien est valable <strong style="color:#5D4E37;">${expMin} minutes</strong> et ne peut être utilisé qu'une seule fois.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Fallback link -->
                <p style="margin:28px 0 0;padding:0;color:#B0A594;font-size:12px;line-height:1.6;word-break:break-all;">
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br />
                  <a href="${link}" style="color:#C4A882;text-decoration:underline;">${link}</a>
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:0 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="height:1px;background-color:#EDE8DF;"></td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Security notice -->
            <tr>
              <td style="padding:28px 44px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:top;padding-right:12px;">
                      <span style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;font-size:11px;">&#128274;</span>
                    </td>
                    <td style="vertical-align:top;">
                      <p style="margin:0;padding:0;color:#B0A594;font-size:12px;line-height:1.6;">
                        <strong style="color:#8A7D6B;">Note de sécurité</strong><br />
                        Si vous n'avez pas demandé ce lien de connexion, vous pouvez ignorer cet email en toute sécurité. Votre compte reste protégé et aucune action n'est requise.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#FAF8F4;padding:32px 44px;border-top:1px solid #EDE8DF;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <p style="margin:0 0 6px;padding:0;color:#5D4E37;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:300;letter-spacing:5px;">HARP</p>
                      <p style="margin:0 0 16px;padding:0;color:#C4A882;font-size:11px;font-weight:400;letter-spacing:2px;font-style:italic;">Une élégance qui résonne</p>
                      <!-- Decorative dots -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
                        <tr>
                          <td style="width:4px;height:4px;border-radius:50%;background-color:#D4C5A9;"></td>
                          <td style="width:12px;"></td>
                          <td style="width:4px;height:4px;border-radius:50%;background-color:#C4A882;"></td>
                          <td style="width:12px;"></td>
                          <td style="width:4px;height:4px;border-radius:50%;background-color:#D4C5A9;"></td>
                        </tr>
                      </table>
                      <p style="margin:0;padding:0;color:#B0A594;font-size:11px;line-height:1.6;">
                        Cet email a été envoyé automatiquement.<br />
                        Merci de ne pas y répondre directement.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
          <!-- End main card -->

          <!-- Below-card legal line -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
            <tr>
              <td align="center" style="padding:24px 20px 0;">
                <p style="margin:0;padding:0;color:#B0A594;font-size:11px;line-height:1.5;">
                  &copy; ${new Date().getFullYear()} Harp. Tous droits réservés.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
    <!-- End outer wrapper -->

  </body>
</html>`;
}

function buildText(link: string, expMin: string) {
  return `Bonjour,

Cliquez sur ce lien pour vous connecter à Harp (valable ${expMin} minutes) :
${link}

Si vous n'avez pas demandé ce lien, ignorez cet email.

À bientôt,
L'équipe Harp`;
}

export async function sendMagicLinkEmail(
  email: string,
  link: string,
  _guestKey?: string,
) {
  const expMin = process.env.MAGIC_LINK_EXP_MIN || "15";
  const html = buildHtml(link, expMin);
  const text = buildText(link, expMin);
  const subject = "Voici votre lien de connexion HARP";

  // Strategy 1: Resend API (preferred — works perfectly on Vercel)
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress =
      process.env.RESEND_FROM || "Harp <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Magic Link] Resend error:", JSON.stringify(error));
      // If domain not verified, give a clear message
      if (
        error.message?.includes("verify a domain") ||
        error.message?.includes("testing emails")
      ) {
        throw new Error(
          "Le service email nécessite la vérification du domaine. Contactez l'administrateur.",
        );
      }
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
    }

    console.log(
      `[Magic Link] Email sent via Resend to ${email} (id: ${data?.id})`,
    );
    return;
  }

  // Strategy 2: SMTP via Nodemailer (fallback)
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromAddress =
      process.env.SMTP_FROM || `"Harp" <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`[Magic Link] Email sent via SMTP to ${email}`);
    return;
  }

  // No email provider configured
  console.error(
    "[Magic Link] No email provider configured. Set RESEND_API_KEY or SMTP_HOST.",
  );
  throw new Error(
    "Service email non configuré. Veuillez contacter le support.",
  );
}
