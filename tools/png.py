"""Encodeur PNG RGBA minimal (zlib uniquement, aucune dependance externe).

Suffisant pour produire des atlas pixel-art : pas de filtre adaptatif,
pas d'entrelacement, pas de palette indexee. Les pixels restent opaques
ou totalement transparents, conformement a la Bible d'art (aucun
anti-aliasing, aucun bord semi-transparent).
"""
import struct
import zlib


def _chunk(tag, data):
    out = struct.pack(">I", len(data)) + tag + data
    return out + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_rgba(path, width, height, pixels):
    """pixels : liste de lignes, chaque ligne = liste de (r, g, b, a)."""
    raw = bytearray()
    for row in pixels:
        raw.append(0)  # filtre "None" : on veut un fichier lisible et stable
        for r, g, b, a in row:
            raw += bytes((r, g, b, a))
    png = b"\x89PNG\r\n\x1a\n"
    png += _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += _chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += _chunk(b"IEND", b"")
    with open(path, "wb") as fh:
        fh.write(png)
