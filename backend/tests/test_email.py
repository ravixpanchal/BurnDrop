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
