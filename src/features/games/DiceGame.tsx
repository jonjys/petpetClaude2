import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  coins: number
  spendCoins: (n: number) => boolean
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const BET_OPTIONS = [5, 10, 25, 50]

type Bet = 'high' | 'low' | 'seven'

function rollDie(): number { return Math.floor(Math.random() * 6) + 1 }

export const DiceGame = memo(function DiceGame({ onExit, onWin, coins, spendCoins }: Props) {
  const [bet, setBet] = useState(10)
  const [betType, setBetType] = useState<Bet>('high')
  const [dice, setDice] = useState<[number, number]>([1, 1])
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<'win' | 'lose' | null>(null)
  const [lastWin, setLastWin] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [wins, setWins] = useState(0)
  const [streak, setStreak] = useState(0)
  const [display, setDisplay] = useState<[number, number]>([1, 1])

  const roll = useCallback(() => {
    if (rolling || !spendCoins(bet)) return
    setRolling(true)
    setResult(null)
    audio.click()

    let ticks = 0
    const iv = setInterval(() => {
      setDisplay([rollDie(), rollDie()])
      ticks++
      if (ticks >= 12) {
        clearInterval(iv)
        const d1 = rollDie()
        const d2 = rollDie()
        const sum = d1 + d2
        setDice([d1, d2])
        setDisplay([d1, d2])

        const won = betType === 'high' ? sum > 7 : betType === 'low' ? sum < 7 : sum === 7
        const mult = betType === 'seven' ? 4 : 1.8
        const newStreak = won ? streak + 1 : 0
        setStreak(newStreak)
        const streakBonus = won && newStreak >= 3 ? 1.5 : 1

        if (won) {
          const winAmt = Math.round(bet * mult * streakBonus)
          setLastWin(winAmt)
          setResult('win')
          setWins(w => w + 1)
          onWin(winAmt, Math.ceil(winAmt / 5))
          audio.achievement()
        } else {
          setLastWin(-bet)
          setResult('lose')
        }
        setGamesPlayed(g => g + 1)
        setRolling(false)
      }
    }, 80)
  }, [rolling, bet, betType, spendCoins, onWin, streak])

  const betColors: Record<Bet, string> = {
    high: '74,222,128',
    low: '96,165,250',
    seven: '251,191,36',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎲 Tärningsspel</span>
        <span className={styles.scoreDisplay}>{wins}/{gamesPlayed} vunna</span>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Dice display */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: '24px 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          border: result === 'win' ? '1px solid rgba(74,222,128,.4)' : result === 'lose' ? '1px solid rgba(248,113,113,.4)' : '1px solid rgba(255,255,255,.08)',
          transition: 'border-color .3s',
        }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {display.map((d, i) => (
              <div
                key={i}
                style={{
                  fontSize: 64,
                  filter: rolling ? 'blur(2px)' : 'none',
                  transition: 'filter .05s',
                  transform: rolling ? `rotate(${Math.random() * 30 - 15}deg)` : 'none',
                }}
              >
                {DICE_FACES[d - 1]}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
            = {display[0] + display[1]}
          </div>

          {result === 'win' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, color: '#4ade80', fontWeight: 900 }}>🏆 VANN! +{lastWin} 🪙</div>
              {streak >= 3 && <div style={{ fontSize: 11, color: '#fbbf24' }}>🔥 {streak}x streak-bonus!</div>}
            </div>
          )}
          {result === 'lose' && (
            <div style={{ fontSize: 16, color: '#f87171', fontWeight: 700 }}>💸 Förlorade {bet} 🪙</div>
          )}
        </div>

        {/* Bet type */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([['high', 'HÖGT', '> 7'], ['low', 'LÅGT', '< 7'], ['seven', '7!', '= 7 × 4']] as const).map(([t, label, sub]) => (
            <button
              key={t}
              onClick={() => { setBetType(t); audio.click() }}
              style={{
                flex: 1, padding: '10px 6px',
                background: betType === t ? `rgba(${betColors[t]},0.2)` : 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(${betColors[t]},${betType === t ? '0.6' : '0.15'})`,
                borderRadius: 12, color: '#fff',
                fontFamily: 'var(--ff-head)', fontWeight: 900, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {label}
              <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 400 }}>{sub}</div>
            </button>
          ))}
        </div>

        {/* Bet amount */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700, flexShrink: 0 }}>Insats:</div>
          {BET_OPTIONS.map(b => (
            <button
              key={b}
              onClick={() => { setBet(b); audio.click() }}
              style={{
                flex: 1, padding: '8px 4px',
                background: bet === b ? 'rgba(255,204,0,.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${bet === b ? 'rgba(255,204,0,.5)' : 'rgba(255,255,255,.1)'}`,
                borderRadius: 10, color: bet === b ? '#fbbf24' : '#888',
                fontFamily: 'var(--ff-head)', fontWeight: 900, fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {b}🪙
            </button>
          ))}
        </div>

        {/* Wallet & roll */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>💰 {coins} 🪙</div>
          <button
            className="btn-primary"
            style={{ flex: 1, fontSize: 16, padding: '14px 0', opacity: coins < bet || rolling ? 0.5 : 1 }}
            onClick={roll}
            disabled={coins < bet || rolling}
          >
            {rolling ? '🎲 Slår...' : '🎲 Kasta!'}
          </button>
        </div>

        {streak >= 2 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24' }}>🔥 {streak}x vinstsvit!</div>
        )}
      </div>
    </div>
  )
})
