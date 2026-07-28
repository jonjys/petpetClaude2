import { memo, useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'
import { SPIN_PRIZES, LUCKY_PRIZES, EXPEDITIONS, ALL_ACHIEVEMENTS, FEATURE_HUB_ITEMS, FORTUNE_MESSAGES, SHOP_HATS, SHOP_ACC, SHOP_AURA, FISH_TYPES } from '@/constants/config'
import { SPIN_KEY, LUCKY_KEY } from '@/constants/config'
import styles from './CreateView.module.css'
import { ShopView } from '@/features/shop/ShopView'

type Panel = null | 'spin' | 'lucky' | 'expedition' | 'achievements' | 'wardrobe' | 'fortune' | 'shop' | 'records' | 'leaderboard' | 'battlepass' | 'quests' | 'craft' | 'chests' | 'bounty' | 'fishpedia' | 'checkin' | 'skilltree' | 'tarot' | 'trophyroom' | 'mine' | 'activitylog' | 'farm' | 'worldevents' | 'dnalab' | 'bank' | 'worldboss' | 'petjournal' | 'tournament' | 'companion' | 'auction' | 'prestigehall' | 'clan' | 'lottery'

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) { r -= item.weight; if (r <= 0) return item }
  return items[items.length - 1]
}

const ITEM_ACCENTS: Record<string, string> = {
  spin: 'gold', lucky: 'purple', shop: 'green', expedition: 'blue',
  achievements: 'gold', craft: 'purple', fortune: 'orange',
  wardrobe: 'pink', battlepass: 'purple', leaderboard: 'gold',
  quests: 'green', records: 'blue', chests: 'gold', bounty: 'red',
  fishpedia: 'blue', checkin: 'green', skilltree: 'green', tarot: 'purple', trophyroom: 'gold',
  mine: 'gold', activitylog: 'blue', farm: 'green', worldevents: 'purple',
  dnalab: 'purple', bank: 'gold', worldboss: 'red', petjournal: 'blue',
  tournament: 'gold', companion: 'green', auction: 'purple',
  prestigehall: 'gold', clan: 'blue', lottery: 'purple',
}
const ITEM_BADGES: Record<string, { label: string; color: string }> = {
  spin:       { label: 'DAGLIG', color: 'var(--gold)'   },
  lucky:      { label: 'NY',     color: 'var(--purple)' },
  battlepass: { label: 'S1',     color: 'var(--purple)' },
  craft:      { label: 'CRAFT',  color: 'var(--blue)'   },
  expedition: { label: 'ÄVENTYR',color: 'var(--green)'  },
  chests:     { label: 'DAGLIG', color: 'var(--gold)'   },
  bounty:     { label: 'NYA',    color: 'var(--red)'    },
  checkin:    { label: 'DAGLIG', color: 'var(--green)'  },
  skilltree:  { label: 'NYA',    color: 'var(--green)'  },
  tarot:      { label: 'DAGLIG', color: 'var(--purple)' },
  trophyroom: { label: 'NY',     color: 'var(--gold)'   },
  mine:       { label: 'NY',     color: 'var(--gold)'   },
  farm:       { label: 'NY',     color: 'var(--green)'  },
  worldevents:{ label: 'LIVE',   color: 'var(--purple)' },
  dnalab:     { label: 'NY',     color: 'var(--purple)' },
  bank:       { label: 'NY',     color: 'var(--gold)'   },
  worldboss:  { label: 'LIVE',   color: 'var(--red)'    },
  tournament: { label: 'LIVE',   color: 'var(--gold)'   },
  companion:  { label: 'NY',     color: 'var(--green)'  },
  auction:    { label: 'NY',     color: 'var(--purple)'  },
  prestigehall:{ label: 'NY',   color: 'var(--gold)'   },
  clan:       { label: 'NY',     color: 'var(--blue)'   },
  lottery:    { label: 'DAGLIG', color: 'var(--purple)' },
}

export const CreateView = memo(function CreateView() {
  const [panel, setPanel] = useState<Panel>(null)
  const dailyMissions = useGameStore(s => s.dailyMissions)
  const todayStr = new Date().toDateString()
  const canSpin = localStorage.getItem(SPIN_KEY) !== todayStr
  const canLucky = localStorage.getItem(LUCKY_KEY) !== todayStr
  const missionsDue = dailyMissions.filter(m => !m.done && m.progress >= m.target).length

  if (panel === 'shop') return (
    <div>
      <div style={{ padding: '12px 14px 0' }}>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => setPanel(null)}>← Tillbaka</button>
      </div>
      <ShopView />
    </div>
  )

  if (panel !== null) return <PanelView panel={panel} onBack={() => setPanel(null)} />

  return (
    <>
      <div style={{ padding: '14px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: 'var(--green)' }}>✨ Feature Hub</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Allt på ett ställe</div>
        </div>
        {missionsDue > 0 && (
          <div style={{
            background: 'rgba(255,204,0,.15)', border: '1px solid rgba(255,204,0,.4)',
            borderRadius: 12, padding: '4px 10px', fontSize: 11, fontWeight: 900, color: 'var(--gold)',
          }}>
            {missionsDue} klara!
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 14px 14px' }}>
        {FEATURE_HUB_ITEMS.map(item => {
          const badge = ITEM_BADGES[item.id]
          const isAvailable = item.id === 'spin' ? canSpin : item.id === 'lucky' ? canLucky : true
          const accent = ITEM_ACCENTS[item.id] ?? 'green'
          const hasNotif = item.id === 'quests' && missionsDue > 0
          return (
            <button
              key={item.id}
              className="care-btn"
              data-accent={accent}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '14px 10px', minHeight: 80, position: 'relative',
                opacity: !isAvailable ? 0.55 : 1,
              }}
              onClick={() => { setPanel(item.id as Panel); audio.click() }}
            >
              {badge && isAvailable && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  background: badge.color + '22', border: `1px solid ${badge.color}66`,
                  borderRadius: 6, fontSize: 7, fontWeight: 900, color: badge.color,
                  padding: '1px 4px', letterSpacing: .5,
                }}>
                  {badge.label}
                </span>
              )}
              {hasNotif && (
                <span style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 900, color: '#000',
                }}>
                  {missionsDue}
                </span>
              )}
              {!isAvailable && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  fontSize: 9, color: 'var(--green)', fontWeight: 900,
                }}>✅</span>
              )}
              <span style={{ fontSize: 28 }}>{item.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--ff-head)' }}>{item.label}</span>
              <span style={{ fontSize: 10, color: 'var(--t3)' }}>{item.desc}</span>
            </button>
          )
        })}
      </div>
    </>
  )
})

// ── Panel router ──────────────────────────────────────────────────────────────
const PanelView = memo(function PanelView({ panel, onBack }: { panel: Panel; onBack: () => void }) {
  const pet = useGameStore(s => s.pet)
  const gainXP = useGameStore(s => s.gainXP)
  const gainCoins = useGameStore(s => s.gainCoins)
  const gainKC = useGameStore(s => s.gainKC)
  const setStat = useGameStore(s => s.setStat)
  const spendCoins = useGameStore(s => s.spendCoins)
  const spendKC = useGameStore(s => s.spendKC)
  const addInventoryItem = useGameStore(s => s.addInventoryItem)
  const equipItem = useGameStore(s => s.equipItem)
  const unlockedAchievements = useGameStore(s => s.unlockedAchievements)
  const dailyMissions = useGameStore(s => s.dailyMissions)
  const claimMission = useGameStore(s => s.claimMission)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)
  const triggerConfetti = useUIStore(s => s.triggerConfetti)

  // Spin
  const [spinning, setSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<(typeof SPIN_PRIZES)[0] | null>(null)
  const [spinAngle, setSpinAngle] = useState(0)
  const lastSpin = localStorage.getItem(SPIN_KEY) ?? ''
  const todayStr = new Date().toDateString()
  const canSpin = lastSpin !== todayStr

  const doSpin = () => {
    if (!canSpin || spinning) return
    setSpinning(true)
    const prize = weightedRandom(SPIN_PRIZES)
    const extra = 360 * 5 + Math.random() * 360
    setSpinAngle(a => a + extra)
    setTimeout(() => {
      setSpinResult(prize)
      setSpinning(false)
      localStorage.setItem(SPIN_KEY, todayStr)
      gainCoins(prize.coins)
      if (prize.xp) gainXP(prize.xp, 'spin')
      if (prize.kc) gainKC(prize.kc)
      if (prize.label === 'Max Humör!') setStat('mood', 100)
      showToast(`🎡 ${prize.emoji} ${prize.label}!`, 'success')
      pushNotif(prize.emoji, `Daglig spin: ${prize.label}!`)
      triggerConfetti()
      audio.achievement()
    }, 2500)
  }

  // Lucky box
  const lastLucky = localStorage.getItem(LUCKY_KEY) ?? ''
  const canLucky = lastLucky !== todayStr
  const [luckyResult, setLuckyResult] = useState<(typeof LUCKY_PRIZES)[0] | null>(null)

  const openLucky = () => {
    if (!canLucky) return
    const prize = LUCKY_PRIZES[Math.floor(Math.random() * LUCKY_PRIZES.length)]
    setLuckyResult(prize)
    localStorage.setItem(LUCKY_KEY, todayStr)
    gainCoins(prize.coins); gainXP(prize.xp, 'lucky')
    if (prize.kc) gainKC(prize.kc)
    showToast(`${prize.emoji} ${prize.label}!`, 'success')
    triggerConfetti(); audio.achievement()
  }

  // Expedition
  const [activeExp, setActiveExp] = useState<string | null>(localStorage.getItem('k0509_activeExp'))
  const [expEnd, setExpEnd] = useState<number>(Number(localStorage.getItem('k0509_expEnd') ?? 0))
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!activeExp) return
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [activeExp])

  const startExp = (id: string, minutes: number) => {
    const end = Date.now() + minutes * 60000
    localStorage.setItem('k0509_activeExp', id)
    localStorage.setItem('k0509_expEnd', String(end))
    setActiveExp(id); setExpEnd(end)
    showToast('🗺️ Expedition startad!', 'success')
    audio.click()
  }

  const claimExp = () => {
    const exp = EXPEDITIONS.find(e => e.id === activeExp)
    if (!exp) return
    gainCoins(exp.reward.coins); gainXP(exp.reward.xp, 'expedition')
    if (exp.reward.kc) gainKC(exp.reward.kc)
    useGameStore.setState(s => ({ pet: { ...s.pet, expeditionsDone: s.pet.expeditionsDone + 1 } }))
    localStorage.removeItem('k0509_activeExp'); localStorage.removeItem('k0509_expEnd')
    setActiveExp(null); setExpEnd(0)
    showToast(`🏆 Expedition klar! +${exp.reward.coins}🪙 +${exp.reward.xp}XP`, 'success')
    pushNotif('🗺️', `Expedition klar: ${exp.name}!`)
    triggerConfetti(); audio.achievement()
  }

  // Fortune
  const [fortune, setFortune] = useState<string | null>(null)
  const fortuneKey = `k0509_fortune_${new Date().toDateString()}`
  const todayFortune = localStorage.getItem(fortuneKey)

  const getFortune = () => {
    const msg = FORTUNE_MESSAGES[Math.floor(Math.random() * FORTUNE_MESSAGES.length)]
    localStorage.setItem(fortuneKey, msg)
    setFortune(msg)
    gainXP(25, 'fortune'); gainCoins(15)
    showToast('🥠 +25 XP +15 🪙', 'success')
    audio.coin()
  }

  const BackBtn = () => (
    <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px', marginBottom: 8 }} onClick={onBack}>← Tillbaka</button>
  )

  // ── Spin panel ──────────────────────────────────────────────────────────────
  if (panel === 'spin') return (
    <div className={styles.panelRoot}>
      <BackBtn />
      <div className={styles.panelTitle}>🎡 Daglig Spin</div>
      <div className={styles.spinWheel} style={{ transform: `rotate(${spinAngle}deg)`, transition: spinning ? 'transform 2.5s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}>
        {SPIN_PRIZES.map((p, i) => {
          const angle = (360 / SPIN_PRIZES.length) * i
          return (
            <div key={i} className={styles.spinSegment} style={{ transform: `rotate(${angle}deg)` }}>
              <span style={{ transform: `rotate(${90}deg)` }}>{p.emoji}</span>
            </div>
          )
        })}
        <div className={styles.spinCenter}>🎡</div>
      </div>
      {spinResult && !spinning && (
        <div className={styles.spinResult}>{spinResult.emoji} {spinResult.label}!</div>
      )}
      <button className="btn-gold" style={{ width: '100%', fontSize: 18, padding: 16, marginTop: 16 }} onClick={doSpin} disabled={!canSpin || spinning}>
        {spinning ? 'Snurrar...' : canSpin ? '🎡 Snurra!' : '✅ Redan snurrat idag'}
      </button>
      <div className={styles.panelNote}>1 gratis spinn per dag</div>
    </div>
  )

  // ── Lucky box panel ─────────────────────────────────────────────────────────
  if (panel === 'lucky') return (
    <div className={styles.panelRoot}>
      <BackBtn />
      <div className={styles.panelTitle}>📦 Lucky Box</div>
      <div className={styles.luckyBox} onClick={!canLucky || luckyResult ? undefined : openLucky}>
        {luckyResult ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 60 }}>{luckyResult.emoji}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 700, color: '#fbbf24', marginTop: 8 }}>{luckyResult.label}</div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>+{luckyResult.coins}🪙 +{luckyResult.xp}XP{luckyResult.kc ? ` +${luckyResult.kc}KC` : ''}</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, animation: 'float 2s ease-in-out infinite' }}>{canLucky ? '📦' : '🔒'}</div>
            <div style={{ color: canLucky ? '#fbbf24' : '#888', fontWeight: 700, marginTop: 8 }}>{canLucky ? 'Tryck för att öppna!' : 'Kom tillbaka imorgon'}</div>
          </div>
        )}
      </div>
      {!luckyResult && canLucky && (
        <button className="btn-gold" style={{ width: '100%', fontSize: 16, padding: 14 }} onClick={openLucky}>📦 Öppna Lucky Box!</button>
      )}
    </div>
  )

  // ── Expedition panel ────────────────────────────────────────────────────────
  if (panel === 'expedition') {
    const expDone = activeExp && now >= expEnd
    const currentExp = EXPEDITIONS.find(e => e.id === activeExp)
    const remaining = activeExp && !expDone ? Math.max(0, expEnd - now) : 0
    const mins = Math.floor(remaining / 60000)
    const secs = Math.floor((remaining % 60000) / 1000)
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🗺️ Expedition</div>
        {activeExp && currentExp ? (
          <div className={styles.activeExp}>
            <div style={{ fontSize: 48 }}>{currentExp.emoji}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 700 }}>{currentExp.name}</div>
            {expDone ? (
              <>
                <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: 8 }}>Expedition klar! 🎉</div>
                <button className="btn-gold" style={{ width: '100%', padding: 14, fontSize: 16 }} onClick={claimExp}>🏆 Hämta belöning!</button>
              </>
            ) : (
              <>
                <div style={{ color: '#fbbf24', fontFamily: 'var(--ff-head)', fontSize: 22, marginBottom: 8 }}>{mins}m {secs}s kvar</div>
                {(() => {
                  const total = currentExp.duration * 60000
                  const pct = Math.min(100, ((total - remaining) / total) * 100)
                  const barColor = pct < 50 ? 'var(--blue)' : pct < 85 ? 'var(--gold)' : 'var(--green)'
                  return (
                    <div style={{ width: '100%', background: 'rgba(255,255,255,.08)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 6, transition: 'width .8s, background .5s' }} />
                    </div>
                  )
                })()}
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 5 }}>
                  Belöning: 🪙{currentExp.reward.coins} ⭐{currentExp.reward.xp}XP{currentExp.reward.kc ? ` 💎${currentExp.reward.kc}KC` : ''}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.expList}>
            {EXPEDITIONS.filter(e => e.unlockLevel <= pet.level).map(exp => (
              <button key={exp.id} className={styles.expCard} onClick={() => startExp(exp.id, exp.duration)} disabled={!!activeExp}>
                <span style={{ fontSize: 32 }}>{exp.emoji}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{exp.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{exp.description}</div>
                  <div style={{ fontSize: 12, color: '#4ade80', marginTop: 2 }}>{exp.duration}min · 🪙{exp.reward.coins} ⭐{exp.reward.xp}XP{exp.reward.kc ? ` 💎${exp.reward.kc}KC` : ''}</div>
                </div>
                <span style={{ fontSize: 11, color: exp.difficulty === 'hard' ? '#f87171' : exp.difficulty === 'normal' ? '#fbbf24' : '#4ade80' }}>{exp.difficulty}</span>
              </button>
            ))}
            {EXPEDITIONS.filter(e => e.unlockLevel > pet.level).map(exp => (
              <div key={exp.id} className={styles.expCard} style={{ opacity: 0.4 }}>
                <span style={{ fontSize: 32 }}>🔒</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{exp.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>Kräver nivå {exp.unlockLevel}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Achievements panel ──────────────────────────────────────────────────────
  if (panel === 'achievements') {
    function getAchProgress(id: string): { current: number; max: number } | null {
      if (id.startsWith('taps')) { const n = parseInt(id.replace('taps', '')); return isNaN(n) ? null : { current: Math.min(n, pet.totalTaps), max: n } }
      if (id.startsWith('level')) { const n = parseInt(id.replace('level', '')); return isNaN(n) ? null : { current: Math.min(n, pet.level), max: n } }
      if (id.startsWith('streak')) { const n = parseInt(id.replace('streak', '')); return isNaN(n) ? null : { current: Math.min(n, pet.streak), max: n } }
      if (id.startsWith('battle')) { const n = parseInt(id.replace('battle', '')); return isNaN(n) ? null : { current: Math.min(n, pet.battleWins), max: n } }
      if (id.startsWith('fish')) { const n = parseInt(id.replace('fish', '')); return isNaN(n) ? null : { current: Math.min(n, pet.fishCaught), max: n } }
      if (id.startsWith('expedition')) { const n = parseInt(id.replace('expedition', '')); return isNaN(n) ? null : { current: Math.min(n, pet.expeditionsDone), max: n } }
      if (id.startsWith('runner')) { const n = parseInt(id.replace('runner', '')); return isNaN(n) ? null : { current: Math.min(n, pet.runnerBest), max: n } }
      return null
    }
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🏆 Prestationer <span style={{ fontSize: 14, color: '#888' }}>{unlockedAchievements.length}/{ALL_ACHIEVEMENTS.length}</span></div>
        <div className={styles.achGrid}>
          {ALL_ACHIEVEMENTS.map(ach => {
            const unlocked = unlockedAchievements.includes(ach.id)
            const rarityColor = { common: '#888', uncommon: '#4ade80', rare: '#60a5fa', epic: '#a855f7', legendary: '#fbbf24' }[ach.rarity]
            const prog = !unlocked ? getAchProgress(ach.id) : null
            const pct = prog ? Math.round((prog.current / prog.max) * 100) : 0
            return (
              <div key={ach.id} className={`${styles.achCard} ${!unlocked ? styles.achLocked : ''}`} style={{ borderColor: unlocked ? rarityColor : pct >= 50 ? `${rarityColor}55` : 'rgba(255,255,255,0.06)' }}>
                <div className={styles.achEmoji}>{unlocked ? ach.emoji : pct >= 75 ? '⏳' : '🔒'}</div>
                <div className={styles.achTitle} style={{ color: unlocked ? rarityColor : pct >= 50 ? `${rarityColor}` : '#555' }}>{ach.title}</div>
                <div className={styles.achDesc}>{ach.description}</div>
                {unlocked && <div className={styles.achReward}>+{ach.reward.xp}XP{ach.reward.kc ? ` +${ach.reward.kc}KC` : ''}</div>}
                {!unlocked && prog && (
                  <div style={{ marginTop: 4, width: '100%' }}>
                    <div style={{ background: 'rgba(0,0,0,.4)', borderRadius: 3, height: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? rarityColor : 'rgba(255,255,255,.2)', borderRadius: 3, transition: 'width .3s' }} />
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--t3)', marginTop: 2, textAlign: 'center' }}>{prog.current}/{prog.max}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Wardrobe panel ──────────────────────────────────────────────────────────
  if (panel === 'wardrobe') return (
    <div className={styles.panelRoot}>
      <BackBtn />
      <div className={styles.panelTitle}>👗 Garderob</div>
      <div style={{ textAlign: 'center', fontSize: 64, marginBottom: 8 }}>{pet.petEmoji}</div>
      <div style={{ textAlign: 'center', fontSize: 24, marginBottom: 16 }}>
        {pet.wardrobe.hat !== 'none' ? SHOP_HATS.find(h => h.id === pet.wardrobe.hat)?.emoji ?? '' : ''}
        {pet.wardrobe.acc !== 'none' ? SHOP_ACC.find(a => a.id === pet.wardrobe.acc)?.emoji ?? '' : ''}
        {pet.wardrobe.aura !== 'none' ? SHOP_AURA.find(a => a.id === pet.wardrobe.aura)?.emoji ?? '' : ''}
      </div>
      <WardSlot slot="hat" label="Hatt" items={SHOP_HATS} owned={pet.ownedItems} equipped={pet.wardrobe.hat} onEquip={(id) => { equipItem('hat', id); showToast('🎩 Hatt bytt!', 'success') }} />
      <WardSlot slot="acc" label="Accessoar" items={SHOP_ACC} owned={pet.ownedItems} equipped={pet.wardrobe.acc} onEquip={(id) => { equipItem('acc', id); showToast('✨ Accessoar bytt!', 'success') }} />
      <WardSlot slot="aura" label="Aura" items={SHOP_AURA} owned={pet.ownedItems} equipped={pet.wardrobe.aura} onEquip={(id) => { equipItem('aura', id); showToast('🌟 Aura bytt!', 'success') }} />
      <button
        className="btn-primary"
        style={{ width: '100%', marginTop: 10, fontSize: 13, padding: '10px' }}
        onClick={onBack}
      >
        🛍️ Gå till Shoppen
      </button>
    </div>
  )

  // ── Fortune panel ───────────────────────────────────────────────────────────
  if (panel === 'fortune') return (
    <div className={styles.panelRoot}>
      <BackBtn />
      <div className={styles.panelTitle}>🥠 Lyckobudskap</div>
      <div className={styles.fortuneBox}>
        {(todayFortune || fortune) ? (
          <>
            <div style={{ fontSize: 60 }}>🥠</div>
            <p className={styles.fortuneMsg}>"{todayFortune || fortune}"</p>
            <div style={{ fontSize: 13, color: '#888' }}>Kom tillbaka imorgon!</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 72, animation: 'float 2s ease-in-out infinite' }}>🥠</div>
            <button className="btn-gold" style={{ fontSize: 16, padding: '12px 32px' }} onClick={getFortune}>Öppna budskapet!</button>
          </>
        )}
      </div>
    </div>
  )

  // ── Records panel ───────────────────────────────────────────────────────────
  if (panel === 'records') return (
    <div className={styles.panelRoot}>
      <BackBtn />
      <div className={styles.panelTitle}>📊 Personliga Rekord</div>

      {/* Session stats */}
      <div style={{ background: 'rgba(0,255,136,.06)', border: '1px solid rgba(0,255,136,.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--green)', letterSpacing: 1, marginBottom: 6 }}>📱 DENNA SESSION</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>{formatNumber(pet.sessionTaps)}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>Pek</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>{formatNumber(pet.sessionXP)}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>XP</div>
          </div>
          {pet.prestigeLevel > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>{pet.prestigeLevel}</div>
              <div style={{ fontSize: 9, color: 'var(--t3)' }}>Prestige</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.recordGrid}>
        <RecordRow emoji="👆" label="Totala pek" value={formatNumber(pet.totalTaps)} />
        <RecordRow emoji="⚔️" label="Strider vunna" value={formatNumber(pet.battleWins)} />
        <RecordRow emoji="🎣" label="Fiskar fångade" value={formatNumber(pet.fishCaught)} />
        <RecordRow emoji="🏃" label="Runner rekord" value={`${pet.runnerBest}m`} />
        <RecordRow emoji="🔥" label="Streak just nu" value={`${pet.streak} dagar`} />
        <RecordRow emoji="💰" label="Totala mynt" value={formatNumber(pet.totalCoinsEarned)} />
        <RecordRow emoji="🌟" label="Nivå (total)" value={`${pet.level + pet.prestigeLevel * 30}`} />
        <RecordRow emoji="📋" label="Uppdrag klara" value={formatNumber(pet.questsCompleted)} />
        <RecordRow emoji="💚" label="Bond" value={['Okänd','Bekant','Kompis','Vän','Bästis','Soulmate'][pet.bondTier] ?? '?'} />
        <RecordRow emoji="⭐" label="Prestige" value={pet.prestigeLevel > 0 ? `×${pet.prestigeLevel}` : 'Ej prestiga'} />
        <RecordRow emoji="🎫" label="BP XP" value={formatNumber(pet.bpassXP)} />
        <RecordRow emoji="💎" label="KC samlat" value={formatNumber(pet.kc)} />
      </div>
    </div>
  )

  // ── Leaderboard panel ───────────────────────────────────────────────────────
  if (panel === 'leaderboard') {
    const FAKE_ENTRIES = [
      { name: 'DragonMaster99', emoji: '🐲', level: 87, taps: 524000, streak: 45 },
      { name: 'UnicornQueen',   emoji: '🦄', level: 74, taps: 398300, streak: 32 },
      { name: 'InfernoKing',    emoji: '🔥', level: 68, taps: 301200, streak: 28 },
      { name: 'MoonWalker',     emoji: '🌙', level: 61, taps: 238700, streak: 21 },
      { name: 'ZenMaster',      emoji: '🐼', level: 55, taps: 187500, streak: 18 },
      { name: 'VoidHunter',     emoji: '🐺', level: 48, taps: 142300, streak: 14 },
      { name: 'LunaDrake',      emoji: '🐉', level: 42, taps: 112100, streak: 11 },
      { name: 'StarPaws',       emoji: '🐱', level: 35, taps: 84500,  streak: 9  },
      { name: 'AquaFisher',     emoji: '🐸', level: 28, taps: 62300,  streak: 7  },
      { name: 'NeonRacer',      emoji: '🦊', level: 22, taps: 43100,  streak: 5  },
    ]
    const allEntries = [
      ...FAKE_ENTRIES,
      { name: pet.petName, emoji: pet.petEmoji, level: pet.level, taps: pet.totalTaps, streak: pet.streak, isMe: true },
    ].sort((a, b) => b.taps - a.taps)
    const userRank = allEntries.findIndex(e => 'isMe' in e && e.isMe) + 1
    const top3 = allEntries.slice(0, 3)
    const rest = allEntries.slice(3)
    const MEDAL_COLOR = ['#ffcc00', '#aaaaaa', '#cd7f32']
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🏅 Global Topplista</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>
          Din rank: <span style={{ color: 'var(--purple)', fontWeight: 900, fontSize: 14 }}>#{userRank}</span> av {allEntries.length}
        </div>

        {/* Podium top 3 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
          {[top3[1], top3[0], top3[2]].map((p, podiumIdx) => {
            const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3
            const height = podiumIdx === 1 ? 90 : podiumIdx === 0 ? 72 : 56
            const isMe = 'isMe' in p && p.isMe
            return (
              <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 90 }}>
                <div style={{ fontSize: 28, marginBottom: 2 }}>{p.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 900, color: isMe ? 'var(--purple)' : '#fff', marginBottom: 4, textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{
                  width: '100%', height,
                  background: `linear-gradient(180deg, ${MEDAL_COLOR[rank - 1]}22, ${MEDAL_COLOR[rank - 1]}11)`,
                  border: `1px solid ${MEDAL_COLOR[rank - 1]}55`,
                  borderRadius: '8px 8px 0 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  paddingTop: 8,
                }}>
                  <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, color: MEDAL_COLOR[rank - 1] }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ fontSize: 9, color: MEDAL_COLOR[rank - 1], fontWeight: 900 }}>{formatNumber(p.taps)}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ranks 4+ */}
        {rest.map((p, i) => {
          const rank = i + 4
          const isMe = 'isMe' in p && p.isMe
          return (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: isMe ? 'rgba(170,102,255,.12)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${isMe ? 'rgba(170,102,255,.4)' : 'rgba(255,255,255,.07)'}`,
              borderRadius: 14, padding: '10px 14px', marginBottom: 8,
              boxShadow: isMe ? '0 0 16px rgba(170,102,255,.2)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--ff-head)', fontSize: 14, color: 'var(--t3)', width: 24, textAlign: 'center' }}>#{rank}</span>
              <span style={{ fontSize: 24 }}>{p.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: isMe ? 'var(--purple)' : '#e8e8f0' }}>
                  {p.name}{isMe ? ' 👈 Du' : ''}
                </div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>LV{p.level} · {p.streak}🔥</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>👆{formatNumber(p.taps)}</div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Battle Pass panel ────────────────────────────────────────────────────────
  if (panel === 'battlepass') {
    const BP_SEASON_MAX = 15000
    const BP_TIERS = [
      { xp: 200,   free: '75🪙',         freeCoins: 75,  freeKC: 0,  emoji: '🪙', special: '' },
      { xp: 500,   free: '150🪙',        freeCoins: 150, freeKC: 0,  emoji: '💰', special: '' },
      { xp: 900,   free: '1💎 KC',       freeCoins: 0,   freeKC: 1,  emoji: '💎', special: '' },
      { xp: 1400,  free: '250🪙',        freeCoins: 250, freeKC: 0,  emoji: '🪙', special: '' },
      { xp: 2000,  free: '3💎 KC',       freeCoins: 0,   freeKC: 3,  emoji: '💎', special: '🌟 Milstolpe' },
      { xp: 2700,  free: '400🪙',        freeCoins: 400, freeKC: 0,  emoji: '💰', special: '' },
      { xp: 3500,  free: '2💎 KC',       freeCoins: 0,   freeKC: 2,  emoji: '💎', special: '' },
      { xp: 4400,  free: '600🪙',        freeCoins: 600, freeKC: 0,  emoji: '🪙', special: '' },
      { xp: 5400,  free: '5💎 KC',       freeCoins: 0,   freeKC: 5,  emoji: '💎', special: '' },
      { xp: 6500,  free: '800🪙',        freeCoins: 800, freeKC: 0,  emoji: '🏅', special: '🏅 Halvvägs' },
      { xp: 7700,  free: '3💎 KC',       freeCoins: 0,   freeKC: 3,  emoji: '💎', special: '' },
      { xp: 9000,  free: '1 000🪙',      freeCoins: 1000,freeKC: 0,  emoji: '💰', special: '' },
      { xp: 10400, free: '5💎 KC',       freeCoins: 0,   freeKC: 5,  emoji: '💎', special: '' },
      { xp: 11900, free: '1 500🪙',      freeCoins: 1500,freeKC: 0,  emoji: '🪙', special: '' },
      { xp: 13500, free: '8💎 KC',       freeCoins: 0,   freeKC: 8,  emoji: '💎', special: '' },
      { xp: 15000, free: '2 000🪙+15💎', freeCoins: 2000,freeKC: 15, emoji: '🏆', special: '🏆 MAX TIER' },
    ]
    const claimedKey = 'k0509_bp_claimed'
    const [claimedLocal, setClaimedLocal] = useState<number[]>(() => JSON.parse(localStorage.getItem(claimedKey) ?? '[]'))
    const pct = Math.min(100, (pet.bpassXP / BP_SEASON_MAX) * 100)
    const currentTier = BP_TIERS.filter(t => pet.bpassXP >= t.xp).length

    const claimTier = (idx: number, coins: number, kc: number) => {
      const next = [...claimedLocal, idx]
      localStorage.setItem(claimedKey, JSON.stringify(next))
      setClaimedLocal(next)
      if (coins > 0) gainCoins(coins)
      if (kc > 0) gainKC(kc)
      showToast(`🎫 BP Tier ${idx + 1} hämtad!${coins > 0 ? ` +${coins}🪙` : ''}${kc > 0 ? ` +${kc}💎` : ''}`, 'success')
      triggerConfetti(); audio.achievement()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🎫 Battle Pass — Säsong 1</div>
        <div style={{ background: 'rgba(168,85,247,.06)', border: '1px solid rgba(168,85,247,.2)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>Tier {currentTier}/{BP_TIERS.length}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{formatNumber(pet.bpassXP)} / {formatNumber(BP_SEASON_MAX)} BP XP</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--purple)' }}>{Math.round(pct)}%</div>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#a855f7,#ec4899)', borderRadius: 5, transition: 'width .6s' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6 }}>BP XP = 10% av all tjänad XP</div>
        </div>
        {BP_TIERS.map((t, i) => {
          const reached = pet.bpassXP >= t.xp
          const isClaimed = claimedLocal.includes(i)
          const canClaim = reached && !isClaimed
          const isMax = i === BP_TIERS.length - 1
          return (
            <div key={i} style={{
              display: 'flex', gap: 10, padding: '10px 12px',
              background: isMax && reached ? 'rgba(255,204,0,.08)' : reached ? 'rgba(168,85,247,0.07)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isMax && reached ? 'rgba(255,204,0,.35)' : reached ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 12, marginBottom: 7, alignItems: 'center',
            }}>
              <div style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>
                {isClaimed ? '✅' : reached ? t.emoji : '🔒'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#666' }}>Tier {i + 1} · {formatNumber(t.xp)} XP{t.special ? ` · ${t.special}` : ''}</div>
                <div style={{ fontSize: 13, color: '#e8e8f0', fontWeight: isClaimed ? 400 : 700, opacity: isClaimed ? 0.5 : 1 }}>{t.free}</div>
              </div>
              {canClaim && (
                <button className="btn-primary" style={{ fontSize: 11, padding: '6px 10px', flexShrink: 0 }} onClick={() => claimTier(i, t.freeCoins, t.freeKC)}>Hämta!</button>
              )}
              {isClaimed && <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>✓ Klar</span>}
              {!reached && <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>{formatNumber(t.xp - pet.bpassXP)} kvar</span>}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Quests panel ─────────────────────────────────────────────────────────────
  if (panel === 'quests') {
    const allDone = dailyMissions.every(m => m.done)
    const completedCount = dailyMissions.filter(m => m.done).length
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>📋 Dagliga Quests</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 8, height: 8, flex: 1, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${dailyMissions.length > 0 ? (completedCount / dailyMissions.length) * 100 : 0}%`,
              background: 'linear-gradient(90deg, var(--green), var(--blue))',
              borderRadius: 8,
              transition: 'width .4s',
            }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)' }}>{completedCount}/{dailyMissions.length}</span>
        </div>
        {dailyMissions.map(m => {
          const pct = Math.min(100, (m.progress / m.target) * 100)
          const ready = m.progress >= m.target && !m.done
          return (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: m.done ? 'rgba(0,255,136,.06)' : ready ? 'rgba(255,204,0,.06)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${m.done ? 'rgba(0,255,136,.25)' : ready ? 'rgba(255,204,0,.3)' : 'rgba(255,255,255,.07)'}`,
                borderRadius: 14, padding: '12px 14px', marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 20 }}>{m.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: m.done ? 'var(--green)' : '#e8e8f0', marginBottom: 4 }}>{m.label}</div>
                <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: m.done ? 'var(--green)' : 'var(--blue)', borderRadius: 4, transition: 'width .3s' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>
                  {m.progress}/{m.target} · Belöning: 🪙{m.reward.coins} +{m.reward.xp}XP
                </div>
              </div>
              {m.done ? (
                <span style={{ fontSize: 18 }}>✅</span>
              ) : ready ? (
                <button
                  className="btn-gold"
                  style={{ fontSize: 11, padding: '6px 10px' }}
                  onClick={() => { claimMission(m.id); showToast(`✅ +${m.reward.coins}🪙 +${m.reward.xp}XP!`, 'success'); audio.achievement() }}
                >
                  Hämta!
                </button>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>{Math.round(pct)}%</span>
              )}
            </div>
          )
        })}
        {allDone && (
          <div style={{
            textAlign: 'center', padding: '16px 12px',
            background: 'rgba(255,204,0,.08)', border: '1px solid rgba(255,204,0,.25)', borderRadius: 14,
          }}>
            <div style={{ fontSize: 28 }}>🌟</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 900, color: 'var(--gold)', marginTop: 6 }}>
              Alla quests klara!
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Nya quests imorgon</div>
          </div>
        )}
      </div>
    )
  }

  // ── Craft panel ─────────────────────────────────────────────────────────────
  if (panel === 'craft') {
    const RECIPES = [
      { id: 'craft_feast', name: 'Stor Fest', emoji: '🍱', cost: 30, rarity: 'rare' as const, desc: 'Mättar husdjuret helt', effect: { hunger: 80 } },
      { id: 'craft_elixir', name: 'Energi-Elixtir', emoji: '⚡', cost: 25, rarity: 'rare' as const, desc: 'Återställer all energi', effect: { energy: 80 } },
      { id: 'craft_joy', name: 'Glädjebomb', emoji: '🎊', cost: 20, rarity: 'common' as const, desc: 'Höjer humöret maximalt', effect: { mood: 80 } },
      { id: 'craft_xp_potion', name: 'XP-Dryck', emoji: '🧪', cost: 50, rarity: 'epic' as const, desc: '+200 XP direkt', effect: { exp: 200 } },
      { id: 'craft_rainbow', name: 'Regnbåge-Kit', emoji: '🌈', cost: 80, rarity: 'legendary' as const, desc: 'Boostar allt +40', effect: { mood: 40, hunger: 40, energy: 40 } },
      { id: 'craft_star', name: 'Lycko-Stjärna', emoji: '⭐', cost: 60, rarity: 'epic' as const, desc: '+100 XP +30 mynt', effect: { exp: 100 } },
      { id: 'craft_turbo', name: 'Turbo-Elixir', emoji: '🚀', cost: 90, rarity: 'epic' as const, desc: 'Alla stats +60', effect: { mood: 60, hunger: 60, energy: 60 } },
      { id: 'craft_god_feast', name: 'Gudomlig Fest', emoji: '🏆', cost: 150, rarity: 'legendary' as const, desc: '+500 XP, allt till 100', effect: { mood: 100, hunger: 100, energy: 100, exp: 500 } },
      { id: 'craft_bond_gem', name: 'Bond-Kristall', emoji: '💎', cost: 120, rarity: 'legendary' as const, desc: '+200 Bond-poäng', effect: {} },
    ]
    const RARITY_CLR: Record<string, string> = { common: '#aaa', rare: '#4488ff', epic: '#aa66ff', legendary: '#ffcc00' }
    const RARITY_LBL: Record<string, string> = { common: 'Vanlig', rare: 'Sällsynt', epic: 'Episk', legendary: 'LEGENDARY' }
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>⚗️ Craftshop</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 14, textAlign: 'center' }}>
          💰 {pet.coins} mynt tillgängliga
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {RECIPES.map(r => {
            const canAfford = pet.coins >= r.cost
            return (
              <div
                key={r.id}
                style={{
                  position: 'relative',
                  background: canAfford ? `rgba(${r.rarity === 'legendary' ? '255,204,0' : r.rarity === 'epic' ? '170,102,255' : r.rarity === 'rare' ? '68,136,255' : '255,255,255'},.06)` : 'rgba(255,255,255,.02)',
                  border: `1px solid ${canAfford ? RARITY_CLR[r.rarity] + '55' : 'rgba(255,255,255,.06)'}`,
                  borderRadius: 14, padding: 12,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  opacity: canAfford ? 1 : 0.5,
                  transition: 'all .15s',
                }}
                onClick={() => {
                  if (!canAfford) { showToast('Inte tillräckligt med mynt!', 'error'); return }
                  spendCoins(r.cost)
                  if (r.id !== 'craft_bond_gem') {
                    addInventoryItem({ id: r.id, name: r.name, emoji: r.emoji, description: r.desc, effect: r.effect, quantity: 1, rarity: r.rarity })
                  }
                  showToast(`${r.emoji} ${r.name} craftat!`, 'success')
                  audio.achievement()
                  if (r.effect.exp) gainXP(r.effect.exp, 'craft')
                  if (r.effect.mood) setStat('mood', Math.min(100, pet.mood + r.effect.mood))
                  if (r.effect.hunger) setStat('hunger', Math.min(100, pet.hunger + r.effect.hunger))
                  if (r.effect.energy) setStat('energy', Math.min(100, pet.energy + r.effect.energy))
                  if (r.id === 'craft_bond_gem') useGameStore.setState(s => ({ pet: { ...s.pet, bondPoints: s.pet.bondPoints + 200 } }))
                }}
              >
                <div style={{
                  position: 'absolute', top: 5, right: 5, fontSize: 7, fontWeight: 900,
                  color: RARITY_CLR[r.rarity], background: RARITY_CLR[r.rarity] + '22',
                  border: `1px solid ${RARITY_CLR[r.rarity]}44`, borderRadius: 4, padding: '1px 4px',
                }}>{RARITY_LBL[r.rarity]}</div>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{r.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: RARITY_CLR[r.rarity], marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: 9, color: 'var(--t3)', marginBottom: 6, lineHeight: 1.3 }}>{r.desc}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: canAfford ? 'var(--gold)' : '#666' }}>💰 {r.cost}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Chests panel ─────────────────────────────────────────────────────────────
  if (panel === 'chests') {
    const todayStr = new Date().toDateString()
    const freeKey = 'k0509_chest_free'
    const silverKey = 'k0509_chest_silver'
    const goldKey = 'k0509_chest_gold'
    const freeClaimed = localStorage.getItem(freeKey) === todayStr
    const CHEST_TYPES = [
      {
        key: freeKey, id: 'free', name: 'Gratis Kista', emoji: '📦', color: '#888',
        costType: 'free' as const, cost: 0, daily: true,
        rewards: () => {
          const coins = 10 + Math.floor(Math.random() * 40)
          const xp = 20 + Math.floor(Math.random() * 30)
          return { coins, xp, kc: 0, extra: '' }
        },
      },
      {
        key: silverKey, id: 'silver', name: 'Silver Kista', emoji: '🥈', color: '#9ca3af',
        costType: 'coins' as const, cost: 50, daily: false,
        rewards: () => {
          const coins = 60 + Math.floor(Math.random() * 80)
          const xp = 50 + Math.floor(Math.random() * 60)
          const kc = Math.random() < 0.3 ? 1 : 0
          return { coins, xp, kc, extra: kc > 0 ? '+1💎' : '' }
        },
      },
      {
        key: goldKey, id: 'gold', name: 'Guld Kista', emoji: '🏆', color: '#fbbf24',
        costType: 'coins' as const, cost: 150, daily: false,
        rewards: () => {
          const coins = 150 + Math.floor(Math.random() * 150)
          const xp = 100 + Math.floor(Math.random() * 100)
          const kc = Math.floor(Math.random() * 3) + 1
          return { coins, xp, kc, extra: `+${kc}💎` }
        },
      },
    ]
    const [opened, setOpened] = useState<Record<string, { coins: number; xp: number; kc: number; extra: string } | null>>({})
    const open = (chest: (typeof CHEST_TYPES)[0]) => {
      if (chest.daily && localStorage.getItem(chest.key) === todayStr) return
      if (chest.costType === 'coins' && !spendCoins(chest.cost)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      if (chest.daily) localStorage.setItem(chest.key, todayStr)
      const r = chest.rewards()
      gainCoins(r.coins)
      gainXP(r.xp, 'chest')
      if (r.kc > 0) gainKC(r.kc)
      setOpened(prev => ({ ...prev, [chest.id]: r }))
      showToast(`${chest.emoji} ${chest.name}! +${r.coins}🪙 +${r.xp}XP${r.extra}`, 'success')
      triggerConfetti(); audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🎁 Kistor</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CHEST_TYPES.map(chest => {
            const result = opened[chest.id]
            const dailyUsed = chest.daily && freeClaimed && !result
            return (
              <div
                key={chest.id}
                style={{
                  background: `rgba(${chest.color === '#fbbf24' ? '251,191,36' : chest.color === '#9ca3af' ? '156,163,175' : '136,136,136'},.08)`,
                  border: `1px solid ${chest.color}44`,
                  borderRadius: 16, padding: '16px 14px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <span style={{ fontSize: 40 }}>{chest.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 900, color: '#fff' }}>{chest.name}</div>
                  {result ? (
                    <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, marginTop: 4 }}>
                      +{result.coins}🪙 +{result.xp}XP{result.extra}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>
                      {chest.daily ? '1x per dag gratis' : `Kostar ${chest.cost}🪙`}
                    </div>
                  )}
                </div>
                {result ? (
                  <div style={{ fontSize: 20 }}>✅</div>
                ) : dailyUsed ? (
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>Imorgon</div>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ fontSize: 13, padding: '8px 14px', flexShrink: 0 }}
                    onClick={() => open(chest)}
                  >
                    {chest.daily ? 'Öppna!' : `${chest.cost}🪙`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 12, fontSize: 11, color: 'var(--t3)' }}>
          💡 Gratis kistan återställs varje dag vid midnatt
        </div>
      </div>
    )
  }

  // ── Bounty Board panel ────────────────────────────────────────────────────────
  if (panel === 'bounty') {
    const BOUNTIES = [
      { id: 'b_fish5', emoji: '🎣', title: 'Fångare', desc: 'Fånga 5 fiskar', type: 'fish', target: 5, coins: 75, xp: 60, kc: 1 },
      { id: 'b_fish20', emoji: '🎣', title: 'Mästerfiskare', desc: 'Fånga 20 fiskar', type: 'fish', target: 20, coins: 250, xp: 200, kc: 3 },
      { id: 'b_battle5', emoji: '⚔️', title: 'Krigare', desc: 'Vinn 5 strider', type: 'battle', target: 5, coins: 100, xp: 80, kc: 2 },
      { id: 'b_battle20', emoji: '⚔️', title: 'Hjälte', desc: 'Vinn 20 strider', type: 'battle', target: 20, coins: 300, xp: 240, kc: 5 },
      { id: 'b_tap100', emoji: '👆', title: 'Tapmaster', desc: '100 pekar totalt', type: 'taps', target: 100, coins: 50, xp: 40, kc: 0 },
      { id: 'b_tap500', emoji: '👆', title: 'Peklegend', desc: '500 pekar totalt', type: 'taps', target: 500, coins: 200, xp: 150, kc: 2 },
    ]
    const claimed: string[] = JSON.parse(localStorage.getItem('k0509_bounties_claimed') ?? '[]')
    const [claimedLocal, setClaimedLocal] = useState<string[]>(claimed)
    const getProgress = (type: string) => {
      if (type === 'fish') return pet.fishCaught
      if (type === 'battle') return pet.battleWins
      if (type === 'taps') return pet.totalTaps
      return 0
    }
    const claimBounty = (b: (typeof BOUNTIES)[0]) => {
      const next = [...claimedLocal, b.id]
      localStorage.setItem('k0509_bounties_claimed', JSON.stringify(next))
      setClaimedLocal(next)
      gainCoins(b.coins)
      gainXP(b.xp, 'bounty')
      if (b.kc > 0) gainKC(b.kc)
      showToast(`📌 ${b.title} klar! +${b.coins}🪙 +${b.xp}XP${b.kc > 0 ? ` +${b.kc}💎` : ''}`, 'success')
      triggerConfetti(); audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>📌 Uppdragstavla</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BOUNTIES.map(b => {
            const prog = getProgress(b.type)
            const pct = Math.min(100, (prog / b.target) * 100)
            const done = prog >= b.target
            const isClaimed = claimedLocal.includes(b.id)
            return (
              <div
                key={b.id}
                style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  background: isClaimed ? 'rgba(0,255,136,.05)' : done ? 'rgba(255,204,0,.06)' : 'rgba(255,255,255,.03)',
                  border: `1px solid ${isClaimed ? 'rgba(0,255,136,.25)' : done ? 'rgba(255,204,0,.3)' : 'rgba(255,255,255,.07)'}`,
                  borderRadius: 14, padding: '12px 14px',
                }}
              >
                <span style={{ fontSize: 24 }}>{b.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--ff-head)', fontSize: 13, fontWeight: 900, color: '#fff' }}>{b.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 4 }}>{b.desc}</div>
                  <div style={{ height: 4, background: 'rgba(0,0,0,.3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: isClaimed ? '#4ade80' : done ? '#fbbf24' : '#4488ff', borderRadius: 2, transition: 'width .4s' }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>
                    {Math.min(prog, b.target)}/{b.target} · +{b.coins}🪙 +{b.xp}XP{b.kc > 0 ? ` +${b.kc}💎` : ''}
                  </div>
                </div>
                {isClaimed ? (
                  <span style={{ fontSize: 18 }}>✅</span>
                ) : done ? (
                  <button
                    className="btn-gold"
                    style={{ fontSize: 11, padding: '6px 10px', flexShrink: 0 }}
                    onClick={() => claimBounty(b)}
                  >
                    Hämta!
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>{Math.round(pct)}%</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Fish Encyclopedia panel ───────────────────────────────────────────────────
  if (panel === 'fishpedia') {
    const rarityColor: Record<string, string> = {
      common: '#888', uncommon: '#4ade80', rare: '#60a5fa', epic: '#a855f7', legendary: '#fbbf24',
    }
    const rarityLabel: Record<string, string> = {
      common: 'Vanlig', uncommon: 'Ovanlig', rare: 'Sällsynt', epic: 'Episk', legendary: 'LEGENDÄR',
    }
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🐟 Fiskpedia</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 14, textAlign: 'center' }}>
          {pet.fishCaught} fiskar fångade totalt · {FISH_TYPES.length} sorter
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FISH_TYPES.map(f => (
            <div
              key={f.id}
              style={{
                background: `rgba(${f.rarity === 'legendary' ? '251,191,36' : f.rarity === 'epic' ? '168,85,247' : f.rarity === 'rare' ? '96,165,250' : f.rarity === 'uncommon' ? '74,222,128' : '136,136,136'},.07)`,
                border: `1px solid ${rarityColor[f.rarity]}44`,
                borderRadius: 14, padding: '12px 10px', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 4 }}>{f.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: rarityColor[f.rarity] }}>{f.name}</div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>{rarityLabel[f.rarity]}</div>
              <div style={{ fontSize: 9, color: '#fbbf24', marginTop: 3 }}>{f.coins}🪙 / {f.xp}XP</div>
              <div style={{ fontSize: 8, color: 'var(--t3)', marginTop: 2 }}>
                {f.weight[0]}-{f.weight[1]} kg · {Math.round(f.chance * 100)}% chans
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Daily Check-in Calendar ───────────────────────────────────────────────────
  if (panel === 'checkin') {
    const todayKey = new Date().toISOString().slice(0, 10)
    const claimedKey = 'k0509_checkin_claimed'
    const claimed: string[] = JSON.parse(localStorage.getItem(claimedKey) ?? '[]')
    const todayClaimed = claimed.includes(todayKey)
    const [claimedToday, setClaimedToday] = useState(todayClaimed)

    const currentStreak = pet.streak
    const DAILY_REWARDS = [
      { day: 1,  coins: 20,  xp: 15,  kc: 0, emoji: '🪙' },
      { day: 2,  coins: 30,  xp: 20,  kc: 0, emoji: '🪙' },
      { day: 3,  coins: 40,  xp: 30,  kc: 0, emoji: '🪙' },
      { day: 4,  coins: 50,  xp: 40,  kc: 0, emoji: '💰' },
      { day: 5,  coins: 75,  xp: 50,  kc: 1, emoji: '💰' },
      { day: 6,  coins: 80,  xp: 60,  kc: 0, emoji: '💰' },
      { day: 7,  coins: 150, xp: 100, kc: 3, emoji: '🏆' },
      { day: 14, coins: 250, xp: 200, kc: 5, emoji: '👑' },
      { day: 21, coins: 400, xp: 300, kc: 8, emoji: '💎' },
      { day: 30, coins: 700, xp: 500, kc: 15, emoji: '🌟' },
    ]
    const getDayReward = (day: number) => {
      for (let i = DAILY_REWARDS.length - 1; i >= 0; i--) {
        if (day % DAILY_REWARDS[i].day === 0 || day === DAILY_REWARDS[i].day) {
          if (day === DAILY_REWARDS[i].day) return DAILY_REWARDS[i]
        }
      }
      const base = Math.min(Math.floor(day / 7), 5)
      return { day, coins: 20 + base * 10, xp: 15 + base * 10, kc: 0, emoji: '🪙' }
    }
    const claim = () => {
      if (claimedToday) return
      const day = Math.max(1, currentStreak)
      const reward = getDayReward(day)
      const next = [...claimed, todayKey]
      localStorage.setItem(claimedKey, JSON.stringify(next.slice(-60)))
      setClaimedToday(true)
      gainCoins(reward.coins)
      gainXP(reward.xp, 'checkin')
      if (reward.kc > 0) gainKC(reward.kc)
      showToast(`📅 Check-in dag ${day}! +${reward.coins}🪙 +${reward.xp}XP${reward.kc > 0 ? ` +${reward.kc}💎` : ''}`, 'success')
      triggerConfetti(); audio.achievement()
    }
    const todayReward = getDayReward(Math.max(1, currentStreak))
    const DAYS = Array.from({ length: 30 }, (_, i) => i + 1)
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>📅 Daglig Check-in</div>
        <div style={{ background: 'rgba(0,255,136,.08)', border: '1px solid rgba(0,255,136,.25)', borderRadius: 16, padding: '14px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 900, color: '#fff' }}>Dag {Math.max(1, currentStreak)}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>🔥 {currentStreak} dagars streak</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>
              {todayReward.emoji} +{todayReward.coins}🪙<br />
              <span style={{ fontSize: 10, color: '#a855f7' }}>+{todayReward.xp}XP{todayReward.kc > 0 ? ` +${todayReward.kc}💎` : ''}</span>
            </div>
          </div>
          {!claimedToday ? (
            <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14 }} onClick={claim}>
              ✓ Hämta dagens belöning!
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px', color: '#4ade80', fontWeight: 700 }}>✅ Redan hämtad idag — kom tillbaka imorgon!</div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {DAYS.map(d => {
            const r = getDayReward(d)
            const isToday = d === Math.max(1, currentStreak)
            const isPast = d < Math.max(1, currentStreak)
            const isMilestone = [7, 14, 21, 30].includes(d)
            return (
              <div
                key={d}
                style={{
                  aspectRatio: '1', borderRadius: 8, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 1,
                  background: isPast ? 'rgba(0,255,136,.15)' : isToday ? 'rgba(255,204,0,.2)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${isMilestone ? '#fbbf2466' : isPast ? 'rgba(0,255,136,.3)' : isToday ? 'rgba(255,204,0,.5)' : 'rgba(255,255,255,.08)'}`,
                }}
              >
                <div style={{ fontSize: 10 }}>{r.emoji}</div>
                <div style={{ fontSize: 8, fontWeight: 900, color: isPast ? '#4ade80' : isToday ? '#fbbf24' : '#555' }}>{d}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, fontSize: 9, color: 'var(--t3)', justifyContent: 'center' }}>
          <span>🟢 Klar</span><span>🟡 Idag</span><span>⬛ Kommande</span>
        </div>
      </div>
    )
  }

  // ── Skill Tree panel ──────────────────────────────────────────────────────────
  if (panel === 'skilltree') {
    const SKILLS = [
      { id: 'sk_xp1',    name: 'XP Boost I',       emoji: '⭐', cost: 3,  effect: '+5% XP permanent',  unlocks: [] },
      { id: 'sk_xp2',    name: 'XP Boost II',      emoji: '🌟', cost: 6,  effect: '+10% XP permanent', unlocks: ['sk_xp1'] },
      { id: 'sk_coin1',  name: 'Guldhand I',        emoji: '💰', cost: 3,  effect: '+5% mynt permanent', unlocks: [] },
      { id: 'sk_coin2',  name: 'Guldhand II',       emoji: '💎', cost: 6,  effect: '+10% mynt permanent',unlocks: ['sk_coin1'] },
      { id: 'sk_bond1',  name: 'Vänskap I',         emoji: '💕', cost: 2,  effect: '+20% bond-poäng',    unlocks: [] },
      { id: 'sk_fish1',  name: 'Fiskare',           emoji: '🎣', cost: 4,  effect: 'Fiske XP ×1.25',     unlocks: [] },
      { id: 'sk_battle1',name: 'Krigare',           emoji: '⚔️', cost: 4,  effect: 'Strid coins ×1.25',  unlocks: [] },
      { id: 'sk_lucky1', name: 'Lyckans Barn',      emoji: '🍀', cost: 5,  effect: '+15% chans chest', unlocks: [] },
      { id: 'sk_energy1',name: 'Uthållighet',       emoji: '⚡', cost: 3,  effect: 'Energiförlust -20%', unlocks: [] },
      { id: 'sk_streak1',name: 'Streakskydd',       emoji: '🔥', cost: 5,  effect: '+1 extra streak-sköld',unlocks: [] },
      { id: 'sk_tap1',   name: 'Snabbtapp I',       emoji: '👆', cost: 2,  effect: '+2 XP per tap',      unlocks: [] },
      { id: 'sk_tap2',   name: 'Snabbtapp II',      emoji: '🖐️', cost: 5,  effect: '+5 XP per tap',      unlocks: ['sk_tap1'] },
    ]
    const unlockedSkills: string[] = JSON.parse(localStorage.getItem('k0509_skills') ?? '[]')
    const [unlocked, setUnlocked] = useState<string[]>(unlockedSkills)

    const buySkill = (skill: (typeof SKILLS)[0]) => {
      if (unlocked.includes(skill.id)) return
      const missingReq = skill.unlocks.find(r => !unlocked.includes(r))
      if (missingReq) { showToast('Lås upp förutsättningarna först!', 'error'); return }
      if (!spendKC(skill.cost)) { showToast('Inte tillräckligt med KC!', 'error'); return }
      const next = [...unlocked, skill.id]
      localStorage.setItem('k0509_skills', JSON.stringify(next))
      setUnlocked(next)
      showToast(`🌳 ${skill.name} upplåst! ${skill.effect}`, 'success')
      audio.achievement()
      triggerConfetti()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🌳 Kompetensträd</div>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#aa66ff', fontWeight: 700, marginBottom: 14 }}>
          💎 {pet.kc} KC tillgängligt
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SKILLS.map(skill => {
            const isUnlocked = unlocked.includes(skill.id)
            const reqsMet = skill.unlocks.every(r => unlocked.includes(r))
            const canAfford = pet.kc >= skill.cost
            const canBuy = !isUnlocked && reqsMet && canAfford
            return (
              <div
                key={skill.id}
                onClick={() => canBuy && buySkill(skill)}
                style={{
                  background: isUnlocked ? 'rgba(0,255,136,.08)' : reqsMet ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)',
                  border: `1px solid ${isUnlocked ? 'rgba(0,255,136,.35)' : reqsMet ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.05)'}`,
                  borderRadius: 14, padding: '12px 10px', cursor: canBuy ? 'pointer' : 'default',
                  opacity: !reqsMet ? 0.45 : 1,
                  transition: 'all .15s',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>{skill.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isUnlocked ? '#4ade80' : '#e8e8f0' }}>{skill.name}</div>
                <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2, lineHeight: 1.3 }}>{skill.effect}</div>
                <div style={{ marginTop: 6 }}>
                  {isUnlocked ? (
                    <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 900 }}>✓ Upplåst</span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 900, color: canAfford && reqsMet ? '#aa66ff' : '#555' }}>
                      💎 {skill.cost} KC
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 14, fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>
          Färdigheter aktiveras automatiskt — inga slottar behövs
        </div>
      </div>
    )
  }

  // ── Tarot panel ──────────────────────────────────────────────────────────────
  if (panel === 'tarot') {
    const todayStr = new Date().toDateString()
    const tarotKey = 'k0509_tarot'
    const tarotDone = localStorage.getItem(tarotKey) === todayStr
    const [flipped, setFlipped] = useState(false)
    const [claimed, setClaimedTarot] = useState(tarotDone)
    const TAROT_CARDS = [
      { name: 'Narren', emoji: '🃏', meaning: 'Nya börjar och äventyr', buff: '+15% XP idag', coins: 25, xp: 40 },
      { name: 'Trollkarlen', emoji: '🔮', meaning: 'Kraft och vilja manifesteras', buff: '+20% mynt idag', coins: 40, xp: 30 },
      { name: 'Stjärnan', emoji: '⭐', meaning: 'Hopp och inspiration lyser', buff: '+2 KC bonus', coins: 20, xp: 50, kc: 2 },
      { name: 'Månen', emoji: '🌙', meaning: 'Mysterier och intuition', buff: '+30 XP gratis', coins: 15, xp: 80 },
      { name: 'Solen', emoji: '☀️', meaning: 'Glädje, framgång och klarhet', buff: '+50 mynt & +25 XP', coins: 50, xp: 25 },
      { name: 'Världen', emoji: '🌍', meaning: 'Fullbordelse och harmoni', buff: '+35 XP & +2 KC', coins: 20, xp: 35, kc: 2 },
      { name: 'Rättvisan', emoji: '⚖️', meaning: 'Balans och sanning segrar', buff: '+25 mynt gratis', coins: 25, xp: 25 },
      { name: 'Styrkan', emoji: '💪', meaning: 'Mod och inre kraft flödar', buff: '+20 XP & bond', coins: 20, xp: 40 },
    ]
    const dayIdx = Math.floor(Date.now() / 86400000) % TAROT_CARDS.length
    const card = TAROT_CARDS[dayIdx]
    const claimTarot = () => {
      if (claimed) return
      localStorage.setItem(tarotKey, todayStr)
      setClaimedTarot(true)
      gainCoins(card.coins)
      gainXP(card.xp, 'tarot')
      if ((card as { kc?: number }).kc) gainKC((card as { kc?: number }).kc ?? 0)
      showToast(`🔮 ${card.name}! +${card.coins}🪙 +${card.xp}XP${(card as { kc?: number }).kc ? ` +${(card as { kc?: number }).kc}💎` : ''}`, 'success')
      triggerConfetti(); audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🔮 Dagligt Tarotkort</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>
          Ett nytt kort varje dag — klicka för att avslöja
        </div>
        <div
          onClick={() => !flipped && setFlipped(true)}
          style={{
            margin: '0 auto 20px',
            width: 160, background: flipped ? 'rgba(170,102,255,.12)' : 'rgba(255,255,255,.05)',
            border: `2px solid ${flipped ? '#a855f7' : 'rgba(255,255,255,.15)'}`,
            borderRadius: 20, padding: '28px 20px', textAlign: 'center',
            cursor: flipped ? 'default' : 'pointer',
            transition: 'all .3s',
          }}
        >
          {flipped ? (
            <>
              <div style={{ fontSize: 52 }}>{card.emoji}</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 14, fontWeight: 900, color: '#a855f7', marginTop: 8 }}>{card.name}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4, lineHeight: 1.4 }}>{card.meaning}</div>
              <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, marginTop: 8, background: 'rgba(251,191,36,.1)', borderRadius: 8, padding: '4px 8px' }}>{card.buff}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48 }}>🎴</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>Klicka för att avslöja</div>
            </>
          )}
        </div>
        {flipped && !claimed && (
          <button className="btn-primary" style={{ width: '100%', padding: 14, fontSize: 14 }} onClick={claimTarot}>
            ✨ Hämta kortets välsignelse!
          </button>
        )}
        {claimed && (
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,255,136,.08)', borderRadius: 12, border: '1px solid rgba(0,255,136,.25)', fontSize: 13, color: '#4ade80', fontWeight: 700 }}>
            ✅ Välsignelse hämtad! Kom tillbaka imorgon.
          </div>
        )}
      </div>
    )
  }

  // ── Trophy Room panel ─────────────────────────────────────────────────────────
  if (panel === 'trophyroom') {
    const TROPHY_CATEGORIES = [
      {
        id: 'pet', label: '🐾 HUSDJUR', trophies: [
          { id: 'lv5', name: 'Lärling', emoji: '🥉', desc: 'Nå nivå 5', unlocked: pet.level >= 5, rarity: 'common' },
          { id: 'lv10', name: 'Veteran', emoji: '🥈', desc: 'Nå nivå 10', unlocked: pet.level >= 10, rarity: 'rare' },
          { id: 'lv25', name: 'Master', emoji: '🥇', desc: 'Nå nivå 25', unlocked: pet.level >= 25, rarity: 'epic' },
          { id: 'lv50', name: 'Legend', emoji: '👑', desc: 'Nå nivå 50', unlocked: pet.level >= 50, rarity: 'legendary' },
        ],
      },
      {
        id: 'combat', label: '⚔️ STRID', trophies: [
          { id: 'w1', name: 'Debytant', emoji: '🗡️', desc: '1 strid vunnen', unlocked: pet.battleWins >= 1, rarity: 'common' },
          { id: 'w10', name: 'Krigare', emoji: '⚔️', desc: '10 strider vunna', unlocked: pet.battleWins >= 10, rarity: 'rare' },
          { id: 'w50', name: 'Hjälte', emoji: '🛡️', desc: '50 strider vunna', unlocked: pet.battleWins >= 50, rarity: 'epic' },
          { id: 'w100', name: 'Legendhjälte', emoji: '🏆', desc: '100 strider vunna', unlocked: pet.battleWins >= 100, rarity: 'legendary' },
        ],
      },
      {
        id: 'fishing', label: '🎣 FISKE', trophies: [
          { id: 'f5', name: 'Hobbyfiskare', emoji: '🐟', desc: '5 fiskar fångade', unlocked: pet.fishCaught >= 5, rarity: 'common' },
          { id: 'f25', name: 'Fiskare', emoji: '🎣', desc: '25 fiskar', unlocked: pet.fishCaught >= 25, rarity: 'rare' },
          { id: 'f100', name: 'Mästerfiskare', emoji: '🐳', desc: '100 fiskar', unlocked: pet.fishCaught >= 100, rarity: 'epic' },
        ],
      },
      {
        id: 'streak', label: '🔥 STREAK', trophies: [
          { id: 's3', name: 'Trogen', emoji: '🔥', desc: '3 dagars streak', unlocked: pet.streak >= 3, rarity: 'common' },
          { id: 's7', name: 'Dedikerad', emoji: '🌟', desc: '7 dagars streak', unlocked: pet.streak >= 7, rarity: 'rare' },
          { id: 's30', name: 'Oövervinnerlig', emoji: '💎', desc: '30 dagars streak', unlocked: pet.streak >= 30, rarity: 'legendary' },
        ],
      },
    ]
    const RARITY_CLR: Record<string, string> = { common: '#888', rare: '#4488ff', epic: '#aa66ff', legendary: '#ffcc00' }
    const totalTrophies = TROPHY_CATEGORIES.reduce((s, c) => s + c.trophies.length, 0)
    const unlockedCount = TROPHY_CATEGORIES.reduce((s, c) => s + c.trophies.filter(t => t.unlocked).length, 0)
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🏆 Pokalrum</div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>
          {unlockedCount}/{totalTrophies} pokaler upplåsta
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${(unlockedCount / totalTrophies) * 100}%`, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 3, transition: 'width .6s' }} />
        </div>
        {TROPHY_CATEGORIES.map(cat => (
          <div key={cat.id} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--t3)', letterSpacing: 1, marginBottom: 8 }}>{cat.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {cat.trophies.map(t => (
                <div
                  key={t.id}
                  style={{
                    textAlign: 'center', padding: '10px 6px',
                    background: t.unlocked ? `rgba(${RARITY_CLR[t.rarity].replace('#','').match(/../g)?.map(h=>parseInt(h,16)).join(',')},.08)` : 'rgba(255,255,255,.03)',
                    border: `1px solid ${t.unlocked ? RARITY_CLR[t.rarity] + '44' : 'rgba(255,255,255,.06)'}`,
                    borderRadius: 12, opacity: t.unlocked ? 1 : 0.45,
                  }}
                >
                  <div style={{ fontSize: 22 }}>{t.unlocked ? t.emoji : '🔒'}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: t.unlocked ? RARITY_CLR[t.rarity] : '#555', marginTop: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 7, color: 'var(--t3)', marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Mine panel ───────────────────────────────────────────────────────────────
  if (panel === 'mine') {
    const MINE_UPGRADES = [
      { level: 1, rate: 5,  capacity: 100,  upgradeCost: 0   },
      { level: 2, rate: 10, capacity: 200,  upgradeCost: 150 },
      { level: 3, rate: 20, capacity: 400,  upgradeCost: 400 },
      { level: 4, rate: 40, capacity: 800,  upgradeCost: 900 },
      { level: 5, rate: 80, capacity: 2000, upgradeCost: 2000 },
    ]
    const mineLevel = Number(localStorage.getItem('k0509_mine_level') ?? 1)
    const mineLastCollect = Number(localStorage.getItem('k0509_mine_collect') ?? Date.now())
    const [mineLvl, setMineLvl] = useState(mineLevel)
    const [lastCollect, setLastCollect] = useState(mineLastCollect)
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
      const iv = setInterval(() => setNow(Date.now()), 5000)
      return () => clearInterval(iv)
    }, [])

    const cfg = MINE_UPGRADES[mineLvl - 1]
    const nextCfg = MINE_UPGRADES[mineLvl] ?? null
    const elapsedMins = (now - lastCollect) / 60000
    const accumulated = Math.min(cfg.capacity, Math.floor(elapsedMins * cfg.rate))
    const pct = Math.min(100, (accumulated / cfg.capacity) * 100)

    const collect = () => {
      if (accumulated <= 0) return
      gainCoins(accumulated)
      const newTime = Date.now()
      localStorage.setItem('k0509_mine_collect', String(newTime))
      setLastCollect(newTime)
      setNow(newTime)
      showToast(`⛏️ +${accumulated}🪙 från gruvan!`, 'success')
      audio.coin()
    }

    const upgrade = () => {
      if (!nextCfg || pet.coins < nextCfg.upgradeCost) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      spendCoins(nextCfg.upgradeCost)
      const newLvl = mineLvl + 1
      localStorage.setItem('k0509_mine_level', String(newLvl))
      setMineLvl(newLvl)
      showToast(`⛏️ Gruvan uppgraderad till Nivå ${newLvl}!`, 'success')
      audio.achievement(); triggerConfetti()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>⛏️ Gruvan</div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)', marginBottom: 16 }}>
          Passiv inkomst medan du spelar!
        </div>
        <div style={{
          background: 'rgba(255,204,0,.06)', border: '1px solid rgba(255,204,0,.2)',
          borderRadius: 16, padding: '20px 16px', textAlign: 'center', marginBottom: 14,
        }}>
          <div style={{ fontSize: 56 }}>⛏️</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fbbf24', marginTop: 8 }}>
            Nivå {mineLvl} Gruva
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
            {cfg.rate} mynt/min · Kapacitet: {cfg.capacity}🪙
          </div>
          <div style={{ margin: '14px 0 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--t3)' }}>Samlade mynt</span>
              <span style={{ color: '#fbbf24', fontWeight: 900 }}>{accumulated} / {cfg.capacity}</span>
            </div>
            <div style={{ height: 10, background: 'rgba(0,0,0,.3)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 5, transition: 'width .5s' }} />
            </div>
          </div>
          <button
            className="btn-gold"
            style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 900, marginTop: 4, opacity: accumulated <= 0 ? 0.5 : 1 }}
            onClick={collect}
            disabled={accumulated <= 0}
          >
            ⛏️ Samla {accumulated} mynt!
          </button>
        </div>
        {nextCfg && (
          <div style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
              Uppgradera till Nivå {nextCfg.level}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
              {nextCfg.rate} mynt/min · Kapacitet: {nextCfg.capacity}🪙
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: 12, opacity: pet.coins >= nextCfg.upgradeCost ? 1 : 0.5 }}
              onClick={upgrade}
            >
              Uppgradera — {nextCfg.upgradeCost}🪙
            </button>
          </div>
        )}
        {!nextCfg && (
          <div style={{ textAlign: 'center', fontSize: 14, color: '#fbbf24', fontWeight: 900, padding: 16 }}>
            🏆 MAX NIVÅ UPPNÅDD!
          </div>
        )}
      </div>
    )
  }

  // ── Farm panel ───────────────────────────────────────────────────────────────
  if (panel === 'farm') {
    const CROPS = [
      { id: 'carrot',  emoji: '🥕', name: 'Morot',     cost: 20,  durationMins: 3,  coins: 50,  xp: 20 },
      { id: 'corn',    emoji: '🌽', name: 'Majs',      cost: 40,  durationMins: 8,  coins: 110, xp: 45 },
      { id: 'pumpkin', emoji: '🎃', name: 'Pumpa',     cost: 80,  durationMins: 20, coins: 230, xp: 90 },
      { id: 'rainbow', emoji: '🌈', name: 'Regnbågskål',cost: 200, durationMins: 60, coins: 650, xp: 250 },
    ]
    const SLOTS = 4
    type CropSlot = { cropId: string; plantedAt: number } | null
    const farmKey = 'k0509_farm_slots'
    const [slots, setSlots] = useState<CropSlot[]>(() => JSON.parse(localStorage.getItem(farmKey) ?? 'null') ?? Array(SLOTS).fill(null))
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
      const iv = setInterval(() => setNow(Date.now()), 5000)
      return () => clearInterval(iv)
    }, [])

    const saveSlots = (s: CropSlot[]) => {
      localStorage.setItem(farmKey, JSON.stringify(s))
      setSlots(s)
    }

    const plant = (slotIdx: number, cropId: string, cost: number) => {
      if (pet.coins < cost) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      spendCoins(cost)
      const next = [...slots]
      next[slotIdx] = { cropId, plantedAt: Date.now() }
      saveSlots(next)
      showToast(`🌱 Planterade ${CROPS.find(c => c.id === cropId)?.name}!`, 'success')
      audio.click()
    }

    const harvest = (slotIdx: number) => {
      const slot = slots[slotIdx]
      if (!slot) return
      const crop = CROPS.find(c => c.id === slot.cropId)!
      gainCoins(crop.coins)
      gainXP(crop.xp, 'farm')
      const next = [...slots]
      next[slotIdx] = null
      saveSlots(next)
      showToast(`${crop.emoji} Skördade ${crop.name}! +${crop.coins}🪙 +${crop.xp}XP`, 'success')
      triggerConfetti(); audio.achievement()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🌾 Gården</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          Plantera grödor — vänta — skörda! · 💰 {pet.coins} tillgängliga
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {Array.from({ length: SLOTS }, (_, i) => {
            const slot = slots[i]
            const crop = slot ? CROPS.find(c => c.id === slot.cropId) : null
            const elapsed = slot ? (now - slot.plantedAt) / 60000 : 0
            const ready = crop ? elapsed >= crop.durationMins : false
            const pct = crop ? Math.min(100, (elapsed / crop.durationMins) * 100) : 0
            const minsLeft = crop ? Math.max(0, Math.ceil(crop.durationMins - elapsed)) : 0
            return (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 14,
                background: ready ? 'rgba(74,222,128,.08)' : slot ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)',
                border: `1px solid ${ready ? 'rgba(74,222,128,.3)' : slot ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{slot && crop ? crop.emoji : '🟫'}</span>
                  <div style={{ flex: 1 }}>
                    {slot && crop ? (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 13, color: ready ? '#4ade80' : '#fff' }}>{crop.name}</div>
                        <div style={{ height: 4, background: 'rgba(0,0,0,.3)', borderRadius: 2, overflow: 'hidden', margin: '4px 0' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: ready ? '#4ade80' : '#fbbf24', borderRadius: 2, transition: 'width .5s' }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--t3)' }}>
                          {ready ? '✅ Klar för skörd!' : `${minsLeft} min kvar · +${crop.coins}🪙 +${crop.xp}XP`}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: '#555' }}>Tom · Välj en gröda att plantera</div>
                    )}
                  </div>
                  {ready && <button className="btn-gold" style={{ fontSize: 11, padding: '6px 10px', flexShrink: 0 }} onClick={() => harvest(i)}>Skörda!</button>}
                </div>
                {!slot && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {CROPS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => plant(i, c.id, c.cost)}
                        style={{
                          padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                          background: pet.coins >= c.cost ? 'rgba(74,222,128,.12)' : 'rgba(255,255,255,.03)',
                          border: `1px solid ${pet.coins >= c.cost ? 'rgba(74,222,128,.35)' : 'rgba(255,255,255,.06)'}`,
                          color: pet.coins >= c.cost ? '#4ade80' : '#555', cursor: pet.coins >= c.cost ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {c.emoji} {c.name} {c.cost}🪙
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── World Events panel ────────────────────────────────────────────────────────
  if (panel === 'worldevents') {
    const hour = new Date().getHours()
    const day = new Date().getDay()
    const dayName = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'][day]
    const EVENTS = [
      {
        id: 'weekend', active: day === 0 || day === 6,
        emoji: '🎉', name: 'Helgfestival',
        desc: 'Alla spel ger +25% XP. Dubblad Quest-belöning!',
        ends: 'Slutar söndag 23:59', color: '#aa66ff',
      },
      {
        id: 'morning', active: hour >= 6 && hour < 10,
        emoji: '🌅', name: 'Morgonrush',
        desc: '+20% XP från alla aktiviteter. Passa på!',
        ends: 'Aktivt 06:00-10:00', color: '#fbbf24',
      },
      {
        id: 'lunch', active: hour >= 11 && hour < 14,
        emoji: '🍽️', name: 'Lunchlycka',
        desc: 'Fiske ger dubbel XP och mynt t.o.m. 14:00.',
        ends: 'Aktivt 11:00-14:00', color: '#4ade80',
      },
      {
        id: 'evening', active: hour >= 18 && hour < 22,
        emoji: '🌆', name: 'Kvällsräd',
        desc: 'Boss Raid och Dungeon ger +50% belöning!',
        ends: 'Aktivt 18:00-22:00', color: '#f87171',
      },
      {
        id: 'summer', active: true,
        emoji: '☀️', name: 'Sommerfestivalen 2026',
        desc: 'Säsongsevent! Exklusiva belöningar och bonusar hela veckan.',
        ends: `Idag ${dayName} · Permanent event`, color: '#ffcc00',
      },
    ]
    const activeNow = EVENTS.filter(e => e.active)
    const upcoming = EVENTS.filter(e => !e.active)
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🌍 Världshändelser</div>
        {activeNow.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#4ade80', letterSpacing: 1, marginBottom: 8 }}>🟢 AKTIVA NU</div>
            {activeNow.map(e => (
              <div key={e.id} style={{
                background: `rgba(${e.color.replace('#','').match(/../g)?.map(h=>parseInt(h,16)).join(',')??'255,255,255'},.08)`,
                border: `1px solid ${e.color}44`,
                borderRadius: 14, padding: '14px 14px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>{e.emoji}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 900, color: e.color }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{e.ends}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#e8e8f0' }}>{e.desc}</div>
              </div>
            ))}
          </>
        )}
        {upcoming.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#555', letterSpacing: 1, margin: '8px 0' }}>⏳ KOMMER SNART</div>
            {upcoming.map(e => (
              <div key={e.id} style={{
                background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 14, padding: '12px 14px', marginBottom: 8, opacity: 0.6,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 24, filter: 'grayscale(1)' }}>{e.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#888' }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: '#555' }}>{e.ends}</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        <div style={{ textAlign: 'center', padding: '12px', fontSize: 11, color: 'var(--t3)', background: 'rgba(255,255,255,.03)', borderRadius: 12, marginTop: 4 }}>
          🌟 Händelser byts automatiskt ut baserat på tid och dag
        </div>
      </div>
    )
  }

  // ── Activity Log panel ────────────────────────────────────────────────────────
  if (panel === 'activitylog') {
    const LOG_KEY = 'k0509_activity_log'
    const rawLog: { emoji: string; text: string; ts: number }[] = JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]')
    const entries = rawLog.slice().reverse().slice(0, 30)
    const now = Date.now()
    const fmt = (ts: number) => {
      const diff = Math.floor((now - ts) / 1000)
      if (diff < 60) return `${diff}s sedan`
      if (diff < 3600) return `${Math.floor(diff / 60)}min sedan`
      if (diff < 86400) return `${Math.floor(diff / 3600)}h sedan`
      return `${Math.floor(diff / 86400)}d sedan`
    }
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>📜 Aktivitetslogg</div>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--t3)', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📜</div>
            Ingen aktivitet ännu — börja spela!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {entries.map((e, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'center',
                padding: '9px 12px', borderRadius: 12,
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{e.emoji}</span>
                <span style={{ flex: 1, fontSize: 12, color: '#e8e8f0' }}>{e.text}</span>
                <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{fmt(e.ts)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── DNA Lab panel ─────────────────────────────────────────────────────────────
  if (panel === 'dnalab') {
    const INGREDIENTS = [
      { id: 'fire',    emoji: '🔥', name: 'Eldkärna',    cost: 50  },
      { id: 'water',   emoji: '💧', name: 'Vattendroppe', cost: 50  },
      { id: 'earth',   emoji: '🌿', name: 'Jordkristall', cost: 50  },
      { id: 'light',   emoji: '⭐', name: 'Ljusskärva',  cost: 100 },
      { id: 'dark',    emoji: '🌑', name: 'Skuggshard',   cost: 100 },
      { id: 'cosmic',  emoji: '🌌', name: 'Kosmisk Runa', cost: 200 },
    ]
    const FORMULAS = [
      { ids: ['fire','water','earth'], name: 'Naturlig Fusion', emoji: '🌈', xp: 500, coins: 300, kc: 3, desc: 'Eld + Vatten + Jord = liv!' },
      { ids: ['fire','fire','light'],  name: 'Flamherre',       emoji: '🔱', xp: 800, coins: 500, kc: 5, desc: 'Dubbel eld + ljus = makt!' },
      { ids: ['dark','dark','cosmic'], name: 'Skugggud',        emoji: '👁️', xp: 1500, coins: 1000, kc: 12, desc: 'Extrem mörker + kosmos = legendarisk!' },
      { ids: ['light','cosmic','earth'], name: 'Paradisfågel',  emoji: '🦅', xp: 1200, coins: 750, kc: 8, desc: 'Ljus + kosmos + jord = frihet!' },
      { ids: ['water','dark','fire'],  name: 'Kaosdraken',      emoji: '🐉', xp: 1000, coins: 600, kc: 7, desc: 'Vatten + mörker + eld = drake!' },
    ]
    const labKey = 'k0509_dnalab'
    const history: string[] = JSON.parse(localStorage.getItem(labKey) ?? '[]')
    const [selected, setSelected] = useState<string[]>([])
    const [result, setResult] = useState<(typeof FORMULAS)[0] | null>(null)
    const [used, setUsed] = useState(false)

    const totalCost = selected.reduce((s, id) => s + (INGREDIENTS.find(i => i.id === id)?.cost ?? 0), 0)
    const canBrew = selected.length === 3

    const brew = () => {
      if (!canBrew || pet.coins < totalCost) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      spendCoins(totalCost)
      const sorted = [...selected].sort()
      const match = FORMULAS.find(f => [...f.ids].sort().join(',') === sorted.join(','))
      const r = match ?? { ids: [], name: 'Mystisk Blandning', emoji: '❓', xp: 200, coins: 100, kc: 0, desc: 'Okänd formel...' }
      setResult(r)
      setUsed(true)
      gainCoins(r.coins)
      gainXP(r.xp, 'dnalab')
      if (r.kc > 0) gainKC(r.kc)
      const newHistory = [r.name, ...history].slice(0, 10)
      localStorage.setItem(labKey, JSON.stringify(newHistory))
      showToast(`🧬 ${r.emoji} ${r.name}! +${r.xp}XP +${r.coins}🪙${r.kc > 0 ? ` +${r.kc}💎` : ''}`, 'success')
      triggerConfetti(); audio.achievement()
    }

    const toggle = (id: string) => {
      if (used) return
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id)
        if (prev.length >= 3) return prev
        return [...prev, id]
      })
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🧬 DNA Lab</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          Välj 3 ingredienser och brygga en fusion! · 💰 {pet.coins}
        </div>
        {!result ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {INGREDIENTS.map(ing => {
                const sel = selected.includes(ing.id)
                const count = selected.filter(x => x === ing.id).length
                return (
                  <button
                    key={ing.id}
                    onClick={() => toggle(ing.id)}
                    style={{
                      padding: '12px 8px', borderRadius: 14, textAlign: 'center',
                      background: sel ? 'rgba(168,85,247,.2)' : 'rgba(255,255,255,.04)',
                      border: `2px solid ${sel ? '#a855f7' : 'rgba(255,255,255,.1)'}`,
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{ing.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: sel ? '#a855f7' : '#e8e8f0', marginTop: 4 }}>{ing.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{ing.cost}🪙{count > 0 ? ` ×${count}` : ''}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              {Array.from({ length: 3 }, (_, i) => {
                const ing = INGREDIENTS.find(x => x.id === selected[i])
                return (
                  <div key={i} style={{ width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, background: 'rgba(168,85,247,.08)', border: '1px dashed rgba(168,85,247,.4)' }}>
                    {ing ? ing.emoji : '+'}
                  </div>
                )
              })}
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: 14, opacity: canBrew && pet.coins >= totalCost ? 1 : 0.5 }}
              onClick={brew}
              disabled={!canBrew || pet.coins < totalCost}
            >
              🧬 Brygg! (kostnad: {totalCost}🪙)
            </button>
            {history.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>Tidigare fusioner:</div>
                {history.slice(0, 5).map((h, i) => <div key={i} style={{ fontSize: 11, color: 'var(--t3)', padding: '3px 0' }}>· {h}</div>)}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 56 }}>{result.emoji}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#fff' }}>{result.name}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{result.desc}</div>
            <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 900 }}>+{result.xp}XP +{result.coins}🪙{result.kc > 0 ? ` +${result.kc}💎` : ''}</div>
            <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={() => { setSelected([]); setResult(null); setUsed(false) }}>Brygg igen!</button>
          </div>
        )}
      </div>
    )
  }

  // ── Bank panel ────────────────────────────────────────────────────────────────
  if (panel === 'bank') {
    const BANK_KEY = 'k0509_bank'
    type BankData = { deposited: number; depositedAt: number; tier: number }
    const TIERS = [
      { name: 'Sparkonto',     interestPct: 2,  maxDeposit: 500,   icon: '🏦' },
      { name: 'Premiumkonto',  interestPct: 5,  maxDeposit: 2000,  icon: '💳' },
      { name: 'Platinumkonto', interestPct: 10, maxDeposit: 10000, icon: '💎' },
    ]
    const [bankData, setBankData] = useState<BankData>(() => JSON.parse(localStorage.getItem(BANK_KEY) ?? 'null') ?? { deposited: 0, depositedAt: 0, tier: 0 })
    const [depositInput, setDepositInput] = useState('')
    const [now] = useState(Date.now())

    const hoursElapsed = bankData.deposited > 0 ? Math.floor((now - bankData.depositedAt) / 3600000) : 0
    const tier = TIERS[bankData.tier]
    const interest = Math.floor(bankData.deposited * (tier.interestPct / 100) * hoursElapsed)
    const totalAvailable = bankData.deposited + interest

    const save = (data: BankData) => { localStorage.setItem(BANK_KEY, JSON.stringify(data)); setBankData(data) }

    const deposit = () => {
      const amt = parseInt(depositInput)
      if (isNaN(amt) || amt <= 0) { showToast('Ogiltigt belopp', 'error'); return }
      if (pet.coins < amt) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      if (bankData.deposited + amt > tier.maxDeposit) { showToast(`Max ${tier.maxDeposit}🪙 för ${tier.name}!`, 'error'); return }
      if (bankData.deposited > 0) { withdraw(); return }
      spendCoins(amt)
      save({ deposited: amt, depositedAt: now, tier: bankData.tier })
      setDepositInput('')
      showToast(`🏦 Deponerade ${amt}🪙 till ${tier.name}!`, 'success')
      audio.coin()
    }

    const withdraw = () => {
      if (bankData.deposited <= 0) return
      gainCoins(totalAvailable)
      showToast(`🏦 Tog ut ${bankData.deposited}🪙 + ${interest}🪙 ränta!`, 'success')
      if (interest > 0) gainXP(Math.floor(interest / 5), 'bank')
      save({ deposited: 0, depositedAt: 0, tier: bankData.tier })
      triggerConfetti()
      audio.achievement()
    }

    const upgradeTier = () => {
      if (bankData.tier >= TIERS.length - 1) return
      const cost = [500, 2000][bankData.tier]
      if (pet.coins < cost) { showToast(`Behöver ${cost}🪙 för att uppgradera!`, 'error'); return }
      spendCoins(cost)
      save({ ...bankData, tier: bankData.tier + 1 })
      showToast(`💳 Uppgraderat till ${TIERS[bankData.tier + 1].name}!`, 'success')
      triggerConfetti(); audio.achievement()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🏦 Banken</div>
        <div style={{
          background: 'rgba(255,204,0,.06)', border: '1px solid rgba(255,204,0,.2)',
          borderRadius: 16, padding: '16px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{tier.icon} {tier.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{tier.interestPct}% ränta/timme · Max {tier.maxDeposit}🪙</div>
            </div>
            {bankData.tier < TIERS.length - 1 && (
              <button className="btn-gold" style={{ fontSize: 10, padding: '5px 8px' }} onClick={upgradeTier}>
                Uppgradera ({[500, 2000][bankData.tier]}🪙)
              </button>
            )}
          </div>
          {bankData.deposited > 0 ? (
            <>
              <div style={{ fontSize: 13, color: '#fff', marginBottom: 4 }}>Deponerat: {bankData.deposited}🪙</div>
              <div style={{ fontSize: 13, color: '#4ade80' }}>Ränta: +{interest}🪙 ({hoursElapsed}h)</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24', marginTop: 8 }}>Totalt: {totalAvailable}🪙</div>
              <button className="btn-primary" style={{ width: '100%', padding: 12, marginTop: 10 }} onClick={withdraw}>
                💰 Ta ut allt ({totalAvailable}🪙)
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input
                  type="number" placeholder="Belopp att deponera..."
                  value={depositInput} onChange={e => setDepositInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13 }}
                />
                <button className="btn-primary" style={{ padding: '10px 14px' }} onClick={deposit}>Sätt in</button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6 }}>Tillgängliga: {pet.coins}🪙</div>
            </>
          )}
        </div>
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>Kontotyper</div>
          {TIERS.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < TIERS.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: bankData.tier === i ? '#fbbf24' : '#888', fontWeight: bankData.tier === i ? 700 : 400 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: '#555' }}>{t.interestPct}%/h · max {t.maxDeposit}🪙</div>
              </div>
              {bankData.tier === i && <span style={{ fontSize: 10, color: '#4ade80' }}>✓ Aktiv</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── World Boss panel ──────────────────────────────────────────────────────────
  if (panel === 'worldboss') {
    const BOSS_KEY = 'k0509_worldboss'
    const WEEK_MS = 7 * 24 * 3600000
    const weekStart = Math.floor(Date.now() / WEEK_MS) * WEEK_MS
    const weekBosses = [
      { name: 'Kaosdraken Zyphos',    emoji: '🐉', maxHP: 100000, reward: { coins: 500, xp: 800, kc: 10 } },
      { name: 'Eldguden Xymbra',      emoji: '🔥', maxHP: 150000, reward: { coins: 750, xp: 1200, kc: 15 } },
      { name: 'Isdemonen Frostheim',  emoji: '❄️', maxHP: 200000, reward: { coins: 1000, xp: 1500, kc: 20 } },
    ]
    const bossIdx = Math.floor(weekStart / WEEK_MS) % weekBosses.length
    const boss = weekBosses[bossIdx]
    type BossData = { contributed: number; claimed: boolean; simulatedHP: number; participants: number }
    const [bossData, setBossData] = useState<BossData>(() => {
      const raw = JSON.parse(localStorage.getItem(BOSS_KEY) ?? 'null')
      if (!raw || raw.weekStart !== weekStart) {
        return { contributed: 0, claimed: false, simulatedHP: Math.floor(boss.maxHP * 0.35), participants: 1337 + Math.floor(Math.random() * 500) }
      }
      return raw
    })

    const attacked = bossData.contributed > 0
    const bossCurrentHP = Math.max(0, bossData.simulatedHP - bossData.contributed * 100)
    const bossPct = Math.max(0, (bossCurrentHP / boss.maxHP) * 100)
    const bossDefeated = bossCurrentHP <= 0

    const attack = () => {
      const dmg = pet.level * 50 + Math.floor(Math.random() * 500)
      const newData = { ...bossData, contributed: bossData.contributed + 1, simulatedHP: Math.max(0, bossData.simulatedHP - dmg) }
      localStorage.setItem(BOSS_KEY, JSON.stringify({ ...newData, weekStart }))
      setBossData(newData)
      showToast(`⚔️ Träff! ${dmg} skada på ${boss.name}!`, 'success')
      audio.coin()
    }

    const claim = () => {
      if (!bossDefeated || bossData.claimed) return
      gainCoins(boss.reward.coins); gainXP(boss.reward.xp, 'worldboss'); gainKC(boss.reward.kc)
      const newData = { ...bossData, claimed: true }
      localStorage.setItem(BOSS_KEY, JSON.stringify({ ...newData, weekStart }))
      setBossData(newData)
      showToast(`🏆 World Boss klar! +${boss.reward.coins}🪙 +${boss.reward.xp}XP +${boss.reward.kc}💎`, 'success')
      triggerConfetti(); audio.achievement()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🌍 World Boss</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginBottom: 12 }}>
          Veckans boss · {bossData.participants.toLocaleString()} spelare deltar
        </div>
        <div style={{
          background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.25)',
          borderRadius: 16, padding: '20px', textAlign: 'center', marginBottom: 14,
        }}>
          <div style={{ fontSize: 64 }}>{boss.emoji}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#f87171', marginTop: 8 }}>{boss.name}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>VECKLIG WORLD BOSS</div>
          <div style={{ margin: '14px 0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: '#f87171' }}>HP Boss</span>
              <span style={{ color: '#f87171', fontWeight: 900 }}>{bossCurrentHP.toLocaleString()} / {boss.maxHP.toLocaleString()}</span>
            </div>
            <div style={{ height: 12, background: 'rgba(0,0,0,.3)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bossPct}%`, background: 'linear-gradient(90deg,#f87171,#ef4444)', borderRadius: 6, transition: 'width .5s' }} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Dina bidrag: {bossData.contributed} attacker</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!bossDefeated ? (
            <button className="btn-primary" style={{ padding: '16px', fontSize: 15, fontWeight: 900 }} onClick={attack}>
              ⚔️ Anfalla Boss! (Nivå {pet.level} = ~{pet.level * 50}+ skada)
            </button>
          ) : bossData.claimed ? (
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(74,222,128,.08)', borderRadius: 12, border: '1px solid rgba(74,222,128,.25)', color: '#4ade80', fontWeight: 700 }}>
              ✅ Belöning hämtad! Ny boss på måndag.
            </div>
          ) : (
            <button className="btn-gold" style={{ padding: '16px', fontSize: 15, fontWeight: 900 }} onClick={claim}>
              🏆 Hämta segerbelöning!
            </button>
          )}
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>Segerbelöning</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: '#fbbf24' }}>+{boss.reward.coins}🪙</span>
              <span style={{ fontSize: 12, color: '#4ade80' }}>+{boss.reward.xp} XP</span>
              <span style={{ fontSize: 12, color: '#a855f7' }}>+{boss.reward.kc}💎 KC</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Pet Journal panel ─────────────────────────────────────────────────────────
  if (panel === 'petjournal') {
    const n = pet.petName
    const ageMs = Number(localStorage.getItem('k0509_born_at') ?? Date.now())
    const age = Math.max(0, Math.floor((Date.now() - ageMs) / 86400000))
    const JOURNAL_ENTRIES = [
      { emoji: '🐣', text: `Dag 1: ${n} kom till världen och tittade nyfiket runt. En ny resa börjar!` },
      pet.level >= 5  ? { emoji: '⭐', text: `Nivå 5: ${n} nådde sin första evolution och glänste med stolthet!` } : null,
      pet.totalTaps >= 100 ? { emoji: '👆', text: `${pet.totalTaps.toLocaleString()} pekar! ${n} älskar din uppmärksamhet.` } : null,
      pet.battleWins >= 1 ? { emoji: '⚔️', text: `${n} vann sin första strid och kände sig oslaglig!` } : null,
      pet.fishCaught >= 1 ? { emoji: '🎣', text: `Första fisken fångad! ${n} visade sig vara ett talang till fiske.` } : null,
      pet.streak >= 3  ? { emoji: '🔥', text: `${pet.streak} dagars streak! ${n} är imponerad av din dedikation.` } : null,
      pet.level >= 10 ? { emoji: '🌟', text: `Nivå 10: ${n} har blivit en veteran och ser på världen med nya ögon.` } : null,
      pet.battleWins >= 10 ? { emoji: '🏆', text: `10 strider vunna! ${n} är nu en fruktad krigare.` } : null,
      pet.fishCaught >= 10 ? { emoji: '🐟', text: `10 fiskar fångade! Havet känner till ${n}s namn.` } : null,
      pet.level >= 20 ? { emoji: '💫', text: `Nivå 20: ${n} har uppnått Masternivå — en sann legend!` } : null,
      age >= 7 ? { emoji: '📅', text: `1 vecka gammal! ${n} firar med ett leende och en kram.` } : null,
      pet.expeditionsDone >= 1 ? { emoji: '🗺️', text: `${n} återvände hem från sin första expedition, redo för nästa!` } : null,
      pet.streak >= 7 ? { emoji: '🏅', text: `7 dagars streak! ${n} vet att du alltid kommer tillbaka.` } : null,
      { emoji: '📖', text: `Idag: ${n} (Lv${pet.level}) tänker på alla äventyr ni har delat.` },
    ].filter(Boolean) as { emoji: string; text: string }[]

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>📖 Husdjursdagbok</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 16 }}>
          {n}s historia · Dag {age + 1} · Nivå {pet.level}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {JOURNAL_ENTRIES.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '12px 14px',
              background: i === JOURNAL_ENTRIES.length - 1 ? 'rgba(0,240,255,.05)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${i === JOURNAL_ENTRIES.length - 1 ? 'rgba(0,240,255,.2)' : 'rgba(255,255,255,.06)'}`,
              borderRadius: 14,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{entry.emoji}</span>
              <div style={{ fontSize: 12, color: '#d4d4f0', lineHeight: 1.5 }}>{entry.text}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Tournament panel ──────────────────────────────────────────────────────────
  if (panel === 'tournament') {
    const TOURNAMENTS = [
      { id: 't_taps', emoji: '👆', name: 'Pek-Mästerskap', desc: 'Flest pek vinner!', metric: pet.totalTaps, unit: 'pek', prizes: ['500🪙+10💎', '300🪙+5💎', '150🪙+2💎'] },
      { id: 't_battle', emoji: '⚔️', name: 'Strids-Grand Prix', desc: 'Flest stridsvinster!', metric: pet.battleWins, unit: 'vinster', prizes: ['750🪙+15💎', '400🪙+8💎', '200🪙+3💎'] },
      { id: 't_fish', emoji: '🎣', name: 'Fiske-SM', desc: 'Flest fiskar fångade!', metric: pet.fishCaught, unit: 'fiskar', prizes: ['600🪙+12💎', '350🪙+6💎', '175🪙+2💎'] },
    ]
    const dayOfWeek = new Date().getDay()
    const activeTournament = TOURNAMENTS[dayOfWeek % TOURNAMENTS.length]
    const LEADERBOARD = [
      { name: 'PixelKong99', emoji: '🦍', score: activeTournament.metric * 3 + 1500 },
      { name: 'StarChaser7', emoji: '⭐', score: activeTournament.metric * 2 + 800 },
      { name: 'NeonWolf',    emoji: '🐺', score: activeTournament.metric + 300 },
      { name: 'Du',          emoji: pet.petEmoji, score: activeTournament.metric, isUser: true },
      { name: 'CryptoFox',   emoji: '🦊', score: Math.max(0, activeTournament.metric - 100) },
    ].sort((a, b) => b.score - a.score)
    const userRank = LEADERBOARD.findIndex(e => e.isUser) + 1

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🏆 Turnering</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginBottom: 14 }}>
          Återställs varje dag kl 00:00
        </div>
        <div style={{
          background: 'rgba(255,204,0,.08)', border: '1px solid rgba(255,204,0,.25)',
          borderRadius: 16, padding: '14px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 32 }}>{activeTournament.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{activeTournament.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{activeTournament.desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🥇', '🥈', '🥉'].map((medal, i) => (
              <div key={i} style={{ fontSize: 10, color: i === 0 ? '#fbbf24' : i === 1 ? '#ccc' : '#cd7f32', background: 'rgba(255,255,255,.05)', borderRadius: 8, padding: '4px 8px' }}>
                {medal} {activeTournament.prizes[i]}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEADERBOARD.map((entry, i) => (
            <div key={entry.name} style={{
              display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, alignItems: 'center',
              background: entry.isUser ? 'rgba(0,240,255,.08)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${entry.isUser ? 'rgba(0,240,255,.3)' : 'rgba(255,255,255,.07)'}`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? '#fbbf24' : i === 1 ? '#ccc' : i === 2 ? '#cd7f32' : '#555', width: 20, textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <span style={{ fontSize: 20 }}>{entry.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: entry.isUser ? '#00f0ff' : '#fff' }}>{entry.name}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{entry.score.toLocaleString()} {activeTournament.unit}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', padding: '12px 0 0', fontSize: 12, color: userRank <= 3 ? '#4ade80' : 'var(--t3)', fontWeight: userRank <= 3 ? 900 : 400 }}>
          Din placering: #{userRank} {userRank <= 3 ? '🏆 Du är i pris-zononen!' : '— fortsätt för att ta dig in i topp 3!'}
        </div>
      </div>
    )
  }

  // ── Companion panel ───────────────────────────────────────────────────────────
  if (panel === 'companion') {
    const COMPANIONS = [
      { id: 'c_mini',    emoji: '🐣', name: 'Mini-Klon',   cost: 200, bonus: '+5% XP från alla aktiviteter',  kc: 0 },
      { id: 'c_dragon',  emoji: '🐉', name: 'Drake-Unge',  cost: 500, bonus: '+10% Mynt från alla källor',    kc: 0 },
      { id: 'c_star',    emoji: '⭐', name: 'Stjärn-Väktare', cost: 0, bonus: '+3% Alla stats',              kc: 15 },
      { id: 'c_ghost',   emoji: '👻', name: 'Spök-Hjälpare', cost: 0, bonus: 'Samlar mynt automatiskt +1/min', kc: 25 },
      { id: 'c_phoenix', emoji: '🦅', name: 'Fenix',         cost: 0, bonus: '+15% XP och skyddar streak',   kc: 50 },
    ]
    const ownedKey = 'k0509_companions'
    const [owned, setOwned] = useState<string[]>(() => JSON.parse(localStorage.getItem(ownedKey) ?? '[]'))
    const activeKey = 'k0509_active_companion'
    const [active, setActive] = useState<string>(() => localStorage.getItem(activeKey) ?? '')

    const buyCompanion = (c: (typeof COMPANIONS)[0]) => {
      if (owned.includes(c.id)) {
        const newActive = c.id === active ? '' : c.id
        localStorage.setItem(activeKey, newActive)
        setActive(newActive)
        showToast(newActive ? `${c.emoji} ${c.name} aktiverad!` : `${c.emoji} Följeslagare avaktiverad`, 'success')
        return
      }
      if (c.kc > 0) {
        if (pet.kc < c.kc) { showToast('Inte tillräckligt med KC!', 'error'); return }
        spendKC(c.kc)
      } else {
        if (pet.coins < c.cost) { showToast('Inte tillräckligt med mynt!', 'error'); return }
        spendCoins(c.cost)
      }
      const next = [...owned, c.id]
      localStorage.setItem(ownedKey, JSON.stringify(next))
      localStorage.setItem(activeKey, c.id)
      setOwned(next); setActive(c.id)
      showToast(`${c.emoji} ${c.name} köpt och aktiverad!`, 'success')
      triggerConfetti(); audio.achievement()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🐾 Följeslagare</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          Aktivera en följeslagare för passiva bonusar · 💰{pet.coins} · 💎{pet.kc}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {COMPANIONS.map(c => {
            const isOwned = owned.includes(c.id)
            const isActive = active === c.id
            return (
              <button
                key={c.id}
                onClick={() => buyCompanion(c)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14, textAlign: 'left',
                  background: isActive ? 'rgba(74,222,128,.1)' : isOwned ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.03)',
                  border: `1px solid ${isActive ? 'rgba(74,222,128,.4)' : isOwned ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)'}`,
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 32, flexShrink: 0 }}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: isActive ? '#4ade80' : '#fff' }}>{c.name}{isActive ? ' ✓ Aktiv' : ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{c.bonus}</div>
                  <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>
                    {isOwned ? (isActive ? 'Klicka för att avaktivera' : 'Klicka för att aktivera') : c.kc > 0 ? `${c.kc}💎 KC` : `${c.cost}🪙`}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Auction House panel ───────────────────────────────────────────────────────
  if (panel === 'auction') {
    const HOUR_MS = 3600000
    const weekSlot = Math.floor(Date.now() / (HOUR_MS * 6))
    const AUCTIONS = [
      { id: 'a1', emoji: '👑', name: 'Legendarisk Krona', desc: '+20% XP bonus', currentBid: 1200 + (weekSlot * 73) % 800, endHours: 3 + (weekSlot % 5) },
      { id: 'a2', emoji: '🔱', name: 'Gudoms-Sköld', desc: 'Skyddar streaken 3 dagar', currentBid: 2500 + (weekSlot * 37) % 500, endHours: 1 + (weekSlot % 8) },
      { id: 'a3', emoji: '🌌', name: 'Galaxhud', desc: 'Exklusiv legendarisk skin', currentBid: 4000 + (weekSlot * 53) % 2000, endHours: 5 + (weekSlot % 6) },
      { id: 'a4', emoji: '🧬', name: 'DNA-Essens', desc: 'Unikt DNA-Lab recept', currentBid: 800 + (weekSlot * 29) % 600, endHours: 2 + (weekSlot % 4) },
    ]
    const bidsKey = 'k0509_auction_bids'
    const [myBids, setMyBids] = useState<Record<string, number>>(() => JSON.parse(localStorage.getItem(bidsKey) ?? '{}'))
    const [bidInputs, setBidInputs] = useState<Record<string, string>>({})

    const placeBid = (auctionId: string, currentBid: number) => {
      const input = parseInt(bidInputs[auctionId] ?? '')
      if (isNaN(input) || input <= currentBid) { showToast(`Bud måste vara högre än ${currentBid}🪙!`, 'error'); return }
      if (pet.coins < input) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      const next = { ...myBids, [auctionId]: input }
      localStorage.setItem(bidsKey, JSON.stringify(next))
      setMyBids(next)
      setBidInputs(prev => ({ ...prev, [auctionId]: '' }))
      showToast(`🔨 Bud ${input}🪙 placerat!`, 'success')
      audio.coin()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🔨 Auktionshuset</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          Bjud på sällsynta föremål! · 💰 {pet.coins} tillgängliga
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {AUCTIONS.map(a => {
            const myBid = myBids[a.id]
            const isHighBidder = myBid && myBid > a.currentBid
            return (
              <div key={a.id} style={{
                borderRadius: 16, padding: '14px',
                background: isHighBidder ? 'rgba(74,222,128,.06)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${isHighBidder ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.1)'}`,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 32 }}>{a.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{a.desc}</div>
                    <div style={{ fontSize: 10, color: '#f87171' }}>⏰ {a.endHours}h kvar</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>Nuvarande bud:</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>{(myBid ?? a.currentBid).toLocaleString()}🪙</span>
                </div>
                {isHighBidder ? (
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#4ade80', fontWeight: 700, padding: '6px 0' }}>✓ Du leder budgivningen!</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      placeholder={`Min ${a.currentBid + 100}🪙`}
                      value={bidInputs[a.id] ?? ''}
                      onChange={e => setBidInputs(prev => ({ ...prev, [a.id]: e.target.value }))}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 12 }}
                    />
                    <button className="btn-primary" style={{ padding: '8px 12px', fontSize: 11 }} onClick={() => placeBid(a.id, a.currentBid)}>Bjud!</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', padding: '12px 0 0', fontSize: 10, color: '#555' }}>
          Auktioner roterar var 6:e timme · Vinnare får föremålet direkt
        </div>
      </div>
    )
  }

  // ── Prestige Hall panel ───────────────────────────────────────────────────────
  if (panel === 'prestigehall') {
    const PRESTIGE_BONUSES = [
      { level: 1, bonus: '+10% all XP', coins: 500, emoji: '🥉' },
      { level: 2, bonus: '+20% all XP, +5% coins', coins: 750, emoji: '🥈' },
      { level: 3, bonus: '+35% XP, +15% coins, +10% fish', coins: 1000, emoji: '🥇' },
      { level: 4, bonus: '+50% XP, +25% coins, +20% battle', coins: 1500, emoji: '💎' },
      { level: 5, bonus: '+75% all rewards, max bond faster', coins: 2000, emoji: '👑' },
    ]
    const prestigeXpRequired = 5000
    const canPrestige = pet.level >= 30 && pet.exp >= prestigeXpRequired

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🔄 Prestige Hall</div>
        {pet.prestigeLevel > 0 ? (
          <div style={{
            background: 'rgba(255,204,0,.08)', border: '1px solid rgba(255,204,0,.25)',
            borderRadius: 14, padding: '14px', marginBottom: 14, textAlign: 'center',
          }}>
            <div style={{ fontSize: 32 }}>{PRESTIGE_BONUSES[Math.min(pet.prestigeLevel - 1, 4)].emoji}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: '#fbbf24', marginTop: 6 }}>
              Prestige {pet.prestigeLevel}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
              {PRESTIGE_BONUSES[Math.min(pet.prestigeLevel - 1, 4)].bonus}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
            Nå nivå 30 för att prestige — återställ och få permanenta bonusar!
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {PRESTIGE_BONUSES.map((p, i) => {
            const achieved = pet.prestigeLevel >= p.level
            const isCurrent = pet.prestigeLevel === p.level
            return (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 12,
                background: achieved ? 'rgba(255,204,0,.07)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${isCurrent ? 'rgba(255,204,0,.5)' : achieved ? 'rgba(255,204,0,.2)' : 'rgba(255,255,255,.06)'}`,
              }}>
                <span style={{ fontSize: 22, opacity: achieved ? 1 : 0.4 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: achieved ? '#fbbf24' : '#666' }}>Prestige {p.level}{isCurrent ? ' ← Aktiv' : ''}</div>
                  <div style={{ fontSize: 10, color: achieved ? 'var(--t3)' : '#444' }}>{p.bonus}</div>
                </div>
                <div style={{ fontSize: 11, color: achieved ? '#4ade80' : '#555' }}>+{p.coins}🪙</div>
              </div>
            )
          })}
        </div>
        {canPrestige ? (
          <button
            className="btn-gold"
            style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 900 }}
            onClick={() => {
              useGameStore.getState().prestige()
              showToast(`🔄 Prestige ${pet.prestigeLevel + 1}! +${PRESTIGE_BONUSES[pet.prestigeLevel].coins}🪙`, 'success')
              triggerConfetti(); audio.achievement()
            }}
          >
            🔄 Prestige nu! (+{PRESTIGE_BONUSES[Math.min(pet.prestigeLevel, 4)].coins}🪙 bonus)
          </button>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#555', padding: 12, background: 'rgba(255,255,255,.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,.06)' }}>
            🔒 Kräver Nivå 30 för att prestige · Du är Lv{pet.level}
          </div>
        )}
      </div>
    )
  }

  // ── Clan panel ────────────────────────────────────────────────────────────────
  if (panel === 'clan') {
    const CLANS = [
      { id: 'dragon', emoji: '🐉', name: 'Dragon Legion', desc: 'Elitlagret för de starkaste', members: 47, level: 12, xp: 85000, bonus: '+15% Battle XP' },
      { id: 'ocean',  emoji: '🌊', name: 'Ocean Riders',  desc: 'Fiskare och äventyrare',    members: 38, level: 9,  xp: 52000, bonus: '+20% Fish XP'   },
      { id: 'star',   emoji: '⭐', name: 'Star Alliance', desc: 'Alla välkomna — snabb levl', members: 62, level: 7,  xp: 34000, bonus: '+10% All XP'   },
    ]
    const clanKey = 'k0509_my_clan'
    const [myClan, setMyClan] = useState<string>(() => localStorage.getItem(clanKey) ?? '')
    const joined = CLANS.find(c => c.id === myClan)

    const join = (clanId: string) => {
      localStorage.setItem(clanKey, clanId)
      setMyClan(clanId)
      const clan = CLANS.find(c => c.id === clanId)!
      showToast(`${clan.emoji} Gick med i ${clan.name}!`, 'success')
      gainXP(100, 'clan'); triggerConfetti(); audio.achievement()
    }
    const leave = () => {
      localStorage.removeItem(clanKey)
      setMyClan('')
      showToast('Lämnade klanen', 'info')
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>⚔️ Klaner</div>
        {joined ? (
          <>
            <div style={{
              background: 'rgba(68,136,255,.08)', border: '1px solid rgba(68,136,255,.25)',
              borderRadius: 16, padding: '16px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 36 }}>{joined.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: '#60a5fa' }}>{joined.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>Nivå {joined.level} · {joined.members} medlemmar</div>
                </div>
              </div>
              <div style={{ height: 6, background: 'rgba(0,0,0,.3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${(joined.xp % 10000) / 100}%`, background: 'linear-gradient(90deg,#60a5fa,#4488ff)', borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)' }}>
                <span>Klan XP: {joined.xp.toLocaleString()}</span>
                <span>Bonus: {joined.bonus}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {['DragonX 🐉', 'LunaPet 🌙', 'StarKing ⭐', `${pet.petName} ${pet.petEmoji} (Du)`, 'ZenPanda 🐼'].map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: m.includes('Du') ? 'rgba(0,240,255,.06)' : 'rgba(255,255,255,.03)', borderRadius: 10, border: `1px solid ${m.includes('Du') ? 'rgba(0,240,255,.25)' : 'rgba(255,255,255,.06)'}`, fontSize: 12, color: m.includes('Du') ? '#00f0ff' : '#e8e8f0' }}>
                  <span style={{ fontSize: 11, color: '#fbbf24', width: 16, textAlign: 'center', fontWeight: 900 }}>#{i + 1}</span>
                  {m}
                </div>
              ))}
            </div>
            <button className="btn-ghost" style={{ width: '100%', padding: 10, fontSize: 12 }} onClick={leave}>Lämna klanen</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
              Gå med i en klan för bonus XP och gemenskapen!
            </div>
            {CLANS.map(c => (
              <div key={c.id} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 32 }}>{c.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{c.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>
                  <span>👥 {c.members} medlemmar · Lv{c.level}</span>
                  <span style={{ color: '#4ade80' }}>{c.bonus}</span>
                </div>
                <button className="btn-primary" style={{ width: '100%', padding: 10, fontSize: 12 }} onClick={() => join(c.id)}>
                  Gå med!
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  // ── Lottery panel ─────────────────────────────────────────────────────────────
  if (panel === 'lottery') {
    const TICKET_COST = 50
    const todayKey = `k0509_lottery_${new Date().toDateString()}`
    const [tickets, setTickets] = useState<number[]>(() => JSON.parse(localStorage.getItem(todayKey) ?? '[]'))
    const [drawn, setDrawn] = useState<boolean>(() => !!localStorage.getItem(`${todayKey}_drawn`))
    const [winResult, setWinResult] = useState<{ prize: string; coins: number; kc: number } | null>(null)

    const PRIZES = [
      { prize: '🎰 JACKPOT! 5000🪙', coins: 5000, kc: 0, chance: 0.01 },
      { prize: '💎 50 KC', coins: 0, kc: 50, chance: 0.02 },
      { prize: '💰 1000🪙', coins: 1000, kc: 0, chance: 0.05 },
      { prize: '⭐ 500🪙', coins: 500, kc: 0, chance: 0.10 },
      { prize: '🪙 200🪙', coins: 200, kc: 0, chance: 0.20 },
      { prize: '🎁 50🪙', coins: 50, kc: 0, chance: 0.30 },
      { prize: '💔 Ingen vinst', coins: 0, kc: 0, chance: 1.0 },
    ]

    const buyTicket = () => {
      if (pet.coins < TICKET_COST) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      if (tickets.length >= 5) { showToast('Max 5 lotter per dag!', 'error'); return }
      spendCoins(TICKET_COST)
      const num = Math.floor(Math.random() * 99) + 1
      const next = [...tickets, num]
      localStorage.setItem(todayKey, JSON.stringify(next))
      setTickets(next)
      showToast(`🎟️ Lott #${num} köpt!`, 'success')
      audio.click()
    }

    const draw = () => {
      if (tickets.length === 0 || drawn) return
      const r = Math.random()
      let cumulative = 0
      const prize = PRIZES.find(p => { cumulative += p.chance; return r <= cumulative }) ?? PRIZES[PRIZES.length - 1]
      setWinResult(prize)
      setDrawn(true)
      localStorage.setItem(`${todayKey}_drawn`, '1')
      if (prize.coins > 0) gainCoins(prize.coins)
      if (prize.kc > 0) gainKC(prize.kc)
      if (prize.coins > 0 || prize.kc > 0) {
        showToast(`🎉 ${prize.prize}`, 'success')
        triggerConfetti(); audio.achievement()
      } else {
        showToast('Bättre lycka imorgon! 🎟️', 'info')
      }
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🎟️ Dagslotteriet</div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>
          Köp max 5 lotter · Dragning sker när du är redo · Återställs varje dag
        </div>
        {winResult && (
          <div style={{ background: winResult.coins > 0 || winResult.kc > 0 ? 'rgba(74,222,128,.1)' : 'rgba(255,255,255,.04)', border: `1px solid ${winResult.coins > 0 ? 'rgba(74,222,128,.35)' : 'rgba(255,255,255,.08)'}`, borderRadius: 16, padding: '16px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{winResult.coins > 500 || winResult.kc > 0 ? '🎉' : winResult.coins > 0 ? '😊' : '😢'}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: winResult.coins > 0 || winResult.kc > 0 ? '#4ade80' : '#888' }}>{winResult.prize}</div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
          {tickets.map((n, i) => (
            <div key={i} style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(168,85,247,.15)', border: '1px solid rgba(168,85,247,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#a855f7' }}>{n}</div>
          ))}
          {Array.from({ length: 5 - tickets.length }, (_, i) => (
            <div key={`empty-${i}`} style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#333' }}>🎟️</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-primary"
            style={{ flex: 1, padding: 12, opacity: tickets.length >= 5 || pet.coins < TICKET_COST ? 0.5 : 1 }}
            onClick={buyTicket}
            disabled={tickets.length >= 5 || pet.coins < TICKET_COST}
          >
            🎟️ Köp lott ({TICKET_COST}🪙)
          </button>
          <button
            className="btn-gold"
            style={{ flex: 1, padding: 12, opacity: tickets.length === 0 || drawn ? 0.5 : 1 }}
            onClick={draw}
            disabled={tickets.length === 0 || drawn}
          >
            🎰 Dra nu!
          </button>
        </div>
        {drawn && !winResult && <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 10 }}>Redan dragen idag · Kom tillbaka imorgon!</div>}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>Prislista:</div>
          {PRIZES.slice(0, -1).map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', padding: '2px 0' }}>
              <span>{p.prize}</span>
              <span>{Math.round(p.chance * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <div style={{ padding: 16, color: '#888' }}>Kommer snart...</div>
})

const WardSlot = memo(function WardSlot({ slot, label, items, owned, equipped, onEquip }: {
  slot: string; label: string; items: { id: string; emoji: string; name: string }[]; owned: string[]; equipped: string; onEquip: (id: string) => void
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={{ ...wardBtn, borderColor: equipped === 'none' ? '#a855f7' : 'rgba(255,255,255,0.1)' }} onClick={() => onEquip('none')}>❌ Ingen</button>
        {items.filter(i => owned.includes(i.id)).map(item => (
          <button key={item.id} style={{ ...wardBtn, borderColor: equipped === item.id ? '#a855f7' : 'rgba(255,255,255,0.1)' }} onClick={() => onEquip(item.id)}>
            {item.emoji}
          </button>
        ))}
      </div>
    </div>
  )
})

const RecordRow = memo(function RecordRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span style={{ flex: 1, fontSize: 14, color: '#e8e8f0' }}>{label}</span>
      <span style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 700, color: '#fbbf24' }}>{value}</span>
    </div>
  )
})

const wardBtn: React.CSSProperties = { padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer', fontSize: 20 }
