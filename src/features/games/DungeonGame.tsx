import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
  petEmoji?: string
}

const ROOMS = [
  { name: 'Ingångshallen', emoji: '🚪', enemy: { name: 'Råtta', emoji: '🐀', hp: 30, atk: 5 },  loot: { coins: 20, xp: 15 } },
  { name: 'Stenmuren',     emoji: '🗿', enemy: { name: 'Troll',  emoji: '👹', hp: 55, atk: 9 },  loot: { coins: 40, xp: 30 } },
  { name: 'Eldgrotta',     emoji: '🔥', enemy: { name: 'Goblin', emoji: '🧌', hp: 80, atk: 14 }, loot: { coins: 70, xp: 50 } },
  { name: 'Skuggtunneln',  emoji: '🌑', enemy: { name: 'Vampyr', emoji: '🧛', hp: 110, atk: 19 },loot: { coins: 110, xp: 80 } },
  { name: 'Bossgrottan',   emoji: '🐉', enemy: { name: 'Draken', emoji: '🐉', hp: 160, atk: 26 },loot: { coins: 200, xp: 150 } },
]

type Action = 'attack' | 'block' | 'heal'

export const DungeonGame = memo(function DungeonGame({ onExit, onWin, petEmoji = '🐾' }: Props) {
  const [phase, setPhase] = useState<'intro' | 'room' | 'loot' | 'done'>('intro')
  const [roomIdx, setRoomIdx] = useState(0)
  const [playerHP, setPlayerHP] = useState(100)
  const [enemyHP, setEnemyHP] = useState(ROOMS[0].enemy.hp)
  const [heals, setHeals] = useState(3)
  const [blocked, setBlocked] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [totalCoins, setTotalCoins] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [resolving, setResolving] = useState(false)
  const [survived, setSurvived] = useState(true)

  const room = ROOMS[roomIdx]

  const startRoom = useCallback((idx: number) => {
    const r = ROOMS[idx]
    setRoomIdx(idx)
    setEnemyHP(r.enemy.hp)
    setBlocked(false)
    setLog([`🚪 ${r.name}: ${r.enemy.emoji} ${r.enemy.name} blockerar vägen!`])
    setPhase('room')
  }, [])

  const doAction = useCallback((action: Action) => {
    if (resolving || phase !== 'room') return
    setResolving(true)
    const r = ROOMS[roomIdx]
    const newLog: string[] = []

    let newEnemyHP = enemyHP
    let newPlayerHP = playerHP
    let newBlocked = false

    if (action === 'attack') {
      const dmg = 12 + Math.floor(Math.random() * 10)
      newEnemyHP = Math.max(0, enemyHP - dmg)
      newLog.push(`⚔️ Du gör ${dmg} skada på ${r.enemy.name}!`)
    } else if (action === 'block') {
      newBlocked = true
      newLog.push(`🛡️ Du tar skyddsposition!`)
    } else if (action === 'heal') {
      if (heals <= 0) { newLog.push('❌ Inga hälsodrycker kvar!'); setResolving(false); return }
      const heal = 20 + Math.floor(Math.random() * 15)
      newPlayerHP = Math.min(100 + roomIdx * 10, playerHP + heal)
      setHeals(h => h - 1)
      newLog.push(`💊 Hälsar ${heal} HP! (${heals - 1} kvar)`)
    }

    // Enemy attack back (unless dead)
    if (newEnemyHP > 0) {
      const eDmg = Math.floor(r.enemy.atk * (0.7 + Math.random() * 0.6))
      const actualDmg = blocked || newBlocked ? Math.floor(eDmg * 0.3) : eDmg
      newPlayerHP = Math.max(0, newPlayerHP - actualDmg)
      newLog.push(`${r.enemy.emoji} ${r.enemy.name} gör ${actualDmg} skada!${(blocked || newBlocked) ? ' (blockad)' : ''}`)
    }

    setBlocked(newBlocked)
    setEnemyHP(newEnemyHP)
    setPlayerHP(newPlayerHP)
    setLog(prev => [...prev.slice(-3), ...newLog])

    setTimeout(() => {
      if (newPlayerHP <= 0) {
        setSurvived(false)
        setPhase('done')
        onWin(totalCoins, totalXP)
        audio.click()
      } else if (newEnemyHP <= 0) {
        audio.achievement()
        newLog.push(`🏆 ${r.enemy.name} besegrad!`)
        setTotalCoins(c => c + r.loot.coins)
        setTotalXP(x => x + r.loot.xp)
        setPhase('loot')
      }
      setResolving(false)
    }, 400)
  }, [resolving, phase, roomIdx, enemyHP, playerHP, heals, blocked, totalCoins, totalXP, onWin])

  const nextRoom = useCallback(() => {
    if (roomIdx + 1 >= ROOMS.length) {
      setSurvived(true)
      setPhase('done')
      const bonus = 100
      onWin(totalCoins + bonus, totalXP + bonus)
      audio.achievement()
    } else {
      startRoom(roomIdx + 1)
    }
  }, [roomIdx, totalCoins, totalXP, onWin, startRoom])

  const playerMaxHP = 100 + roomIdx * 10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>⚔️ Dungeon</span>
        <span className={styles.scoreDisplay}>{totalCoins}🪙</span>
      </div>

      {phase === 'intro' && (
        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 56 }}>🏰</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Dungeon Crawler</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', maxWidth: 260 }}>
            {ROOMS.length} rum med fiender. Överlev alla för bonus!
            Anfall, Blockera eller Läk dig igenom.
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--t3)' }}>
            <span>💊 3 Hälsodrycker</span>
            <span>❤️ 100 HP</span>
          </div>
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={() => startRoom(0)}>
            Gå in i Dungeons!
          </button>
        </div>
      )}

      {phase === 'room' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Room info */}
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--purple)', fontWeight: 900, letterSpacing: 1 }}>
            RUM {roomIdx + 1}/{ROOMS.length} · {room.emoji} {room.name}
          </div>

          {/* HP bars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#4ade80' }}>{petEmoji} Du</span>
                <span style={{ color: '#4ade80', fontWeight: 900 }}>{playerHP}/{playerMaxHP}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(0,0,0,.3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(playerHP / playerMaxHP) * 100}%`, background: `linear-gradient(90deg,${playerHP < 30 ? '#f87171,#ef4444' : '#4ade80,#22c55e'})`, borderRadius: 4, transition: 'width .4s' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#f87171' }}>{room.enemy.emoji} {room.enemy.name}</span>
                <span style={{ color: '#f87171', fontWeight: 900 }}>{enemyHP}/{room.enemy.hp}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(0,0,0,.3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(enemyHP / room.enemy.hp) * 100}%`, background: 'linear-gradient(90deg,#f87171,#ef4444)', borderRadius: 4, transition: 'width .4s' }} />
              </div>
            </div>
          </div>

          {/* Log */}
          <div style={{ background: 'rgba(0,0,0,.25)', borderRadius: 12, padding: '8px 12px', minHeight: 64 }}>
            {log.slice(-3).map((l, i) => (
              <div key={i} style={{ fontSize: 11, color: i === log.slice(-3).length - 1 ? '#fff' : '#666', marginBottom: 2 }}>{l}</div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {([
              { action: 'attack' as Action, emoji: '⚔️', label: 'Anfall' },
              { action: 'block' as Action, emoji: '🛡️', label: 'Blockera' },
              { action: 'heal' as Action, emoji: '💊', label: `Läk (${heals})` },
            ]).map(({ action, emoji, label }) => (
              <button
                key={action}
                onClick={() => doAction(action)}
                disabled={resolving || (action === 'heal' && heals <= 0)}
                style={{
                  padding: '14px 6px', borderRadius: 14, textAlign: 'center',
                  background: action === 'heal' && heals <= 0 ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.05)',
                  border: `1px solid ${blocked && action === 'block' ? '#60a5fa99' : 'rgba(255,255,255,.12)'}`,
                  color: action === 'heal' && heals <= 0 ? '#444' : '#e8e8f0',
                  fontSize: 12, fontWeight: 700, cursor: resolving || (action === 'heal' && heals <= 0) ? 'not-allowed' : 'pointer',
                  opacity: resolving ? 0.6 : 1, transition: 'all .15s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'loot' && (
        <div style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 48 }}>🎁</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#4ade80' }}>Rum klart!</div>
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{room.loot.coins}🪙 +{room.loot.xp} XP</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Totalt: {totalCoins}🪙 · HP: {playerHP}/{playerMaxHP} · 💊{heals}</div>
          {roomIdx + 1 < ROOMS.length ? (
            <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={nextRoom}>
              → Nästa rum ({ROOMS[roomIdx + 1].emoji} {ROOMS[roomIdx + 1].name})
            </button>
          ) : (
            <button className="btn-gold" style={{ padding: '14px 32px' }} onClick={nextRoom}>
              🏆 Slutföra dungeon! (+100 bonus)
            </button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{survived ? '🏆' : '💀'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: survived ? '#fbbf24' : '#f87171' }}>
            {survived ? 'DUNGEON KLAR!' : 'Du föll i strid...'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--t3)' }}>
            {survived ? `Alla ${ROOMS.length} rum klarade!` : `Kom till rum ${roomIdx + 1}/${ROOMS.length}`}
          </div>
          <div style={{ fontSize: 16, color: '#fbbf24', fontWeight: 900 }}>
            +{totalCoins}🪙 · +{totalXP} XP
          </div>
          <button className="btn-primary" style={{ padding: '14px 32px', marginTop: 4 }} onClick={() => {
            setPhase('intro'); setRoomIdx(0); setPlayerHP(100); setEnemyHP(ROOMS[0].enemy.hp)
            setHeals(3); setBlocked(false); setLog([]); setTotalCoins(0); setTotalXP(0); setSurvived(true)
          }}>
            Spela igen
          </button>
        </div>
      )}
    </div>
  )
})
