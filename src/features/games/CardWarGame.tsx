import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const NAMES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
const VALUES = [2,3,4,5,6,7,8,9,10,11,12,13,14]
const SUITS = ['♠','♥','♦','♣']
const ROUNDS = 5

type Card = { name: string; value: number; suit: string }
type Result = 'win' | 'lose' | 'tie'

function draw(): Card {
  const i = Math.floor(Math.random() * 13)
  return { name: NAMES[i], value: VALUES[i], suit: SUITS[Math.floor(Math.random() * 4)] }
}

export const CardWarGame = memo(function CardWarGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [myCard, setMyCard] = useState<Card | null>(null)
  const [dealCard, setDealCard] = useState<Card | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_war_best') ?? 0))

  const start = useCallback(() => {
    setRound(0); setWins(0); setLosses(0)
    setMyCard(null); setDealCard(null); setResult(null); setRevealed(false)
    setPhase('playing')
  }, [])

  const flip = useCallback(() => {
    if (revealed) return
    const p = draw(); const d = draw()
    setMyCard(p); setDealCard(d); setRevealed(true)
    const r: Result = p.value > d.value ? 'win' : p.value < d.value ? 'lose' : 'tie'
    setResult(r)
    if (r === 'win') { setWins(w => w + 1); audio.coin() }
    else if (r === 'lose') { setLosses(l => l + 1); audio.click() }
    setTimeout(() => {
      setRevealed(false); setMyCard(null); setDealCard(null); setResult(null)
      setRound(prev => {
        const next = prev + 1
        if (next >= ROUNDS) setPhase('done')
        return next
      })
    }, 1600)
  }, [revealed])

  useEffect(() => {
    if (phase === 'done') {
      const prev = Number(localStorage.getItem('k0509_war_best') ?? 0)
      if (wins > prev) localStorage.setItem('k0509_war_best', String(wins))
      onWin(wins * 30 + (wins >= 4 ? 60 : 0), wins * 25)
      audio.achievement()
    }
  }, [phase, wins, onWin])

  const suitRed = (s: string) => s === '♥' || s === '♦'
  const resultColor = result === 'win' ? '#4ade80' : result === 'lose' ? '#f87171' : '#fbbf24'

  const Card = ({ card, hidden }: { card: Card | null; hidden?: boolean }) => (
    <div style={{
      width: 76, height: 108, borderRadius: 12,
      background: hidden ? 'rgba(99,102,241,.12)' : 'rgba(255,255,255,.06)',
      border: `2px solid ${hidden ? 'rgba(99,102,241,.35)' : 'rgba(255,255,255,.18)'}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
    }}>
      {hidden ? (
        <span style={{ fontSize: 32 }}>🂠</span>
      ) : card ? (
        <>
          <span style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900,
            color: suitRed(card.suit) ? '#f87171' : '#e8e8f0', lineHeight: 1 }}>{card.name}</span>
          <span style={{ fontSize: 20, color: suitRed(card.suit) ? '#f87171' : '#e8e8f0' }}>{card.suit}</span>
        </>
      ) : <span style={{ fontSize: 28, color: '#333' }}>?</span>}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🃏 Kortkrig</span>
        <span className={styles.scoreDisplay}>{wins}W {losses}L</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🃏</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Kortkrig</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Vänd ett kort — slå dealerns för att vinna!<br />{ROUNDS} rundor · Ess är högst
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Runda {round + 1}/{ROUNDS}</div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>DEALER</div>
              <Card card={dealCard} hidden={!revealed} />
            </div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900,
              color: result ? resultColor : 'var(--t3)', minWidth: 56, textAlign: 'center' }}>
              {result === 'win' ? 'VANN!' : result === 'lose' ? 'FÖRLOR' : result === 'tie' ? 'LIKA' : 'VS'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>DU</div>
              <Card card={myCard} hidden={!revealed} />
            </div>
          </div>
          {!revealed && (
            <button className="btn-primary" style={{ padding: '14px 48px', fontSize: 15 }} onClick={flip}>
              Vänd kortet!
            </button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{wins >= 4 ? '👑' : wins >= 3 ? '⭐' : '🃏'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{wins}/{ROUNDS} vinster</div>
          <div style={{ fontSize: 14, color: wins >= 4 ? '#4ade80' : '#fbbf24' }}>
            {wins >= 4 ? 'Kortmästare! 👑' : wins >= 3 ? 'Bra spel! ⭐' : 'Öva mer! 🃏'}
          </div>
          {wins > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{wins * 30 + (wins >= 4 ? 60 : 0)}🪙 +{wins * 25} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
