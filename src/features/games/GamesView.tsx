import { memo, useState } from 'react'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'
import { formatNumber } from '@/utils/format'
import type { FishType } from '@/types/game'
import { SnakeGame } from './SnakeGame'
import { MemoryGame } from './MemoryGame'
import { ReactionGame } from './ReactionGame'
import { RunnerGame } from './RunnerGame'
import { FishingGame } from './FishingGame'
import { BattleGame } from './BattleGame'
import { Puzzle2048 } from './puzzle2048/Puzzle2048'

type GameId = 'snake' | 'memory' | 'reaction' | 'runner' | 'fishing' | 'battle' | 'puzzle2048' | null

const GAMES = [
  { id: 'battle' as const, emoji: '⚔️', name: 'Strid', desc: 'Turn-based PvE', reward: '🪙20-400', hot: true },
  { id: 'puzzle2048' as const, emoji: '🔢', name: '2048', desc: 'Slå ihop brickor', reward: '🪙500', hot: true },
  { id: 'runner' as const, emoji: '🏃', name: 'Runner', desc: 'Undvik hinder', reward: '🪙5-100', hot: false },
  { id: 'fishing' as const, emoji: '🎣', name: 'Fiske', desc: 'Fånga fiskar', reward: '🪙10-1000', hot: false },
  { id: 'snake' as const, emoji: '🐍', name: 'Snake', desc: 'Klassiskt', reward: '🪙5-50', hot: false },
  { id: 'memory' as const, emoji: '🃏', name: 'Minne', desc: 'Para ihop kort', reward: '🪙10-30', hot: false },
  { id: 'reaction' as const, emoji: '⚡', name: 'Reaktion', desc: 'Hur snabb?', reward: '🪙5-25', hot: false },
]

export const GamesView = memo(function GamesView() {
  const [activeGame, setActiveGame] = useState<GameId>(null)
  const { awardCoins, awardXP } = useGame()
  const recordBattleWin = useGameStore(s => s.recordBattleWin)
  const recordFishCaught = useGameStore(s => s.recordFishCaught)
  const recordRunnerScore = useGameStore(s => s.recordRunnerScore)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)
  const runnerBest = useGameStore(s => s.pet.runnerBest)
  const battleWins = useGameStore(s => s.pet.battleWins)
  const fishCaught = useGameStore(s => s.pet.fishCaught)

  const handleGenericWin = (coins: number, xp: number) => {
    awardCoins(coins); awardXP(xp, 'game'); audio.achievement()
    showToast(`+${formatNumber(coins)} 🪙 +${xp} XP`, 'success')
  }

  const handle2048Win = (coins: number, xp: number) => {
    awardCoins(coins); awardXP(xp, 'game'); audio.achievement()
    showToast(`🔢 2048 CLEARED! +${formatNumber(coins)} 🪙 +${xp} XP`, 'success')
    pushNotif('🔢', `Du klarade 2048! +${coins} mynt belöning!`)
  }

  const handleBattleWin = (coins: number, xp: number) => {
    awardCoins(coins); awardXP(xp, 'battle'); audio.achievement()
    recordBattleWin()
    showToast(`⚔️ Seger! +${coins} 🪙`, 'success')
    pushNotif('⚔️', `Du vann en strid! +${coins} mynt`)
  }

  const handleFishCatch = (fish: FishType, coins: number, xp: number) => {
    awardCoins(coins); awardXP(xp, 'fish'); audio.coin()
    recordFishCaught()
    showToast(`${fish.emoji} Fångade ${fish.name}! +${coins} 🪙`, 'success')
    if (fish.rarity === 'legendary') pushNotif(fish.emoji, `LEGENDÄRT! Du fångade ${fish.name}!`)
  }

  const handleRunnerWin = (coins: number, xp: number, score: number) => {
    awardCoins(coins); awardXP(xp, 'runner')
    recordRunnerScore(score)
    showToast(`🏃 ${score}m! +${coins} 🪙`, 'success')
  }

  if (activeGame === 'snake') return <SnakeGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'memory') return <MemoryGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'reaction') return <ReactionGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'runner') return <RunnerGame onExit={() => setActiveGame(null)} onWin={handleRunnerWin} />
  if (activeGame === 'fishing') return <FishingGame onExit={() => setActiveGame(null)} onCatch={handleFishCatch} />
  if (activeGame === 'battle') return <BattleGame onExit={() => setActiveGame(null)} onWin={handleBattleWin} />
  if (activeGame === 'puzzle2048') return <Puzzle2048 onExit={() => setActiveGame(null)} onWin={handle2048Win} />

  return (
    <>
      <div className="games-header-2027">
        <div className="games-title-2027">🎮 GAMES</div>
        <div className="games-daily-xp-badge">+{(battleWins + fishCaught) * 10} XP idag</div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ background: 'rgba(255,68,85,.12)', border: '1px solid rgba(255,68,85,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap' }}>⚔️ {battleWins} segrar</div>
        <div style={{ background: 'rgba(0,255,136,.12)', border: '1px solid rgba(0,255,136,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>🏃 {runnerBest}m rekord</div>
        <div style={{ background: 'rgba(68,136,255,.12)', border: '1px solid rgba(68,136,255,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap' }}>🎣 {fishCaught} fisk</div>
      </div>

      <div className="games-grid-2027">
        {GAMES.map(g => (
          <button
            key={g.id}
            className={`game-card-2027${g.hot ? ' hot' : ''}`}
            onClick={() => { setActiveGame(g.id); audio.click() }}
          >
            <div className="game-card-icon">{g.emoji}</div>
            <div className="game-card-name">{g.name}</div>
            <div className="game-card-xp">{g.desc}</div>
            <div className="game-card-badge">{g.reward}</div>
          </button>
        ))}
      </div>

      <div className="vend" />
    </>
  )
})
