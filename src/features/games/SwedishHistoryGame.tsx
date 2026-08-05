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

const ANCIENT: QDef[] = [
  { q: 'Vilket år grundades Sverige som nation (ca)?', a: '800-talet', w: ['600-talet', '1000-talet', '1200-talet'] },
  { q: 'Vad heter Sveriges förste kung (legendarisk)?', a: 'Erik Segersäll', w: ['Gustav Vasa', 'Karl den store', 'Björn Järnsida'] },
  { q: 'Vilket folk bosatte sig i Skandinavien under vikingatiden?', a: 'Nordbor', w: ['Kelter', 'Romare', 'Hunner'] },
  { q: 'Vad heter det svenska rikets äldsta stad?', a: 'Sigtuna', w: ['Stockholm', 'Uppsala', 'Göteborg'] },
  { q: 'Vilket år var Magnus Ladulås kung i Sverige?', a: '1275–1290', w: ['1050–1066', '1350–1370', '1400–1412'] },
]

const MEDIEVAL: QDef[] = [
  { q: 'Vem var Gustav Vasa?', a: 'Sveriges förste rikskung', w: ['En vikingahövding', 'En dansk kung', 'En norsk sjöfarare'] },
  { q: 'Vilket år grundade Gustav Vasa kungadömet Sverige?', a: '1523', w: ['1492', '1648', '1389'] },
  { q: 'Vad är Kalmarunionen?', a: 'Nordisk statsunion 1397–1523', w: ['En handelspakt 1200', 'En militärallians 1600', 'Ett fredsavtal 1700'] },
  { q: 'Vilken religion antog Sverige på 1500-talet?', a: 'Lutheranism', w: ['Katolicismen', 'Kalvinism', 'Ortodoxt kristendom'] },
  { q: 'Vad hette den svenska armadas störste general under stormaktstiden?', a: 'Karl X Gustav', w: ['Gustaf II Adolf', 'Karl XII', 'Johan III'] },
]

const MODERN: QDef[] = [
  { q: 'Vilket år antog Sverige sin nuvarande grundlag?', a: '1974', w: ['1809', '1865', '1921'] },
  { q: 'När fick kvinnor rösträtt i Sverige?', a: '1921', w: ['1905', '1945', '1918'] },
  { q: 'Vilket år gick Sverige med i EU?', a: '1995', w: ['1973', '2000', '1986'] },
  { q: 'Vem var Sveriges statsminister när neutraliteten deklarerades 1940?', a: 'Per Albin Hansson', w: ['Tage Erlander', 'Hjalmar Branting', 'Ernst Wigforss'] },
  { q: 'Vilket år avskaffades monarkins politiska makt i Sverige?', a: '1974', w: ['1809', '1905', '1950'] },
]

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 7 ? 1 : 2
  let pool: QDef[]
  if (tier === 0) pool = ANCIENT
  else if (tier === 1) pool = MEDIEVAL
  else pool = MODERN

  const def = pool[Math.floor(Math.random() * pool.length)]
  return { question: def.q, answer: def.a, options: uniqueFourStr(def.a, () => def.w[Math.floor(Math.random() * def.w.length)]) }
}

export const SwedishHistoryGame = memo(function SwedishHistoryGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_swehist2_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_swehist2_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_swehist2_best', String(s))
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

  const accent = '#fbbf24'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>📜 Historien</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>📜</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sveriges Historia</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Forntid, medeltid och modern tid! {TIME_LIMIT} sek, {ROUNDS} ronder.
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.7 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 12, fontWeight: 900, background: 'rgba(251,191,36,.1)', color: accent, border: '2px solid rgba(251,191,36,.3)', cursor: 'pointer', padding: '0 6px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>{q.question}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 📜' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '📜'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 📜'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 17}🪙 +{score * 51} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
