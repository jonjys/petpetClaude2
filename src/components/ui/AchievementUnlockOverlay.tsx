import { memo, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { ALL_ACHIEVEMENTS } from '@/constants/config'
import { audio } from '@/services/AudioService'

const RARITY_GRADIENT: Record<string, string> = {
  common:    'linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.04))',
  uncommon:  'linear-gradient(135deg, rgba(0,255,136,.18), rgba(0,255,136,.05))',
  rare:      'linear-gradient(135deg, rgba(68,136,255,.22), rgba(68,136,255,.06))',
  epic:      'linear-gradient(135deg, rgba(170,102,255,.28), rgba(170,102,255,.08))',
  legendary: 'linear-gradient(135deg, rgba(255,204,0,.3), rgba(255,140,0,.08))',
}
const RARITY_BORDER: Record<string, string> = {
  common:    'rgba(255,255,255,.2)',
  uncommon:  'rgba(0,255,136,.45)',
  rare:      'rgba(68,136,255,.5)',
  epic:      'rgba(170,102,255,.6)',
  legendary: 'rgba(255,204,0,.7)',
}
const RARITY_LABEL: Record<string, string> = {
  common:    'VANLIG',
  uncommon:  'OVANLIG',
  rare:      'SÄLLSYNT',
  epic:      'EPISK',
  legendary: 'LEGENDAR',
}
const RARITY_COLOR: Record<string, string> = {
  common:    '#aaa',
  uncommon:  'var(--green)',
  rare:      '#4488ff',
  epic:      'var(--purple)',
  legendary: 'var(--gold)',
}

export const AchievementUnlockOverlay = memo(function AchievementUnlockOverlay() {
  const newAchievement = useGameStore(s => s.newAchievement)
  const clearNewAchievement = useGameStore(s => s.clearNewAchievement)
  const triggerConfetti = useUIStore(s => s.triggerConfetti)

  useEffect(() => {
    if (newAchievement) {
      triggerConfetti()
      audio.achievement()
      const t = setTimeout(clearNewAchievement, 4000)
      return () => clearTimeout(t)
    }
  }, [newAchievement, clearNewAchievement, triggerConfetti])

  if (!newAchievement) return null

  const ach = ALL_ACHIEVEMENTS.find(a => a.id === newAchievement)
  if (!ach) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: RARITY_GRADIENT[ach.rarity],
          border: `2px solid ${RARITY_BORDER[ach.rarity]}`,
          borderRadius: 28,
          padding: '30px 28px',
          maxWidth: 320,
          width: '100%',
          textAlign: 'center',
          boxShadow: `0 0 80px ${RARITY_BORDER[ach.rarity]}, 0 0 160px ${RARITY_BORDER[ach.rarity]}44`,
          animation: 'achievePop .4s cubic-bezier(.17,.67,.12,.99)',
          pointerEvents: 'all',
        }}
        onClick={clearNewAchievement}
      >
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: RARITY_COLOR[ach.rarity], marginBottom: 12 }}>
          ✦ PRESTATION UPPLÅST ✦
        </div>
        <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 12, filter: `drop-shadow(0 0 16px ${RARITY_BORDER[ach.rarity]})` }}>
          {ach.emoji}
        </div>
        <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
          {ach.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.4 }}>
          {ach.description}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,.3)', borderRadius: 20, padding: '4px 12px',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: RARITY_COLOR[ach.rarity], letterSpacing: 1 }}>
            {RARITY_LABEL[ach.rarity]}
          </span>
        </div>
        {(ach.reward.xp > 0 || ach.reward.kc > 0) && (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>
            +{ach.reward.xp} XP {ach.reward.kc > 0 ? `• +${ach.reward.kc} 💎` : ''}
          </div>
        )}
        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 14 }}>Tryck för att stänga</div>
      </div>
    </div>
  )
})
