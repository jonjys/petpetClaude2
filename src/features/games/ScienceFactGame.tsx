import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10
const TIME_LIMIT = 9

type Q = { question: string; answer: string; options: string[] }

function uniqueFourStr(answer: string, gen: () => string): string[] {
  const seen = new Set([answer])
  const opts = [answer]
  let safety = 0
  while (opts.length < 4 && safety++ < 300) {
    const w = gen()
    if (!seen.has(w)) { seen.add(w); opts.push(w) }
  }
  let e = 0
  while (opts.length < 4) { const fb = `??${++e}`; if (!seen.has(fb)) { seen.add(fb); opts.push(fb) } }
  return opts.sort(() => Math.random() - 0.5)
}

type QDef = { q: string; a: string; w: string[] }

const PHYSICS: QDef[] = [
  { q: 'Vad är enheten för kraft?', a: 'Newton', w: ['Joule', 'Watt', 'Pascal'] },
  { q: 'Vad är ljusets hastighet (ca)?', a: '300 000 km/s', w: ['150 000 km/s', '500 000 km/s', '30 000 km/s'] },
  { q: 'Vad mäter en termometer?', a: 'Temperatur', w: ['Tryck', 'Massa', 'Volym'] },
  { q: 'Vilken partikel har negativ laddning?', a: 'Elektron', w: ['Proton', 'Neutron', 'Foton'] },
  { q: 'Vad är enheten för elektrisk spänning?', a: 'Volt', w: ['Ampere', 'Ohm', 'Watt'] },
  { q: 'Vad kallas rörelse orsakad av gravitation?', a: 'Fritt fall', w: ['Tröghet', 'Friktion', 'Magnetism'] },
  { q: 'Vilken våg transporterar INTE materia?', a: 'Ljusvåg', w: ['Havsvåg', 'Ljudvåg', 'Seismisk våg'] },
]

const CHEMISTRY: QDef[] = [
  { q: 'Vad är kemisk beteckning för vatten?', a: 'H₂O', w: ['CO₂', 'NaCl', 'O₂'] },
  { q: 'Vad är kemisk beteckning för salt?', a: 'NaCl', w: ['H₂O', 'CO₂', 'KCl'] },
  { q: 'Vilket grundämne har symbol O?', a: 'Syre', w: ['Osmium', 'Ozon', 'Ovan'] },
  { q: 'Vad kallas en substans med pH < 7?', a: 'Syra', w: ['Bas', 'Salt', 'Neutral'] },
  { q: 'Vilket grundämne är flytande vid rumstemperatur?', a: 'Kvicksilver', w: ['Järn', 'Guld', 'Aluminium'] },
  { q: 'Vilken gas finns mest i atmosfären?', a: 'Kväve', w: ['Syre', 'Koldioxid', 'Argon'] },
  { q: 'Vad kallas minsta enheten av ett grundämne?', a: 'Atom', w: ['Molekyl', 'Elektron', 'Partikel'] },
]

const BIOLOGY: QDef[] = [
  { q: 'Vilken cell har cellvägg?', a: 'Växcell', w: ['Djurcell', 'Blodcell', 'Nervcell'] },
  { q: 'Var sker fotosyntes i cellen?', a: 'Kloroplast', w: ['Mitokondrie', 'Cellkärna', 'Ribosom'] },
  { q: 'Vad kallas arvsmassan i cellen?', a: 'DNA', w: ['RNA', 'ATP', 'mRNA'] },
  { q: 'Vilket organ pumpar blodet?', a: 'Hjärtat', w: ['Lungan', 'Levern', 'Njuren'] },
  { q: 'Vad kallas det när en cell delar sig?', a: 'Celldelning', w: ['Osmosis', 'Diffusion', 'Fermentering'] },
  { q: 'Vad producerar fotosyntesen?', a: 'Socker och syre', w: ['Koldioxid och vatten', 'Protein och fett', 'Salt och syra'] },
]

const ALL_Q = [...PHYSICS, ...CHEMISTRY, ...BIOLOGY]

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 7 ? 1 : 2
  let pool: QDef[]
  if (tier === 0) pool = PHYSICS
  else if (tier === 1) pool = CHEMISTRY
  else pool = BIOLOGY

  const def = pool[Math.floor(Math.random() * pool.length)]
  return { question: def.q, answer: def.a, options: uniqueFourStr(def.a, () => def.w[Math.floor(Math.random() * def.w.length)]) }
}

void ALL_Q

export const ScienceFactGame = memo(function ScienceFactGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_scifact_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_scifact_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_scifact_best', String(s))
      onWin(s * 17, s * 51)
      setPhase('done')
      audio.achievement()
      return
    }
    answeredRef.current = false
    setQ(makeQ(r))
    setChosen(null)
    setTimeLeft(TIME_LIMIT)
    setRound(r)
    setPhase('play')
  }, [onWin])

  useEffect(() => {
    if (phase !== 'play') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          if (!answeredRef.current) {
            answeredRef.current = true
            setWasCorrect(false)
            setChosen('--')
            setPhase('feedback')
            audio.click()
            toRef.current = setTimeout(() => nextRound(round + 1), 1000)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, round, nextRound])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (toRef.current) clearTimeout(toRef.current)
  }, [])

  const answer = useCallback((val: string) => {
    if (phase !== 'play' || answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const correct = val === q.answer
    setWasCorrect(correct)
    setChosen(val)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    toRef.current = setTimeout(() => nextRound(round + 1), 1000)
  }, [phase, q, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const accent = '#60a5fa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔬 NO-fakta</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔬</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>NO-fakta</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Fysik, kemi och biologi! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 3 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '28px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.7 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 13, fontWeight: 900, background: 'rgba(96,165,250,.1)', color: accent, border: '2px solid rgba(96,165,250,.3)', cursor: 'pointer', padding: '0 6px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>{q.question}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🔬' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🔬'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🔬'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 17}🪙 +{score * 51} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
