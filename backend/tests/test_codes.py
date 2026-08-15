"""Tests for code generation and hashing."""

import re

from app.security.codes import (
    CODE_ALPHABET,
    code_entropy_bits,
    generate_share_code,
    hash_code,
    normalize_code,
    validate_code_format,
)


def test_code_format():
    code = generate_share_code()
    assert re.match(r"^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$", code)
    assert validate_code_format(code)


def test_codes_are_random():
    codes = {generate_share_code() for _ in range(100)}
    assert len(codes) > 95


def test_code_entropy():
    bits = code_entropy_bits()
    assert bits >= 39


def test_normalize_code():
    assert normalize_code("k7x9-p2lm") == "K7X9-P2LM"
    assert normalize_code(" K7X9-P2LM ") == "K7X9-P2LM"


def test_hash_deterministic():
    secret = "test-secret"
    h1 = hash_code("K7X9-P2LM", secret)
    h2 = hash_code("k7x9-p2lm", secret)
    assert h1 == h2


def test_hash_different_codes():
    secret = "test-secret"
    h1 = hash_code("K7X9-P2LM", secret)
    h2 = hash_code("A2B3-C4D5", secret)
    assert h1 != h2


def test_no_ambiguous_characters():
    for _ in range(50):
        code = generate_share_code()
        for c in code.replace("-", ""):
            assert c in CODE_ALPHABET
