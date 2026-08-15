"""Secure one-time code generation and hashing."""

import hashlib
import hmac
import secrets
import string

# Crockford-like alphabet excluding ambiguous characters (0/O, 1/I/L)
CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def generate_share_code() -> str:
    """Generate a cryptographically secure code in XXXX-XXXX format."""
    parts = []
    for _ in range(2):
        part = "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))
        parts.append(part)
    return "-".join(parts)


def normalize_code(code: str) -> str:
    """Normalize user input: uppercase, strip whitespace."""
    return code.strip().upper().replace(" ", "")


def hash_code(code: str, secret: str) -> str:
    """Hash a share code using HMAC-SHA256 with application secret."""
    normalized = normalize_code(code)
    return hmac.new(secret.encode("utf-8"), normalized.encode("utf-8"), hashlib.sha256).hexdigest()


def validate_code_format(code: str) -> bool:
    """Validate code format XXXX-XXXX."""
    normalized = normalize_code(code)
    if len(normalized) != 9 or normalized[4] != "-":
        return False
    parts = normalized.split("-")
    if len(parts) != 2 or len(parts[0]) != 4 or len(parts[1]) != 4:
        return False
    allowed = set(CODE_ALPHABET + "-")
    return all(c in allowed for c in normalized)


def code_entropy_bits() -> float:
    """Calculate approximate entropy bits for generated codes."""
    import math

    return 2 * 4 * math.log2(len(CODE_ALPHABET))
