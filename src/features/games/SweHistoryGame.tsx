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

const EASY: Q[] = [
  { question: 'Vilket år bildades Sverige som rike?', answer: '1523', options: ['1523', '1397', '1611', '1809'] },
  { question: 'Vem var Sveriges förste kung av huset Vasa?', answer: 'Gustav Vasa', options: ['Gustav Vasa', 'Karl XII', 'Gustav II Adolf', 'Erik XIV'] },
  { question: 'I vilket krig deltog Sverige under Gustav II Adolf?', answer: 'Trettioåriga kriget', options: ['Trettioåriga kriget', 'Napoleonkrigen', 'Krimkriget', 'Sjuåriga kriget'] },
  { question: 'Vilket år antog Sverige sin nuvarande grundlag?', answer: '1974', options: ['1974', '1809', '1866', '1921'] },
  { question: 'Vad heter den svenska riksdagens byggnad i Stockholm?', answer: 'Riksdagshuset', options: ['Riksdagshuset', 'Rosenbad', 'Stockholms slott', 'Sager House'] },
  { question: 'Vilket år fick kvinnor rösträtt i Sverige?', answer: '1921', options: ['1921', '1909', '1945', '1918'] },
  { question: 'Vad kallas perioden 1772-1809 i svensk historia?', answer: 'Gustavianska epoken', options: ['Gustavianska epoken', 'Frihetstiden', 'Stormaktstiden', 'Folkhemstiden'] },
  { question: 'Vilket år lämnade Sverige Kalmarunionen?', answer: '1523', options: ['1523', '1397', '1460', '1471'] },
]

const MEDIUM: Q[] = [
  { question: 'Vid vilken händelse omkom Karl XII?', answer: 'Belägrade Fredriksten', options: ['Belägrade Fredriksten', 'Slaget vid Poltava', 'Slaget vid Narva', 'Freden i Nystad'] },
  { question: 'Vad kallas perioden 1718-1772 i svensk historia?', answer: 'Frihetstiden', options: ['Frihetstiden', 'Stormaktstiden', 'Gustavianska epoken', 'Medeltiden'] },
  { question: 'Vilket år avskaffades dödsstraffet i Sverige?', answer: '1972', options: ['1972', '1944', '1963', '1980'] },
  { question: 'Vem mördades 1986 på Sveavägen?', answer: 'Olof Palme', options: ['Olof Palme', 'Dag Hammarskjöld', 'Anna Lindh', 'Tage Erlander'] },
  { question: 'Vilket år gick Sverige med i EU?', answer: '1995', options: ['1995', '1991', '1999', '2001'] },
  { question: 'Vilken nordisk union grundades 1397 i Kalmar?', answer: 'Kalmarunionen', options: ['Kalmarunionen', 'Nordiska rådet', 'Hansan', 'Norska unionen'] },
]

const HARD: Q[] = [
  { question: 'Vad hette det berömda svenska skepp som sjönk 1628?', answer: 'Vasa', options: ['Vasa', 'Kronan', 'Mars', 'Riksäpplet'] },
  { question: 'Vilket år skedde Dackeupproret?', answer: '1542', options: ['1542', '1521', '1434', '1567'] },
  { question: 'Vem var ledare för Engelbrektsupproret?', answer: 'Engelbrekt Engelbrektsson', options: ['Engelbrekt Engelbrektsson', 'Gustav Vasa', 'Sten Sture d.ä.', 'Nils Dacke'] },
  { question: 'Vilket år skedde Stockholms blodbad?', answer: '1520', options: ['1520', '1523', '1471', '1497'] },
]

function pickQ(difficulty: number): Q {
  const pool = difficulty < 4 ? EASY : difficulty < 7 ? [...EASY, ...MEDIUM] : [...EASY, ...MEDIUM, ...HARD]
  const q = pool[Math.floor(Math.random() * pool.length)]
  const shuffled = [...q.options].sort(() => Math.random() - 0.5)
  return { ...q, options: shuffled }
}

export const SweHistoryGame = memo(function SweHistoryGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState(() => pickQ(0))
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_swh_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_swh_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_swh_best', String(s))
      onWin(s * 16, s * 48)
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
        <span className={styles.gameTitle}>🇸🇪 Sverigehistoria</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🇸🇪</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sverigehistoria</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Historia-trivia om Sverige! {TIME_LIMIT} sek per fråga, {ROUNDS} ronder. Svårare frågor tillkommer!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
            <div style={{ fontSize: 13, color: timeLeft <= 3 ? '#f87171' : '#4ade80', fontWeight: 900 }}>⏱ {timeLeft}s</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{q.question}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} style={{ height: 64, borderRadius: 16, fontSize: 12, fontWeight: 700, background: 'rgba(96,165,250,.1)', color: accent, border: '2px solid rgba(96,165,250,.3)', cursor: 'pointer', padding: '0 6px', lineHeight: 1.3 }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 48 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: accent }}>{q.answer}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? 'Rätt! 🇸🇪' : chosen === '--' ? 'Timeout!' : `Fel! Du valde: ${chosen}`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 6 ? '⭐' : '🇸🇪'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 6 ? 'Bra! 👍' : 'Öva mer! 🇸🇪'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 16}🪙 +{score * 48} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
