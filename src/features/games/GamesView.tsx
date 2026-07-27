import { memo, useState, useMemo } from 'react'
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
import { SpinGame } from './SpinGame'

type GameId = 'snake' | 'memory' | 'reaction' | 'runner' | 'fishing' | 'battle' | 'puzzle2048' | 'spin' | null

const GAMES = [
  { id: 'battle' as const, emoji: '⚔️', name: 'Strid', desc: 'Turn-based PvE', reward: '🪙20-400', hot: true },
  { id: 'spin' as const, emoji: '🎰', name: 'Lyckhjulet', desc: 'Snurra & vinn', reward: '🪙25-200+', hot: true },
  { id: 'puzzle2048' as const, emoji: '🔢', name: '2048', desc: 'Slå ihop brickor', reward: '🪙500', hot: false },
  { id: 'runner' as const, emoji: '🏃', name: 'Runner', desc: 'Undvik hinder', reward: '🪙5-100', hot: false },
  { id: 'fishing' as const, emoji: '🎣', name: 'Fiske', desc: 'Fånga fiskar', reward: '🪙10-1000', hot: false },
  { id: 'snake' as const, emoji: '🐍', name: 'Snake', desc: 'Klassiskt', reward: '🪙5-50', hot: false },
  { id: 'memory' as const, emoji: '🃏', name: 'Minne', desc: 'Para ihop kort', reward: '🪙10-30', hot: false },
  { id: 'reaction' as const, emoji: '⚡', name: 'Reaktion', desc: 'Hur snabb?', reward: '🪙5-25', hot: false },
]

function weekKey() {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return `k0509_wk_${Math.floor(Date.now() / msPerWeek)}`
}

export const GamesView = memo(function GamesView() {
  const [activeGame, setActiveGame] = useState<GameId>(null)
  const { awardCoins, awardXP } = useGame()
  const recordBattleWin = useGameStore(s => s.recordBattleWin)
  const recordFishCaught = useGameStore(s => s.recordFishCaught)
  const recordRunnerScore = useGameStore(s => s.recordRunnerScore)
  const recordMissionProgress = useGameStore(s => s.recordMissionProgress)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)
  const triggerConfetti = useUIStore(s => s.triggerConfetti)
  const runnerBest = useGameStore(s => s.pet.runnerBest)
  const battleWins = useGameStore(s => s.pet.battleWins)
  const fishCaught = useGameStore(s => s.pet.fishCaught)
  const petEmoji = useGameStore(s => s.pet.petEmoji)
  const gainKC = useGameStore(s => s.gainKC)
  const [weeklyClaimed, setWeeklyClaimed] = useState(() => !!localStorage.getItem(weekKey()))

  const weekChallenge = useMemo(() => {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const weekNum = Math.floor(Date.now() / msPerWeek)
    const challenges = [
      { title: 'Vinn 10 Strider', goal: 10, current: battleWins, game: 'battle', reward: '500 🪙 + 20 KC', emoji: '⚔️', coins: 500, kc: 20 },
      { title: 'Fånga 20 Fiskar', goal: 20, current: fishCaught, game: 'fishing', reward: '400 🪙 + 15 KC', emoji: '🎣', coins: 400, kc: 15 },
      { title: 'Spring 300m', goal: 300, current: runnerBest, game: 'runner', reward: '300 🪙 + 10 KC', emoji: '🏃', coins: 300, kc: 10 },
    ]
    return challenges[weekNum % challenges.length]
  }, [battleWins, fishCaught, runnerBest])

  const claimWeekly = () => {
    if (weeklyClaimed || weekChallenge.current < weekChallenge.goal) return
    awardCoins(weekChallenge.coins)
    gainKC(weekChallenge.kc)
    localStorage.setItem(weekKey(), '1')
    setWeeklyClaimed(true)
    showToast(`🏆 Veckoutmaning klar! +${weekChallenge.coins}🪙 +${weekChallenge.kc}💎`, 'success')
    pushNotif('🏆', `Veckans utmaning klar! +${weekChallenge.coins} mynt`)
    triggerConfetti()
    audio.achievement()
  }

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
  if (activeGame === 'memory') return <MemoryGame onExit={() => setActiveGame(null)} onWin={(c, xp) => { handleGenericWin(c, xp); recordMissionProgress('memory') }} />
  if (activeGame === 'reaction') return <ReactionGame onExit={() => setActiveGame(null)} onWin={handleGenericWin} />
  if (activeGame === 'runner') return <RunnerGame onExit={() => setActiveGame(null)} onWin={handleRunnerWin} petEmoji={petEmoji} runnerBest={runnerBest} />
  if (activeGame === 'fishing') return <FishingGame onExit={() => setActiveGame(null)} onCatch={handleFishCatch} />
  if (activeGame === 'battle') return <BattleGame onExit={() => setActiveGame(null)} onWin={handleBattleWin} />
  if (activeGame === 'puzzle2048') return <Puzzle2048 onExit={() => setActiveGame(null)} onWin={handle2048Win} />
  if (activeGame === 'spin') return <SpinGame onExit={() => setActiveGame(null)} onWin={(c, xp) => handleGenericWin(c, xp)} />

  return (
    <>
      <div className="games-header-2027">
        <div className="games-title-2027">🎮 GAMES</div>
        <div className="games-daily-xp-badge">+{(battleWins + fishCaught) * 10} XP idag</div>
      </div>

      {/* Weekly Challenge */}
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(170,102,255,.12), rgba(68,136,255,.08))',
          border: '1px solid rgba(170,102,255,.3)',
          borderRadius: 16,
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🗓️</span>
              <span style={{ fontFamily: 'var(--ff-head)', fontSize: 12, fontWeight: 900, color: 'var(--purple)', letterSpacing: 1 }}>VECKANS UTMANING</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>Återst. måndag</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{weekChallenge.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{weekChallenge.title}</div>
              <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (weekChallenge.current / weekChallenge.goal) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--purple), var(--blue))',
                  borderRadius: 6,
                  transition: 'width .4s',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>
                {Math.min(weekChallenge.current, weekChallenge.goal)}/{weekChallenge.goal} · {weekChallenge.reward}
              </div>
            </div>
            {weekChallenge.current >= weekChallenge.goal && !weeklyClaimed && (
              <button
                onClick={claimWeekly}
                style={{
                  background: 'linear-gradient(135deg, var(--gold), #ff8844)',
                  border: 'none', borderRadius: 10, padding: '8px 12px',
                  fontFamily: 'var(--ff-head)', fontSize: 11, fontWeight: 900, color: '#000',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >Hämta!</button>
            )}
            {weeklyClaimed && (
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 900, flexShrink: 0 }}>✓ Klar</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ background: 'rgba(255,68,85,.12)', border: '1px solid rgba(255,68,85,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap' }}>⚔️ {battleWins} segrar</div>
        <div style={{ background: 'rgba(0,255,136,.12)', border: '1px solid rgba(0,255,136,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>🏃 {runnerBest}m rekord</div>
        <div style={{ background: 'rgba(68,136,255,.12)', border: '1px solid rgba(68,136,255,.3)', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap' }}>🎣 {fishCaught} fisk</div>
      </div>

      {/* Seasonal Event Banner */}
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,204,0,.12), rgba(255,136,68,.08))',
          border: '1px solid rgba(255,204,0,.3)',
          borderRadius: 16, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 32 }}>🌅</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 13, fontWeight: 900, color: 'var(--gold)', letterSpacing: 1 }}>
              SOMMERFESTIVALEN 2026 🎉
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
              Bonus XP +25% · Exklusiva belöningar
            </div>
          </div>
          <div style={{
            background: 'rgba(255,204,0,.2)', border: '1px solid rgba(255,204,0,.4)',
            borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: 900, color: 'var(--gold)',
            whiteSpace: 'nowrap',
          }}>
            LIVE ●
          </div>
        </div>
      </div>

      <div className="games-grid-2027">
        {GAMES.map(g => {
          const pb = g.id === 'battle' ? `⚔️ ${battleWins} seg.`
            : g.id === 'runner' ? `🏃 ${runnerBest}m`
            : g.id === 'fishing' ? `🎣 ${fishCaught} fisk`
            : null
          return (
            <button
              key={g.id}
              className={`game-card-2027${g.hot ? ' hot' : ''}`}
              onClick={() => { setActiveGame(g.id); audio.click() }}
            >
              <div className="game-card-icon">{g.emoji}</div>
              <div className="game-card-name">{g.name}</div>
              <div className="game-card-xp">{g.desc}</div>
              <div className="game-card-badge">{g.reward}</div>
              {pb && <div style={{ fontSize: 8, color: 'var(--t3)', marginTop: 2, fontWeight: 700 }}>{pb}</div>}
            </button>
          )
        })}
      </div>

      <div className="vend" />
    </>
  )
})
