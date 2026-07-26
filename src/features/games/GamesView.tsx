import { memo, useState } from 'react'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'
import { formatNumber } from '@/utils/format'
import type { FishType } from '@/types/game'
import styles from './GamesView.module.css'
import { SnakeGame } from './SnakeGame'
import { MemoryGame } from './MemoryGame'
import { ReactionGame } from './ReactionGame'
import { RunnerGame } from './RunnerGame'
import { FishingGame } from './FishingGame'
import { BattleGame } from './BattleGame'

type GameId = 'snake' | 'memory' | 'reaction' | 'runner' | 'fishing' | 'battle' | null

const GAMES = [
  { id: 'battle' as const, emoji: '⚔️', name: 'Strid', desc: 'Turn-based PvE battle', reward: '🪙20-400' },
  { id: 'runner' as const, emoji: '🏃', name: 'Runner', desc: 'Undvik hinder i full fart', reward: '🪙5-100' },
  { id: 'fishing' as const, emoji: '🎣', name: 'Fiske', desc: 'Fånga sällsynta fiskar', reward: '🪙10-1000' },
  { id: 'snake' as const, emoji: '🐍', name: 'Snake', desc: 'Klassiskt snake-spel', reward: '🪙5-50' },
  { id: 'memory' as const, emoji: '🃏', name: 'Minne', desc: 'Para ihop korten', reward: '🪙10-30' },
  { id: 'reaction' as const, emoji: '⚡', name: 'Reaktion', desc: 'Hur snabb är du?', reward: '🪙5-25' },
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

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>🎮 Mini-spel</h2>
        <span className={styles.sub}>Tjäna mynt & XP</span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statChip}>⚔️ {battleWins} segrar</div>
        <div className={styles.statChip}>🏃 {runnerBest}m rekord</div>
        <div className={styles.statChip}>🎣 {fishCaught} fisk</div>
      </div>

      <div className={styles.grid}>
        {GAMES.map(g => (
          <button
            key={g.id}
            className={styles.gameCard}
            onClick={() => { setActiveGame(g.id); audio.click() }}
          >
            <div className={styles.gameEmoji}>{g.emoji}</div>
            <div className={styles.gameName}>{g.name}</div>
            <div className={styles.gameDesc}>{g.desc}</div>
            <div className={styles.gameReward}>{g.reward}</div>
          </button>
        ))}
      </div>
    </div>
  )
})
