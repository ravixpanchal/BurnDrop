"""Email service for sending share codes."""

import logging

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


def render_share_email(code: str, app_name: str, app_base_url: str, expiration_hours: int) -> tuple[str, str, str]:
    retrieve_url = f"{app_base_url.rstrip('/')}/retrieve"
    subject = f"Your {app_name} one-time code: {code}"

    text = f"""Thanks for using {app_name}.

Your one-time unique code is: {code}

Do not share this code with anyone you do not trust. If you share this code with someone else, they may be able to access your data. We are not responsible for unauthorized access resulting from sharing the code.

Please note that your data will be automatically deleted within {expiration_hours} hours. Please use the service within this time.

This code can be successfully used only once.

Open {app_name}: {retrieve_url}
"""

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 4px; font-size: 24px; color: #0f172a;">{app_name}</h1>
    <p style="margin: 0 0 32px; color: #64748b; font-size: 14px;">Share once. Keep it temporary.</p>
    <p style="color: #334155; line-height: 1.6;">Thanks for using our service.</p>
    <p style="color: #334155; line-height: 1.6;">Your one-time unique code is:</p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #0f172a; font-family: monospace;">{code}</span>
    </div>
    <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
      Do not share this code with anyone you do not trust. If you share this code with someone else, they may be able to access your data. We are not responsible for unauthorized access resulting from sharing the code.
    </p>
    <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
      Please note that your data will be automatically deleted within {expiration_hours} hours. Please use the service within this time.
    </p>
    <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
      This code can be successfully used only once.
    </p>
    <div style="text-align: center; margin-top: 32px;">
      <a href="{retrieve_url}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">Open {app_name}</a>
    </div>
  </div>
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
    else:
        return await _send_via_smtp(to_email, subject, text, html, settings)



