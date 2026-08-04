// components/BattleGame.tsx
import { memo, useCallback, useState } from 'react'
import { BATTLE_NPCS } from '@/constants/config'
import { useGameStore } from '@/stores/gameStore'
import { JudgementRing, type JudgementRingResult } from './JudgementRing'
import styles from './GamesView.module.css'

interface Props { onExit: () => void; onWin: (coins: number, xp: number) => void }

type Phase = 'pick' | 'fight' | 'win' | 'lose'
type RingAction = 'attack' | 'special' | null

const SPECIAL_COOLDOWN = 3
const ATTACK_BASE = [20, 35] as const
const SPECIAL_BASE = [40, 60] as const

function diffStars(hp: number): string {
  if (hp <= 150) return '⭐'
  if (hp <= 300) return '⭐⭐'
  if (hp <= 600) return '⭐⭐⭐'
  if (hp <= 1200) return '⭐⭐⭐⭐'
  return '⭐⭐⭐⭐⭐'
}

const SKILL_DESC = {
  attack: 'Judgement Ring · 1 zon',
  special: 'Judgement Ring · 3 zoner · CD: 3',
  defend: 'Halvera inkommande',
}

/** No dedicated "Agility" stat exists on PetState yet — pet level is the
 *  closest real stat to scale ring difficulty with, so it stands in until
 *  a proper combat-stat system is built. Documented here rather than
 *  silently inventing an Agility field that doesn't exist in the store. */
function difficultyFromLevel(level: number): number {
  return Math.max(0, Math.min(1, level / 50))
}

function resolveRingDamage(base: readonly [number, number], def: number, result: JudgementRingResult): number {
  if (result.failed || result.zonesCleared === 0) return 0
  const fraction = result.zonesCleared / result.totalZones
  const rolled = base[0] + Math.random() * (base[1] - base[0])
  let dmg = Math.max(0, Math.round(rolled * fraction) - def)
  if (result.anyCritical) dmg = Math.round(dmg * 1.5)
  return dmg
}

export const BattleGame = memo(function BattleGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [npcIdx, setNpcIdx] = useState(0)
  const [playerHP, setPlayerHP] = useState(200)
  const [npcHP, setNpcHP] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [ringAction, setRingAction] = useState<RingAction>(null)
  const [specialCooldown, setSpecialCooldown] = useState(0)
  const [playerHit, setPlayerHit] = useState(false)
  const [npcHit, setNpcHit] = useState(false)
  const petEmoji = useGameStore(s => s.pet.petEmoji)
  const petLevel = useGameStore(s => s.pet.level)

  const npc = BATTLE_NPCS[npcIdx]
  const difficulty = difficultyFromLevel(petLevel)

  const startFight = useCallback((idx: number) => {
    setNpcIdx(idx)
    setPlayerHP(200)
    setNpcHP(BATTLE_NPCS[idx].hp)
    setLog([`⚔️ Strid mot ${BATTLE_NPCS[idx].name} börjar!`])
    setSpecialCooldown(0)
    setPlayerHit(false)
    setNpcHit(false)
    setRingAction(null)
    setPhase('fight')
  }, [])

  const applyExchange = useCallback((pDmg: number, nDmg: number, msg: string) => {
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
            onWin(npc.reward.coins, npc.reward.xp)
          } else if (nextPH <= 0) {
            setPhase('lose')
          }
          setSpecialCooldown(c => Math.max(0, c - 1))
        }, 300)
        return nextPH
      })
      return next
    })
  }, [npc, onWin])

  const doDefend = useCallback(() => {
    const nDmg = Math.max(0, Math.floor((npc.atk - 10) / 2))
    applyExchange(0, nDmg, `🛡️ Försvarar! Tar bara -${nDmg}HP skada`)
  }, [npc, applyExchange])

  const startRing = useCallback((action: 'attack' | 'special') => {
    if (ringAction) return
    if (action === 'special' && specialCooldown > 0) return
    setRingAction(action)
  }, [ringAction, specialCooldown])

  const onRingComplete = useCallback((result: JudgementRingResult) => {
    const action = ringAction
    setRingAction(null)
    if (!action) return

    const base = action === 'attack' ? ATTACK_BASE : SPECIAL_BASE
    const pDmg = resolveRingDamage(base, npc.def, result)
    const whiffed = pDmg === 0
    const baseRetaliation = Math.max(0, npc.atk + Math.floor(Math.random() * 10) - 8)
    const nDmg = whiffed ? Math.round(baseRetaliation * 1.3) : baseRetaliation

    const label = action === 'attack' ? 'Attack' : 'SUPERATTACK'
    const icon = action === 'attack' ? '⚔️' : '💥'
    const outcome = result.anyCritical ? ' KRITISK TRÄFF!' : whiffed ? ' TOTALMISS!' : ''
    const msg = `${icon} ${label}!${outcome} -${pDmg}HP fiende, -${nDmg}HP dig`

    if (action === 'special') setSpecialCooldown(SPECIAL_COOLDOWN)
    applyExchange(pDmg, nDmg, msg)
  }, [ringAction, npc, applyExchange])

  if (phase === 'pick') {
    return (
      <div className="nb-theme" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className={styles.gameHeader}>
          <button className={styles.backBtn} onClick={onExit}>←</button>
          <span className={styles.gameTitle}>⚔️ STRID 2.0</span>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--nb-white)', textAlign: 'center' }}>
            Välj motståndare
          </div>
          {BATTLE_NPCS.map((n, i) => (
            <button
              key={i}
              onClick={() => startFight(i)}
              className="nb-card"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 30, flexShrink: 0 }}>{n.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, color: 'var(--nb-white)', fontSize: 14, textTransform: 'uppercase' }}>{n.name}</div>
                <div style={{ fontSize: 11, color: 'var(--nb-green)', marginTop: 1 }}>{diffStars(n.hp)}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>HP: {n.hp} · ATK: {n.atk} · DEF: {n.def}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--gold)' }}>🪙{n.reward.coins}</div>
                <div style={{ fontSize: 11, color: 'var(--nb-green)' }}>⭐{n.reward.xp}XP</div>
                {(n.reward.kc ?? 0) > 0 && <div style={{ fontSize: 11, color: 'var(--nb-blue)' }}>💎{n.reward.kc}KC</div>}
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
    <div className="nb-theme" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={() => setPhase('pick')}>←</button>
        <span className={styles.gameTitle}>⚔️ {npc.name}</span>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Battle field */}
        <div className="nb-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            {/* Player */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, textAlign: 'center', filter: playerHit ? 'drop-shadow(0 0 8px #ff3333)' : 'none', transition: 'filter .15s' }}>{petEmoji}</div>
              <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', textTransform: 'uppercase', fontWeight: 700 }}>Du</div>
              <div style={{ height: 10, background: '#222', border: '2px solid var(--nb-black)', overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', width: `${pPct}%`, background: playerHit ? '#ff3333' : 'var(--nb-green)', transition: 'width 0.3s, background .15s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--nb-green)', textAlign: 'center', marginTop: 2, fontWeight: 700 }}>{playerHP}/200</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 18 }}>⚡</div>
            {/* NPC */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, textAlign: 'center', filter: npcHit ? 'drop-shadow(0 0 8px #39ff14)' : 'none', transition: 'filter .15s' }}>{npc.emoji}</div>
              <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', textTransform: 'uppercase', fontWeight: 700 }}>{npc.name}</div>
              <div style={{ height: 10, background: '#222', border: '2px solid var(--nb-black)', overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', width: `${nPct}%`, background: npcHit ? 'var(--nb-green)' : '#ff3333', transition: 'width 0.3s, background .15s' }} />
              </div>
              <div style={{ fontSize: 11, color: '#ff3333', textAlign: 'center', marginTop: 2, fontWeight: 700 }}>{npcHP}/{npc.hp}</div>
            </div>
          </div>
          {/* Log */}
          <div style={{ background: '#000', border: '2px solid var(--nb-black)', padding: 8, minHeight: 48 }}>
            {log.slice(-2).map((l, i) => <div key={i} style={{ fontSize: 12, color: '#ddd', marginBottom: 2, fontWeight: 600 }}>{l}</div>)}
          </div>
        </div>

        {ringAction && (
          <div className="nb-card" style={{ padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 900, color: 'var(--nb-white)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {ringAction === 'attack' ? 'Träffa den gula zonen!' : 'Kombo! Träffa alla 3 zoner!'}
            </div>
            <JudgementRing
              zoneCount={ringAction === 'attack' ? 1 : 3}
              difficulty={difficulty}
              onComplete={onRingComplete}
            />
          </div>
        )}

        {(phase === 'win' || phase === 'lose') && (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 40 }}>{phase === 'win' ? '🏆' : '💀'}</div>
            <div style={{ fontWeight: 900, color: phase === 'win' ? 'var(--nb-green)' : '#ff3333', fontSize: 18, marginBottom: 8, textTransform: 'uppercase' }}>
              {phase === 'win'
                ? `Seger! +${npc.reward.coins}🪙 +${npc.reward.xp}XP${(npc.reward.kc ?? 0) > 0 ? ` +${npc.reward.kc}💎` : ''}`
                : 'Förlorade!'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="nb-btn nb-btn-green" style={{ padding: '10px 18px' }} onClick={() => startFight(npcIdx)}>Igen</button>
              <button className="nb-btn" style={{ padding: '10px 18px' }} onClick={() => setPhase('pick')}>Byt fiende</button>
            </div>
          </div>
        )}

        {phase === 'fight' && !ringAction && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button onClick={() => startRing('attack')} className="nb-btn" style={actionBtn}>
              ⚔️
              <span style={{ fontSize: 11 }}>Attack</span>
              <span style={{ fontSize: 8, opacity: 0.6, marginTop: 1 }}>{SKILL_DESC.attack}</span>
            </button>
            <button onClick={() => startRing('special')} disabled={specialCooldown > 0} className="nb-btn nb-btn-pink" style={actionBtn}>
              💥
              <span style={{ fontSize: 11 }}>Special{specialCooldown > 0 ? ` (${specialCooldown})` : ''}</span>
              <span style={{ fontSize: 8, opacity: 0.75, marginTop: 1 }}>{SKILL_DESC.special}</span>
            </button>
            <button onClick={doDefend} className="nb-btn nb-btn-blue" style={actionBtn}>
              🛡️
              <span style={{ fontSize: 11 }}>Försvara</span>
              <span style={{ fontSize: 8, opacity: 0.7, marginTop: 1 }}>{SKILL_DESC.defend}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

const actionBtn: React.CSSProperties = { padding: '10px 6px', fontSize: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }
