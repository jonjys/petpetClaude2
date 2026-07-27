import { memo } from 'react'
import { useUIStore } from '@/stores/uiStore'

const DAY_REWARDS = [
  { day: 1, label: '10🪙',   coins: 10,  kc: 0 },
  { day: 2, label: '20🪙',   coins: 20,  kc: 0 },
  { day: 3, label: '30🪙',   coins: 30,  kc: 0 },
  { day: 4, label: '50🪙+1💎', coins: 50,  kc: 1 },
  { day: 5, label: '75🪙',   coins: 75,  kc: 0 },
  { day: 6, label: '100🪙',  coins: 100, kc: 0 },
  { day: 7, label: '150🪙+5💎', coins: 150, kc: 5 },
]

export const DailyBonusModal = memo(function DailyBonusModal() {
  const data = useUIStore(s => s.dailyBonusData)
  const hide = useUIStore(s => s.hideDailyBonus)
  if (!data) return null

  const streak = data.streak
  const dayInCycle = ((streak - 1) % 7) + 1

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeInOverlay .25s ease',
      }}
      onClick={hide}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0a0a14 0%, #0d0d1a 100%)',
          border: '1px solid rgba(255,204,0,.35)',
          borderRadius: 24,
          padding: '28px 22px 24px',
          maxWidth: 360,
          width: '100%',
          boxShadow: '0 0 60px rgba(255,204,0,.15), 0 0 120px rgba(170,102,255,.08)',
          animation: 'modalPop .3s cubic-bezier(.17,.67,.12,.99)',
          textAlign: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 10 }}>🔥</div>
        <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
          Daglig Bonus!
        </div>
        <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>
          {streak} dagars streak — fortsätt!
        </div>

        {/* 7-day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 22 }}>
          {DAY_REWARDS.map(r => {
            const claimed = r.day < dayInCycle
            const current = r.day === dayInCycle
            const locked   = r.day > dayInCycle
            return (
              <div
                key={r.day}
                style={{
                  background: current
                    ? 'linear-gradient(135deg, rgba(255,204,0,.25), rgba(255,204,0,.1))'
                    : claimed
                      ? 'rgba(0,255,136,.08)'
                      : 'rgba(255,255,255,.03)',
                  border: current
                    ? '2px solid rgba(255,204,0,.7)'
                    : claimed
                      ? '1px solid rgba(0,255,136,.3)'
                      : '1px solid rgba(255,255,255,.06)',
                  borderRadius: 10,
                  padding: '8px 2px',
                  opacity: locked ? 0.4 : 1,
                  transition: 'all .2s',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 900, color: current ? 'var(--gold)' : 'var(--t3)', marginBottom: 3 }}>
                  D{r.day}
                </div>
                <div style={{ fontSize: 14 }}>
                  {claimed ? '✅' : current ? '⭐' : '🔒'}
                </div>
                <div style={{ fontSize: 7, color: 'var(--t3)', marginTop: 2, lineHeight: 1.2 }}>
                  {r.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Today's reward */}
        <div style={{
          background: 'rgba(255,204,0,.08)',
          border: '1px solid rgba(255,204,0,.25)',
          borderRadius: 16,
          padding: '14px 18px',
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>DAGENS BELÖNING</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: 'var(--gold)' }}>
            +{data.coins} 🪙 {data.kc > 0 ? `+${data.kc} 💎` : ''}
          </div>
        </div>

        <button
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--gold), #ff8800)',
            border: 'none',
            borderRadius: 16,
            padding: '14px 20px',
            fontFamily: 'var(--ff-head)',
            fontSize: 16,
            fontWeight: 900,
            color: '#000',
            cursor: 'pointer',
            transition: 'transform .15s',
          }}
          onClick={hide}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Hämta & fortsätt! 🎉
        </button>
      </div>
    </div>
  )
})
