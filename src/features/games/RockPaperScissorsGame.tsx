import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

type Move = 'rock' | 'paper' | 'scissors'
const MOVES: Move[] = ['rock', 'paper', 'scissors']
const EMOJI: Record<Move, string> = { rock: '🪨', paper: '📄', scissors: '✂️' }
const NAMES: Record<Move, string> = { rock: 'Sten', paper: 'Papper', scissors: 'Sax' }
const BEATS: Record<Move, Move> = { rock: 'scissors', paper: 'rock', scissors: 'paper' }

const BEST_OF = 5

function outcome(player: Move, ai: Move): 'win' | 'lose' | 'draw' {
  if (player === ai) return 'draw'
  return BEATS[player] === ai ? 'win' : 'lose'
}

export const RockPaperScissorsGame = memo(function RockPaperScissorsGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [playerWins, setPlayerWins] = useState(0)
  const [aiWins, setAiWins] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [lastPlayer, setLastPlayer] = useState<Move | null>(null)
  const [lastAi, setLastAi] = useState<Move | null>(null)
  const [lastResult, setLastResult] = useState<'win' | 'lose' | 'draw' | null>(null)
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_rps_best') ?? 0))
  const [totalWins, setTotalWins] = useState(bestScore)

  const start = useCallback(() => {
    setPlayerWins(0); setAiWins(0); setRounds(0)
    setLastPlayer(null); setLastAi(null); setLastResult(null); setGameResult(null)
    setPhase('playing')
  }, [])

  const play = useCallback((move: Move) => {
    const aiMove = MOVES[Math.floor(Math.random() * 3)]
    const res = outcome(move, aiMove)
    const newPW = res === 'win' ? playerWins + 1 : playerWins
    const newAW = res === 'lose' ? aiWins + 1 : aiWins
    const newRounds = rounds + 1
    setLastPlayer(move); setLastAi(aiMove); setLastResult(res)
    setPlayerWins(newPW); setAiWins(newAW); setRounds(newRounds)
    if (res === 'win') audio.coin(); else if (res === 'lose') audio.click()
    const winsNeeded = Math.ceil(BEST_OF / 2) + 1
    if (newPW >= winsNeeded || newAW >= winsNeeded || newRounds >= BEST_OF + 2) {
      const won = newPW > newAW
      setGameResult(won ? 'win' : 'lose')
      if (won) {
        audio.achievement()
        const newTotal = totalWins + 1
        setTotalWins(newTotal)
        const prev = Number(localStorage.getItem('k0509_rps_best') ?? 0)
        if (newTotal > prev) localStorage.setItem('k0509_rps_best', String(newTotal))
        onWin(newTotal * 40, newTotal * 80)
      }
      setPhase('done')
    }
  }, [playerWins, aiWins, rounds, totalWins, onWin])

  const winsNeeded = Math.ceil(BEST_OF / 2) + 1
  const resColor = lastResult === 'win' ? '#4ade80' : lastResult === 'lose' ? '#f87171' : '#fbbf24'
  const resText = lastResult === 'win' ? 'Du vann rundan!' : lastResult === 'lose' ? 'Datorn vann rundan!' : 'Oavgjort!'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>✂️ Sten Sax Påse</span>
        <span className={styles.scoreDisplay}>{playerWins}-{aiWins}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>✂️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Sten, Sax, Påse</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Bäst av {BEST_OF} mot datorn!<br />Vinn {winsNeeded} rundor för att vinna matchen.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Totalt vunna matcher: {bestScore}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Du</div>
              <div style={{ fontSize: 36, minHeight: 44 }}>{lastPlayer ? EMOJI[lastPlayer] : '❓'}</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#818cf8' }}>{playerWins}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, color: 'var(--t3)' }}>VS</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Datorn</div>
              <div style={{ fontSize: 36, minHeight: 44 }}>{lastAi ? EMOJI[lastAi] : '❓'}</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#f87171' }}>{aiWins}</div>
            </div>
          </div>
          {lastResult && <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 900, color: resColor }}>{resText}</div>}
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Runda {rounds + 1}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {MOVES.map(m => (
              <button key={m} onClick={() => play(m)} style={{ flex: 1, padding: '16px 8px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.1)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 28 }}>{EMOJI[m]}</span>
                <span style={{ fontSize: 10, color: 'var(--t3)' }}>{NAMES[m]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{gameResult === 'win' ? '🏆' : '😅'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: gameResult === 'win' ? '#4ade80' : '#f87171' }}>
            {gameResult === 'win' ? 'Du vann matchen!' : 'Datorn vann matchen!'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>{playerWins} - {aiWins} i rundor</div>
          {gameResult === 'win' && <div style={{ fontSize: 13, color: '#fbbf24' }}>+{totalWins * 40}🪙 +{totalWins * 80} XP</div>}
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
