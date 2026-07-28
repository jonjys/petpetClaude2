import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  coins: number
}

type Card = { suit: string; val: string; num: number }

const SUITS = ['♠', '♥', '♦', '♣']
const VALS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']

function makeDeck(): Card[] {
  const d: Card[] = []
  for (const s of SUITS) for (const v of VALS) {
    const n = v === 'A' ? 11 : ['J','Q','K'].includes(v) ? 10 : parseInt(v)
    d.push({ suit: s, val: v, num: n })
  }
  return d.sort(() => Math.random() - 0.5)
}

function handValue(cards: Card[]): number {
  let total = cards.reduce((a, c) => a + c.num, 0)
  let aces = cards.filter(c => c.val === 'A').length
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

function CardDisplay({ card, hidden }: { card: Card; hidden?: boolean }) {
  const red = card.suit === '♥' || card.suit === '♦'
  return (
    <div style={{ width: 42, height: 58, borderRadius: 6, background: hidden ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.95)', border: `1px solid ${hidden ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.2)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {hidden ? <span style={{ fontSize: 18 }}>🂠</span> : (
        <span style={{ fontSize: 13, fontWeight: 900, color: red ? '#dc2626' : '#1e1e2e', lineHeight: 1.1, textAlign: 'center' }}>{card.val}<br />{card.suit}</span>
      )}
    </div>
  )
}

export const BlackjackGame = memo(function BlackjackGame({ onExit, onWin, coins }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [deck, setDeck] = useState<Card[]>([])
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [revealed, setRevealed] = useState(false)
  const [bet, setBet] = useState(50)
  const [result, setResult] = useState<'win' | 'lose' | 'push' | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bj_best') ?? 0))

  const deal = useCallback((betAmt: number) => {
    if (betAmt > coins) { return }
    const d = makeDeck()
    const ph = [d.pop()!, d.pop()!]
    const dh = [d.pop()!, d.pop()!]
    setDeck(d); setPlayerHand(ph); setDealerHand(dh); setRevealed(false); setResult(null)
    setBet(betAmt); setPhase('playing')
    if (handValue(ph) === 21) {
      const d2 = [...d]
      setRevealed(true)
      const dv = handValue(dh)
      if (dv === 21) { setResult('push'); audio.click() }
      else { setResult('win'); audio.achievement(); onWin(Math.round(betAmt * 1.5), betAmt * 3) }
      setPhase('done')
    }
  }, [coins, onWin])

  const hit = useCallback(() => {
    const d = [...deck]
    const card = d.pop()!
    const ph = [...playerHand, card]
    setDeck(d); setPlayerHand(ph)
    const v = handValue(ph)
    if (v > 21) {
      setRevealed(true); setResult('lose'); audio.click()
      const newStreak = 0; setStreak(newStreak); setPhase('done')
    }
    audio.coin()
  }, [deck, playerHand])

  const stand = useCallback(() => {
    let dh = [...dealerHand]
    let d = [...deck]
    while (handValue(dh) < 17) { dh.push(d.pop()!); }
    setDealerHand(dh); setDeck(d); setRevealed(true)
    const pv = handValue(playerHand)
    const dv = handValue(dh)
    if (dv > 21 || pv > dv) {
      setResult('win'); audio.achievement()
      const newStreak = streak + 1; setStreak(newStreak)
      const winAmt = bet * (newStreak >= 3 ? 2 : 1)
      const prev = Number(localStorage.getItem('k0509_bj_best') ?? 0)
      if (winAmt > prev) localStorage.setItem('k0509_bj_best', String(winAmt))
      onWin(winAmt, winAmt * 2)
    } else if (pv === dv) { setResult('push'); audio.click() }
    else { setResult('lose'); audio.click(); setStreak(0) }
    setPhase('done')
  }, [dealerHand, deck, playerHand, bet, streak, onWin])

  const playerVal = handValue(playerHand)
  const dealerVal = revealed ? handValue(dealerHand) : dealerHand[0]?.num ?? 0
  const BET_OPTIONS = [25, 50, 100, 200].filter(b => b <= Math.max(coins, 25))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🃏 Blackjack</span>
        <span className={styles.scoreDisplay}>{coins}🪙 · {streak > 0 ? `🔥${streak}` : ''}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🃏</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Blackjack</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Kom närmast 21 utan att gå över!<br />Välj insats för att börja.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Bäst: {bestScore}🪙 vunnet</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {BET_OPTIONS.map(b => (
              <button key={b} className="btn-primary" style={{ padding: '10px 18px' }} onClick={() => deal(b)}>{b}🪙</button>
            ))}
          </div>
        </div>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Dealer */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>
              Dealer {revealed ? `(${handValue(dealerHand)})` : `(${dealerHand[0]?.num ?? 0}+?)`}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {dealerHand.map((c, i) => <CardDisplay key={i} card={c} hidden={i === 1 && !revealed} />)}
            </div>
          </div>
          {/* Player */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>Du ({playerVal})</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {playerHand.map((c, i) => <CardDisplay key={i} card={c} />)}
            </div>
          </div>
          {/* Bet display */}
          <div style={{ textAlign: 'center', fontSize: 12, color: '#fbbf24' }}>Insats: {bet}🪙 {streak >= 3 ? '· 🔥 3× streak = 2× vinst!' : ''}</div>
          {/* Result */}
          {result && (
            <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 16, color: result === 'win' ? '#4ade80' : result === 'push' ? '#fbbf24' : '#f87171' }}>
              {result === 'win' ? `🎉 Du vann! +${bet * (streak >= 3 ? 2 : 1)}🪙` : result === 'push' ? '🤝 Oavgjort' : '😮 Dealer vinner'}
            </div>
          )}
          {/* Actions */}
          {phase === 'playing' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={hit} disabled={playerVal >= 21}>Dra (Hit)</button>
              <button className="btn-primary" style={{ flex: 1, padding: '12px', background: 'rgba(251,191,36,.2)' }} onClick={stand}>Stå (Stand)</button>
            </div>
          )}
          {phase === 'done' && (
            <div style={{ display: 'flex', gap: 10 }}>
              {BET_OPTIONS.map(b => (
                <button key={b} className="btn-primary" style={{ flex: 1, padding: '10px 6px', fontSize: 12 }} onClick={() => deal(b)}>{b}🪙</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
