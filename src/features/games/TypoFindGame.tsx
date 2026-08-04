import { memo, useState, useCallback, useRef, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 12
const TIME_LIMIT = 7

type Q = { words: string[]; answerIndex: number }

const SETS: [string, string, string, string][] = [
  ['katt', 'hund', 'häst', 'katr'],
  ['blomma', 'skola', 'flomma', 'träd'],
  ['Sverige', 'Norgee', 'Danmark', 'Finland'],
  ['äpple', 'päron', 'apälle', 'citron'],
  ['cykel', 'buss', 'cykkel', 'tåg'],
  ['matematik', 'matmatik', 'svenska', 'engelska'],
  ['bibliotek', 'bibriotek', 'museum', 'teater'],
  ['telefon', 'telifon', 'dator', 'surfplatta'],
  ['choklad', 'godis', 'choklat', 'kaka'],
  ['elefant', 'elefannt', 'giraff', 'lejon'],
  ['astronaut', 'astronaut', 'pilot', 'kosmonnaut'],
  ['helikopter', 'helikkoter', 'flygplan', 'båt'],
  ['fotboll', 'tennis', 'fotbål', 'basket'],
  ['gitarr', 'piano', 'gittar', 'violin'],
  ['semester', 'semster', 'resa', 'semester'],
  ['krokodil', 'krokodill', 'alligator', 'ödla'],
  ['spindel', 'myra', 'spiindel', 'bi'],
  ['dammsugar', 'damsugar', 'tvättmaskin', 'kylskåp'],
  ['frisör', 'lärare', 'frisörr', 'doktor'],
  ['paraply', 'paraply', 'parapli', 'regnjacka'],
]

function makeQ(difficulty: number): Q {
  const idx = Math.floor(Math.random() * SETS.length)
  const set = SETS[idx]
  const answerIndex = set.findIndex((w, i) => {
    const others = set.filter((_, j) => j !== i)
    return others.some(o => o !== w && levenshtein(w, o) <= 2 && !isCommonWord(w))
  })
  const typoIdx = answerIndex >= 0 ? answerIndex : pickTypo(set)
  const shuffled = [...set].sort(() => Math.random() - 0.5)
  const typoWord = set[typoIdx]
  const newAnswerIndex = shuffled.indexOf(typoWord)
  return { words: shuffled, answerIndex: newAnswerIndex }
}

function isCommonWord(w: string) {
  const common = ['katt', 'hund', 'häst', 'träd', 'skola', 'Sverige', 'Danmark', 'Finland',
    'äpple', 'päron', 'citron', 'cykel', 'buss', 'tåg', 'svenska', 'engelska', 'museum',
    'teater', 'dator', 'surfplatta', 'godis', 'kaka', 'giraff', 'lejon', 'pilot',
    'flygplan', 'båt', 'tennis', 'basket', 'piano', 'violin', 'resa', 'alligator',
    'ödla', 'myra', 'bi', 'tvättmaskin', 'kylskåp', 'lärare', 'doktor', 'regnjacka']
  return common.includes(w)
}

function pickTypo(set: string[]): number {
  for (let i = 0; i < set.length; i++) {
    if (!isCommonWord(set[i])) continue
    const others = set.filter((_, j) => j !== i)
    if (others.some(o => levenshtein(set[i], o) <= 2)) return i
  }
  return 2
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

const QUESTIONS: Q[] = [
  { words: ['katt', 'hund', 'häst', 'katr'], answerIndex: 3 },
  { words: ['blomma', 'flomma', 'skola', 'träd'], answerIndex: 1 },
  { words: ['Sverige', 'Norgee', 'Danmark', 'Finland'], answerIndex: 1 },
  { words: ['äpple', 'päron', 'apälle', 'citron'], answerIndex: 2 },
  { words: ['cykel', 'cykkel', 'buss', 'tåg'], answerIndex: 1 },
  { words: ['matematik', 'matmatik', 'svenska', 'engelska'], answerIndex: 1 },
  { words: ['bibliotek', 'bibriotek', 'museum', 'teater'], answerIndex: 1 },
  { words: ['telefon', 'telifon', 'dator', 'surfplatta'], answerIndex: 1 },
  { words: ['choklad', 'choklat', 'godis', 'kaka'], answerIndex: 1 },
  { words: ['elefant', 'elefannt', 'giraff', 'lejon'], answerIndex: 1 },
  { words: ['astronaut', 'pilot', 'kosmonnaut', 'flygare'], answerIndex: 2 },
  { words: ['helikopter', 'helikkoter', 'flygplan', 'båt'], answerIndex: 1 },
  { words: ['fotboll', 'fotbål', 'tennis', 'basket'], answerIndex: 1 },
  { words: ['gitarr', 'gittar', 'piano', 'violin'], answerIndex: 1 },
  { words: ['semester', 'semster', 'resa', 'ferie'], answerIndex: 1 },
  { words: ['krokodil', 'krokodill', 'alligator', 'ödla'], answerIndex: 1 },
  { words: ['spindel', 'spiindel', 'myra', 'bi'], answerIndex: 1 },
  { words: ['dammsugar', 'damsugar', 'tvättmaskin', 'kylskåp'], answerIndex: 1 },
  { words: ['lärare', 'frisörr', 'doktor', 'advokat'], answerIndex: 1 },
  { words: ['paraply', 'parapli', 'regnjacka', 'mössa'], answerIndex: 1 },
]

function pickQ(_difficulty: number): Q {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
  const shuffled = [...q.words].sort(() => Math.random() - 0.5)
  const typo = q.words[q.answerIndex]
  return { words: shuffled, answerIndex: shuffled.indexOf(typo) }
}

export const TypoFindGame = memo(function TypoFindGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => pickQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_tyf_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_tyf_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_tyf_best', String(s))
      onWin(s * 13, s * 39)
      setPhase('done')
      audio.achievement()
      return
    }
    answeredRef.current = false
    setQ(pickQ(r))
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
            setChosen(-1)
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

  const answer = useCallback((idx: number) => {
    if (phase !== 'play' || answeredRef.current) return
    answeredRef.current = true
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const correct = idx === q.answerIndex
    setWasCorrect(correct)
    setChosen(idx)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    toRef.current = setTimeout(() => nextRound(round + 1), 900)
  }, [phase, q, round, nextRound])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const accent = '#fb923c'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔍 Stavfelet</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Stavfelet</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Ett av fyra ord är felstavat — hitta det! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder.
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
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '16px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Vilket ord är felstavat?</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.words.map((word, i) => (
              <button key={i} onClick={() => answer(i)} style={{ height: 68, borderRadius: 16, fontSize: 15, fontWeight: 700, background: 'rgba(251,146,60,.1)', color: accent, border: '2px solid rgba(251,146,60,.3)', cursor: 'pointer', padding: '0 8px', wordBreak: 'break-word' }}>{word}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, color: 'var(--t3)' }}>Felstavat ord:</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#f87171' }}>{q.words[q.answerIndex]}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🔍' : chosen === -1 ? 'Timeout!' : `Fel! Du valde "${q.words[chosen!]}"`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 10 ? '🏆' : score >= 7 ? '⭐' : '🔍'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 10 ? '#4ade80' : '#fbbf24' }}>
            {score === 12 ? 'PERFEKT! 🏆' : score >= 10 ? 'Utmärkt! ⭐' : score >= 7 ? 'Bra! 👍' : 'Öva mer! 🔍'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 13}🪙 +{score * 39} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
