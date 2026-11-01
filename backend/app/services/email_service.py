"""Email service for sending share codes."""

import logging
from html import escape

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


def render_share_email(code: str, app_name: str, app_base_url: str, expiration_hours: int) -> tuple[str, str, str]:
    retrieve_url = f"{app_base_url.rstrip('/')}/retrieve"
    subject = f"Your {app_name} sharing code: {code}"
    text = f"""Your files are ready to receive.

Someone shared files with you using {app_name}.
Your one-time access code: {code}

Open {retrieve_url} and enter the code to access your files.
Access expires {expiration_hours} hours after the share was created.

Keep this code private. Anyone with the code can access the shared files.
If you weren't expecting this email, you can ignore it.

{app_name} — Share once. Keep it temporary.
"""
    name, pin, url = escape(app_name), escape(code), escape(retrieve_url, quote=True)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Your {name} sharing code</title>
<style>
body,table,td,a {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
table,td {{ mso-table-lspace:0; mso-table-rspace:0; }}
@media only screen and (min-width:601px) {{
 .outer {{ padding:40px 20px !important; }}
 .content {{ padding:36px 36px 32px !important; }}
 .footer {{ padding:22px 36px !important; }}
 .title {{ font-size:30px !important; }}
 .code {{ font-size:36px !important; line-height:44px !important; letter-spacing:5px !important; }}
}}
@media only screen and (max-width:360px) {{
 .outer {{ padding:12px 8px !important; }}
 .content {{ padding:24px 16px !important; }}
 .footer {{ padding:20px 16px !important; }}
 .title {{ font-size:24px !important; }}
 .code {{ font-size:25px !important; line-height:36px !important; letter-spacing:2px !important; }}
}}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<div style="display:none;font-size:1px;line-height:1px;color:#f8fafc;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Your sharing code is {pin}. Access expires {expiration_hours} hours after creation.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;">
<tr><td class="outer" align="center" style="padding:20px 12px;">
<!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
<tr><td class="content" style="padding:28px 20px;overflow-wrap:break-word;word-wrap:break-word;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="40" height="40" align="center" style="width:40px;height:40px;background-color:#0f172a;border-radius:10px;font-size:22px;line-height:40px;font-weight:700;color:#ffffff;">B</td>
<td style="padding-left:12px;font-size:21px;font-weight:700;letter-spacing:-0.5px;color:#0f172a;">{name}</td>
</tr></table>
<p style="margin:32px 0 10px;font-size:13px;line-height:20px;font-weight:600;color:#6d28d9;">Simple sharing. Temporary access.</p>
<h1 class="title" style="margin:0;font-size:26px;line-height:1.25;letter-spacing:-0.7px;font-weight:700;color:#0f172a;">Your files are ready.</h1>
<p style="margin:16px 0 26px;font-size:15px;line-height:24px;color:#475569;">Someone shared files with you. Enter the code below on {name} to view or download them.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;">
<tr><td align="center" style="padding:24px 12px;">
<p style="margin:0 0 12px;font-size:13px;line-height:20px;font-weight:600;color:#6d28d9;">One-time access code</p>
<p class="code" style="margin:0;font-family:Consolas,Menlo,monospace;font-size:28px;line-height:40px;letter-spacing:2px;overflow-wrap:anywhere;word-wrap:break-word;font-weight:700;color:#0f172a;">{pin}</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td align="center" bgcolor="#7c3aed" style="background-color:#7c3aed;border-radius:8px;mso-padding-alt:16px 28px;">
<a class="button" href="{url}" style="display:block;padding:16px 12px;min-height:20px;font-size:15px;line-height:20px;font-weight:600;text-decoration:none;color:#ffffff;border-radius:8px;">Receive files &rarr;</a>
</td></tr></table>
<p style="margin:14px 0 0;text-align:center;font-size:13px;line-height:21px;color:#475569;">Access expires {expiration_hours} hours after this share was created.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid #e2e8f0;"><tr><td style="padding-top:20px;">
<p style="margin:0;font-size:13px;line-height:21px;color:#475569;"><strong style="color:#334155;">Keep your code private.</strong> Anyone with this code can access the shared files.</p>
<p style="margin:14px 0 0;font-size:12px;line-height:20px;color:#64748b;">Button not working? Open <a href="{url}" style="color:#6d28d9;text-decoration:underline;word-break:break-all;">{url}</a> and enter your code.</p>
</td></tr></table>
</td></tr>
<tr><td class="footer" style="padding:22px 20px;border-top:1px solid #e2e8f0;text-align:center;">
<p style="margin:0;font-size:13px;line-height:20px;font-weight:600;color:#334155;">{name}</p>
<p style="margin:5px 0 14px;font-size:12px;line-height:20px;color:#64748b;">Share once. Keep it temporary.</p>
<p style="margin:0;font-size:12px;line-height:20px;color:#64748b;">Sent because a share was created for your address.<br>If you weren’t expecting this email, you can ignore it.</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>"""
    return subject, text, html


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



