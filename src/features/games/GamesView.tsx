import { memo, useState } from 'react'
import { useGame } from '@/hooks/useGame'
import { audio } from '@/services/AudioService'
import styles from './GamesView.module.css'
import { SnakeGame } from './SnakeGame'
import { MemoryGame } from './MemoryGame'
import { ReactionGame } from './ReactionGame'

type GameId = 'snake' | 'memory' | 'reaction' | null

const GAMES = [
  { id: 'snake' as const, emoji: '🐍', name: 'Snake', desc: 'Klassiskt snake-spel', reward: '🪙 5-50' },
  { id: 'memory' as const, emoji: '🃏', name: 'Minne', desc: 'Para ihop korten', reward: '🪙 10-30' },
  { id: 'reaction' as const, emoji: '⚡', name: 'Reaktion', desc: 'Hur snabb är du?', reward: '🪙 5-25' },
]

export const GamesView = memo(function GamesView() {
  const [activeGame, setActiveGame] = useState<GameId>(null)
  const { awardCoins, awardXP } = useGame()

  const handleGameWin = (coins: number, xp: number) => {
    awardCoins(coins)
    awardXP(xp, 'game')
    audio.achievement()
  }

  if (activeGame === 'snake') {
    return <SnakeGame onExit={() => setActiveGame(null)} onWin={handleGameWin} />
  }
  if (activeGame === 'memory') {
    return <MemoryGame onExit={() => setActiveGame(null)} onWin={handleGameWin} />
  }
  if (activeGame === 'reaction') {
    return <ReactionGame onExit={() => setActiveGame(null)} onWin={handleGameWin} />
  }

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Mini-spel</h2>
        <span className={styles.sub}>Tjäna mynt & XP</span>
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
