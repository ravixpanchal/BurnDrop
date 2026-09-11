"""Email service for sending share codes."""

import logging

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


def render_share_email(code: str, app_name: str, app_base_url: str, expiration_hours: int) -> tuple[str, str, str]:
    retrieve_url = f"{app_base_url.rstrip('/')}/retrieve"
    subject = f"🔐 Your {app_name} One-Time Access Code: {code}"

    text = f"""Thanks for using {app_name}!

Your One-Time Access Code is: {code}

Direct Retrieval Link: {retrieve_url}

IMPORTANT DETAILS:
- Valid for {expiration_hours} hours only.
- Single-use access (file auto-destructs after consumption).
- If you didn't receive this email directly in your inbox, please check your Spam/Junk folder.
- Do not share this code publicly or with unauthorized persons.

Powered by {app_name} - Share once • Keep it temporary.
"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your {app_name} Access Code</title>
  <style>
    /* ── Reset ── */
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }}

    /* ── Responsive overrides (≤ 600px) ── */
    @media only screen and (max-width: 600px) {{
      .email-wrapper {{ padding: 16px 8px !important; }}
      .email-card   {{ border-radius: 16px !important; }}

      /* Header & body padding */
      .header-td  {{ padding: 24px 20px 16px 20px !important; }}
      .body-td    {{ padding: 0 20px 20px 20px !important; }}
      .footer-td  {{ padding: 20px !important; }}

      /* Headings */
      .h2         {{ font-size: 17px !important; }}

      /* PIN code */
      .pin-code   {{ font-size: 28px !important; letter-spacing: 4px !important; }}

      /* CTA button — full width on mobile */
      .cta-td     {{ padding: 0 !important; }}
      .cta-btn    {{
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 15px 20px !important;
        text-align: center !important;
        border-radius: 12px !important;
      }}

      /* Badges — stack vertically */
      .badges-td  {{ font-size: 12px !important; }}
      .badge-sep  {{ display: none !important; }}
      .badge-item {{ display: block !important; margin-bottom: 4px !important; }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
         class="email-wrapper" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">

        <!-- ░░ CARD ░░ -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
               class="email-card"
               style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden;
                      box-shadow: 0 10px 25px -5px rgba(15,23,42,.08), 0 8px 10px -6px rgba(15,23,42,.04);
                      border: 1px solid #e2e8f0;">

          <!-- ACCENT BAR -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
                       height: 8px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td class="header-td" style="padding: 36px 36px 24px 36px; text-align: center;">
              <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 14px;
                             width: 44px; height: 44px; text-align: center; vertical-align: middle;
                             color: #ffffff; font-size: 22px; line-height: 44px; font-weight: bold;">
                    🔥
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; display: block; line-height: 1;">{app_name}</span>
                    <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.5px; display: block; margin-top: 4px;">SHARE ONCE &bull; KEEP IT TEMPORARY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="body-td" style="padding: 0 36px 24px 36px;">

              <h2 class="h2" style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a; text-align: center;">
                Your Secure File is Ready 📦
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                You have received a secure, temporary file transfer. Use the one-time PIN code below to unlock and download your file.
              </p>

              <!-- PIN CODE BOX -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
                     style="background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
                            border: 2px dashed #93c5fd; border-radius: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <span style="display: inline-block; background-color: #dbeafe; color: #1e40af;
                                 font-size: 10px; font-weight: 800; letter-spacing: 1.5px;
                                 text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                      🔑 ONE-TIME PIN CODE
                    </span>
                    <div class="pin-code"
                         style="font-family: 'SF Mono', 'Roboto Mono', Menlo, Consolas, Monaco, monospace;
                                font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #0f172a;
                                line-height: 1.2; margin: 6px 0 12px 0; word-break: break-all;">
                      {code}
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
                      Enter this code on the download page to unlock your file.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
                     style="margin-bottom: 24px;">
                <tr>
                  <td class="cta-td" align="center">
                    <a href="{retrieve_url}" target="_blank" class="cta-btn"
                       style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
                              color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none;
                              padding: 14px 36px; border-radius: 14px;
                              box-shadow: 0 4px 14px rgba(37,99,235,.35); text-align: center;">
                      Unlock &amp; Download File &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SPAM ALERT -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
                     style="background-color: #fffbeb; border: 1.5px solid #fcd34d; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="28" valign="top" style="font-size: 18px; line-height: 1.4;">📥</td>
                        <td style="font-size: 13px; line-height: 1.5; color: #78350f; font-weight: 600;">
                          <strong style="color: #92400e;">Did not receive the mail in your inbox?</strong>
                          Please check your <span style="text-decoration: underline;">Spam or Junk folder</span> for the code.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- BADGES ROW -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
                     style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 8px;">
                <tr>
                  <td class="badges-td" style="padding: 14px; font-size: 12px; color: #64748b; line-height: 1.8; text-align: center;">
                    <span class="badge-item">⏱️ <strong style="color: #334155;">Expires in {expiration_hours} hours</strong></span>
                    <span class="badge-sep">&nbsp;&bull;&nbsp;</span>
                    <span class="badge-item">🔥 <strong style="color: #334155;">Single-Use Only</strong></span>
                    <span class="badge-sep">&nbsp;&bull;&nbsp;</span>
                    <span class="badge-item">🛡️ <strong style="color: #334155;">Encrypted</strong></span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer-td"
                style="background-color: #f8fafc; padding: 24px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 500;">
                {app_name} &bull; Secure Temporary File Sharing Service
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This email was sent because a file share was created for your address. If you did not request this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
        <!-- ░░ END CARD ░░ -->

      </td>
    </tr>
  </table>
</body>
</html>"""

    return subject, text, html  # type: ignore[return-value]


async def _send_via_resend(to_email: str, subject: str, html: str, settings) -> bool:
    if not settings.resend_api_key:
        logger.warning("Resend API key not configured; skipping email send")
        return False

    import httpx
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.email_from,
                    "to": [to_email],
                    "subject": subject,
                    "html": html,
                },
                timeout=10.0,
            )
            if response.status_code in (200, 201):
                return True
            logger.error("Resend API failed: Status %s, Response: %s", response.status_code, response.text)
            return False
    except Exception:
        logger.exception("Failed to send email to %s via Resend API", to_email)
        return False


async def _send_via_sendgrid(to_email: str, subject: str, text: str, html: str, settings) -> bool:
    if not settings.sendgrid_api_key:
        logger.warning("SendGrid API key not configured; skipping email send")
        return False

    import httpx
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {settings.sendgrid_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "personalizations": [
                        {
                            "to": [{"email": to_email}]
                        }
                    ],
                    "from": {"email": settings.email_from},
                    "subject": subject,
                    "content": [
                        {"type": "text/plain", "value": text},
                        {"type": "text/html", "value": html},
                    ],
                },
                timeout=10.0,
            )
            if response.status_code in (200, 202):
                return True
            logger.error("SendGrid API failed: Status %s, Response: %s", response.status_code, response.text)
            return False
    except Exception:
        logger.exception("Failed to send email to %s via SendGrid API", to_email)
        return False


async def _send_via_brevo(to_email: str, subject: str, html: str, settings) -> bool:
    if not settings.brevo_api_key:
        logger.warning("Brevo API key not configured; skipping email send")
        return False

    import httpx
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": settings.brevo_api_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json={
                    "sender": {"email": settings.email_from},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": html,
                },
                timeout=10.0,
            )
            if response.status_code in (200, 201, 202):
                return True
            logger.error("Brevo API failed: Status %s, Response: %s", response.status_code, response.text)
            return False
    except Exception:
        logger.exception("Failed to send email to %s via Brevo API", to_email)
        return False


async def _send_via_smtp(to_email: str, subject: str, text: str, html: str, settings) -> bool:
    if not settings.email_password:
        logger.warning("Email password not configured; skipping email send")
        return False

    message = MIMEMultipart("alternative")
    message["From"] = settings.email_from
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    use_tls = settings.email_smtp_port == 465
    start_tls = settings.email_smtp_port == 587 or not use_tls

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.email_smtp_host,
            port=settings.email_smtp_port,
            username=settings.email_username,
            password=settings.email_password,
            use_tls=use_tls,
            start_tls=start_tls,
        )
        return True
    except Exception:
        logger.exception("Failed to send email to %s via %s:%s", to_email, settings.email_smtp_host, settings.email_smtp_port)
        return False


async def _send_via_gmail_api(to_email: str, subject: str, text: str, html: str, settings) -> bool:
    if not settings.google_refresh_token or not settings.google_client_id or not settings.google_client_secret:
        logger.warning("Google credentials not fully configured; skipping Gmail API email send")
        return False

    import base64
    from email.message import EmailMessage
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    try:
        creds = Credentials(
            token=None,
            refresh_token=settings.google_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
        )
        import asyncio
        loop = asyncio.get_running_loop()

        def _send():
            service = build("gmail", "v1", credentials=creds, cache_discovery=False)
            message = EmailMessage()
            message.set_content(text)
            message.add_alternative(html, subtype="html")
            message["To"] = to_email
            message["From"] = settings.email_from
            message["Subject"] = subject
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
            body = {"raw": raw_message}
            service.users().messages().send(userId="me", body=body).execute()
            return True

        return await loop.run_in_executor(None, _send)
    except Exception:
        logger.exception("Failed to send email to %s via Gmail API", to_email)
        return False


async def send_share_code_email(to_email: str, code: str) -> bool:
    settings = get_settings()
    service_type = settings.email_service.lower().strip()

    subject, text, html = render_share_email(
        code=code,
        app_name=settings.app_name,
        app_base_url=settings.app_base_url,
        expiration_hours=settings.file_expiration_hours,
    )

    if service_type == "resend":
        return await _send_via_resend(to_email, subject, html, settings)
    elif service_type == "sendgrid":
        return await _send_via_sendgrid(to_email, subject, text, html, settings)
    elif service_type == "brevo":
        return await _send_via_brevo(to_email, subject, html, settings)
    elif service_type == "gmail":
        return await _send_via_gmail_api(to_email, subject, text, html, settings)
    else:
        return await _send_via_smtp(to_email, subject, text, html, settings)



