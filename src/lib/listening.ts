import { useCallback, useEffect, useRef, useState } from 'react'
import manifest from '../data/audio-manifest.json'
import { cancelSpeech, speak } from './tts'
import type { QuizQuestion, ScriptLine } from '../types'

interface ClipMeta {
  dur: number
  starts: number[]
}
const clips = ((manifest as { quiz?: Record<string, ClipMeta> }).quiz ?? {}) as Record<string, ClipMeta>

/** Playback order, like the exam: question, the script, question again. */
export function playbackSequence(q: QuizQuestion): ScriptLine[] {
  const ask: ScriptLine = { s: 'N', t: q.question }
  // Quick-response and expression items play the prompt first, like the exam.
  if (q.type === 'listening-response' || q.type === 'listening-expression') {
    return [...(q.script ?? []), ask]
  }
  return [ask, ...(q.script ?? []), ask]
}

// Browser speech synthesis fallback: tell the voices apart by pitch.
const TTS_VOICE: Record<ScriptLine['s'], { rate: number; pitch: number }> = {
  F: { rate: 0.95, pitch: 1.1 },
  M: { rate: 0.95, pitch: 0.8 },
  N: { rate: 0.88, pitch: 1.0 },
}

export interface ListeningPlayer {
  playing: boolean
  /** index into playbackSequence() of the line being spoken, -1 when idle */
  line: number
  /** how many times playback has been started for this question */
  plays: number
  /** 0–1 progress of the pre-generated clip (NaN for the TTS fallback) */
  progress: number
  play: () => void
  stop: () => void
}

/**
 * Plays a listening question's audio: the pre-generated two-voice mp3 when
 * the manifest has it, otherwise browser speech synthesis line by line.
 */
export function useListeningPlayer(q: QuizQuestion | undefined): ListeningPlayer {
  const [playing, setPlaying] = useState(false)
  const [line, setLine] = useState(-1)
  const [plays, setPlays] = useState(0)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cancelRef = useRef<() => void>(() => {})

  const stop = useCallback(() => {
    cancelRef.current()
    cancelRef.current = () => {}
    audioRef.current?.pause()
    audioRef.current = null
    cancelSpeech()
    setPlaying(false)
    setLine(-1)
    setProgress(0)
  }, [])

  // New question: silence and reset the counter.
  useEffect(() => {
    stop()
    setPlays(0)
  }, [q?.id, stop])
  useEffect(() => stop, [stop])

  const play = useCallback(() => {
    if (!q) return
    stop()
    setPlays((n) => n + 1)
    setPlaying(true)
    const seq = playbackSequence(q)
    const meta = clips[q.id]

    const speakFrom = (i: number) => {
      if (i >= seq.length) {
        setPlaying(false)
        setLine(-1)
        return
      }
      setLine(i)
      const { s, t } = seq[i]
      speak(t, { ...TTS_VOICE[s], onEnd: () => timer(i) })
    }
    // A beat between lines, like the pauses in the real clips.
    let handle: ReturnType<typeof setTimeout> | undefined
    const timer = (i: number) => {
      const gap = i === 0 || i === seq.length - 2 ? 900 : 500
      handle = setTimeout(() => speakFrom(i + 1), gap)
    }
    const fallback = () => {
      cancelRef.current = () => {
        if (handle) clearTimeout(handle)
      }
      setProgress(NaN)
      speakFrom(0)
    }

    if (!meta) {
      fallback()
      return
    }
    const el = new Audio(`/audio/quiz/${q.id}.mp3`)
    audioRef.current = el
    el.ontimeupdate = () => {
      const t = el.currentTime
      let i = -1
      for (let k = 0; k < meta.starts.length; k++) if (t >= meta.starts[k]) i = k
      setLine(i)
      setProgress(meta.dur > 0 ? Math.min(1, t / meta.dur) : 0)
    }
    el.onended = () => {
      setPlaying(false)
      setLine(-1)
      setProgress(1)
    }
    el.onerror = () => {
      audioRef.current = null
      fallback()
    }
    el.play().catch(() => {
      audioRef.current = null
      fallback()
    })
  }, [q, stop])

  return { playing, line, plays, progress, play, stop }
}
