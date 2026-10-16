#!/usr/bin/env python3
"""
Build the pitch-accent tables from the Kanjium accent database
(github.com/mifunetoshiro/kanjium — NHK/大辞林 Tokyo accents):

    src/data/vocab/accents.json    vocab id        → accent type
    src/data/vocab/scene-accents.json  "表記|よみ"  → accent type   (scene words)

    python scripts/build-accents.py path/to/accents.txt

Lookup order per word: (surface, reading) → (surface, –) → (reading, reading)
→ surface alone → reading alone (kana-only words: Kanjium often lists them under
a kanji surface, e.g. いたわる → 労る). Adverbs/expressions ending in a particle
(一向に, 依然として) fall back to the base word, N+する verbs to the noun.
Where Kanjium gives several accents ("0,2") the first (most common) is kept.
Words Kanjium does not know — mostly set phrases like いただきます — come from
scripts/accents-overrides.json, hand-written from NHK accent rules.
"""

from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOCAB_DIR = ROOT / "src" / "data" / "vocab"
SCENE_DIR = ROOT / "src" / "data" / "scenes"
OVERRIDES = ROOT / "scripts" / "accents-overrides.json"

# particles / endings stripped to find the base word
TAILS = ("として", "に", "と", "で", "する")
# words that are not accented on their own
SKIP_SURFACES = {"を", "まで", "は", "が", "の", "へ", "に", "と", "で", "も", "か", "ね", "よ"}


def kata2hira(s: str) -> str:
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s)


def is_kana(s: str) -> bool:
    return all("ぁ" <= c <= "ゖ" or "ァ" <= c <= "ヺ" or c in "ーゝゞヽヾ" for c in s)


class Table:
    def __init__(self, path: Path):
        self.exact: dict[tuple[str, str], int] = {}
        self.surface: dict[str, int] = {}
        self.reading: dict[str, list[tuple[str, int]]] = defaultdict(list)
        for line in path.read_text(encoding="utf-8").splitlines():
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            surface, reading, accent = parts[0], parts[1], parts[2]
            try:
                first = int(accent.split(",")[0].split(";")[0].strip("()"))
            except ValueError:
                continue
            hira = kata2hira(reading) if reading else ""
            self.exact.setdefault((surface, hira), first)
            self.surface.setdefault(surface, first)
            self.reading[hira or kata2hira(surface)].append((surface, first))

    def direct(self, word: str, hira: str) -> int | None:
        for key in [(word, hira), (word, ""), (hira, hira), (hira, "")]:
            if key in self.exact:
                return self.exact[key]
        if word in self.surface:
            return self.surface[word]
        return None

    def by_reading(self, hira: str) -> int | None:
        rows = self.reading.get(hira)
        if not rows:
            return None
        # prefer entries whose surface is itself kana (same word); otherwise only
        # trust the reading when every homophone agrees (ふと: 太② vs 不図① → leave
        # it to the overrides file)
        kana_rows = [a for s, a in rows if is_kana(s)]
        if kana_rows:
            return Counter(kana_rows).most_common(1)[0][0]
        accs = {a for _, a in rows}
        return rows[0][1] if len(accs) == 1 else None

    def lookup(self, word: str, reading: str) -> int | None:
        hira = kata2hira(reading)
        if word in SKIP_SURFACES:
            return None
        got = self.direct(word, hira)
        if got is not None:
            return got
        if is_kana(word):
            got = self.by_reading(hira)
            if got is not None:
                return got
        # 一向に → 一向, 依然として → 依然, 確認する → 確認
        for tail in TAILS:
            if word.endswith(tail) and hira.endswith(tail) and len(hira) - len(tail) >= 2:
                base_w, base_r = word[: -len(tail)], hira[: -len(tail)]
                got = self.direct(base_w, base_r)
                if got is None and is_kana(base_w):
                    got = self.by_reading(base_r)
                if got is not None:
                    return got
        return None


def main() -> int:
    table = Table(Path(sys.argv[1]))
    overrides: dict[str, int] = {}
    if OVERRIDES.exists():
        for k, v in json.loads(OVERRIDES.read_text(encoding="utf-8")).items():
            w, _, r = k.partition("|")
            overrides[f"{w}|{kata2hira(r)}"] = v

    def accent_of(word: str, reading: str) -> int | None:
        key = f"{word}|{kata2hira(reading)}"
        if key in overrides:
            return overrides[key]
        return table.lookup(word, reading)

    # 1. vocab list
    out: dict[str, int] = {}
    missing: list[str] = []
    total = 0
    for f in ["n5", "n4", "n3", "n2", "n1"]:
        for w in json.loads((VOCAB_DIR / f"{f}.json").read_text(encoding="utf-8")):
            total += 1
            a = accent_of(w["word"], w["reading"])
            if a is None:
                missing.append(f'{w["id"]} {w["word"]}|{w["reading"]}')
            else:
                out[w["id"]] = a
    (VOCAB_DIR / "accents.json").write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    print(f"vocab: {len(out)}/{total} words have accent data")
    for m in missing:
        print("  missing", m)

    # 2. scene words (keyed by 表記|よみ so words outside the list get one too)
    scene_out: dict[str, int] = {}
    scene_missing: list[str] = []
    for f in sorted(SCENE_DIR.glob("*.json")):
        for w in json.loads(f.read_text(encoding="utf-8"))["words"]:
            key = f'{w["w"]}|{kata2hira(w["r"])}'
            if key in scene_out:
                continue
            a = accent_of(w["w"], w["r"])
            if a is None:
                scene_missing.append(f"{f.stem}: {key}")
            else:
                scene_out[key] = a
    (VOCAB_DIR / "scene-accents.json").write_text(
        json.dumps(scene_out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    n_scene = len(scene_out) + len(scene_missing)
    print(f"scenes: {len(scene_out)}/{n_scene} distinct words have accent data")
    for m in scene_missing:
        print("  missing", m)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
