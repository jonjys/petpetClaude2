import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 8
const SHOW_MS = 2500

const EMOJI_POOL = [
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮',
  '🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦉','🦋','🐌','🐛','🐝',
  '🦀','🐠','🐟','🐡','🐬','🐳','🦈','🐊','🐢','🦎','🐍','🦔',
  '🐙','🦑','🦞','🦐','🐞','🦗','🐜','🐿','🦫','🦦','🦥','🐁',
  '🐇','🐈','🦌','🦬','🐂','🐄','🐖','🐏','🦙','🐐','🦘','🐘',
  '🦏','🦛','🐪','🐫','🦒','🦓','🦍','🦧','🕊','🐕','🦮','🦃',
  '🦤','🦚','🦜','🦢','🦩','🐓','🦆','🐉','🦕','🦖','🐊','🦋',
]

function getEmojis(round: number): { shown: string[]; all: string[] } {
  const count = Math.min(4 + round, 9)
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5)
  const shown = shuffled.slice(0, count)
  const distractors = shuffled.slice(count, count + 4)
  const all = [...shown, ...distractors].sort(() => Math.random() - 0.5)
  return { shown, all }
}

export const IconRecallGame = memo(function IconRecallGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'show' | 'answer' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [shown, setShown] = useState<string[]>([])
  const [all, setAll] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [roundPts, setRoundPts] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_ir_best') ?? 0))
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_ir_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_ir_best', String(s))
      onWin(s * 12, s * 38)
      setPhase('done')
      audio.achievement()
      return
    }
    const { shown: sh, all: a } = getEmojis(r)
    setShown(sh)
    setAll(a)
    setSelected(new Set())
    setRound(r)
    setPhase('show')
    timerRef.current = setTimeout(() => setPhase('answer'), SHOW_MS)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    nextRound(0)
  }, [nextRound])

  const toggle = useCallback((emoji: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(emoji)) next.delete(emoji)
      else next.add(emoji)
      return next
    })
  }, [])

  const submit = useCallback(() => {
    let correct = 0
    selected.forEach(e => { if (shown.includes(e)) correct++ })
    const pts = correct
    scoreRef.current += pts
    setScore(scoreRef.current)
    setRoundPts(pts)
    setPhase('feedback')
    if (pts >= shown.length) audio.coin()
    else if (pts > 0) audio.tap()
    else audio.click()
    timerRef.current = setTimeout(() => nextRound(round + 1), 1400)
  }, [selected, shown, round, nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🧠 Emoji Minne</span>
        <span className={styles.scoreDisplay}>{score} pt</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🧠</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Emoji Minne</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Memorera emoji på skärmen — välj sedan rätt bland blandade alternativ! 8 ronder, fler emoji varje runda.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} pt</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'show' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Memorera dessa! ({round + 1}/{ROUNDS})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {shown.map((e, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
                {e}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'answer' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Välj de du såg ({shown.length} st)! ({round + 1}/{ROUNDS})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {all.map((e, i) => (
              <button
                key={i}
                onClick={() => toggle(e)}
                style={{
                  aspectRatio: '1', borderRadius: 12, fontSize: 28,
                  background: selected.has(e) ? 'rgba(96,165,250,.3)' : 'rgba(255,255,255,.06)',
                  border: selected.has(e) ? '2px solid #60a5fa' : '2px solid rgba(255,255,255,.1)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .12s, border-color .12s',
                }}
              >
                {e}
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            style={{ padding: '12px 24px', opacity: selected.size === 0 ? 0.5 : 1 }}
            onClick={submit}
            disabled={selected.size === 0}
          >
            Klar! ({selected.size}/{shown.length})
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{roundPts >= shown.length ? '✅' : roundPts > 0 ? '⭐' : '❌'}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: roundPts >= shown.length ? '#4ade80' : roundPts > 0 ? '#fbbf24' : '#f87171' }}>
            {roundPts >= shown.length ? `Perfekt! +${roundPts}` : roundPts > 0 ? `+${roundPts} av ${shown.length}` : `Inga poäng`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>Rätt: {shown.join(' ')}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 50 ? '🏆' : score >= 35 ? '⭐' : '🧠'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} poäng</div>
          <div style={{ fontSize: 13, color: score >= 50 ? '#4ade80' : '#fbbf24' }}>
            {score >= 60 ? 'PERFEKT MINNE! 🏆' : score >= 45 ? 'Utmärkt! ⭐' : score >= 30 ? 'Bra jobbat! 👍' : 'Öva mer! 🧠'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 12}🪙 +{score * 38} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
