import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  petEmoji?: string
}

interface Boss {
  name: string
  emoji: string
  maxHp: number
  phase: number
  maxPhase: number
  atk: number
  def: number
  reward: { coins: number; xp: number }
  color: string
}

const BOSSES: Boss[] = [
  { name: 'Skuggdraken', emoji: '🐲', maxHp: 200, phase: 1, maxPhase: 2, atk: 18, def: 5, reward: { coins: 120, xp: 80 }, color: '#7c3aed' },
  { name: 'Eldgiganten', emoji: '🔥', maxHp: 350, phase: 1, maxPhase: 3, atk: 25, def: 8, reward: { coins: 200, xp: 130 }, color: '#ea580c' },
  { name: 'Isdemonen',   emoji: '❄️', maxHp: 280, phase: 1, maxPhase: 2, atk: 20, def: 12, reward: { coins: 160, xp: 100 }, color: '#0284c7' },
  { name: 'Kaosguden',   emoji: '💀', maxHp: 500, phase: 1, maxPhase: 3, atk: 35, def: 15, reward: { coins: 350, xp: 220 }, color: '#be123c' },
]

type LogEntry = { text: string; color: string }
type Phase = 'select' | 'battle' | 'win' | 'lose'

const PLAYER_MAX_HP = 150
const SPECIAL_COST = 30
const HEAL_COST = 20

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const BossRaidGame = memo(function BossRaidGame({ onExit, onWin, petEmoji = '⚔️' }: Props) {
  const [phase, setPhase] = useState<Phase>('select')
  const [boss, setBoss] = useState<Boss | null>(null)
  const [bossHp, setBossHp] = useState(0)
  const [bossPhase, setBossPhase] = useState(1)
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP)
  const [energy, setEnergy] = useState(SPECIAL_COST)
  const [log, setLog] = useState<LogEntry[]>([])
  const [locked, setLocked] = useState(false)
  const [shake, setShake] = useState<'boss' | 'player' | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const addLog = useCallback((text: string, color = '#e8e8f0') => {
    setLog(prev => [...prev.slice(-20), { text, color }])
  }, [])

  const startBoss = useCallback((b: Boss) => {
    setBoss({ ...b })
    setBossHp(b.maxHp)
    setBossPhase(1)
    setPlayerHp(PLAYER_MAX_HP)
    setEnergy(SPECIAL_COST)
    setLog([{ text: `⚔️ ${b.name} väcks!`, color: b.color }])
    setPhase('battle')
  }, [])

  const bossAttack = useCallback((b: Boss, bPhase: number) => {
    const multiphase = 1 + (bPhase - 1) * 0.3
    const isCrit = Math.random() < 0.15
    const rawDmg = randInt(b.atk, b.atk + 12) * multiphase * (isCrit ? 1.8 : 1)
    const dmg = Math.max(1, Math.round(rawDmg))
    const specialAttack = Math.random() < 0.25
    const text = specialAttack
      ? `${b.emoji} SPECIALATTACK! -${dmg} HP!`
      : isCrit
        ? `${b.emoji} Kritisk träff! -${dmg} HP!`
        : `${b.emoji} attackerar — -${dmg} HP`
    setShake('player')
    setTimeout(() => setShake(null), 400)
    setPlayerHp(prev => {
      const next = Math.max(0, prev - dmg)
      addLog(text, specialAttack ? '#f87171' : isCrit ? '#fbbf24' : '#f472b6')
      return next
    })
  }, [addLog])

  const attack = useCallback(() => {
    if (!boss || locked) return
    setLocked(true)
    const isCrit = Math.random() < 0.15
    const rawDmg = randInt(25, 45) * (isCrit ? 2 : 1)
    const dmg = Math.max(1, rawDmg - boss.def)
    setShake('boss')
    setTimeout(() => setShake(null), 400)
    audio.click()
    addLog(isCrit ? `${petEmoji} KRITISK TRÄFF! -${dmg} HP!` : `${petEmoji} angriper — -${dmg} HP`, isCrit ? '#fbbf24' : '#4ade80')
    setBossHp(prev => {
      const next = Math.max(0, prev - dmg)
      if (next <= 0) {
        const phaseHpLeft = bossPhase < boss.maxPhase ? boss.maxHp / boss.maxPhase : 0
        if (bossPhase < boss.maxPhase) {
          const newPhase = bossPhase + 1
          setBossPhase(newPhase)
          setBossHp(boss.maxHp / boss.maxPhase)
          addLog(`💥 FAS ${newPhase}! ${boss.name} är rasande!`, boss.color)
          setTimeout(() => { bossAttack(boss, newPhase); setLocked(false) }, 700)
          return boss.maxHp / boss.maxPhase
        }
        setTimeout(() => { setPhase('win'); onWin(boss.reward.coins, boss.reward.xp); audio.achievement() }, 500)
        addLog(`🏆 ${boss.name} besegrad!`, '#4ade80')
        return 0
      }
      setTimeout(() => { bossAttack(boss, bossPhase); setLocked(false) }, 700)
      return next
    })
  }, [boss, locked, petEmoji, bossPhase, addLog, bossAttack, onWin])

  const special = useCallback(() => {
    if (!boss || locked || energy < SPECIAL_COST) return
    setLocked(true)
    const dmg = randInt(60, 100)
    setEnergy(prev => prev - SPECIAL_COST)
    setShake('boss')
    setTimeout(() => setShake(null), 400)
    audio.coin()
    addLog(`⚡ SPECIALATTACK! -${dmg} HP!`, '#a855f7')
    setBossHp(prev => {
      const next = Math.max(0, prev - dmg)
      if (next <= 0) {
        if (bossPhase < boss.maxPhase) {
          const newPhase = bossPhase + 1
          setBossPhase(newPhase)
          setBossHp(boss.maxHp / boss.maxPhase)
          addLog(`💥 FAS ${newPhase}! ${boss.name} är rasande!`, boss.color)
          setTimeout(() => { bossAttack(boss, newPhase); setLocked(false) }, 700)
          return boss.maxHp / boss.maxPhase
        }
        setTimeout(() => { setPhase('win'); onWin(boss.reward.coins, boss.reward.xp); audio.achievement() }, 500)
        addLog(`🏆 ${boss.name} besegrad!`, '#4ade80')
        return 0
      }
      setTimeout(() => { bossAttack(boss, bossPhase); setLocked(false) }, 700)
      return next
    })
  }, [boss, locked, energy, bossPhase, addLog, bossAttack, onWin])

  const heal = useCallback(() => {
    if (!boss || locked || energy < HEAL_COST) return
    setLocked(true)
    const restored = randInt(30, 50)
    setEnergy(prev => prev - HEAL_COST)
    addLog(`💚 Helad! +${restored} HP`, '#4ade80')
    setPlayerHp(prev => Math.min(PLAYER_MAX_HP, prev + restored))
    setTimeout(() => { bossAttack(boss, bossPhase); setLocked(false) }, 600)
  }, [boss, locked, energy, bossPhase, addLog, bossAttack])

  useEffect(() => {
    if (playerHp <= 0 && phase === 'battle') {
      setPhase('lose')
      addLog('💀 Du förlorade...', '#f87171')
    }
  }, [playerHp, phase, addLog])

  const btnStyle = (disabled: boolean, color: string): React.CSSProperties => ({
    flex: 1, padding: '12px 8px',
    background: disabled ? 'rgba(255,255,255,0.05)' : `rgba(${color}, 0.15)`,
    border: `1px solid rgba(${color}, ${disabled ? '0.1' : '0.4'})`,
    borderRadius: 12, color: disabled ? '#555' : '#fff',
    fontFamily: 'var(--ff-head)', fontSize: 11, fontWeight: 900,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .15s',
  })

  if (phase === 'select') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚔️ Boss Raid</span>
        <span className={styles.scoreDisplay}>Välj boss</span>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BOSSES.map(b => (
          <button
            key={b.name}
            onClick={() => { startBoss(b); audio.click() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: `rgba(${b.color.replace('#','').match(/../g)?.map(h=>parseInt(h,16)).join(',')},0.1)`,
              border: `1px solid ${b.color}44`,
              borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 32 }}>{b.emoji}</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 900, color: '#fff' }}>{b.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                ❤️ {b.maxHp} · {b.maxPhase} faser · ⚔️ {b.atk} ATK
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>+{b.reward.coins}🪙</div>
              <div style={{ fontSize: 11, color: '#a855f7' }}>+{b.reward.xp} XP</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  if (!boss) return null

  const bossHpPct = Math.max(0, bossHp / (boss.maxHp / boss.maxPhase)) * 100
  const playerHpPct = Math.max(0, playerHp / PLAYER_MAX_HP) * 100
  const energyPct = Math.min(100, (energy / SPECIAL_COST) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>{boss.emoji} {boss.name}</span>
        <span className={styles.scoreDisplay}>Fas {bossPhase}/{boss.maxPhase}</span>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Boss HP */}
        <div style={{
          background: `linear-gradient(135deg, ${boss.color}22, rgba(0,0,0,.3))`,
          border: `1px solid ${boss.color}44`, borderRadius: 14, padding: '12px 14px',
          transform: shake === 'boss' ? 'translateX(6px)' : 'none',
          transition: 'transform .1s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 32 }}>{boss.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 14, fontWeight: 900, color: '#fff' }}>{boss.name}</div>
              <div style={{ fontSize: 10, color: boss.color }}>FAS {bossPhase}/{boss.maxPhase}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>{Math.ceil(bossHp)} ❤️</div>
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,.4)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${bossHpPct}%`, background: `linear-gradient(90deg, ${boss.color}, #ff4455)`, borderRadius: 4, transition: 'width .3s' }} />
          </div>
        </div>

        {/* Battle log */}
        <div ref={logRef} style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 10px',
          height: 90, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: l.color }}>{l.text}</div>
          ))}
        </div>

        {/* Player HP */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 14px',
          transform: shake === 'player' ? 'translateX(-6px)' : 'none',
          transition: 'transform .1s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>{petEmoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Du</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: playerHp < 40 ? '#f87171' : '#4ade80' }}>
              {playerHp}/{PLAYER_MAX_HP} ❤️
            </div>
          </div>
          <div style={{ height: 6, background: 'rgba(0,0,0,.4)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${playerHpPct}%`, background: playerHp < 40 ? '#f87171' : 'linear-gradient(90deg,#4ade80,#22c55e)', borderRadius: 3, transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 9, color: '#a855f7', fontWeight: 700 }}>⚡ {energy}/{SPECIAL_COST}</div>
            <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,.3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${energyPct}%`, background: '#a855f7', borderRadius: 2, transition: 'width .3s' }} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {phase === 'battle' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnStyle(locked, '74,222,128')} onClick={attack} disabled={locked}>
              ⚔️ Attack
            </button>
            <button style={btnStyle(locked || energy < SPECIAL_COST, '168,85,247')} onClick={special} disabled={locked || energy < SPECIAL_COST}>
              ⚡ Special<br/><span style={{ fontSize: 9 }}>(-{SPECIAL_COST}⚡)</span>
            </button>
            <button style={btnStyle(locked || energy < HEAL_COST, '34,197,94')} onClick={heal} disabled={locked || energy < HEAL_COST}>
              💚 Hela<br/><span style={{ fontSize: 9 }}>(-{HEAL_COST}⚡)</span>
            </button>
          </div>
        )}

        {phase === 'win' && (
          <div style={{ textAlign: 'center', padding: 12, background: 'rgba(74,222,128,0.1)', borderRadius: 14, border: '1px solid rgba(74,222,128,.3)' }}>
            <div style={{ fontSize: 40 }}>🏆</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#4ade80', marginTop: 6 }}>SEGER!</div>
            <div style={{ fontSize: 13, color: '#fbbf24', marginTop: 4 }}>+{boss.reward.coins}🪙 +{boss.reward.xp} XP</div>
            <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => setPhase('select')}>Nästa Boss →</button>
          </div>
        )}

        {phase === 'lose' && (
          <div style={{ textAlign: 'center', padding: 12, background: 'rgba(248,113,113,0.1)', borderRadius: 14, border: '1px solid rgba(248,113,113,.3)' }}>
            <div style={{ fontSize: 40 }}>💀</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#f87171', marginTop: 6 }}>BESEGRAD</div>
            <button className="btn-ghost" style={{ marginTop: 10 }} onClick={() => setPhase('select')}>Försök igen</button>
          </div>
        )}
      </div>
    </div>
  )
})
