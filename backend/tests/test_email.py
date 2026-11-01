"""Tests for email rendering."""

from app.services.email_service import render_share_email


def test_email_content():
    subject, text, html = render_share_email("K7X9-P2LM", "BurnDrop", "http://localhost:3000", 3)

    assert "K7X9-P2LM" in subject
    assert "K7X9-P2LM" in text
    assert "K7X9-P2LM" in html
    assert "BurnDrop" in html
    assert "Share once" in html
    assert "http://localhost:3000/retrieve" in html
    assert "3 hours" in text
    assert "one-time" in text.lower()
    assert "drive.google" not in html.lower()
    assert "google" not in html.lower() or "BurnDrop" in html


def test_email_matches_website_theme_and_escapes_content():
    _, _, html = render_share_email("<code>", "<Brand>", "https://example.com", 3)
    assert "#7c3aed" in html
    assert "#f5f3ff" in html
    assert "linear-gradient" not in html
    assert "&lt;code&gt;" in html
    assert "&lt;Brand&gt;" in html
    assert "Encrypted" not in html
    assert "Spam" not in html
