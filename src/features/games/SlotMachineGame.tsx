import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  coins?: number
}

const SYMBOLS = ['🍋','🍒','🍇','🔔','⭐','💎','🎰','🎯']
const WEIGHTS = [30, 25, 20, 12, 8, 3, 1, 1]

const PAY_TABLE: Record<string, number> = {
  '🍋🍋🍋': 3, '🍒🍒🍒': 5, '🍇🍇🍇': 8, '🔔🔔🔔': 15,
  '⭐⭐⭐': 25, '💎💎💎': 50, '🎰🎰🎰': 100, '🎯🎯🎯': 200,
}

function weightedPick(): string {
  const total = WEIGHTS.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < SYMBOLS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return SYMBOLS[i] }
  return SYMBOLS[0]
}

const BET_OPTIONS = [5, 10, 25, 50]
const MAX_SPINS = 15

export const SlotMachineGame = memo(function SlotMachineGame({ onExit, onWin, coins: initCoins = 200 }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [wallet, setWallet] = useState(initCoins)
  const [bet, setBet] = useState(10)
  const [reels, setReels] = useState<[string, string, string]>(['❓', '❓', '❓'])
  const [spinning, setSpinning] = useState(false)
  const [spins, setSpins] = useState(0)
  const [totalWon, setTotalWon] = useState(0)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [bestWin] = useState(() => Number(localStorage.getItem('k0509_slots_best') ?? 0))

  const start = useCallback(() => {
    setWallet(200); setBet(10); setReels(['❓','❓','❓']); setSpins(0)
    setTotalWon(0); setLastResult(null); setSpinning(false)
    setPhase('playing')
  }, [])

  const spin = useCallback(() => {
    if (spinning || wallet < bet) return
    setWallet(w => w - bet); setSpinning(true); setLastResult(null)
    setTimeout(() => {
      const r1 = weightedPick(), r2 = weightedPick(), r3 = weightedPick()
      setReels([r1, r2, r3])
      const key = `${r1}${r2}${r3}`
      const multi = PAY_TABLE[key] ?? (r1 === r2 || r2 === r3 || r1 === r3 ? 2 : 0)
      const winAmt = multi * bet
      if (winAmt > 0) {
        setWallet(w => w + winAmt)
        setTotalWon(t => t + winAmt)
        setLastResult(`+${winAmt}🪙 (${multi}×)`)
        audio.coin()
        if (multi >= 25) audio.achievement()
      } else {
        setLastResult('Ingen vinst')
        audio.click()
      }
      setSpinning(false)
      setSpins(s => {
        const ns = s + 1
        if (ns >= MAX_SPINS || wallet - bet + winAmt <= 0) setPhase('done')
        return ns
      })
    }, 600)
  }, [spinning, wallet, bet])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_slots_best') ?? 0)
      if (totalWon > prev) localStorage.setItem('k0509_slots_best', String(totalWon))
      const finalCoins = Math.max(0, wallet - 200 + totalWon)
      onWin(Math.max(wallet, 0), totalWon)
      audio.achievement()
    }
  }, [phase, wallet, totalWon, onWin])

  const reelBg = (sym: string) => sym === '💎' ? 'rgba(129,140,248,.2)' : sym === '🎰' || sym === '🎯' ? 'rgba(251,191,36,.2)' : 'rgba(255,255,255,.06)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎰 Slots</span>
        <span className={styles.scoreDisplay}>{spins}/{MAX_SPINS} · 🪙{wallet}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎰</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Slots</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Börja med 🪙200 · {MAX_SPINS} snurrar max<br />Tre lika = vinst! 💎💎💎 = 50×
          </div>
          {bestWin > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Bästa vinst: {bestWin}🪙</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {reels.map((sym, i) => (
              <div key={i} style={{
                width: 72, height: 80, borderRadius: 16, fontSize: spinning ? 14 : 42,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: reelBg(sym), border: '2px solid rgba(255,255,255,.15)',
                transition: 'font-size .2s',
              }}>
                {spinning ? '⏳' : sym}
              </div>
            ))}
          </div>

          <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {lastResult && (
              <div style={{ fontSize: 14, fontWeight: 900, color: lastResult.startsWith('+') ? '#4ade80' : '#888' }}>
                {lastResult}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {BET_OPTIONS.map(b => (
              <button key={b} onClick={() => setBet(b)} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900,
                background: bet === b ? 'rgba(129,140,248,.2)' : 'rgba(255,255,255,.06)',
                border: `1px solid ${bet === b ? 'rgba(129,140,248,.4)' : 'rgba(255,255,255,.1)'}`,
                color: bet === b ? '#818cf8' : '#888', cursor: 'pointer',
              }}>
                {b}🪙
              </button>
            ))}
          </div>

          <button className="btn-primary" style={{ padding: '16px 48px', fontSize: 16, opacity: (!spinning && wallet >= bet) ? 1 : 0.4 }}
            disabled={spinning || wallet < bet} onClick={spin}>
            {spinning ? '⏳ Snurrar...' : '🎰 SNURRA!'}
          </button>

          <div style={{ fontSize: 11, color: 'var(--t3)' }}>
            Total vinst: +{totalWon}🪙 · Satsar: {bet}🪙/snurr
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{wallet > 200 ? '🤑' : wallet > 100 ? '🎰' : '💸'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>
            {wallet > 200 ? `Vinst! +${wallet - 200}🪙` : wallet > 100 ? `Nästan! 🪙${wallet}` : `Förlorade 🪙${200 - wallet}`}
          </div>
          <div style={{ fontSize: 13, color: '#fbbf24' }}>Total vinstmynt: {totalWon}🪙</div>
          {totalWon > bestWin && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 BÄSTA VINST!</div>}
          <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
