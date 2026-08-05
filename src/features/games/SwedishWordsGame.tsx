import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_LIMIT = 7

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

// en/ett gender
const GENDER_Q: QDef[] = [
  { q: 'Vilket är rätt artikel: ___ hus?', a: 'ett hus', w: ['en hus', 'en huset', 'ett husen'] },
  { q: 'Vilket är rätt artikel: ___ bil?', a: 'en bil', w: ['ett bil', 'en bilen', 'ett bilar'] },
  { q: 'Vilket är rätt artikel: ___ bord?', a: 'ett bord', w: ['en bord', 'en bordet', 'ett borden'] },
  { q: 'Vilket är rätt artikel: ___ blomma?', a: 'en blomma', w: ['ett blomma', 'en blomman', 'ett blommor'] },
  { q: 'Vilket är rätt artikel: ___ land?', a: 'ett land', w: ['en land', 'ett landet', 'en lander'] },
  { q: 'Vilket är rätt artikel: ___ skola?', a: 'en skola', w: ['ett skola', 'en skolan', 'ett skolor'] },
  { q: 'Vilket är rätt artikel: ___ barn?', a: 'ett barn', w: ['en barn', 'ett barnet', 'en barnen'] },
  { q: 'Vilket är rätt artikel: ___ katt?', a: 'en katt', w: ['ett katt', 'en katten', 'ett kattar'] },
  { q: 'Vilket är rätt artikel: ___ äpple?', a: 'ett äpple', w: ['en äpple', 'ett äpplet', 'en äpplen'] },
  { q: 'Vilket är rätt artikel: ___ dörr?', a: 'en dörr', w: ['ett dörr', 'en dörren', 'ett dörrar'] },
]

// plural forms
const PLURAL_Q: QDef[] = [
  { q: 'Plural av "bok"?', a: 'böcker', w: ['boks', 'böken', 'bokar'] },
  { q: 'Plural av "man"?', a: 'män', w: ['mans', 'maner', 'männer'] },
  { q: 'Plural av "barn"?', a: 'barn', w: ['barns', 'barnen', 'barnar'] },
  { q: 'Plural av "hand"?', a: 'händer', w: ['hands', 'hander', 'händar'] },
  { q: 'Plural av "fot"?', a: 'fötter', w: ['fotar', 'foter', 'föter'] },
  { q: 'Plural av "land"?', a: 'länder', w: ['lands', 'lander', 'ländar'] },
  { q: 'Plural av "lärare"?', a: 'lärare', w: ['läraren', 'lärares', 'lärar'] },
  { q: 'Plural av "stad"?', a: 'städer', w: ['stads', 'stader', 'städar'] },
  { q: 'Plural av "hund"?', a: 'hundar', w: ['hunds', 'hunder', 'händer'] },
  { q: 'Plural av "ägg"?', a: 'ägg', w: ['äggs', 'äggen', 'äggarna'] },
]

// verb conjugation
const VERB_Q: QDef[] = [
  { q: 'Konjugera "att springa" (presens): Jag ___', a: 'springer', w: ['spring', 'sprang', 'sprungit'] },
  { q: 'Konjugera "att äta" (preteritum): Han ___', a: 'åt', w: ['äter', 'ätit', 'ät'] },
  { q: 'Konjugera "att se" (presens): De ___', a: 'ser', w: ['såg', 'sett', 'seende'] },
  { q: 'Konjugera "att gå" (preteritum): Vi ___', a: 'gick', w: ['går', 'gått', 'gångit'] },
  { q: 'Konjugera "att skriva" (presens): Hon ___', a: 'skriver', w: ['skrev', 'skrivit', 'skrivas'] },
  { q: 'Konjugera "att komma" (preteritum): Jag ___', a: 'kom', w: ['kommer', 'kommit', 'kommas'] },
  { q: 'Konjugera "att tala" (presens): Du ___', a: 'talar', w: ['talade', 'talat', 'talande'] },
  { q: 'Konjugera "att vara" (presens): Det ___', a: 'är', w: ['var', 'varit', 'vore'] },
]

const ALL = [...GENDER_Q, ...PLURAL_Q, ...VERB_Q]

function makeQ(difficulty: number): Q {
  const tier = difficulty < 4 ? 0 : difficulty < 8 ? 1 : 2
  let pool: QDef[]
  if (tier === 0) pool = GENDER_Q
  else if (tier === 1) pool = PLURAL_Q
  else pool = VERB_Q

  const def = pool[Math.floor(Math.random() * pool.length)]
  return { question: def.q, answer: def.a, options: uniqueFourStr(def.a, () => def.w[Math.floor(Math.random() * def.w.length)]) }
}

export const SwedishWordsGame = memo(function SwedishWordsGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => makeQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_swwords_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_swwords_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_swwords_best', String(s))
      onWin(s * 15, s * 45)
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
            toRef.current = setTimeout(() => nextRound(round + 1), 900)
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
    toRef.current = setTimeout(() => nextRound(round + 1), 900)
  }, [phase, q, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const accent = '#4ade80'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🇸🇪 Svenska</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🇸🇪</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Svenska</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            En/ett, plural och verbböjning! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 2 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '28px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.7 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 16, fontWeight: 900, background: 'rgba(74,222,128,.1)', color: accent, border: '2px solid rgba(74,222,128,.3)', cursor: 'pointer', padding: '0 6px' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.6 }}>{q.question}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🇸🇪' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🇸🇪'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🇸🇪'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 15}🪙 +{score * 45} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
