import { memo, useState, useRef, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'

interface Segment {
  label: string
  coins: number
  xp: number
  kc: number
  emoji: string
  color: string
  x2xp?: boolean
  mystery?: boolean
}

const SEGMENTS: Segment[] = [
  { label: '50 🪙',   coins: 50,  xp: 0,   kc: 0,  emoji: '🪙', color: '#ffcc00' },
  { label: '200 XP',  coins: 0,   xp: 200, kc: 0,  emoji: '⭐', color: '#4488ff' },
  { label: '100 🪙',  coins: 100, xp: 0,   kc: 0,  emoji: '🪙', color: '#ff8844' },
  { label: '5 KC 💎', coins: 0,   xp: 0,   kc: 5,  emoji: '💎', color: '#aa66ff' },
  { label: '25 🪙',   coins: 25,  xp: 0,   kc: 0,  emoji: '🪙', color: '#00ff88' },
  { label: '200 🪙',  coins: 200, xp: 0,   kc: 0,  emoji: '🏆', color: '#ff3377' },
  { label: '2× XP',   coins: 0,   xp: 0,   kc: 0,  emoji: '⚡', color: '#00f0ff', x2xp: true },
  { label: '????',    coins: 0,   xp: 0,   kc: 0,  emoji: '🎁', color: '#ff44ff', mystery: true },
]

const SEG_DEG = 360 / SEGMENTS.length
const SPIN_COST = 10

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number, kc?: number) => void
}

function todayStr() { return new Date().toDateString() }

export const SpinGame = memo(function SpinGame({ onExit, onWin }: Props) {
  const pet = useGameStore(s => s.pet)
  const spendCoins = useGameStore(s => s.spendCoins)
  const gainCoins = useGameStore(s => s.gainCoins)
  const gainXP = useGameStore(s => s.gainXP)
  const gainKC = useGameStore(s => s.gainKC)
  const showToast = useUIStore(s => s.showToast)
  const triggerConfetti = useUIStore(s => s.triggerConfetti)

  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<typeof SEGMENTS[number] | null>(null)
  const [spinsLeft, setSpinsLeft] = useState(3)
  const [freeSpin, setFreeSpin] = useState(() => localStorage.getItem('k0509_spin_day') !== todayStr())
  const rotRef = useRef(0)

  const doSpin = useCallback(() => {
    if (spinning) return
    const isFree = freeSpin
    if (!isFree && pet.coins < SPIN_COST) {
      showToast('Inte tillräckligt med mynt!', 'error')
      return
    }
    if (!isFree) { if (!spendCoins(SPIN_COST)) return }
    else {
      setFreeSpin(false)
      localStorage.setItem('k0509_spin_day', todayStr())
    }

    setSpinning(true)
    setResult(null)

    const winIdx = Math.floor(Math.random() * SEGMENTS.length)
    const seg = SEGMENTS[winIdx]

    // target: pointer at top (0°) aligns with center of winIdx segment
    // segment i center = i * SEG_DEG + SEG_DEG/2 degrees from top (clockwise)
    // wheel needs to rotate so that winIdx center lands at top
    const segCenter = winIdx * SEG_DEG + SEG_DEG / 2
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360
    const prev = rotRef.current % 360
    const needed = (360 - segCenter - prev + 3600) % 360
    const newRot = rotRef.current + extraSpins + needed

    rotRef.current = newRot
    setRotation(newRot)

    setTimeout(() => {
      setSpinning(false)
      setResult(seg)

      let coins = 0, xp = 0, kc = 0
      if (seg.mystery) {
        coins = 50 + Math.floor(Math.random() * 150)
        xp = 50 + Math.floor(Math.random() * 150)
      } else {
        coins = seg.coins
        xp = seg.xp
        kc = seg.kc
      }
      if (seg.x2xp) {
        // Activate 15-min 2×XP
        useGameStore.getState().buyShopItem('kc_x2xp', 0, 'coins')
        showToast('⚡ 2× XP aktiverat i 15 min!', 'success')
      }
      if (coins > 0) gainCoins(coins)
      if (xp > 0) gainXP(xp, 'spin')
      if (kc > 0) gainKC(kc)

      const label = seg.mystery
        ? `🎁 Mystery! +${coins}🪙 +${xp}XP`
        : seg.x2xp
          ? '⚡ 2× XP aktiverat!'
          : `${seg.emoji} +${coins > 0 ? `${coins}🪙` : ''}${xp > 0 ? `${xp}XP` : ''}${kc > 0 ? `${kc}KC` : ''}`
      showToast(label, kc > 0 || seg.x2xp ? 'success' : 'success')
      if (kc > 0 || seg.x2xp || (coins >= 200)) triggerConfetti()
      if (kc > 0) audio.achievement()
      else audio.coin()

      onWin(coins, xp, kc)
      setSpinsLeft(n => n - 1)
    }, 3600)
  }, [spinning, freeSpin, pet.coins, spendCoins, gainCoins, gainXP, gainKC, showToast, triggerConfetti, onWin])

  const conicStops = SEGMENTS.map((s, i) => {
    const start = i * SEG_DEG
    const end = start + SEG_DEG
    return `${s.color} ${start}deg ${end}deg`
  }).join(', ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 14px 80px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: 20 }}>
        <button
          style={{ background: 'none', border: 'none', color: 'var(--t2)', fontSize: 22, cursor: 'pointer', padding: '0 8px 0 0' }}
          onClick={onExit}
        >←</button>
        <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>🎰 LYCKHJULET</div>
        {freeSpin && (
          <div style={{
            marginLeft: 'auto', background: 'rgba(0,255,136,.15)', border: '1px solid rgba(0,255,136,.4)',
            borderRadius: 10, padding: '4px 10px', fontSize: 10, fontWeight: 900, color: 'var(--green)',
          }}>GRATIS SPINN!</div>
        )}
      </div>

      {/* Wheel container */}
      <div style={{ position: 'relative', width: 280, height: 280, marginBottom: 16 }}>
        {/* Pointer */}
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '20px solid #fff',
          zIndex: 10, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.8))',
        }} />

        {/* Wheel */}
        <div style={{
          width: 280, height: 280, borderRadius: '50%',
          background: `conic-gradient(${conicStops})`,
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 3.6s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          border: '3px solid rgba(255,255,255,.15)',
          boxShadow: '0 0 40px rgba(0,0,0,.6)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Segment dividers + labels */}
          {SEGMENTS.map((s, i) => {
            const angle = i * SEG_DEG + SEG_DEG / 2
            const rad = (angle - 90) * (Math.PI / 180)
            const r = 82
            const cx = 140 + r * Math.cos(rad)
            const cy = 140 + r * Math.sin(rad)
            return (
              <div key={i} style={{
                position: 'absolute',
                left: cx, top: cy,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                fontSize: 14, fontWeight: 900,
                textShadow: '0 1px 3px rgba(0,0,0,.8)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                color: '#fff',
              }}>
                {s.emoji}
              </div>
            )
          })}
        </div>

        {/* Center cap */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 48, height: 48, borderRadius: '50%',
          background: '#000', border: '3px solid rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, zIndex: 5, boxShadow: '0 0 20px rgba(0,0,0,.8)',
        }}>
          {spinning ? '🌀' : '🎯'}
        </div>
      </div>

      {/* Segments legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, width: '100%', marginBottom: 20 }}>
        {SEGMENTS.map((s, i) => (
          <div key={i} style={{
            background: `${s.color}18`, border: `1px solid ${s.color}44`,
            borderRadius: 10, padding: '6px 4px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 18 }}>{s.emoji}</div>
            <div style={{ fontSize: 9, color: s.color, fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Spin button */}
      <button
        disabled={spinning || spinsLeft <= 0}
        onClick={doSpin}
        style={{
          width: '100%', maxWidth: 280, padding: '14px 0',
          background: spinning
            ? 'rgba(255,255,255,.05)'
            : freeSpin
              ? 'linear-gradient(135deg, var(--green), #00cc66)'
              : 'linear-gradient(135deg, var(--pink), var(--purple))',
          border: 'none', borderRadius: 16,
          fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff',
          cursor: spinning || spinsLeft <= 0 ? 'not-allowed' : 'pointer',
          opacity: spinning || spinsLeft <= 0 ? 0.5 : 1,
          letterSpacing: 2, transition: 'opacity .2s',
        }}
      >
        {spinning
          ? '🌀 SNURRAR...'
          : spinsLeft <= 0
            ? '✓ SESSIONEN SLUT'
            : freeSpin
              ? '🎁 GRATIS SPINN!'
              : `🎰 SNURRA! (${SPIN_COST}🪙)`}
      </button>

      {!freeSpin && spinsLeft > 0 && (
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>{spinsLeft} spinn kvar · Gratis spinn om {(() => {
          const now = new Date()
          const midnight = new Date(now); midnight.setHours(24, 0, 0, 0)
          const diff = midnight.getTime() - now.getTime()
          const h = Math.floor(diff / 3600000)
          const m = Math.floor((diff % 3600000) / 60000)
          return `${h}h ${m}m`
        })()}</div>
      )}

      {/* Result popup */}
      {result && !spinning && (
        <div style={{
          marginTop: 20, width: '100%',
          background: 'linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))',
          border: '1px solid rgba(255,255,255,.15)', borderRadius: 20, padding: 20,
          textAlign: 'center',
          animation: 'fadeSlideUp .35s ease',
        }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>{result.emoji}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: result.color, marginTop: 8 }}>
            {result.mystery ? 'MYSTERY BONUS!' : result.x2xp ? '2× XP BOOST!' : result.label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
            {result.mystery ? 'Du vann en hemlig bonus!' : result.x2xp ? '15 minuters dubbel XP aktiverat' : 'Mynt + XP har tilldelats'}
          </div>
        </div>
      )}

      <div className="vend" />
    </div>
  )
})
