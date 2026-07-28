import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const FLAGS = [
  { flag: '🇸🇪', country: 'Sverige', options: ['Sverige', 'Norge', 'Finland', 'Danmark'] },
  { flag: '🇯🇵', country: 'Japan', options: ['Japan', 'Kina', 'Korea', 'Vietnam'] },
  { flag: '🇩🇪', country: 'Tyskland', options: ['Österrike', 'Schweiz', 'Tyskland', 'Belgien'] },
  { flag: '🇫🇷', country: 'Frankrike', options: ['Spanien', 'Frankrike', 'Italien', 'Portugal'] },
  { flag: '🇧🇷', country: 'Brasilien', options: ['Brasilien', 'Argentina', 'Colombia', 'Chile'] },
  { flag: '🇦🇺', country: 'Australien', options: ['Nya Zeeland', 'Kanada', 'Australien', 'Papua Nya Guinea'] },
  { flag: '🇨🇦', country: 'Kanada', options: ['USA', 'Kanada', 'Mexiko', 'Kuba'] },
  { flag: '🇮🇳', country: 'Indien', options: ['Pakistan', 'Bangladesh', 'Sri Lanka', 'Indien'] },
  { flag: '🇷🇺', country: 'Ryssland', options: ['Ryssland', 'Ukraina', 'Polen', 'Vitryssland'] },
  { flag: '🇳🇴', country: 'Norge', options: ['Island', 'Danmark', 'Norge', 'Finland'] },
  { flag: '🇮🇹', country: 'Italien', options: ['Italien', 'Ungern', 'Rumänien', 'Bulgarien'] },
  { flag: '🇪🇸', country: 'Spanien', options: ['Portugal', 'Spanien', 'Mexiko', 'Argentina'] },
  { flag: '🇬🇧', country: 'England', options: ['Irland', 'Skottland', 'England', 'Wales'] },
  { flag: '🇺🇸', country: 'USA', options: ['Kanada', 'USA', 'Liberia', 'Australien'] },
  { flag: '🇰🇷', country: 'Sydkorea', options: ['Nordkorea', 'Sydkorea', 'Japan', 'Taiwan'] },
  { flag: '🇲🇽', country: 'Mexiko', options: ['Brasilien', 'Colombia', 'Mexiko', 'Guatemala'] },
  { flag: '🇨🇳', country: 'Kina', options: ['Vietnam', 'Kina', 'Laos', 'Kambodja'] },
  { flag: '🇿🇦', country: 'Sydafrika', options: ['Sydafrika', 'Nigeria', 'Kenya', 'Ghana'] },
  { flag: '🇦🇷', country: 'Argentina', options: ['Uruguay', 'Argentina', 'Chile', 'Paraguay'] },
  { flag: '🇮🇩', country: 'Indonesien', options: ['Malaysia', 'Indonesien', 'Filippinerna', 'Thailand'] },
]

const ROUNDS = 10

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export const FlagQuizGame = memo(function FlagQuizGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [questions, setQuestions] = useState<typeof FLAGS>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_fq_best') ?? 0))

  const start = useCallback(() => {
    const qs = shuffle(FLAGS).slice(0, ROUNDS)
    setQuestions(qs); setRound(0); setScore(0); setSelected(null); setStreak(0)
    setPhase('playing')
  }, [])

  const answer = useCallback((choice: string) => {
    if (selected) return
    setSelected(choice)
    const q = questions[round]
    const correct = choice === q.country
    const newStreak = correct ? streak + 1 : 0
    const newScore = correct ? score + 10 + Math.min(newStreak - 1, 5) * 5 : score
    setStreak(newStreak); setScore(newScore)
    if (correct) audio.coin(); else audio.click()
    setTimeout(() => {
      setSelected(null)
      if (round + 1 >= ROUNDS) {
        const prev = Number(localStorage.getItem('k0509_fq_best') ?? 0)
        if (newScore > prev) localStorage.setItem('k0509_fq_best', String(newScore))
        onWin(Math.round(newScore * 3), newScore * 5)
        audio.achievement(); setPhase('done')
      } else {
        setRound(r => r + 1)
      }
    }, 900)
  }, [selected, questions, round, streak, score, onWin])

  const q = questions[round]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌍 Flaggquiz</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Flaggquiz</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vilket land tillhör flaggan?<br />10 frågor · Streakbonus!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(round / ROUNDS) * 100}%`, background: '#818cf8', transition: 'width .3s' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 80 }}>{q.flag}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>Vilket land? {streak >= 2 ? `🔥${streak}` : ''}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {shuffle(q.options).map(opt => {
              const isCorrect = opt === q.country
              const isSelected = opt === selected
              const bg = selected
                ? isCorrect ? 'rgba(74,222,128,.2)' : isSelected ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.03)'
                : 'rgba(255,255,255,.05)'
              const border = selected
                ? isCorrect ? 'rgba(74,222,128,.5)' : isSelected ? 'rgba(248,113,113,.4)' : 'rgba(255,255,255,.06)'
                : 'rgba(255,255,255,.1)'
              return (
                <button key={opt} onClick={() => answer(opt)} disabled={!!selected} style={{ padding: '14px 10px', borderRadius: 14, background: bg, border: `2px solid ${border}`, color: '#e8e8f0', fontSize: 13, fontWeight: 700, cursor: selected ? 'default' : 'pointer', transition: 'all .2s' }}>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 120 ? '🏆' : score >= 80 ? '⭐' : '🌍'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{questions.filter((_, i) => i < ROUNDS).length}/{ROUNDS} rätt</div>
          {score >= bestScore && score > 0 && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{Math.round(score * 3)}🪙 +{score * 5} XP</div>
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
