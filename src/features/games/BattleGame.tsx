import { memo, useState, useCallback } from 'react'
import { BATTLE_NPCS } from '@/constants/config'
import { useGameStore } from '@/stores/gameStore'
import styles from './GamesView.module.css'

interface Props { onExit: () => void; onWin: (coins: number, xp: number) => void }

type Phase = 'pick' | 'fight' | 'win' | 'lose'

const SPECIAL_COOLDOWN = 3

function diffStars(hp: number): string {
  if (hp <= 150) return '⭐'
  if (hp <= 300) return '⭐⭐'
  if (hp <= 600) return '⭐⭐⭐'
  if (hp <= 1200) return '⭐⭐⭐⭐'
  return '⭐⭐⭐⭐⭐'
}

const SKILL_DESC = {
  attack: '20–35 skada · Motanfall',
  special: '40–60 skada · CD: 3',
  defend: 'Halvera inkommande',
}

export const BattleGame = memo(function BattleGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [npcIdx, setNpcIdx] = useState(0)
  const [playerHP, setPlayerHP] = useState(200)
  const [npcHP, setNpcHP] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [animating, setAnimating] = useState(false)
  const [specialCooldown, setSpecialCooldown] = useState(0)
  const [playerHit, setPlayerHit] = useState(false)
  const [npcHit, setNpcHit] = useState(false)
  const petEmoji = useGameStore(s => s.pet.petEmoji)

  const npc = BATTLE_NPCS[npcIdx]

  const startFight = useCallback((idx: number) => {
    setNpcIdx(idx)
    setPlayerHP(200)
    setNpcHP(BATTLE_NPCS[idx].hp)
    setLog([`⚔️ Strid mot ${BATTLE_NPCS[idx].name} börjar!`])
    setSpecialCooldown(0)
    setPlayerHit(false)
    setNpcHit(false)
    setPhase('fight')
  }, [])

  const doAction = useCallback((action: 'attack' | 'special' | 'defend') => {
    if (animating) return
    if (action === 'special' && specialCooldown > 0) return
    setAnimating(true)
    const enemy = BATTLE_NPCS[npcIdx]

    let pDmg = 0, nDmg = 0, msg = ''

    if (action === 'attack') {
      pDmg = Math.max(0, 20 + Math.floor(Math.random() * 15) - enemy.def)
      nDmg = Math.max(0, enemy.atk + Math.floor(Math.random() * 10) - 8)
      msg = `👊 Attackerar! -${pDmg}HP fiende, -${nDmg}HP dig`
    } else if (action === 'special') {
      pDmg = Math.max(0, 40 + Math.floor(Math.random() * 20) - enemy.def)
      nDmg = Math.max(0, Math.round(enemy.atk * 1.5) + Math.floor(Math.random() * 8) - 4)
      msg = `💥 SUPERATTACK! -${pDmg}HP fiende, -${nDmg}HP dig`
      setSpecialCooldown(SPECIAL_COOLDOWN)
    } else {
      nDmg = Math.max(0, Math.floor((enemy.atk - 10) / 2))
      msg = `🛡️ Försvarar! Tar bara -${nDmg}HP skada`
    }

    if (pDmg > 0) { setNpcHit(true); setTimeout(() => setNpcHit(false), 280) }
    if (nDmg > 0) { setPlayerHit(true); setTimeout(() => setPlayerHit(false), 280) }

    setNpcHP(prev => {
      const next = Math.max(0, prev - pDmg)
      setPlayerHP(ph => {
        const nextPH = Math.max(0, ph - nDmg)
        setLog(l => [...l.slice(-4), msg])
        setTimeout(() => {
          if (next <= 0) {
            setPhase('win')
            onWin(enemy.reward.coins, enemy.reward.xp)
          } else if (nextPH <= 0) {
            setPhase('lose')
          }
          setAnimating(false)
          setSpecialCooldown(c => Math.max(0, c - 1))
        }, 300)
        return nextPH
      })
      return next
    })
  }, [npcIdx, animating, onWin])

  if (phase === 'pick') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className={styles.gameHeader}>
          <button className={styles.backBtn} onClick={onExit}>←</button>
          <span className={styles.gameTitle}>⚔️ Strid</span>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>Välj motståndare</div>
          {BATTLE_NPCS.map((n, i) => (
            <button key={i} onClick={() => startFight(i)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}>
              <span style={{ fontSize: 30, flexShrink: 0 }}>{n.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#e8e8f0', fontSize: 14 }}>{n.name}</div>
                <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 1 }}>{diffStars(n.hp)}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>HP: {n.hp} · ATK: {n.atk} · DEF: {n.def}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#fbbf24' }}>🪙{n.reward.coins}</div>
                <div style={{ fontSize: 11, color: '#4ade80' }}>⭐{n.reward.xp}XP</div>
                {(n.reward.kc ?? 0) > 0 && <div style={{ fontSize: 11, color: '#aa66ff' }}>💎{n.reward.kc}KC</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const pPct = Math.max(0, (playerHP / 200) * 100)
  const nPct = Math.max(0, (npcHP / npc.hp) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={() => setPhase('pick')}>←</button>
        <span className={styles.gameTitle}>⚔️ {npc.name}</span>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Battle field */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            {/* Player */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, textAlign: 'center', filter: playerHit ? 'drop-shadow(0 0 8px #f87171)' : 'none', transition: 'filter .15s' }}>{petEmoji}</div>
              <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>Du</div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', width: `${pPct}%`, background: playerHit ? '#f87171' : '#4ade80', transition: 'width 0.3s, background .15s' }} />
              </div>
              <div style={{ fontSize: 11, color: '#4ade80', textAlign: 'center', marginTop: 2 }}>{playerHP}/200</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 18 }}>⚡</div>
            {/* NPC */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, textAlign: 'center', filter: npcHit ? 'drop-shadow(0 0 8px #4ade80)' : 'none', transition: 'filter .15s' }}>{npc.emoji}</div>
              <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>{npc.name}</div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', width: `${nPct}%`, background: npcHit ? '#4ade80' : '#f87171', transition: 'width 0.3s, background .15s' }} />
              </div>
              <div style={{ fontSize: 11, color: '#f87171', textAlign: 'center', marginTop: 2 }}>{npcHP}/{npc.hp}</div>
            </div>
          </div>
          {/* Log */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8, minHeight: 48 }}>
            {log.slice(-2).map((l, i) => <div key={i} style={{ fontSize: 12, color: '#ccc', marginBottom: 2 }}>{l}</div>)}
          </div>
        </div>

        {(phase === 'win' || phase === 'lose') && (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 40 }}>{phase === 'win' ? '🏆' : '💀'}</div>
            <div style={{ fontWeight: 700, color: phase === 'win' ? '#4ade80' : '#f87171', fontSize: 18, marginBottom: 8 }}>
              {phase === 'win'
                ? `Seger! +${npc.reward.coins}🪙 +${npc.reward.xp}XP${(npc.reward.kc ?? 0) > 0 ? ` +${npc.reward.kc}💎` : ''}`
                : 'Förlorade!'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => startFight(npcIdx)}>Igen</button>
              <button className="btn-ghost" onClick={() => setPhase('pick')}>Byt fiende</button>
            </div>
          </div>
        )}

        {phase === 'fight' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button onClick={() => doAction('attack')} disabled={animating} style={{ ...actionBtn, background: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}>
              ⚔️
              <span style={{ fontSize: 11 }}>Attack</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{SKILL_DESC.attack}</span>
            </button>
            <button onClick={() => doAction('special')} disabled={animating || specialCooldown > 0} style={{ ...actionBtn, background: 'rgba(168,85,247,0.2)', borderColor: 'rgba(168,85,247,0.4)', color: specialCooldown > 0 ? '#666' : '#a855f7', opacity: specialCooldown > 0 ? 0.55 : 1 }}>
              💥
              <span style={{ fontSize: 11 }}>Special{specialCooldown > 0 ? ` (${specialCooldown})` : ''}</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{SKILL_DESC.special}</span>
            </button>
            <button onClick={() => doAction('defend')} disabled={animating} style={{ ...actionBtn, background: 'rgba(96,165,250,0.2)', borderColor: 'rgba(96,165,250,0.4)', color: '#60a5fa' }}>
              🛡️
              <span style={{ fontSize: 11 }}>Försvara</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{SKILL_DESC.defend}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

const actionBtn: React.CSSProperties = { padding: '10px 6px', border: '1px solid', borderRadius: 12, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.15s' }
