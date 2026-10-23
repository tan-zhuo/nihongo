#!/usr/bin/env python3
"""
Audio for the JLPT listening questions (src/data/quiz/listening-*.json) with
Microsoft Edge neural TTS: 女 = ja-JP-NanamiNeural, 男 = ja-JP-KeitaNeural,
narrator / question = Nanami, lowered and slowed a touch.

Each question becomes one mp3 at public/audio/quiz/<id>.mp3 laid out like
the exam: question → pause → script lines → pause → question again. Line start
offsets go to src/data/audio-manifest.json under "quiz" so the transcript can
follow the audio:

    "quiz": { "n5-l01": { "dur": 18.4, "starts": [0.3, 3.1, …] }, … }

Requirements (one-off):
    python3 -m venv /root/tts-venv && /root/tts-venv/bin/pip install edge-tts
    apt-get install ffmpeg
Usage:
    /root/tts-venv/bin/python scripts/generate-listening-audio.py           # missing ones
    /root/tts-venv/bin/python scripts/generate-listening-audio.py --force   # re-render all
    /root/tts-venv/bin/python scripts/generate-listening-audio.py --only n5-l01,n5-l02
"""
from __future__ import annotations

import argparse
import asyncio
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
QUIZ_DIR = ROOT / "src" / "data" / "quiz"
OUT_DIR = ROOT / "public" / "audio" / "quiz"
MANIFEST = ROOT / "src" / "data" / "audio-manifest.json"

SR = 24000  # edge-tts native rate
VOICES = {
    "F": dict(voice="ja-JP-NanamiNeural", rate="-4%", pitch="+0Hz"),
    "M": dict(voice="ja-JP-KeitaNeural", rate="-4%", pitch="+0Hz"),
    "N": dict(voice="ja-JP-NanamiNeural", rate="-10%", pitch="-6Hz"),
}
LEAD_IN = 0.3
LINE_GAP = 0.55  # between dialogue lines
BLOCK_GAP = 1.0  # question ↔ dialogue
TAIL = 0.4


def load_questions() -> list[dict]:
    out: list[dict] = []
    for p in sorted(QUIZ_DIR.glob("listening-*.json")):
        out.extend(json.loads(p.read_text(encoding="utf-8")))
    return out


def sequence(q: dict) -> list[tuple[str, str, float]]:
    """(speaker, text, gap-after) in playback order."""
    # Quick-response / expression items: prompt first, then the question.
    short = q["type"] in ("listening-response", "listening-expression")
    seq: list[tuple[str, str, float]] = [] if short else [("N", q["question"], BLOCK_GAP)]
    lines = q["script"]
    for i, ln in enumerate(lines):
        seq.append((ln["s"], ln["t"], LINE_GAP if i < len(lines) - 1 else BLOCK_GAP))
    seq.append(("N", q["question"], TAIL))
    return seq


async def synth(text: str, spk: str, path: Path) -> None:
    v = VOICES[spk]
    com = edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"])
    for attempt in range(4):
        try:
            await com.save(str(path))
            if path.stat().st_size > 0:
                return
        except Exception as exc:  # noqa: BLE001 — network hiccups; retry
            if attempt == 3:
                raise
            await asyncio.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"empty audio for {text!r}")


def pcm(path: Path) -> bytes:
    return subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
        check=True,
        capture_output=True,
    ).stdout


def silence(sec: float) -> bytes:
    return b"\x00\x00" * int(SR * sec)


def encode(raw: bytes, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(SR), "-i", "-",
         "-codec:a", "libmp3lame", "-b:a", "48k", str(out)],
        input=raw,
        check=True,
    )


async def render(q: dict, tmp: Path) -> dict:
    seq = sequence(q)
    parts: list[bytes] = []
    for i, (spk, text, _gap) in enumerate(seq):
        p = tmp / f"{q['id']}-{i}.mp3"
        await synth(text, spk, p)
        parts.append(pcm(p))
    raw = bytearray(silence(LEAD_IN))
    starts: list[float] = []
    for (_spk, _text, gap), audio in zip(seq, parts):
        starts.append(round(len(raw) / 2 / SR, 3))
        raw += audio
        raw += silence(gap)
    encode(bytes(raw), OUT_DIR / f"{q['id']}.mp3")
    return {"dur": round(len(raw) / 2 / SR, 3), "starts": starts}


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", help="comma-separated question ids")
    ap.add_argument("--jobs", type=int, default=3)
    args = ap.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    quiz = manifest.setdefault("quiz", {})
    questions = load_questions()
    if args.only:
        wanted = set(args.only.split(","))
        questions = [q for q in questions if q["id"] in wanted]
    todo = [q for q in questions if args.force or q["id"] not in quiz
            or not (OUT_DIR / f"{q['id']}.mp3").exists()]
    print(f"{len(questions)} listening questions, {len(todo)} to render")

    sem = asyncio.Semaphore(args.jobs)
    done = 0
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)

        async def one(q: dict) -> None:
            nonlocal done
            async with sem:
                try:
                    quiz[q["id"]] = await render(q, tmp)
                except Exception as exc:  # noqa: BLE001
                    print(f"  ! {q['id']}: {exc}", file=sys.stderr)
                    return
                done += 1
                if done % 10 == 0 or done == len(todo):
                    print(f"  {done}/{len(todo)}")
                    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        await asyncio.gather(*(one(q) for q in todo))

    manifest["quiz"] = {k: quiz[k] for k in sorted(quiz)}
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"done: {len(manifest['quiz'])} clips in manifest")


if __name__ == "__main__":
    asyncio.run(main())
