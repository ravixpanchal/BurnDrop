import pytest
from unittest.mock import ANY, AsyncMock, MagicMock, patch
from app.config.settings import Settings
from app.services.email_service import send_share_code_email

@pytest.mark.asyncio
async def test_send_via_resend():
    settings = Settings(
        email_service="resend",
        resend_api_key="resend-key-123",
        email_from="sender@example.com"
    )

    with patch("app.services.email_service.get_settings", return_value=settings):
        # Mock httpx.AsyncClient.post
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.text = "OK"

        with patch("httpx.AsyncClient.post", return_value=mock_response) as mock_post:
            success = await send_share_code_email("recipient@example.com", "1234-ABCD")
            assert success is True
            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            assert args[0] == "https://api.resend.com/emails"
            assert kwargs["headers"]["Authorization"] == "Bearer resend-key-123"
            assert kwargs["json"]["from"] == "sender@example.com"
            assert kwargs["json"]["to"] == ["recipient@example.com"]
            assert "1234-ABCD" in kwargs["json"]["html"]

@pytest.mark.asyncio
async def test_send_via_sendgrid():
    settings = Settings(
        email_service="sendgrid",
        sendgrid_api_key="sendgrid-key-123",
        email_from="sender@example.com"
    )

    with patch("app.services.email_service.get_settings", return_value=settings):
        mock_response = AsyncMock()
        mock_response.status_code = 202
        mock_response.text = "Accepted"

        with patch("httpx.AsyncClient.post", return_value=mock_response) as mock_post:
            success = await send_share_code_email("recipient@example.com", "1234-ABCD")
            assert success is True
            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            assert args[0] == "https://api.sendgrid.com/v3/mail/send"
            assert kwargs["headers"]["Authorization"] == "Bearer sendgrid-key-123"
            assert kwargs["json"]["from"] == {"email": "sender@example.com"}
            assert kwargs["json"]["personalizations"][0]["to"] == [{"email": "recipient@example.com"}]
            assert "1234-ABCD" in kwargs["json"]["content"][0]["value"] or "1234-ABCD" in kwargs["json"]["content"][1]["value"]

@pytest.mark.asyncio
async def test_send_via_brevo():
    settings = Settings(
        email_service="brevo",
        brevo_api_key="brevo-key-123",
        email_from="sender@example.com"
    )

    with patch("app.services.email_service.get_settings", return_value=settings):
        mock_response = AsyncMock()
        mock_response.status_code = 201
        mock_response.text = "Created"

        with patch("httpx.AsyncClient.post", return_value=mock_response) as mock_post:
            success = await send_share_code_email("recipient@example.com", "1234-ABCD")
            assert success is True
            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            assert args[0] == "https://api.brevo.com/v3/smtp/email"
            assert kwargs["headers"]["api-key"] == "brevo-key-123"
            assert kwargs["json"]["sender"] == {"email": "sender@example.com"}
            assert kwargs["json"]["to"] == [{"email": "recipient@example.com"}]
            assert "1234-ABCD" in kwargs["json"]["htmlContent"]

def test_settings_auto_detection():
    # If email_service is default but resend_api_key is set:
    settings = Settings(resend_api_key="test-resend")
    assert settings.email_service == "resend"

    # If sendgrid_api_key is set:
    settings = Settings(sendgrid_api_key="test-sendgrid")
    assert settings.email_service == "sendgrid"

    # If brevo_api_key is set:
    settings = Settings(brevo_api_key="test-brevo")
    assert settings.email_service == "brevo"


@pytest.mark.asyncio
async def test_send_via_gmail_api():
    settings = Settings(
        email_service="gmail",
        google_client_id="test-client-id",
        google_client_secret="test-client-secret",
        google_refresh_token="test-refresh-token",
        email_from="sender@example.com"
    )

    with patch("app.services.email_service.get_settings", return_value=settings):
        mock_build = MagicMock()
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        # mock service.users().messages().send(userId='me', body=...).execute()
        mock_send = MagicMock()
        mock_service.users.return_value.messages.return_value.send.return_value = mock_send

        # In python, MagicMock supports sync execute()
        mock_send.execute.return_value = {"id": "12345"}

        with patch("googleapiclient.discovery.build", mock_build):
            success = await send_share_code_email("recipient@example.com", "1234-ABCD")
            assert success is True
            mock_build.assert_called_once_with("gmail", "v1", credentials=ANY, cache_discovery=False)
            mock_service.users.return_value.messages.return_value.send.assert_called_once()
            args, kwargs = mock_service.users.return_value.messages.return_value.send.call_args
            assert kwargs["userId"] == "me"
            assert "raw" in kwargs["body"]
