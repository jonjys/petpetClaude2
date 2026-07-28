import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  petEmoji?: string
}

const OPPONENTS = [
  { name: 'Rookie',     emoji: '🐣', hp: 60,  atk: 6,  def: 3,  tier: 1 },
  { name: 'Krigar',    emoji: '⚔️', hp: 90,  atk: 9,  def: 5,  tier: 2 },
  { name: 'Champion',  emoji: '🛡️', hp: 130, atk: 13, def: 8,  tier: 3 },
  { name: 'Legend',    emoji: '👑', hp: 180, atk: 18, def: 12, tier: 4 },
  { name: 'Övergud',   emoji: '🔱', hp: 250, atk: 25, def: 18, tier: 5 },
]

type Move = 'attack' | 'guard' | 'special'

const MOVE_BEATS: Record<Move, Move> = {
  attack: 'special',
  special: 'guard',
  guard: 'attack',
}

const MOVE_ICONS: Record<Move, string> = { attack: '⚔️', guard: '🛡️', special: '💥' }
const MOVE_LABELS: Record<Move, string> = { attack: 'Anfall', guard: 'Försvar', special: 'Special' }

function calcDamage(base: number, move: Move, enemyMove: Move): number {
  const beats = MOVE_BEATS[move] === enemyMove
  const countered = MOVE_BEATS[enemyMove] === move
  if (beats) return Math.floor(base * 1.5 + Math.random() * 4)
  if (countered) return Math.floor(base * 0.4 + Math.random() * 2)
  return Math.floor(base * 0.9 + Math.random() * 3)
}

export const ArenaGame = memo(function ArenaGame({ onExit, onWin, petEmoji = '🐾' }: Props) {
  const [phase, setPhase] = useState<'select' | 'fight' | 'done'>('select')
  const [oppIdx, setOppIdx] = useState(0)
  const [playerHP, setPlayerHP] = useState(100)
  const [enemyHP, setEnemyHP] = useState(0)
  const [playerMaxHP] = useState(100)
  const [enemyMaxHP, setEnemyMaxHP] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [won, setWon] = useState(false)
  const [streak] = useState(() => Number(localStorage.getItem('k0509_arena_streak') ?? 0))
  const [resolving, setResolving] = useState(false)
  const [lastMoves, setLastMoves] = useState<{ player: Move; enemy: Move } | null>(null)
  const [bestStreak] = useState(() => Number(localStorage.getItem('k0509_arena_best') ?? 0))

  const startFight = useCallback((idx: number) => {
    const opp = OPPONENTS[idx]
    setOppIdx(idx)
    setPlayerHP(100 + idx * 10)
    setEnemyHP(opp.hp)
    setEnemyMaxHP(opp.hp)
    setLog([`⚔️ Du möter ${opp.name} ${opp.emoji}!`])
    setLastMoves(null)
    setPhase('fight')
  }, [])

  const pickMove = useCallback((move: Move) => {
    if (resolving) return
    setResolving(true)
    const opp = OPPONENTS[oppIdx]
    const moves: Move[] = ['attack', 'guard', 'special']
    const enemyMove = moves[Math.floor(Math.random() * moves.length)]
    setLastMoves({ player: move, enemy: enemyMove })

    const playerAtk = 10 + oppIdx * 2
    const playerDmg = calcDamage(playerAtk, move, enemyMove)
    const enemyDmg = calcDamage(opp.atk, enemyMove, move)

    const newEnemyHP = Math.max(0, enemyHP - playerDmg)
    const newPlayerHP = Math.max(0, playerHP - enemyDmg)

    const newLog: string[] = []
    newLog.push(`Du: ${MOVE_ICONS[move]} → ${opp.emoji}: ${MOVE_ICONS[enemyMove]}`)
    if (MOVE_BEATS[move] === enemyMove) newLog.push(`💥 Kritisk! Du gör ${playerDmg} skada!`)
    else if (MOVE_BEATS[enemyMove] === move) newLog.push(`🛡️ Kontrad! Du gör ${playerDmg} skada`)
    else newLog.push(`⚔️ Du gör ${playerDmg} skada`)
    newLog.push(`🩸 ${opp.name} gör ${enemyDmg} skada mot dig`)

    setEnemyHP(newEnemyHP)
    setPlayerHP(newPlayerHP)
    setLog(prev => [...prev.slice(-4), ...newLog])

    setTimeout(() => {
      if (newEnemyHP <= 0) {
        setLog(prev => [...prev, `🏆 Du besegrade ${opp.name}!`])
        setWon(true)
        setPhase('done')
        audio.achievement()
        const newStreak = streak + 1
        localStorage.setItem('k0509_arena_streak', String(newStreak))
        if (newStreak > bestStreak) localStorage.setItem('k0509_arena_best', String(newStreak))
        const coins = (oppIdx + 1) * 30 + (streak >= 3 ? 50 : 0)
        const xp = (oppIdx + 1) * 25
        onWin(coins, xp)
      } else if (newPlayerHP <= 0) {
        setLog(prev => [...prev, `💀 Du förlorade mot ${opp.name}...`])
        setWon(false)
        setPhase('done')
        localStorage.setItem('k0509_arena_streak', '0')
        onWin(0, 0)
      }
      setResolving(false)
    }, 600)
  }, [resolving, oppIdx, enemyHP, playerHP, streak, bestStreak, onWin])

  const pHP = (phase === 'fight' || phase === 'done') ? playerHP : 100
  const pMaxHP = 100 + oppIdx * 10
  const opp = OPPONENTS[oppIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚔️ Arena</span>
        <span className={styles.scoreDisplay}>🔥{streak}</span>
      </div>

      {phase === 'select' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <div style={{ fontSize: 48 }}>⚔️</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff', marginTop: 8 }}>Arena Battle</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Välj din motståndare</div>
            {bestStreak > 0 && <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 4 }}>🏆 Bästa streak: {bestStreak}</div>}
            {streak > 0 && <div style={{ fontSize: 12, color: '#f97316', marginTop: 2 }}>🔥 Nuvarande streak: {streak}</div>}
          </div>
          {OPPONENTS.map((o, i) => (
            <button
              key={o.name}
              onClick={() => { startFight(i); audio.click() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: 'rgba(255,255,255,.04)',
                border: `1px solid ${'rgba(168,85,247,' + (0.1 + i * 0.08) + ')'}`,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 28 }}>{o.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, color: '#fff', fontSize: 14 }}>Tier {o.tier} · {o.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>HP: {o.hp} · ATK: {o.atk}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#fbbf24' }}>+{(i + 1) * 30}🪙</div>
            </button>
          ))}
        </div>
      )}

      {phase === 'fight' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* HP bars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#4ade80' }}>{petEmoji} Du</span>
                <span style={{ color: '#4ade80', fontWeight: 900 }}>{pHP}/{pMaxHP}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(0,0,0,.3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(pHP / pMaxHP) * 100}%`, background: 'linear-gradient(90deg,#4ade80,#22c55e)', borderRadius: 4, transition: 'width .4s' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#f87171' }}>{opp.emoji} {opp.name}</span>
                <span style={{ color: '#f87171', fontWeight: 900 }}>{enemyHP}/{enemyMaxHP}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(0,0,0,.3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(enemyHP / enemyMaxHP) * 100}%`, background: 'linear-gradient(90deg,#f87171,#ef4444)', borderRadius: 4, transition: 'width .4s' }} />
              </div>
            </div>
          </div>

          {/* Last moves */}
          {lastMoves && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: 'var(--t3)' }}>
              <span>Du: {MOVE_ICONS[lastMoves.player]} {MOVE_LABELS[lastMoves.player]}</span>
              <span>·</span>
              <span>{opp.name}: {MOVE_ICONS[lastMoves.enemy]} {MOVE_LABELS[lastMoves.enemy]}</span>
            </div>
          )}

          {/* Log */}
          <div style={{ background: 'rgba(0,0,0,.25)', borderRadius: 12, padding: '10px 12px', minHeight: 80, maxHeight: 100, overflow: 'hidden' }}>
            {log.slice(-4).map((l, i) => (
              <div key={i} style={{ fontSize: 11, color: i === log.slice(-4).length - 1 ? '#fff' : 'var(--t3)', marginBottom: 2 }}>{l}</div>
            ))}
          </div>

          {/* Moves */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['attack', 'guard', 'special'] as Move[]).map(m => (
              <button
                key={m}
                onClick={() => pickMove(m)}
                disabled={resolving}
                style={{
                  padding: '14px 6px', borderRadius: 14, textAlign: 'center',
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)',
                  color: '#e8e8f0', fontSize: 12, fontWeight: 700, cursor: resolving ? 'not-allowed' : 'pointer',
                  opacity: resolving ? 0.5 : 1, transition: 'all .15s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{MOVE_ICONS[m]}</div>
                {MOVE_LABELS[m]}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>
            Anfall slår Special · Special slår Försvar · Försvar slår Anfall
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{won ? '🏆' : '💀'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: won ? '#4ade80' : '#f87171' }}>
            {won ? 'SEGER!' : 'FÖRLORAT!'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>{won ? `Motståndare: ${opp.name}` : `${opp.name} var för stark`}</div>
          {won && (
            <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 900 }}>
              +{(oppIdx + 1) * 30 + (streak > 3 ? 50 : 0)}🪙 · +{(oppIdx + 1) * 25} XP
            </div>
          )}
          <button
            className="btn-primary"
            style={{ padding: '14px 32px', marginTop: 4 }}
            onClick={() => setPhase('select')}
          >
            Tillbaka till val
          </button>
        </div>
      )}
    </div>
  )
})
