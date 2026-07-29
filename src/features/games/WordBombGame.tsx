import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const SYLLABLES = ['ba', 'te', 'ka', 'in', 'st', 'al', 'or', 'en', 'ov', 'er', 'an', 'de', 'la', 'ma', 'ge', 'il', 'ra', 'fo', 'vi', 'sk']
const ACCEPTED: Record<string, string[]> = {
  ba: ['banan', 'bad', 'barn', 'bakom', 'bas', 'baka', 'bana'],
  te: ['text', 'test', 'tema', 'tegel', 'tecken', 'telefon'],
  ka: ['katt', 'kaffe', 'kakor', 'karta', 'kam', 'kall', 'kan'],
  in: ['ingen', 'inte', 'info', 'ingå', 'inre', 'insikt'],
  st: ['stark', 'sten', 'stad', 'stil', 'stop', 'storm', 'start'],
  al: ['allt', 'alltid', 'alla', 'alfa', 'album', 'alder'],
  or: ['ord', 'orm', 'ork', 'orgel', 'orka', 'order'],
  en: ['enda', 'enkel', 'ens', 'energi', 'enkelt'],
  ov: ['ovan', 'oval', 'oväsen', 'övrig', 'övre'],
  er: ['era', 'erbjuda', 'erfaren', 'erkänna'],
  an: ['and', 'anda', 'ankel', 'annars', 'antal', 'ange'],
  de: ['del', 'den', 'delta', 'deras', 'demon', 'deja'],
  la: ['lag', 'land', 'lans', 'lapp', 'larm', 'last', 'lat'],
  ma: ['mat', 'man', 'mars', 'mask', 'massa', 'makt'],
  ge: ['gen', 'geni', 'gest', 'geta', 'gemål'],
  il: ['illa', 'ilska', 'ilning', 'iland'],
  ra: ['rad', 'ram', 'rand', 'rank', 'rask', 'ras'],
  fo: ['folk', 'form', 'fort', 'fond', 'foton', 'foder'],
  vi: ['vid', 'vila', 'vilja', 'vild', 'visa', 'vikt'],
  sk: ['skog', 'ske', 'skola', 'skatt', 'skön', 'skarp'],
}

export const WordBombGame = memo(function WordBombGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [syllable, setSyllable] = useState('')
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(8)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [used, setUsed] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wb_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ROUNDS = 10

  const nextRound = useCallback((r: number) => {
    const syl = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
    setSyllable(syl); setInput(''); setFeedback(null); setTimeLeft(Math.max(4, 8 - Math.floor(r / 3))); setRound(r)
  }, [])

  const start = useCallback(() => {
    setScore(0); setStreak(0); setUsed(new Set()); setPhase('playing'); nextRound(0)
  }, [nextRound])

  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        setFeedback('💣 Boom! Tiden gick ut!')
        setStreak(0); audio.tap()
        setTimeout(() => {
          const nr = round + 1
          if (nr >= ROUNDS) { finalize(score); return }
          nextRound(nr)
        }, 1000)
        return 0
      }
      return t - 1
    }), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, feedback, score, nextRound])

  const finalize = (s: number) => {
    const prev = Number(localStorage.getItem('k0509_wb_best') ?? 0)
    if (s > prev) localStorage.setItem('k0509_wb_best', String(s))
    if (s > 0) onWin(Math.round(s / 5), s)
    setPhase('done')
  }

  const submit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const word = input.trim().toLowerCase()
    const valid = ACCEPTED[syllable] || []
    const hasSlyl = word.includes(syllable)
    const isNew = !used.has(word)
    const isWord = valid.includes(word) || (hasSlyl && word.length >= 3)
    if (hasSlyl && isNew && word.length >= 3) {
      const pts = (50 + (streak + 1) * 20) * (isWord ? 2 : 1)
      const ns = streak + 1
      setStreak(ns); setScore(s => s + pts); setUsed(u => new Set([...u, word]))
      setFeedback(`✅ "${word}" +${pts}p 🔥×${ns}`)
      audio.coin()
    } else if (!isNew) {
      setFeedback(`⚠️ Ord redan använt!`); audio.tap()
    } else {
      setFeedback(`❌ Måste innehålla "${syllable}"!`); audio.tap(); setStreak(0)
    }
    setTimeout(() => {
      const nr = round + 1
      if (nr >= ROUNDS) { finalize(score + (hasSlyl && isNew && word.length >= 3 ? (50 + (streak + 1) * 20) : 0)); return }
      nextRound(nr)
    }, 900)
  }, [syllable, input, used, streak, score, round, nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>💣 Ordbömbaren</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>💣</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordbömbaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En stavelse visas — skriv ett ord som innehåller den innan bomben exploderar! Streak ger mer poäng.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '20px', background: `rgba(${timeLeft <= 2 ? '248,113,113' : '255,255,255'},.06)`, border: `2px solid rgba(${timeLeft <= 2 ? '248,113,113' : '255,255,255'},.15)`, borderRadius: 16, transition: 'all .3s' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>Stavelsen</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 44, fontWeight: 900, color: timeLeft <= 2 ? '#f87171' : '#fff', letterSpacing: 4 }}>{syllable.toUpperCase()}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 4 }}>
              {Array.from({ length: timeLeft }, (_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: timeLeft <= 2 ? '#f87171' : '#4ade80' }} />)}
            </div>
          </div>

          {feedback && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#f87171' }}>{feedback}</div>}

          {phase === 'playing' && !feedback && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder={`Skriv ord med "${syllable}"...`}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 12, fontSize: 16, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.15)', color: '#e8e8f0', outline: 'none' }}
                autoFocus
              />
              <button className="btn-primary" style={{ padding: '12px 14px' }} onClick={submit}>→</button>
            </div>
          )}

          {phase === 'done' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 16 }}>🎉 {score}p på {ROUNDS} runder!</div>
              <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
