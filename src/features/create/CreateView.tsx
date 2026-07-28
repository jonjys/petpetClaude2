import { memo, useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'
import { SPIN_PRIZES, LUCKY_PRIZES, EXPEDITIONS, ALL_ACHIEVEMENTS, FEATURE_HUB_ITEMS, FORTUNE_MESSAGES, SHOP_HATS, SHOP_ACC, SHOP_AURA, FISH_TYPES } from '@/constants/config'
import { SPIN_KEY, LUCKY_KEY } from '@/constants/config'
import styles from './CreateView.module.css'
import { ShopView } from '@/features/shop/ShopView'

type Panel = null | 'spin' | 'lucky' | 'expedition' | 'achievements' | 'wardrobe' | 'fortune' | 'shop' | 'records' | 'leaderboard' | 'battlepass' | 'quests' | 'craft' | 'chests' | 'bounty' | 'fishpedia' | 'checkin' | 'skilltree' | 'tarot' | 'trophyroom' | 'mine' | 'activitylog' | 'farm' | 'worldevents' | 'dnalab' | 'bank' | 'worldboss' | 'petjournal' | 'tournament' | 'companion' | 'auction' | 'prestigehall' | 'clan' | 'lottery' | 'spa' | 'challenges' | 'traits' | 'roulette' | 'mailbox' | 'cookbook' | 'bond' | 'training' | 'petcare' | 'flashsale' | 'giftshop' | 'milestones' | 'seasonal' | 'trading' | 'forge' | 'enchant' | 'museum' | 'pvprank' | 'inventory' | 'events' | 'stickers' | 'gifting' | 'pethome' | 'potions' | 'arena2' | 'cosmetics' | 'garden' | 'rescue' | 'stats' | 'leaguetable' | 'badges' | 'wishlist' | 'meditation' | 'petdiary' | 'petshowcase' | 'petgym' | 'hatchery' | 'cosmicmap' | 'petschool' | 'mysterybox' | 'petfusion' | 'carnival' | 'petbirthday' | 'royaltytree' | 'speedrun' | 'collectibles' | 'petparade' | 'shrine' | 'timecapsule' | 'constellation'

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
  spa: 'pink', challenges: 'red', traits: 'purple',
  roulette: 'red', mailbox: 'blue', cookbook: 'green',
  bond: 'green', training: 'blue', petcare: 'green',
  flashsale: 'red', giftshop: 'purple',
  milestones: 'gold', seasonal: 'green', trading: 'blue',
  forge: 'orange', enchant: 'purple', museum: 'gold',
  pvprank: 'red', inventory: 'blue', events: 'purple',
  stickers: 'gold', gifting: 'pink', pethome: 'green',
  potions: 'purple', arena2: 'red', cosmetics: 'pink',
  garden: 'green', rescue: 'blue', stats: 'gold',
  leaguetable: 'gold', badges: 'purple', wishlist: 'blue',
  meditation: 'blue', petdiary: 'purple', petshowcase: 'gold',
  petgym: 'orange', hatchery: 'green', cosmicmap: 'purple',
  petschool: 'blue', mysterybox: 'gold', petfusion: 'purple',
  carnival: 'orange', petbirthday: 'pink', royaltytree: 'gold',
  speedrun: 'blue', collectibles: 'purple', petparade: 'orange',
  shrine: 'gold', timecapsule: 'purple', constellation: 'blue',
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
  spa:        { label: 'NY',     color: 'var(--pink)'   },
  challenges: { label: 'NYA',   color: 'var(--red)'    },
  traits:     { label: 'NY',     color: 'var(--purple)' },
  roulette:   { label: 'NY',     color: 'var(--red)'    },
  mailbox:    { label: 'NYTT',   color: 'var(--blue)'   },
  cookbook:   { label: 'NY',     color: 'var(--green)'  },
  bond:       { label: 'NY',     color: 'var(--green)'  },
  training:   { label: 'NY',     color: 'var(--blue)'   },
  petcare:    { label: 'NY',     color: 'var(--green)'  },
  flashsale:  { label: 'LIVE',   color: 'var(--red)'    },
  giftshop:   { label: 'NY',     color: 'var(--purple)' },
  milestones: { label: 'NY',     color: 'var(--gold)'   },
  seasonal:   { label: 'LIVE',   color: 'var(--green)'  },
  trading:    { label: 'NY',     color: 'var(--blue)'   },
  forge:      { label: 'NY',     color: 'var(--orange)' },
  enchant:    { label: 'NY',     color: 'var(--purple)' },
  museum:     { label: 'NY',     color: 'var(--gold)'   },
  pvprank:    { label: 'LIVE',   color: 'var(--red)'    },
  inventory:  { label: 'NY',     color: 'var(--blue)'   },
  events:     { label: 'NY',     color: 'var(--purple)' },
  stickers:   { label: 'NY',     color: 'var(--gold)'   },
  gifting:    { label: 'NY',     color: 'var(--pink)'   },
  pethome:    { label: 'NY',     color: 'var(--green)'  },
  potions:    { label: 'NY',     color: 'var(--purple)' },
  arena2:     { label: 'NY',     color: 'var(--red)'    },
  cosmetics:  { label: 'NY',     color: 'var(--pink)'   },
  garden:     { label: 'NY',     color: 'var(--green)'  },
  rescue:     { label: 'NY',     color: 'var(--blue)'   },
  stats:      { label: 'NY',     color: 'var(--gold)'   },
  leaguetable:{ label: 'LIVE',   color: 'var(--gold)'   },
  badges:     { label: 'NY',     color: 'var(--purple)' },
  wishlist:   { label: 'NY',     color: 'var(--blue)'   },
  meditation: { label: 'DAGLIG', color: 'var(--blue)'   },
  petdiary:   { label: 'NY',     color: 'var(--purple)' },
  petshowcase:{ label: 'NY',     color: 'var(--gold)'   },
  petgym:     { label: 'NY',     color: 'var(--orange)'  },
  hatchery:   { label: 'NY',     color: 'var(--green)'  },
  cosmicmap:  { label: 'NY',     color: 'var(--purple)' },
  petschool:  { label: 'NY',     color: 'var(--blue)'   },
  mysterybox: { label: 'DAGLIG', color: 'var(--gold)'   },
  petfusion:  { label: 'NY',     color: 'var(--purple)' },
  carnival:   { label: 'NY',     color: 'var(--orange)' },
  petbirthday:{ label: 'NY',     color: '#f472b6'       },
  royaltytree:{ label: 'NY',     color: 'var(--gold)'   },
  speedrun:   { label: 'NY',     color: 'var(--blue)'   },
  collectibles:{ label: 'NY',   color: 'var(--purple)' },
  petparade:  { label: 'NY',     color: 'var(--orange)' },
  shrine:     { label: 'DAGLIG', color: 'var(--gold)'   },
  timecapsule:{ label: 'NY',     color: 'var(--purple)' },
  constellation:{ label: 'NY',  color: 'var(--blue)'   },
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
  const gainBond = useGameStore(s => s.gainBond)
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

  // ── Pet Spa panel ───────────────────────────────────────────────────────────
  if (panel === 'spa') {
    const SPA_TREATMENTS = [
      { id: 'bubblebath', emoji: '🛁', name: 'Bubbelbad', desc: '+40 humör +20 energi', cost: 80, currency: 'coins' as const, mood: 40, energy: 20, hunger: 0 },
      { id: 'massage', emoji: '💆', name: 'Massage', desc: '+50 energi +20 humör', cost: 120, currency: 'coins' as const, mood: 20, energy: 50, hunger: 0 },
      { id: 'grooming', emoji: '✂️', name: 'Grooming', desc: '+30 humör +30 mat', cost: 100, currency: 'coins' as const, mood: 30, energy: 0, hunger: 30 },
      { id: 'aromatherapy', emoji: '🌸', name: 'Aromaterapi', desc: '+60 humör', cost: 150, currency: 'coins' as const, mood: 60, energy: 0, hunger: 0 },
      { id: 'fullspa', emoji: '💎', name: 'Full Spa-dag', desc: 'Alla stats +80', cost: 300, currency: 'coins' as const, mood: 80, energy: 80, hunger: 80 },
      { id: 'kcspa', emoji: '🌟', name: 'Lyxspa', desc: '+200 XP + alla stats max', cost: 15, currency: 'kc' as const, mood: 100, energy: 100, hunger: 100 },
    ]
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🛁 Pet Spa</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 12 }}>Pamper ditt husdjur med lyxiga behandlingar!</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SPA_TREATMENTS.map(t => {
            const canAfford = t.currency === 'coins' ? pet.coins >= t.cost : pet.kc >= t.cost
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ fontSize: 28 }}>{t.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{t.desc}</div>
                </div>
                <button
                  className={t.currency === 'kc' ? 'btn-gold' : 'btn-primary'}
                  style={{ padding: '8px 14px', fontSize: 12, opacity: canAfford ? 1 : 0.4 }}
                  disabled={!canAfford}
                  onClick={() => {
                    if (!canAfford) return
                    if (t.currency === 'coins') spendCoins(t.cost)
                    else { if (!spendKC(t.cost)) return }
                    if (t.mood) setStat('mood', Math.min(100, pet.mood + t.mood))
                    if (t.energy) setStat('energy', Math.min(100, pet.energy + t.energy))
                    if (t.hunger) setStat('hunger', Math.min(100, pet.hunger + t.hunger))
                    if (t.id === 'kcspa') gainXP(200, 'spa')
                    showToast(`${t.emoji} ${t.name} klar! Ditt husdjur mår jättebra!`, 'success')
                    audio.coin()
                  }}
                >
                  {t.cost}{t.currency === 'kc' ? '💎' : '🪙'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Daily Challenges panel ────────────────────────────────────────────────
  if (panel === 'challenges') {
    const today = new Date().toDateString()
    const storedChallenges = (() => {
      try {
        const s = localStorage.getItem('k0509_challenges')
        if (!s) return null
        const parsed = JSON.parse(s)
        return parsed.date === today ? parsed : null
      } catch { return null }
    })()
    const CHALLENGE_POOL = [
      { id: 'taps300', emoji: '👆', name: 'Tryck 300 gånger', desc: 'Peka på husdjuret 300 ggr idag', reward: '250🪙 + 15KC', coins: 250, kc: 15, xp: 200 },
      { id: 'win5games', emoji: '🎮', name: 'Vinn 5 spel', desc: 'Klara 5 minigames med belöning', reward: '200🪙 + 10KC', coins: 200, kc: 10, xp: 150 },
      { id: 'streak3', emoji: '🔥', name: '3 dagars streak', desc: 'Ha minst 3 dagars streak', reward: '300🪙 + 20KC', coins: 300, kc: 20, xp: 300 },
      { id: 'fish5', emoji: '🎣', name: 'Fånga 5 fiskar', desc: 'Fiska tills du har 5 fiskar totalt', reward: '150🪙 + 8KC', coins: 150, kc: 8, xp: 120 },
      { id: 'lvlcheck', emoji: '⭐', name: 'Var nivå 5+', desc: 'Ha din husdjur på nivå 5 eller högre', reward: '100🪙 + 5KC', coins: 100, kc: 5, xp: 80 },
      { id: 'coins500', emoji: '💰', name: 'Tjäna 500 mynt', desc: 'Spela spel och tjäna 500 mynt', reward: '180🪙 + 10KC', coins: 180, kc: 10, xp: 150 },
    ]
    const dayOfYear = Math.floor(Date.now() / 86400000)
    const selected = [
      CHALLENGE_POOL[dayOfYear % CHALLENGE_POOL.length],
      CHALLENGE_POOL[(dayOfYear + 2) % CHALLENGE_POOL.length],
      CHALLENGE_POOL[(dayOfYear + 4) % CHALLENGE_POOL.length],
    ]
    const claimed: string[] = storedChallenges?.claimed ?? []
    const claimChallenge = (id: string, coins: number, kc: number, xp: number) => {
      const newClaimed = [...claimed, id]
      localStorage.setItem('k0509_challenges', JSON.stringify({ date: today, claimed: newClaimed }))
      gainCoins(coins)
      gainKC(kc)
      gainXP(xp, 'challenge')
      showToast(`🎯 Utmaning klar! +${coins}🪙 +${kc}💎`, 'success')
      triggerConfetti()
      audio.achievement()
    }
    const checkMet = (id: string) => {
      if (id === 'taps300') return pet.totalTaps >= 300
      if (id === 'win5games') return pet.battleWins >= 5
      if (id === 'streak3') return pet.streak >= 3
      if (id === 'fish5') return pet.fishCaught >= 5
      if (id === 'lvlcheck') return pet.level >= 5
      if (id === 'coins500') return pet.coins >= 500
      return false
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🎯 Dagliga Utmaningar</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>Svårare utmaningar med större belöningar · Återställs varje dag</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selected.map(ch => {
            const done = claimed.includes(ch.id)
            const met = checkMet(ch.id)
            return (
              <div key={ch.id} style={{ padding: '14px 16px', background: done ? 'rgba(74,222,128,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${done ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.1)'}`, borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{ch.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: done ? '#4ade80' : '#e8e8f0' }}>{ch.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{ch.desc}</div>
                    <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>Belöning: {ch.reward}</div>
                  </div>
                  {done ? (
                    <div style={{ fontSize: 20 }}>✅</div>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: 12, opacity: met ? 1 : 0.4 }}
                      disabled={!met}
                      onClick={() => claimChallenge(ch.id, ch.coins, ch.kc, ch.xp)}
                    >
                      Hämta
                    </button>
                  )}
                </div>
                {!done && <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: met ? '100%' : '30%', background: met ? '#4ade80' : '#fbbf24', borderRadius: 2, transition: 'width .4s' }} />
                </div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Traits panel ─────────────────────────────────────────────────────────
  if (panel === 'traits') {
    const TRAITS = [
      { id: 'swift', emoji: '⚡', name: 'Snabb', desc: '+15% XP från spel', rarity: 'common', cost: 200, costType: 'coins' as const },
      { id: 'lucky', emoji: '🍀', name: 'Lycklig', desc: '+20% chans på rare fisk', rarity: 'uncommon', cost: 500, costType: 'coins' as const },
      { id: 'strong', emoji: '💪', name: 'Stark', desc: '+25% skada i strider', rarity: 'uncommon', cost: 600, costType: 'coins' as const },
      { id: 'wise', emoji: '📚', name: 'Vis', desc: '+20% XP från quiz', rarity: 'rare', cost: 30, costType: 'kc' as const },
      { id: 'golden', emoji: '✨', name: 'Gyllene', desc: '+10% alla mynt-belöningar', rarity: 'rare', cost: 40, costType: 'kc' as const },
      { id: 'cosmic', emoji: '🌌', name: 'Kosmisk', desc: '+30% XP i alla aktiviteter', rarity: 'legendary', cost: 100, costType: 'kc' as const },
    ]
    const rarityColors: Record<string, string> = { common: '#888', uncommon: '#4ade80', rare: '#60a5fa', legendary: '#fbbf24' }
    const owned: string[] = (() => {
      try { return JSON.parse(localStorage.getItem('k0509_traits') ?? '[]') } catch { return [] }
    })()
    const active: string[] = (() => {
      try { return JSON.parse(localStorage.getItem('k0509_traits_active') ?? '[]') } catch { return [] }
    })()
    const buyTrait = (id: string, cost: number, costType: 'coins' | 'kc') => {
      if (owned.includes(id)) return
      if (costType === 'coins') { if (!spendCoins(cost)) return }
      else { if (!spendKC(cost)) return }
      const newOwned = [...owned, id]
      localStorage.setItem('k0509_traits', JSON.stringify(newOwned))
      showToast('✨ Trait upplåst!', 'success')
      audio.achievement()
    }
    const toggleTrait = (id: string) => {
      let next = active.includes(id) ? active.filter(a => a !== id) : active.length >= 3 ? active : [...active, id]
      localStorage.setItem('k0509_traits_active', JSON.stringify(next))
      audio.click()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🧬 Traits</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 4 }}>Upp till 3 aktiva traits · Passiva bonusar</div>
        <div style={{ fontSize: 11, color: '#fbbf24', textAlign: 'center', marginBottom: 14 }}>Aktiva: {active.length}/3</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TRAITS.map(t => {
            const isOwned = owned.includes(t.id)
            const isActive = active.includes(t.id)
            const canAfford = t.costType === 'coins' ? pet.coins >= t.cost : pet.kc >= t.cost
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isActive ? 'rgba(168,85,247,.1)' : 'rgba(255,255,255,.04)', borderRadius: 14, border: `1px solid ${isActive ? 'rgba(168,85,247,.4)' : 'rgba(255,255,255,.08)'}` }}>
                <div style={{ fontSize: 26 }}>{t.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{t.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: rarityColors[t.rarity], textTransform: 'uppercase' }}>{t.rarity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{t.desc}</div>
                </div>
                {isOwned ? (
                  <button
                    className={isActive ? 'btn-gold' : 'btn-ghost'}
                    style={{ padding: '8px 12px', fontSize: 12 }}
                    onClick={() => toggleTrait(t.id)}
                  >
                    {isActive ? '✓ Aktiv' : 'Aktivera'}
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 12px', fontSize: 12, opacity: canAfford ? 1 : 0.4 }}
                    disabled={!canAfford}
                    onClick={() => buyTrait(t.id, t.cost, t.costType)}
                  >
                    {t.cost}{t.costType === 'kc' ? '💎' : '🪙'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Bond panel ─────────────────────────────────────────────────────────────
  if (panel === 'bond') {
    const BOND_NAMES = ['Okänd', 'Bekant', 'Kompis', 'Vän', 'Bästis', 'Soulmate']
    const BOND_EMOJIS = ['❓', '🤝', '😊', '💚', '🫶', '💫']
    const BOND_THRESHOLDS = [0, 50, 150, 350, 700, 1500]
    const BOND_COLORS = ['#888', '#60a5fa', '#4ade80', '#4ade80', '#f472b6', '#fbbf24']
    const tier = pet.bondTier
    const nextThresh = tier < 5 ? BOND_THRESHOLDS[tier + 1] : BOND_THRESHOLDS[5]
    const currThresh = BOND_THRESHOLDS[tier]
    const bondPct = tier >= 5 ? 100 : Math.min(100, ((pet.bondPoints - currThresh) / (nextThresh - currThresh)) * 100)
    const BOND_ACTIONS = [
      { id: 'pet', emoji: '🐾', name: 'Kela', desc: '+5 Bond · Ge husdjuret lite kärlek', cost: 0, bond: 5, cooldownMs: 60000 },
      { id: 'play', emoji: '🎮', name: 'Lek tillsammans', desc: '+15 Bond · Spela ett spel', cost: 30, bond: 15, cooldownMs: 300000 },
      { id: 'gift', emoji: '🎁', name: 'Ge en gåva', desc: '+30 Bond + 10 XP', cost: 100, bond: 30, cooldownMs: 3600000 },
      { id: 'feast', emoji: '🍱', name: 'Kungsmåltid', desc: '+50 Bond + +60 mat', cost: 200, bond: 50, cooldownMs: 86400000 },
    ]
    const [bondCooldowns, setBondCooldowns] = useState<Record<string, number>>(() => {
      try { return JSON.parse(localStorage.getItem('k0509_bond_cd') ?? '{}') } catch { return {} }
    })
    const doAction = (a: typeof BOND_ACTIONS[0]) => {
      const now = Date.now()
      if (bondCooldowns[a.id] && now - bondCooldowns[a.id] < a.cooldownMs) return
      if (a.cost > 0 && !spendCoins(a.cost)) return
      gainBond(a.bond)
      if (a.id === 'feast') setStat('hunger', Math.min(100, pet.hunger + 60))
      if (a.id === 'play') gainXP(10, 'bond')
      if (a.id === 'gift') gainXP(10, 'bond')
      const next = { ...bondCooldowns, [a.id]: now }
      setBondCooldowns(next)
      localStorage.setItem('k0509_bond_cd', JSON.stringify(next))
      showToast(`${a.emoji} +${a.bond} Bond-poäng!`, 'success')
      audio.coin()
    }
    const now = Date.now()
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>💚 Band</div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48 }}>{BOND_EMOJIS[tier]}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: BOND_COLORS[tier], marginTop: 6 }}>{BOND_NAMES[tier]}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Band-tier {tier}/5 · {pet.bondPoints} poäng</div>
          {tier < 5 && (
            <div style={{ marginTop: 10, padding: '0 20px' }}>
              <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bondPct}%`, background: BOND_COLORS[tier], borderRadius: 3, transition: 'width .4s' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>Nästa tier: {BOND_NAMES[tier + 1]} ({pet.bondPoints}/{nextThresh})</div>
            </div>
          )}
          {tier >= 5 && <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 8 }}>💫 Max band uppnådd!</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BOND_ACTIONS.map(a => {
            const cdRemaining = bondCooldowns[a.id] ? Math.max(0, a.cooldownMs - (now - bondCooldowns[a.id])) : 0
            const onCd = cdRemaining > 0
            const minLeft = Math.ceil(cdRemaining / 60000)
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ fontSize: 28 }}>{a.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{a.desc}</div>
                  {onCd && <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 2 }}>⏳ {minLeft < 60 ? `${minLeft}min` : `${Math.ceil(minLeft/60)}h`}</div>}
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: 12, opacity: onCd || (a.cost > 0 && pet.coins < a.cost) ? 0.4 : 1 }}
                  disabled={onCd || (a.cost > 0 && pet.coins < a.cost)}
                  onClick={() => doAction(a)}
                >
                  {a.cost > 0 ? `${a.cost}🪙` : '💚'}
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', marginBottom: 8 }}>Band-förmåner per tier:</div>
          {[['Bekant','Låser upp daglig spin-bonus'],['Kompis','+10% XP från pek'],['Vän','+20% alla belöningar'],['Bästis','+5% KC-inkomst'],['Soulmate','DUBBEL allt!']].map(([tier2, benefit], i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, color: pet.bondTier > i ? '#4ade80' : 'var(--t3)', padding: '3px 0' }}>
              <span>{pet.bondTier > i ? '✓' : '○'}</span>
              <span style={{ fontWeight: 700 }}>{BOND_EMOJIS[i+1]} {tier2}:</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Training panel ─────────────────────────────────────────────────────────
  if (panel === 'training') {
    const SKILLS = [
      { id: 'str', emoji: '⚔️', name: 'Styrka', desc: '+battle-skada', maxLevel: 5, costPerLevel: 100 },
      { id: 'agi', emoji: '⚡', name: 'Snabbhet', desc: '+reaktions-bonus', maxLevel: 5, costPerLevel: 100 },
      { id: 'int', emoji: '🧠', name: 'Intelligens', desc: '+quiz-XP bonus', maxLevel: 5, costPerLevel: 120 },
      { id: 'lck', emoji: '🍀', name: 'Tur', desc: '+fisk-chans', maxLevel: 5, costPerLevel: 80 },
      { id: 'end', emoji: '💚', name: 'Uthållighet', desc: '+max energi (passiv)', maxLevel: 5, costPerLevel: 150 },
    ]
    const [levels, setLevels] = useState<Record<string, number>>(() => {
      try { return JSON.parse(localStorage.getItem('k0509_training') ?? '{}') } catch { return {} }
    })
    const [trainCd, setTrainCd] = useState<Record<string, number>>(() => {
      try { return JSON.parse(localStorage.getItem('k0509_train_cd') ?? '{}') } catch { return {} }
    })
    const now = Date.now()
    const trainSkill = (id: string, costPerLevel: number, maxLevel: number) => {
      const lvl = levels[id] ?? 0
      if (lvl >= maxLevel) return
      if (trainCd[id] && now - trainCd[id] < 3600000) return
      const cost = costPerLevel * (lvl + 1)
      if (!spendCoins(cost)) return
      const nextLevels = { ...levels, [id]: lvl + 1 }
      const nextCd = { ...trainCd, [id]: now }
      setLevels(nextLevels)
      setTrainCd(nextCd)
      localStorage.setItem('k0509_training', JSON.stringify(nextLevels))
      localStorage.setItem('k0509_train_cd', JSON.stringify(nextCd))
      gainXP(50 * (lvl + 1), 'training')
      showToast(`💪 Tränade ${id}! +${50 * (lvl+1)} XP`, 'success')
      audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>💪 Träning</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>Träna husdjurets förmågor · 1 gång per förmåga per timme</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SKILLS.map(s => {
            const lvl = levels[s.id] ?? 0
            const maxed = lvl >= s.maxLevel
            const cdMs = trainCd[s.id] ? Math.max(0, 3600000 - (now - trainCd[s.id])) : 0
            const onCd = cdMs > 0
            const cost = s.costPerLevel * (lvl + 1)
            return (
              <div key={s.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 26 }}>{s.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{s.name}</span>
                      <span style={{ fontSize: 10, color: '#fbbf24' }}>LV{lvl}/{s.maxLevel}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{s.desc}</div>
                    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                      {Array.from({ length: s.maxLevel }, (_, i) => (
                        <div key={i} style={{ width: 20, height: 4, borderRadius: 2, background: i < lvl ? '#4ade80' : 'rgba(255,255,255,.1)' }} />
                      ))}
                    </div>
                  </div>
                  {maxed ? (
                    <div style={{ fontSize: 12, color: '#4ade80' }}>✓ MAX</div>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ padding: '8px 12px', fontSize: 11, opacity: onCd || pet.coins < cost ? 0.4 : 1, whiteSpace: 'nowrap' }}
                      disabled={onCd || pet.coins < cost}
                      onClick={() => trainSkill(s.id, s.costPerLevel, s.maxLevel)}
                    >
                      {onCd ? `${Math.ceil(cdMs/60000)}min` : `${cost}🪙`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Pet Care panel ─────────────────────────────────────────────────────────
  if (panel === 'petcare') {
    const today = new Date().toDateString()
    const [careLog, setCareLog] = useState<Record<string, boolean>>(() => {
      try {
        const s = localStorage.getItem('k0509_petcare')
        if (!s) return {}
        const p = JSON.parse(s)
        return p.date === today ? p.done : {}
      } catch { return {} }
    })
    const CARE_TASKS = [
      { id: 'brush', emoji: '🪥', name: 'Borsta tänderna', desc: '+10 humör', mood: 10, coins: 15 },
      { id: 'walk', emoji: '🚶', name: 'Kvällspromenad', desc: '+20 energi', energy: 20, coins: 25 },
      { id: 'groom', emoji: '✂️', name: 'Grooming', desc: '+15 humör', mood: 15, coins: 20 },
      { id: 'medicine', emoji: '💊', name: 'Vitaminer', desc: '+20 hunger + 10 energi', hunger: 20, energy: 10, coins: 30 },
      { id: 'story', emoji: '📖', name: 'Läs saga', desc: '+25 humör + Bond +10', mood: 25, bond: 10, coins: 20 },
      { id: 'sleep', emoji: '😴', name: 'Lästid', desc: '+50 energi', energy: 50, coins: 40 },
    ]
    const doTask = (t: typeof CARE_TASKS[0]) => {
      if (careLog[t.id]) return
      if ((t as { mood?: number }).mood) setStat('mood', Math.min(100, pet.mood + ((t as { mood?: number }).mood ?? 0)))
      if ((t as { energy?: number }).energy) setStat('energy', Math.min(100, pet.energy + ((t as { energy?: number }).energy ?? 0)))
      if ((t as { hunger?: number }).hunger) setStat('hunger', Math.min(100, pet.hunger + ((t as { hunger?: number }).hunger ?? 0)))
      if ((t as { bond?: number }).bond) gainBond((t as { bond?: number }).bond ?? 0)
      gainCoins(t.coins)
      const next = { ...careLog, [t.id]: true }
      setCareLog(next)
      localStorage.setItem('k0509_petcare', JSON.stringify({ date: today, done: next }))
      showToast(`${t.emoji} ${t.name} klar! +${t.coins}🪙`, 'success')
      audio.coin()
    }
    const doneCount = Object.values(careLog).filter(Boolean).length
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🩺 Husdjursvård</div>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Dagliga vårduppgifter: {doneCount}/{CARE_TASKS.length}</div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginTop: 8, marginInline: 20 }}>
            <div style={{ height: '100%', width: `${(doneCount / CARE_TASKS.length) * 100}%`, background: '#4ade80', borderRadius: 3, transition: 'width .4s' }} />
          </div>
          {doneCount === CARE_TASKS.length && <div style={{ fontSize: 12, color: '#4ade80', marginTop: 8 }}>🌟 Perfekt vård idag!</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CARE_TASKS.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: careLog[t.id] ? 'rgba(74,222,128,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${careLog[t.id] ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
              <div style={{ fontSize: 26 }}>{t.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{t.desc}</div>
              </div>
              {careLog[t.id] ? (
                <div style={{ fontSize: 20 }}>✅</div>
              ) : (
                <button className="btn-primary" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => doTask(t)}>
                  +{t.coins}🪙
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Milestones panel ────────────────────────────────────────────────────────
  if (panel === 'milestones') {
    const MILESTONES = [
      { id: 'first_tap', emoji: '👆', name: 'Första pek', desc: 'Tryckte på husdjuret för första gången', achieved: pet.totalTaps >= 1, reward: 50 },
      { id: 'first_game', emoji: '🎮', name: 'Spelnörd', desc: 'Vann första spelet', achieved: pet.battleWins >= 1 || pet.fishCaught >= 1, reward: 100 },
      { id: 'first_level', emoji: '⭐', name: 'Nivå upp!', desc: 'Nådde nivå 2', achieved: pet.level >= 2, reward: 75 },
      { id: 'first_fish', emoji: '🎣', name: 'Fiskaren', desc: 'Fångade sin första fisk', achieved: pet.fishCaught >= 1, reward: 50 },
      { id: 'first_battle', emoji: '⚔️', name: 'Krigar', desc: 'Vann första striden', achieved: pet.battleWins >= 1, reward: 75 },
      { id: 'first_streak', emoji: '🔥', name: '3 dagars streak', desc: 'Logga in 3 dagar i rad', achieved: pet.streak >= 3, reward: 150 },
      { id: 'first_post', emoji: '📸', name: 'Influencer', desc: 'Publicerade första inlägget', achieved: pet.postCount >= 1, reward: 100 },
      { id: 'first_expedition', emoji: '🗺️', name: 'Äventyrare', desc: 'Klarade första expeditionen', achieved: pet.expeditionsDone >= 1, reward: 200 },
      { id: 'lv10', emoji: '🌟', name: 'Veteran', desc: 'Nådde nivå 10', achieved: pet.level >= 10, reward: 500 },
      { id: 'lv20', emoji: '🔱', name: 'Elitspelare', desc: 'Nådde nivå 20', achieved: pet.level >= 20, reward: 1000 },
      { id: 'taps1k', emoji: '⚡', name: 'Tusen pek', desc: '1000 pek totalt', achieved: pet.totalTaps >= 1000, reward: 300 },
      { id: 'coins5k', emoji: '💰', name: 'Pengamagnat', desc: 'Tjänade 5000 mynt totalt', achieved: pet.totalCoinsEarned >= 5000, reward: 400 },
      { id: 'bond_mate', emoji: '💚', name: 'Bästis för livet', desc: 'Nådde Bond Tier 3', achieved: pet.bondTier >= 3, reward: 750 },
      { id: 'streak30', emoji: '🏅', name: '30 dagars streak', desc: 'Logga in 30 dagar i rad', achieved: pet.streak >= 30, reward: 2000 },
    ]
    const [claimed, setClaimed] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('k0509_milestones_claimed') ?? '[]') } catch { return [] }
    })
    const claimMilestone = (id: string, reward: number) => {
      const next = [...claimed, id]
      setClaimed(next)
      localStorage.setItem('k0509_milestones_claimed', JSON.stringify(next))
      gainCoins(reward)
      showToast(`🏁 Milstolpe uppnådd! +${reward}🪙`, 'success')
      triggerConfetti()
      audio.achievement()
    }
    const total = MILESTONES.filter(m => m.achieved && !claimed.includes(m.id)).length
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🏁 Milstolpar</div>
        {total > 0 && <div style={{ textAlign: 'center', fontSize: 12, color: '#4ade80', marginBottom: 12 }}>{total} uppnådda milstolpar att hämta!</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MILESTONES.map(m => {
            const done = claimed.includes(m.id)
            const ready = m.achieved && !done
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: done ? 'rgba(74,222,128,.06)' : m.achieved ? 'rgba(251,191,36,.06)' : 'rgba(255,255,255,.03)', border: `1px solid ${done ? 'rgba(74,222,128,.2)' : m.achieved ? 'rgba(251,191,36,.25)' : 'rgba(255,255,255,.06)'}`, borderRadius: 12 }}>
                <div style={{ fontSize: 22, opacity: m.achieved ? 1 : 0.3 }}>{m.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: m.achieved ? '#e8e8f0' : '#555' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>{m.desc}</div>
                </div>
                {done ? (
                  <div style={{ fontSize: 11, color: '#4ade80' }}>✓</div>
                ) : ready ? (
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => claimMilestone(m.id, m.reward)}>
                    +{m.reward}🪙
                  </button>
                ) : (
                  <div style={{ fontSize: 11, color: '#555' }}>Låst</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Seasonal pass panel ─────────────────────────────────────────────────────
  if (panel === 'seasonal') {
    const season = 'Sommar 2026'
    const SEASONAL_QUESTS = [
      { id: 'sq1', emoji: '☀️', name: 'Sommarpek', desc: 'Peka 500 gånger denna säsong', target: 500, current: Math.min(500, pet.totalTaps), reward: 200, kc: 5 },
      { id: 'sq2', emoji: '🏊', name: 'Sommarsimmare', desc: 'Fånga 10 fiskar', target: 10, current: Math.min(10, pet.fishCaught), reward: 300, kc: 8 },
      { id: 'sq3', emoji: '🌴', name: 'Semesterkrigare', desc: 'Vinn 5 strider', target: 5, current: Math.min(5, pet.battleWins), reward: 250, kc: 6 },
      { id: 'sq4', emoji: '🎆', name: 'Fest-streak', desc: 'Uppnå 7 dagars streak', target: 7, current: Math.min(7, pet.streak), reward: 400, kc: 10 },
      { id: 'sq5', emoji: '🌅', name: 'Sommarexpedition', desc: 'Klara 3 expeditioner', target: 3, current: Math.min(3, pet.expeditionsDone), reward: 350, kc: 9 },
      { id: 'sq6', emoji: '🏆', name: 'Sommarlegend', desc: 'Nå nivå 10', target: 10, current: Math.min(10, pet.level), reward: 1000, kc: 25 },
    ]
    const [sClaimed, setSClaimed] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('k0509_seasonal_claimed') ?? '[]') } catch { return [] }
    })
    const claimSQ = (id: string, reward: number, kc: number) => {
      const next = [...sClaimed, id]
      setSClaimed(next)
      localStorage.setItem('k0509_seasonal_claimed', JSON.stringify(next))
      gainCoins(reward); gainKC(kc)
      showToast(`🌸 Säsongsuppdrag klarat! +${reward}🪙 +${kc}💎`, 'success')
      audio.achievement()
    }
    const totalDone = SEASONAL_QUESTS.filter(q => q.current >= q.target).length
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🌸 {season}</div>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Säsongspass · {totalDone}/{SEASONAL_QUESTS.length} klara</div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginTop: 8, marginInline: 16 }}>
            <div style={{ height: '100%', width: `${(totalDone / SEASONAL_QUESTS.length) * 100}%`, background: '#4ade80', borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SEASONAL_QUESTS.map(q => {
            const done = sClaimed.includes(q.id)
            const met = q.current >= q.target
            return (
              <div key={q.id} style={{ padding: '12px 14px', background: done ? 'rgba(74,222,128,.07)' : 'rgba(255,255,255,.04)', border: `1px solid ${done ? 'rgba(74,222,128,.25)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 24 }}>{q.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: done ? '#4ade80' : '#e8e8f0' }}>{q.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{q.desc}</div>
                    <div style={{ fontSize: 10, color: '#fbbf24' }}>+{q.reward}🪙 +{q.kc}💎</div>
                  </div>
                  {done ? <div style={{ fontSize: 18 }}>✅</div> : (
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11, opacity: met ? 1 : 0.4 }} disabled={!met} onClick={() => claimSQ(q.id, q.reward, q.kc)}>
                      Hämta
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${(q.current / q.target) * 100}%`, background: met ? '#4ade80' : '#fbbf24', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>{q.current}/{q.target}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Trading Post panel ──────────────────────────────────────────────────────
  if (panel === 'trading') {
    const TRADE_ITEMS = [
      { id: 't1', emoji: '⚡', name: 'XP Boost (500)', sellFor: 80, buyFor: 150 },
      { id: 't2', emoji: '🍎', name: 'Äpplet', sellFor: 20, buyFor: 40 },
      { id: 't3', emoji: '🔮', name: 'Magisk Sten', sellFor: 120, buyFor: 220 },
      { id: 't4', emoji: '🌟', name: 'Stjärnstoft', sellFor: 200, buyFor: 380 },
      { id: 't5', emoji: '🐉', name: 'Dragfjäll', sellFor: 500, buyFor: 900 },
      { id: 't6', emoji: '🌊', name: 'Havsessens', sellFor: 300, buyFor: 550 },
    ]
    const [holdings, setHoldings] = useState<Record<string, number>>(() => {
      try { return JSON.parse(localStorage.getItem('k0509_trading') ?? '{}') } catch { return {} }
    })
    const trade = (id: string, buy: boolean, price: number) => {
      if (buy) {
        if (!spendCoins(price)) return
        const next = { ...holdings, [id]: (holdings[id] ?? 0) + 1 }
        setHoldings(next)
        localStorage.setItem('k0509_trading', JSON.stringify(next))
        showToast(`📦 Köpte 1 st!`, 'success')
        audio.coin()
      } else {
        if ((holdings[id] ?? 0) < 1) return
        gainCoins(price)
        const next = { ...holdings, [id]: (holdings[id] ?? 0) - 1 }
        setHoldings(next)
        localStorage.setItem('k0509_trading', JSON.stringify(next))
        showToast(`💰 Sålde för ${price}🪙!`, 'success')
        audio.coin()
      }
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🔄 Handelspost</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>Köp lågt, sälj högt · Ditt kapital: {pet.coins}🪙</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TRADE_ITEMS.map(t => {
            const qty = holdings[t.id] ?? 0
            return (
              <div key={t.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 24 }}>{t.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>Innehav: {qty} st</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 0', fontSize: 12, opacity: pet.coins >= t.buyFor ? 1 : 0.4 }}
                    disabled={pet.coins < t.buyFor}
                    onClick={() => trade(t.id, true, t.buyFor)}
                  >
                    Köp {t.buyFor}🪙
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: '8px 0', fontSize: 12, opacity: qty > 0 ? 1 : 0.4 }}
                    disabled={qty < 1}
                    onClick={() => trade(t.id, false, t.sellFor)}
                  >
                    Sälj {t.sellFor}🪙
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Flash Sale panel ────────────────────────────────────────────────────────
  if (panel === 'flashsale') {
    const hour = new Date().getHours()
    const dayOfYear = Math.floor(Date.now() / 86400000)
    const OFFERS = [
      { id: 'f1', emoji: '⚡', name: 'XP Boost Pack', desc: '+800 XP direkt', origPrice: 300, salePrice: 150, currency: 'coins' as const, xp: 800 },
      { id: 'f2', emoji: '💰', name: 'Mynt-explosion', desc: '+1500 mynt direkt', origPrice: 400, salePrice: 200, currency: 'coins' as const, coins: 1500 },
      { id: 'f3', emoji: '🌟', name: 'KC Bundle', desc: '+15 KC till pris av 10', origPrice: 600, salePrice: 300, currency: 'coins' as const, kc: 15 },
      { id: 'f4', emoji: '🎁', name: 'Stat Reset', desc: 'Alla stats → 100', origPrice: 500, salePrice: 250, currency: 'coins' as const, stats: true },
      { id: 'f5', emoji: '🔥', name: 'Streak Shield x3', desc: 'Skyddar streaken 3 dagar', origPrice: 20, salePrice: 10, currency: 'kc' as const, shields: 3 },
      { id: 'f6', emoji: '💎', name: 'Premium Pack', desc: '+30 KC + 2000 mynt', origPrice: 50, salePrice: 25, currency: 'kc' as const, kc: 30, coins: 2000 },
    ]
    const available = OFFERS.slice((dayOfYear * 3 + hour) % OFFERS.length, ((dayOfYear * 3 + hour) % OFFERS.length) + 3).concat(
      OFFERS.slice(0, Math.max(0, 3 - (OFFERS.length - (dayOfYear * 3 + hour) % OFFERS.length)))
    )
    const [purchased, setPurchased] = useState<string[]>(() => {
      try {
        const s = localStorage.getItem('k0509_flashsale')
        if (!s) return []
        const p = JSON.parse(s)
        return p.date === new Date().toDateString() ? p.ids : []
      } catch { return [] }
    })
    const buy = (o: typeof OFFERS[0]) => {
      if (purchased.includes(o.id)) return
      const canAfford = o.currency === 'coins' ? pet.coins >= o.salePrice : pet.kc >= o.salePrice
      if (!canAfford) { showToast('Inte tillräckligt med resurser!', 'error'); return }
      if (o.currency === 'coins') spendCoins(o.salePrice)
      else if (!spendKC(o.salePrice)) return
      if ((o as { xp?: number }).xp) gainXP((o as { xp?: number }).xp ?? 0, 'flashsale')
      if ((o as { coins?: number }).coins) gainCoins((o as { coins?: number }).coins ?? 0)
      if ((o as { kc?: number }).kc) gainKC((o as { kc?: number }).kc ?? 0)
      if ((o as { stats?: boolean }).stats) { setStat('mood', 100); setStat('energy', 100); setStat('hunger', 100) }
      const next = [...purchased, o.id]
      setPurchased(next)
      localStorage.setItem('k0509_flashsale', JSON.stringify({ date: new Date().toDateString(), ids: next }))
      showToast(`⚡ ${o.name} köpt! ${o.desc}`, 'success')
      audio.achievement()
    }
    const timeLeft = 60 - new Date().getMinutes()
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>⚡ Flash Sale</div>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#f87171', fontWeight: 700 }}>⏰ Erbjudanden uppdateras om {timeLeft}min</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>50% rabatt · Begränsad mängd!</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {available.map(o => {
            const isBought = purchased.includes(o.id)
            const canAfford = o.currency === 'coins' ? pet.coins >= o.salePrice : pet.kc >= o.salePrice
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isBought ? 'rgba(74,222,128,.06)' : 'rgba(255,68,68,.08)', border: `1px solid ${isBought ? 'rgba(74,222,128,.3)' : 'rgba(255,68,68,.25)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 28 }}>{o.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{o.desc}</div>
                  <div style={{ fontSize: 10, marginTop: 2 }}>
                    <span style={{ color: '#888', textDecoration: 'line-through' }}>{o.origPrice}{o.currency === 'kc' ? '💎' : '🪙'}</span>
                    <span style={{ color: '#f87171', fontWeight: 900, marginLeft: 6 }}>{o.salePrice}{o.currency === 'kc' ? '💎' : '🪙'}</span>
                    <span style={{ color: '#4ade80', fontSize: 10, marginLeft: 6 }}>-50%</span>
                  </div>
                </div>
                {isBought ? (
                  <div style={{ fontSize: 12, color: '#4ade80' }}>✓ Köpt</div>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 12px', fontSize: 12, opacity: canAfford ? 1 : 0.4 }}
                    disabled={!canAfford}
                    onClick={() => buy(o)}
                  >
                    Köp
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Gift Shop panel ─────────────────────────────────────────────────────────
  if (panel === 'giftshop') {
    const GIFTS = [
      { id: 'g1', emoji: '🌈', name: 'Regnbåge-aura', desc: 'Exklusiv aura (équivalent 350🪙 värde)', price: 25, type: 'aura' as const, itemId: 'aura_rainbow' },
      { id: 'g2', emoji: '🐉', name: 'Dragon-skin', desc: 'Sällsynt drakskin', price: 100, type: 'skin' as const, itemId: 'kc_dragon' },
      { id: 'g3', emoji: '🌟', name: 'Mega XP Explosion', desc: '+3000 XP direkt', price: 50, type: 'xp' as const, xp: 3000 },
      { id: 'g4', emoji: '🪙', name: 'Mynt Geyser', desc: '+5000 mynt', price: 40, type: 'coins' as const, coins: 5000 },
      { id: 'g5', emoji: '🛡️', name: 'Streak Shield x5', desc: 'Skyddar streaken 5 dagar', price: 15, type: 'shield' as const, shields: 5 },
      { id: 'g6', emoji: '🎭', name: 'Mystisk Kista', desc: 'Slumpmässig sällsynt belöning', price: 10, type: 'mystery' as const },
      { id: 'g7', emoji: '🔮', name: 'XP × 2 boost', desc: '2× XP i 1 timme', price: 10, type: 'boost' as const },
      { id: 'g8', emoji: '💖', name: 'Full Återhämtning', desc: 'Alla stats → 100', price: 15, type: 'revive' as const },
    ]
    const buy = (g: typeof GIFTS[0]) => {
      if (pet.kc < g.price) { showToast('Inte tillräckligt med KC!', 'error'); return }
      if (!spendKC(g.price)) return
      if (g.type === 'xp') gainXP(g.xp ?? 0, 'giftshop')
      if (g.type === 'coins') gainCoins(g.coins ?? 0)
      if (g.type === 'revive') { setStat('mood', 100); setStat('energy', 100); setStat('hunger', 100) }
      if (g.type === 'mystery') {
        const r = Math.random()
        if (r < 0.3) { gainCoins(2000); showToast('🎭 Mysterium: +2000🪙!', 'success') }
        else if (r < 0.6) { gainXP(1000, 'giftshop'); showToast('🎭 Mysterium: +1000 XP!', 'success') }
        else if (r < 0.85) { gainKC(20); showToast('🎭 Mysterium: +20 KC!', 'success') }
        else { gainKC(100); showToast('🎭 JACKPOT! +100 KC!!!', 'success'); triggerConfetti() }
        audio.achievement()
        return
      }
      showToast(`🎁 ${g.name} aktiverad!`, 'success')
      audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🎁 Presentbutik</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          Exklusiva gåvor för KC · Ditt KC: {pet.kc}💎
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GIFTS.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ fontSize: 28 }}>{g.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{g.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{g.desc}</div>
              </div>
              <button
                className="btn-gold"
                style={{ padding: '8px 12px', fontSize: 12, opacity: pet.kc >= g.price ? 1 : 0.4 }}
                disabled={pet.kc < g.price}
                onClick={() => buy(g)}
              >
                {g.price}💎
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Roulette panel ─────────────────────────────────────────────────────────
  if (panel === 'roulette') {
    const [rBet, setRBet] = useState(50)
    const [rChoice, setRChoice] = useState<'red' | 'black' | 'green' | null>(null)
    const [rResult, setRResult] = useState<{ color: string; num: number } | null>(null)
    const [rSpinning, setRSpinning] = useState(false)

    const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
    const spin = () => {
      if (!rChoice || rSpinning || pet.coins < rBet) return
      setRSpinning(true)
      setRResult(null)
      setTimeout(() => {
        const num = Math.floor(Math.random() * 37)
        const color = num === 0 ? 'green' : REDS.includes(num) ? 'red' : 'black'
        setRResult({ color, num })
        setRSpinning(false)
        const won = color === rChoice
        if (won) {
          const mult = rChoice === 'green' ? 14 : 2
          gainCoins(rBet * mult)
          showToast(`🎰 ${num} ${color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'} — Vann! +${rBet * mult}🪙`, 'success')
          audio.achievement()
        } else {
          spendCoins(rBet)
          showToast(`🎰 ${num} — Förlorade ${rBet}🪙`, 'error')
          audio.click()
        }
      }, 1500)
    }

    const COLOR_COLORS: Record<string, string> = { red: '#f87171', black: '#6b7280', green: '#4ade80' }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🎰 Roulette</div>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Saldo: {pet.coins}🪙</div>
          {rResult && (
            <div style={{ padding: '16px', background: `${COLOR_COLORS[rResult.color]}22`, border: `2px solid ${COLOR_COLORS[rResult.color]}66`, borderRadius: 16, marginBottom: 12, fontSize: 32, fontWeight: 900, color: COLOR_COLORS[rResult.color] }}>
              {rResult.num} {rResult.color === 'red' ? '🔴' : rResult.color === 'black' ? '⚫' : '🟢'}
            </div>
          )}
          {rSpinning && <div style={{ fontSize: 32, marginBottom: 12 }}>⏳ Snurrar...</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Välj insats:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[10, 25, 50, 100, 250, 500].map(b => (
              <button key={b} className={rBet === b ? 'btn-gold' : 'btn-ghost'} style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setRBet(b)}>{b}🪙</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Satsa på:</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['red', 'black', 'green'] as const).map(c => (
              <button
                key={c}
                onClick={() => setRChoice(c)}
                style={{ flex: 1, padding: 14, borderRadius: 14, fontSize: 13, fontWeight: 900, border: `2px solid ${rChoice === c ? COLOR_COLORS[c] : 'rgba(255,255,255,.1)'}`, background: rChoice === c ? `${COLOR_COLORS[c]}22` : 'rgba(255,255,255,.04)', color: COLOR_COLORS[c], cursor: 'pointer' }}
              >
                {c === 'red' ? '🔴 Röd' : c === 'black' ? '⚫ Svart' : '🟢 Grön'}<br />
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>{c === 'green' ? '14×' : '2×'}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: 14, fontSize: 16, opacity: rChoice && pet.coins >= rBet && !rSpinning ? 1 : 0.4 }}
          disabled={!rChoice || pet.coins < rBet || rSpinning}
          onClick={spin}
        >
          🎰 Snurra! ({rBet}🪙)
        </button>
      </div>
    )
  }

  // ── Mailbox panel ─────────────────────────────────────────────────────────
  if (panel === 'mailbox') {
    const MESSAGES = [
      { id: 'm1', from: '🎮 Spelsystemet', subject: 'Välkommen!', body: 'Tack för att du spelar! Du får 100🪙 som välkomstgåva.', reward: { coins: 100 }, emoji: '🎁', date: 'Idag' },
      { id: 'm2', from: '⚔️ Arenan', subject: 'Utmanar dig!', body: 'DragonSlayer999 utmanar dig till en arenaduell!', reward: null, emoji: '⚔️', date: 'Igår' },
      { id: 'm3', from: '🐉 World Boss', subject: 'Boss Raid klar!', body: 'Du bidrog till att besegra Draconus! Belöning: 50🪙.', reward: { coins: 50 }, emoji: '🐉', date: '2 dagar sen' },
      { id: 'm4', from: '🏆 Turneringen', subject: 'Rankninguppdatering', body: 'Du är nu i topp 100 på global topplista!', reward: null, emoji: '🏅', date: '3 dagar sen' },
      { id: 'm5', from: '🌟 Karma Daily', subject: 'Daglig belöning', body: 'Håll koll på din streak för att låsa upp specialbelöningar!', reward: { coins: 25 }, emoji: '📅', date: '4 dagar sen' },
    ]
    const [claimed, setClaimed] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('k0509_mailbox_claimed') ?? '[]') } catch { return [] }
    })
    const claimMsg = (id: string, coins: number) => {
      const next = [...claimed, id]
      setClaimed(next)
      localStorage.setItem('k0509_mailbox_claimed', JSON.stringify(next))
      gainCoins(coins)
      showToast(`📬 Belöning hämtad! +${coins}🪙`, 'success')
      audio.coin()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>📬 Brevlåda</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>{MESSAGES.filter(m => !claimed.includes(m.id)).length} olästa meddelanden</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MESSAGES.map(m => {
            const isRead = claimed.includes(m.id) || !m.reward
            const isClaimed = claimed.includes(m.id)
            return (
              <div key={m.id} style={{ padding: '14px 16px', background: isRead ? 'rgba(255,255,255,.03)' : 'rgba(99,102,241,.08)', border: `1px solid ${isRead ? 'rgba(255,255,255,.07)' : 'rgba(99,102,241,.3)'}`, borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: 26, flexShrink: 0 }}>{m.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.from}</div>
                      <div style={{ fontSize: 10, color: '#444' }}>{m.date}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isRead ? '#888' : '#e8e8f0', marginTop: 2 }}>{m.subject}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, lineHeight: 1.5 }}>{m.body}</div>
                    {m.reward && !isClaimed && (
                      <button className="btn-primary" style={{ marginTop: 8, padding: '6px 14px', fontSize: 12 }} onClick={() => claimMsg(m.id, m.reward!.coins)}>
                        🎁 Hämta {m.reward.coins}🪙
                      </button>
                    )}
                    {isClaimed && <div style={{ fontSize: 11, color: '#4ade80', marginTop: 6 }}>✓ Hämtad</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Cookbook panel ─────────────────────────────────────────────────────────
  if (panel === 'cookbook') {
    const RECIPES = [
      { id: 'r1', name: 'Energisoppa', emoji: '🍲', desc: '+80 energi + 50 XP', cost: 150, costType: 'coins' as const, energy: 80, xp: 50, mood: 0, hunger: 40 },
      { id: 'r2', name: 'Lyckobulle', emoji: '🍞', desc: '+60 humör + 30 XP', cost: 120, costType: 'coins' as const, energy: 0, xp: 30, mood: 60, hunger: 30 },
      { id: 'r3', name: 'Maktbanan', emoji: '🍌', desc: '+100 hunger + 40 XP', cost: 100, costType: 'coins' as const, energy: 20, xp: 40, mood: 10, hunger: 100 },
      { id: 'r4', name: 'Kosmisk Gryta', emoji: '✨', desc: 'Alla stats +50 + 100 XP', cost: 300, costType: 'coins' as const, energy: 50, xp: 100, mood: 50, hunger: 50 },
      { id: 'r5', name: 'Drakstek', emoji: '🐉', desc: 'Alla stats max + 200 XP', cost: 30, costType: 'kc' as const, energy: 100, xp: 200, mood: 100, hunger: 100 },
      { id: 'r6', name: 'Stjärnsoppa', emoji: '🌟', desc: '+500 XP + 200🪙', cost: 20, costType: 'kc' as const, energy: 30, xp: 500, mood: 30, hunger: 30 },
    ]
    const today = new Date().toDateString()
    const [cooked, setCooked] = useState<Record<string, string>>(() => {
      try { return JSON.parse(localStorage.getItem('k0509_cookbook') ?? '{}') } catch { return {} }
    })
    const cook = (r: typeof RECIPES[0]) => {
      if (cooked[r.id] === today) return
      const canAfford = r.costType === 'coins' ? pet.coins >= r.cost : pet.kc >= r.cost
      if (!canAfford) { showToast('Inte tillräckligt med resurser!', 'error'); return }
      if (r.costType === 'coins') spendCoins(r.cost)
      else if (!spendKC(r.cost)) return
      if (r.mood) setStat('mood', Math.min(100, pet.mood + r.mood))
      if (r.energy) setStat('energy', Math.min(100, pet.energy + r.energy))
      if (r.hunger) setStat('hunger', Math.min(100, pet.hunger + r.hunger))
      if (r.xp) gainXP(r.xp, 'cookbook')
      const next = { ...cooked, [r.id]: today }
      setCooked(next)
      localStorage.setItem('k0509_cookbook', JSON.stringify(next))
      showToast(`${r.emoji} ${r.name} lagad! +${r.xp} XP`, 'success')
      audio.coin()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>📖 Kokboken</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>Laga krafträtter · 1 recept per dag per rätt</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RECIPES.map(r => {
            const cookedToday = cooked[r.id] === today
            const canAfford = r.costType === 'coins' ? pet.coins >= r.cost : pet.kc >= r.cost
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: cookedToday ? 'rgba(74,222,128,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${cookedToday ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 28 }}>{r.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{r.desc}</div>
                </div>
                {cookedToday ? (
                  <div style={{ fontSize: 12, color: '#4ade80' }}>✓ Lagad</div>
                ) : (
                  <button
                    className={r.costType === 'kc' ? 'btn-gold' : 'btn-primary'}
                    style={{ padding: '8px 14px', fontSize: 12, opacity: canAfford ? 1 : 0.4 }}
                    disabled={!canAfford}
                    onClick={() => cook(r)}
                  >
                    {r.cost}{r.costType === 'kc' ? '💎' : '🪙'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Forge ──────────────────────────────────────────────────────────────────
  if (panel === 'forge') {
    const FORGE_ITEMS = [
      { id: 'sword', emoji: '⚔️', name: 'Järnsvärd', desc: '+10% skada i strid', cost: 200, tier: 'common' },
      { id: 'shield', emoji: '🛡️', name: 'Stålsköld', desc: '+15% försvar', cost: 350, tier: 'uncommon' },
      { id: 'amulet', emoji: '📿', name: 'Lyckoamuletten', desc: '+10% XP från alla källor', cost: 500, tier: 'rare' },
      { id: 'staff', emoji: '🪄', name: 'Magistaven', desc: '+20% magi & +5% allt', cost: 800, tier: 'epic' },
      { id: 'crown', emoji: '👑', name: 'Kungakronan', desc: 'Ultimat prestigenivå-föremål', cost: 1500, tier: 'legendary' },
    ]
    const tierColor: Record<string, string> = { common: '#9ca3af', uncommon: '#4ade80', rare: '#818cf8', epic: '#c084fc', legendary: '#fbbf24' }
    const forged: string[] = JSON.parse(localStorage.getItem('k0509_forged') ?? '[]')
    const doForge = (item: typeof FORGE_ITEMS[0]) => {
      if (pet.coins < item.cost) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      if (forged.includes(item.id)) { showToast('Redan smitt!', 'info'); return }
      spendCoins(item.cost)
      const next = [...forged, item.id]
      localStorage.setItem('k0509_forged', JSON.stringify(next))
      gainXP(80, 'forge')
      showToast(`⚒️ ${item.name} smitt!`, 'success')
      pushNotif('⚒️', `${item.name} är nu ditt!`)
      triggerConfetti()
      audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>⚒️ Smedjan</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          Smid mäktiga föremål · 🪙{pet.coins} tillgängliga
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FORGE_ITEMS.map(item => {
            const owned = forged.includes(item.id)
            const canAfford = pet.coins >= item.cost
            const tc = tierColor[item.tier]
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: owned ? 'rgba(251,191,36,.06)' : 'rgba(255,255,255,.04)', border: `1px solid ${owned ? 'rgba(251,191,36,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 30 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: tc }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{item.desc}</div>
                  <div style={{ fontSize: 10, color: tc, textTransform: 'uppercase', marginTop: 2 }}>{item.tier}</div>
                </div>
                {owned ? (
                  <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 900 }}>✓ Äger</div>
                ) : (
                  <button className="btn-primary" style={{ padding: '8px 12px', fontSize: 12, opacity: canAfford ? 1 : 0.4 }}
                    disabled={!canAfford} onClick={() => doForge(item)}>
                    {item.cost}🪙
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Enchant ────────────────────────────────────────────────────────────────
  if (panel === 'enchant') {
    const ENCHANTS = [
      { id: 'speed',    emoji: '💨', name: 'Hastighet',   desc: '+10% XP från spel i 24h',      cost: 50,  dur: 86400000 },
      { id: 'strength', emoji: '💪', name: 'Styrka',      desc: '+15% stridspower i 24h',        cost: 75,  dur: 86400000 },
      { id: 'wisdom',   emoji: '🧠', name: 'Visdom',      desc: '+20% XP från alla källor i 24h', cost: 100, dur: 86400000 },
      { id: 'fortune',  emoji: '🍀', name: 'Lycka',       desc: '+15% mynt från allt i 24h',     cost: 125, dur: 86400000 },
    ]
    const now = Date.now()
    const active: Record<string, number> = JSON.parse(localStorage.getItem('k0509_enchant') ?? '{}')
    const doEnchant = (e: typeof ENCHANTS[0]) => {
      if (pet.kc < e.cost) { showToast('Inte tillräckligt med KC!', 'error'); return }
      if (active[e.id] && active[e.id] > now) { showToast('Redan aktiv!', 'info'); return }
      spendKC(e.cost)
      active[e.id] = now + e.dur
      localStorage.setItem('k0509_enchant', JSON.stringify(active))
      gainXP(60, 'enchant')
      showToast(`✨ ${e.name} aktiverad i 24h!`, 'success')
      audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>✨ Förtrollning</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          Aktiva förtrollningar · 💎{pet.kc} KC
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ENCHANTS.map(e => {
            const isActive = active[e.id] && active[e.id] > now
            const remaining = isActive ? Math.ceil((active[e.id] - now) / 3600000) : 0
            const canAfford = pet.kc >= e.cost
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isActive ? 'rgba(168,85,247,.1)' : 'rgba(255,255,255,.04)', border: `1px solid ${isActive ? 'rgba(168,85,247,.35)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 30 }}>{e.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? '#c084fc' : '#e8e8f0' }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{e.desc}</div>
                  {isActive && <div style={{ fontSize: 10, color: '#c084fc', marginTop: 2 }}>⏱ {remaining}h kvar</div>}
                </div>
                {isActive ? (
                  <div style={{ fontSize: 12, color: '#c084fc', fontWeight: 900 }}>✨ Aktiv</div>
                ) : (
                  <button className="btn-gold" style={{ padding: '8px 12px', fontSize: 12, opacity: canAfford ? 1 : 0.4 }}
                    disabled={!canAfford} onClick={() => doEnchant(e)}>
                    {e.cost}💎
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Museum ─────────────────────────────────────────────────────────────────
  if (panel === 'museum') {
    const forged: string[] = JSON.parse(localStorage.getItem('k0509_forged') ?? '[]')
    void FISH_TYPES
    const achCount = unlockedAchievements.length
    const totalAch = 57
    const collScore = achCount * 10 + forged.length * 20 + pet.battleWins * 2 + Math.min(pet.fishCaught, 200)
    const SECTIONS = [
      { emoji: '🏆', label: 'Prestationer', value: `${achCount}/${totalAch}`, sub: `${Math.round(achCount / totalAch * 100)}% klart` },
      { emoji: '⚔️', label: 'Stridssegrar', value: String(pet.battleWins), sub: 'totala vinster' },
      { emoji: '🎣', label: 'Fångade fiskar', value: String(pet.fishCaught), sub: 'totalt' },
      { emoji: '⚒️', label: 'Smidda föremål', value: `${forged.length}/5`, sub: 'smedjan' },
      { emoji: '🗺️', label: 'Expeditioner', value: String(pet.expeditionsDone), sub: 'genomförda' },
      { emoji: '💬', label: 'Inlägg', value: String(pet.postCount), sub: 'i communityn' },
      { emoji: '⭐', label: 'Nuvarande nivå', value: String(pet.level), sub: `${pet.bpassXP} total XP` },
      { emoji: '🪙', label: 'Totala tryckar', value: String(pet.totalTaps), sub: 'husdjurstryckar' },
    ]
    const tierLabel = collScore >= 1000 ? '🏛️ Museumsmästare' : collScore >= 500 ? '🥇 Samlare' : collScore >= 200 ? '🥈 Nybörjare' : '🥉 Ny'
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🏛️ Museet</div>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 900, color: '#fbbf24' }}>{collScore}</div>
          <div style={{ fontSize: 12, color: '#fbbf24' }}>{tierLabel}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Samlarpoäng</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SECTIONS.map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{s.emoji}</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#e8e8f0', marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── PvP Rank ───────────────────────────────────────────────────────────────
  if (panel === 'pvprank') {
    const score = pet.battleWins * 15 + pet.level * 10 + Math.min(pet.bpassXP / 100, 500)
    const TIERS = [
      { name: 'Brons', emoji: '🥉', min: 0,    color: '#cd7f32' },
      { name: 'Silver', emoji: '🥈', min: 200,  color: '#c0c0c0' },
      { name: 'Guld',   emoji: '🥇', min: 500,  color: '#fbbf24' },
      { name: 'Platina',emoji: '💎', min: 1000, color: '#818cf8' },
      { name: 'Diamant',emoji: '🔷', min: 2000, color: '#38bdf8' },
      { name: 'Mästare',emoji: '👑', min: 3500, color: '#a855f7' },
    ]
    const tier = [...TIERS].reverse().find(t => score >= t.min) ?? TIERS[0]
    const nextTier = TIERS[TIERS.indexOf(tier) + 1]
    const progress = nextTier ? Math.min(((score - tier.min) / (nextTier.min - tier.min)) * 100, 100) : 100
    const FAKE_RIVALS = [
      { name: 'DragonMaster', emoji: '🐲', score: score + 42, rank: 1 },
      { name: 'StarWolf',     emoji: '🐺', score: score + 18, rank: 2 },
      { name: pet.petEmoji + ' Du',        score: Math.round(score), rank: 3 },
      { name: 'CrystalFox',  emoji: '🦊', score: score - 24, rank: 4 },
      { name: 'NovaBear',    emoji: '🐻', score: score - 67, rank: 5 },
    ].map((r, i) => ({ ...r, emoji: r.emoji ?? r.name.split(' ')[0], name: r.name.includes('Du') ? `${pet.petEmoji} Du` : r.name, rank: i + 1 }))
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🥊 PvP Rang</div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 52 }}>{tier.emoji}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: tier.color }}>{tier.name}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>{Math.round(score)} rankpoäng</div>
          {nextTier && (
            <div style={{ marginTop: 10, padding: '0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginBottom: 4 }}>
                <span>{tier.name}</span><span>{nextTier.name} ({nextTier.min}p)</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: tier.color, borderRadius: 3, transition: 'width .5s' }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FAKE_RIVALS.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: r.name.includes('Du') ? 'rgba(99,102,241,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${r.name.includes('Du') ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: r.rank === 1 ? '#fbbf24' : 'var(--t3)', minWidth: 20 }}>#{r.rank}</div>
              <div style={{ fontSize: 22 }}>{r.emoji}</div>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 13, color: r.name.includes('Du') ? '#818cf8' : '#e8e8f0' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>{r.score}p</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  if (panel === 'inventory') {
    const forged: string[] = JSON.parse(localStorage.getItem('k0509_forged') ?? '[]')
    const FORGE_MAP: Record<string, { emoji: string; name: string }> = {
      sword: { emoji: '⚔️', name: 'Järnsvärd' }, shield: { emoji: '🛡️', name: 'Stålsköld' },
      amulet: { emoji: '📿', name: 'Lyckoamuletten' }, staff: { emoji: '🪄', name: 'Magistaven' },
      crown: { emoji: '👑', name: 'Kungakronan' },
    }
    const ownedHats = (pet as unknown as Record<string, string[]>).ownedHats ?? []
    const ownedAcc = (pet as unknown as Record<string, string[]>).ownedAccessories ?? []
    const allItems: { emoji: string; name: string; type: string }[] = [
      ...forged.map(id => ({ ...FORGE_MAP[id] ?? { emoji: '❓', name: id }, type: 'Smidd' })),
      ...ownedHats.map((id: string) => ({ emoji: '🎩', name: id, type: 'Hatt' })),
      ...ownedAcc.map((id: string) => ({ emoji: '✨', name: id, type: 'Accessoar' })),
    ]
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🎒 Ryggsäck</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          {allItems.length} föremål · Nivå {pet.level} ryggsäck
        </div>
        {allItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)', fontSize: 13 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎒</div>
            Ryggsäcken är tom — smid föremål i Smedjan!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {allItems.map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>{item.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e8f0', marginTop: 4 }}>{item.name}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{item.type}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 12, fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>
          🪙 {pet.coins} mynt · 💎 {pet.kc} KC
        </div>
      </div>
    )
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  if (panel === 'events') {
    const hour = new Date().getHours()
    const day = new Date().getDay()
    const isWeekend = day === 0 || day === 6
    const EVENTS = [
      { emoji: isWeekend ? '🎉' : '🌅', name: isWeekend ? 'Helgfestival' : 'Morgon-XP', desc: isWeekend ? 'Alla spel +25% XP hela helgen!' : '+20% XP t.o.m. kl. 10:00', active: isWeekend || hour < 10, color: '#fbbf24' },
      { emoji: '🍽️', name: 'Lunchlycka', desc: 'Fiske ger dubbel XP 11:00–14:00', active: hour >= 11 && hour < 14, color: '#4ade80' },
      { emoji: '🌆', name: 'Kvällsbonus', desc: '+30% mynt i alla spel 18:00–22:00', active: hour >= 18 && hour < 22, color: '#818cf8' },
      { emoji: '🐉', name: 'World Boss', desc: 'Vecklig boss — hög XP-belöning', active: day === 3, color: '#f87171' },
      { emoji: '🎰', name: 'Lucky Hour', desc: 'Lucky Box ger dubbla belöningar', active: hour === 12 || hour === 20, color: '#c084fc' },
      { emoji: '🌙', name: 'Nattbonus', desc: '+15% KC från expeditioner 22:00–06:00', active: hour >= 22 || hour < 6, color: '#38bdf8' },
    ]
    const UPCOMING = [
      { emoji: '🎃', name: 'Halloween Event', date: 'Okt 2026', desc: 'Spökhusdjur & sällsynta drops' },
      { emoji: '❄️', name: 'Vinter Wonderland', date: 'Dec 2026', desc: 'Snöhusdjur + exklusiva skins' },
      { emoji: '🎆', name: 'Nyårsfest 2027', date: 'Jan 2027', desc: 'Fyrverkeritema + 2x allt' },
    ]
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>📆 Händelser</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 10 }}>🟢 Aktiva nu</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {EVENTS.map(e => (
            <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: e.active ? `rgba(${e.color === '#fbbf24' ? '251,191,36' : e.color === '#4ade80' ? '74,222,128' : '99,102,241'},.08)` : 'rgba(255,255,255,.03)', border: `1px solid ${e.active ? e.color + '44' : 'rgba(255,255,255,.06)'}`, borderRadius: 12, opacity: e.active ? 1 : 0.5 }}>
              <div style={{ fontSize: 22 }}>{e.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: e.active ? e.color : '#888' }}>{e.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{e.desc}</div>
              </div>
              {e.active && <div style={{ fontSize: 10, color: e.color, fontWeight: 900 }}>LIVE</div>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', marginBottom: 10 }}>🔮 Kommande</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {UPCOMING.map(e => (
            <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12 }}>
              <div style={{ fontSize: 22 }}>{e.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f0' }}>{e.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{e.desc}</div>
              </div>
              <div style={{ fontSize: 10, color: '#818cf8', fontWeight: 700 }}>{e.date}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Stickers ───────────────────────────────────────────────────────────────
  if (panel === 'stickers') {
    const ALL_STICKERS = [
      { id: 's1', emoji: '⭐', name: 'Stjärna',      unlock: () => pet.level >= 5 },
      { id: 's2', emoji: '🔥', name: 'Eldkraft',     unlock: () => pet.totalTaps >= 100 },
      { id: 's3', emoji: '🎣', name: 'Fiskaren',     unlock: () => pet.fishCaught >= 10 },
      { id: 's4', emoji: '⚔️', name: 'Krigaren',     unlock: () => pet.battleWins >= 5 },
      { id: 's5', emoji: '🏆', name: 'Mästaren',     unlock: () => pet.level >= 20 },
      { id: 's6', emoji: '💎', name: 'Diamant',      unlock: () => pet.kc >= 50 },
      { id: 's7', emoji: '🌈', name: 'Regnbåge',     unlock: () => pet.streak >= 7 },
      { id: 's8', emoji: '🚀', name: 'Raket',        unlock: () => pet.expeditionsDone >= 3 },
      { id: 's9', emoji: '🧠', name: 'Geniet',       unlock: () => unlockedAchievements.length >= 10 },
      { id: 's10',emoji: '👑', name: 'Kung/Drottning',unlock: () => pet.level >= 50 },
      { id: 's11',emoji: '🌙', name: 'Nattlig',      unlock: () => new Date().getHours() >= 22 || new Date().getHours() < 6 },
      { id: 's12',emoji: '🐉', name: 'Drakjägare',   unlock: () => pet.battleWins >= 50 },
    ]
    const equippedKey = 'k0509_sticker_equipped'
    const equipped: string[] = JSON.parse(localStorage.getItem(equippedKey) ?? '[]')
    const toggleSticker = (id: string) => {
      const next = equipped.includes(id) ? equipped.filter(e => e !== id) : equipped.length < 3 ? [...equipped, id] : equipped
      localStorage.setItem(equippedKey, JSON.stringify(next))
      showToast(equipped.includes(id) ? 'Klistermärke borttaget' : 'Klistermärke utrustat!', 'success')
      audio.click()
    }
    const unlockedCount = ALL_STICKERS.filter(s => s.unlock()).length
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🌟 Klistermärken</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 6 }}>
          {unlockedCount}/{ALL_STICKERS.length} upplåsta · Utrusta upp till 3 st
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
          {equipped.length === 0 ? <span style={{ fontSize: 12, color: 'var(--t3)' }}>Inga utrustade</span> : equipped.map(id => {
            const s = ALL_STICKERS.find(s => s.id === id)
            return s ? <span key={id} style={{ fontSize: 28 }}>{s.emoji}</span> : null
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ALL_STICKERS.map(s => {
            const unlocked = s.unlock()
            const isEquipped = equipped.includes(s.id)
            return (
              <button key={s.id} onClick={() => unlocked && toggleSticker(s.id)} style={{
                padding: '12px 10px', borderRadius: 12, textAlign: 'center', cursor: unlocked ? 'pointer' : 'default',
                background: isEquipped ? 'rgba(251,191,36,.15)' : unlocked ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)',
                border: `1px solid ${isEquipped ? 'rgba(251,191,36,.4)' : unlocked ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)'}`,
                opacity: unlocked ? 1 : 0.45,
              }}>
                <div style={{ fontSize: 30 }}>{unlocked ? s.emoji : '🔒'}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? '#e8e8f0' : '#555', marginTop: 4 }}>{s.name}</div>
                {isEquipped && <div style={{ fontSize: 10, color: '#fbbf24' }}>✓ Utrustad</div>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Gifting ────────────────────────────────────────────────────────────────
  if (panel === 'gifting') {
    const GIFTS = [
      { id: 'g1', emoji: '🍎', name: 'Äppelpåse',   desc: '+30 hunger till mottagaren', cost: 30 },
      { id: 'g2', emoji: '💝', name: 'Hjärtat',      desc: '+20 bond till mottagaren',   cost: 50 },
      { id: 'g3', emoji: '⭐', name: 'Stjärna',      desc: '+200 XP till mottagaren',    cost: 100 },
      { id: 'g4', emoji: '🎁', name: 'Mysterielåda', desc: 'Slumpad belöning x3',        cost: 200 },
      { id: 'g5', emoji: '👑', name: 'Kungsgåva',    desc: '+1000 mynt till mottagaren', cost: 500 },
    ]
    const FAKE_FRIENDS = ['StarWolf 🐺','CrystalFox 🦊','NovaHawk 🦅','DragonCat 🐱','BlazeKnight 🔥']
    const [selFriend, setSelFriend] = useState(FAKE_FRIENDS[0])
    const giftToday = localStorage.getItem('k0509_gift_today') === new Date().toDateString()
    const sendGift = (gift: typeof GIFTS[0]) => {
      if (pet.coins < gift.cost) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      if (giftToday) { showToast('Redan skickat en gåva idag!', 'info'); return }
      spendCoins(gift.cost)
      localStorage.setItem('k0509_gift_today', new Date().toDateString())
      gainXP(50, 'gift')
      showToast(`🎀 Skickade ${gift.name} till ${selFriend}!`, 'success')
      pushNotif('🎀', `Gåva skickad till ${selFriend}!`)
      audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🎀 Gåvor</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 12 }}>
          Skicka 1 gåva per dag · 🪙{pet.coins}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Välj mottagare:</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {FAKE_FRIENDS.map(f => (
            <button key={f} onClick={() => setSelFriend(f)} style={{ padding: '5px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: selFriend === f ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.05)', border: `1px solid ${selFriend === f ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.1)'}`, color: selFriend === f ? '#818cf8' : '#888', cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GIFTS.map(gift => (
            <div key={gift.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14 }}>
              <div style={{ fontSize: 26 }}>{gift.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{gift.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{gift.desc}</div>
              </div>
              <button className="btn-primary" style={{ padding: '7px 12px', fontSize: 11, opacity: (!giftToday && pet.coins >= gift.cost) ? 1 : 0.4 }}
                disabled={giftToday || pet.coins < gift.cost} onClick={() => sendGift(gift)}>
                {gift.cost}🪙
              </button>
            </div>
          ))}
        </div>
        {giftToday && <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#4ade80' }}>✓ Gåva skickad idag!</div>}
      </div>
    )
  }

  // ── Pet Home ───────────────────────────────────────────────────────────────
  if (panel === 'pethome') {
    const HOME_ITEMS = [
      { id: 'h1', emoji: '🛋️', name: 'Soffa',       desc: '+5 energi/dag', cost: 300 },
      { id: 'h2', emoji: '🌿', name: 'Krukväxt',     desc: '+3 humör/dag',  cost: 150 },
      { id: 'h3', emoji: '🖼️', name: 'Tavla',        desc: '+5% XP hemma',  cost: 400 },
      { id: 'h4', emoji: '🎮', name: 'Spelkonsol',   desc: '+10% game XP',  cost: 600 },
      { id: 'h5', emoji: '🏊', name: 'Pool',         desc: '+8 humör/dag',  cost: 800 },
      { id: 'h6', emoji: '🌟', name: 'Stjärnlampa',  desc: '+5% alla bonusar',cost:1200 },
    ]
    const owned: string[] = JSON.parse(localStorage.getItem('k0509_home') ?? '[]')
    const buyItem = (item: typeof HOME_ITEMS[0]) => {
      if (pet.coins < item.cost) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      if (owned.includes(item.id)) { showToast('Redan köpt!', 'info'); return }
      spendCoins(item.cost); gainXP(100, 'home')
      const next = [...owned, item.id]; localStorage.setItem('k0509_home', JSON.stringify(next))
      showToast(`🏠 ${item.name} köpt!`, 'success'); triggerConfetti(); audio.achievement()
    }
    const homeScore = owned.length * 20
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🏠 Husdjurshus</div>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 40 }}>{pet.petEmoji}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Hemnivå: {homeScore} · {owned.length}/{HOME_ITEMS.length} möbler</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', padding: '8px 0', marginBottom: 12, background: 'rgba(255,255,255,.02)', borderRadius: 12 }}>
          {owned.length === 0 ? <span style={{ fontSize: 12, color: 'var(--t3)', padding: '8px 0' }}>Hemmet är tomt — köp möbler!</span>
            : owned.map(id => { const item = HOME_ITEMS.find(i => i.id === id); return item ? <span key={id} style={{ fontSize: 28 }}>{item.emoji}</span> : null })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HOME_ITEMS.map(item => {
            const isOwned = owned.includes(item.id)
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: isOwned ? 'rgba(74,222,128,.06)' : 'rgba(255,255,255,.04)', border: `1px solid ${isOwned ? 'rgba(74,222,128,.25)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 26 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{item.desc}</div>
                </div>
                {isOwned ? <div style={{ fontSize: 12, color: '#4ade80' }}>✓ Köpt</div> : (
                  <button className="btn-primary" style={{ padding: '7px 12px', fontSize: 11, opacity: pet.coins >= item.cost ? 1 : 0.4 }}
                    disabled={pet.coins < item.cost} onClick={() => buyItem(item)}>
                    {item.cost}🪙
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Potions ────────────────────────────────────────────────────────────────
  if (panel === 'potions') {
    const BREWS = [
      { id: 'b1', emoji: '❤️', name: 'Livselixir',   desc: '+50 hunger +50 humör',    kc: 30,  dur: 0 },
      { id: 'b2', emoji: '⚡', name: 'Energidryck',  desc: '+100 energi omedelbart',   kc: 40,  dur: 0 },
      { id: 'b3', emoji: '🌟', name: 'XP-potion',    desc: '+500 XP direkt',           kc: 60,  dur: 0 },
      { id: 'b4', emoji: '🍀', name: 'Luckpotion',   desc: '+20% drops i 1h',          kc: 80,  dur: 3600000 },
      { id: 'b5', emoji: '💪', name: 'Styrkebrygd',  desc: '+25% battle power i 2h',   kc: 100, dur: 7200000 },
      { id: 'b6', emoji: '🧠', name: 'Visdomsdryck', desc: '+30% XP i 3h',             kc: 150, dur: 10800000 },
    ]
    const active: Record<string, number> = JSON.parse(localStorage.getItem('k0509_potions') ?? '{}')
    const now = Date.now()
    const brew = (b: typeof BREWS[0]) => {
      if (pet.kc < b.kc) { showToast('Inte tillräckligt KC!', 'error'); return }
      if (b.dur && active[b.id] && active[b.id] > now) { showToast('Redan aktiv!', 'info'); return }
      spendKC(b.kc)
      if (b.id === 'b1') { setStat('hunger', Math.min(pet.hunger + 50, 100)); setStat('mood', Math.min(pet.mood + 50, 100)) }
      if (b.id === 'b2') { setStat('energy', 100) }
      if (b.id === 'b3') { gainXP(500, 'potion') }
      if (b.dur) { active[b.id] = now + b.dur; localStorage.setItem('k0509_potions', JSON.stringify(active)) }
      showToast(`🧪 ${b.name} brygd!`, 'success'); audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🧪 Bryggeriet</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>💎 {pet.kc} KC tillgängliga</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BREWS.map(b => {
            const isActive = b.dur && active[b.id] && active[b.id] > now
            const remaining = isActive ? Math.ceil((active[b.id] - now) / 60000) : 0
            return (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: isActive ? 'rgba(168,85,247,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${isActive ? 'rgba(168,85,247,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 26 }}>{b.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? '#c084fc' : '#e8e8f0' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{b.desc}</div>
                  {isActive && <div style={{ fontSize: 10, color: '#c084fc', marginTop: 2 }}>⏱ {remaining}min kvar</div>}
                </div>
                {isActive ? <div style={{ fontSize: 12, color: '#c084fc' }}>✨</div> : (
                  <button className="btn-gold" style={{ padding: '7px 12px', fontSize: 11, opacity: pet.kc >= b.kc ? 1 : 0.4 }}
                    disabled={pet.kc < b.kc} onClick={() => brew(b)}>{b.kc}💎</button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Arena 2 ────────────────────────────────────────────────────────────────
  if (panel === 'arena2') {
    const TIERS = ['Brons','Silver','Guld','Platina','Diamant','Legendarisk']
    const wins = pet.battleWins
    const tierIdx = Math.min(Math.floor(wins / 10), 5)
    const tierName = TIERS[tierIdx]
    const tierProgress = (wins % 10) / 10 * 100
    const MATCHES = [
      { name: 'QuickDuel',   desc: 'Snabb 1v1, 3 rundor',   reward: '🪙50-150',  cost: 0 },
      { name: 'Ranked',      desc: 'Rankad match — kräver nivå 10+', reward: '🪙100-300', cost: 0 },
      { name: 'Tournament',  desc: 'Eliminationsserie 8 spelare',    reward: '🪙500+',    cost: 20 },
      { name: 'Championship',desc: 'Mästerskapsmatch — topptier',    reward: '🪙1000+',   cost: 50 },
    ]
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🏟️ Grand Arena</div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>{tierName}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>{wins} totala stridssegrar</div>
          <div style={{ margin: '8px 16px 0', height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${tierProgress}%`, background: '#fbbf24', borderRadius: 3, transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>{wins % 10}/10 till nästa tier</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MATCHES.map(m => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.desc}</div>
                <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 2 }}>{m.reward}</div>
              </div>
              <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}
                onClick={() => { showToast(`⚔️ ${m.name} startar...`, 'info'); audio.click() }}>
                {m.cost > 0 ? `${m.cost}💎 Gå med` : 'Gå med'}
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Cosmetics ──────────────────────────────────────────────────────────────
  if (panel === 'cosmetics') {
    const ownedHatIds: string[] = (pet as unknown as Record<string, string[]>).ownedHats ?? []
    const ownedAccIds: string[] = (pet as unknown as Record<string, string[]>).ownedAccessories ?? []
    const ownedAuraIds: string[] = (pet as unknown as Record<string, string[]>).ownedAuras ?? []
    const totalOwned = ownedHatIds.length + ownedAccIds.length + ownedAuraIds.length
    const SECTIONS = [
      { label: 'Hattar', emoji: '🎩', owned: ownedHatIds.length, total: SHOP_HATS.length },
      { label: 'Accessoarer', emoji: '✨', owned: ownedAccIds.length, total: SHOP_ACC.length },
      { label: 'Auror', emoji: '🌟', owned: ownedAuraIds.length, total: SHOP_AURA.length },
    ]
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>💅 Kosmetika</div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 40 }}>{pet.petEmoji}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#e8e8f0', marginTop: 8 }}>{pet.petName}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{totalOwned} kosmetika ägda</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTIONS.map(s => (
            <div key={s.label} style={{ padding: '14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{s.emoji} {s.label}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>{s.owned}/{s.total}</div>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.total > 0 ? (s.owned/s.total)*100 : 0}%`, background: '#a855f7', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>
                {s.owned === 0 ? 'Ingen ägd ännu — besök Shoppen!' : s.owned === s.total ? '✅ Komplett!' : `${s.total - s.owned} kvar att låsa upp`}
              </div>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ marginTop: 14, padding: '12px', width: '100%' }}
          onClick={() => { showToast('Öppnar shoppen...', 'info'); onBack() }}>
          🛍️ Gå till Shoppen
        </button>
      </div>
    )
  }

  // ── Garden ─────────────────────────────────────────────────────────────────
  if (panel === 'garden') {
    const PLOTS = [
      { id: 'p1', emoji: '🌻', name: 'Solros',    cost: 20,  xp: 50,  time: 1 },
      { id: 'p2', emoji: '🌷', name: 'Tulpan',    cost: 35,  xp: 80,  time: 2 },
      { id: 'p3', emoji: '🌹', name: 'Ros',       cost: 60,  xp: 130, time: 4 },
      { id: 'p4', emoji: '🌸', name: 'Körsbärsblomma', cost: 100, xp: 200, time: 8 },
      { id: 'p5', emoji: '🌺', name: 'Hibiskus',  cost: 150, xp: 300, time: 12 },
      { id: 'p6', emoji: '💐', name: 'Bukett',    cost: 250, xp: 500, time: 24 },
    ]
    const gardenKey = 'k0509_garden'
    const garden: Record<string, number> = JSON.parse(localStorage.getItem(gardenKey) ?? '{}')
    const now = Date.now()
    const plant = (p: typeof PLOTS[0]) => {
      if (pet.coins < p.cost) { showToast('Inte tillräckligt mynt!', 'error'); return }
      if (garden[p.id] && garden[p.id] > now) { showToast('Växer fortfarande!', 'info'); return }
      spendCoins(p.cost)
      garden[p.id] = now + p.time * 3600000
      localStorage.setItem(gardenKey, JSON.stringify(garden))
      showToast(`🌱 ${p.name} planterad!`, 'success')
      audio.click()
    }
    const harvest = (p: typeof PLOTS[0]) => {
      delete garden[p.id]
      localStorage.setItem(gardenKey, JSON.stringify(garden))
      gainXP(p.xp, 'garden'); gainCoins(Math.round(p.cost * 1.5))
      showToast(`🌸 ${p.name} skördad! +${p.xp} XP`, 'success')
      triggerConfetti(); audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🌻 Trädgård</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>🪙{pet.coins} · Plantera & skörda</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PLOTS.map(p => {
            const plantTime = garden[p.id]
            const growing = plantTime && plantTime > now
            const ready = plantTime && plantTime <= now
            const remaining = growing ? Math.ceil((plantTime - now) / 3600000) : 0
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: ready ? 'rgba(74,222,128,.08)' : growing ? 'rgba(251,191,36,.06)' : 'rgba(255,255,255,.04)', border: `1px solid ${ready ? 'rgba(74,222,128,.3)' : growing ? 'rgba(251,191,36,.2)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 26 }}>{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>+{p.xp} XP · {p.time}h</div>
                  {growing && <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 2 }}>🌱 {remaining}h kvar</div>}
                </div>
                {ready ? (
                  <button className="btn-primary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => harvest(p)}>Skörda!</button>
                ) : growing ? (
                  <div style={{ fontSize: 12, color: '#fbbf24' }}>⏳</div>
                ) : (
                  <button className="btn-primary" style={{ padding: '7px 12px', fontSize: 11, opacity: pet.coins >= p.cost ? 1 : 0.4 }}
                    disabled={pet.coins < p.cost} onClick={() => plant(p)}>{p.cost}🪙</button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Rescue ─────────────────────────────────────────────────────────────────
  if (panel === 'rescue') {
    const MISSIONS = [
      { id: 'r1', emoji: '🐶', name: 'Vilsen hund',      desc: 'Lös 3 minispel',     reward: 100, xp: 150, reqs: 'Nivå 1+' },
      { id: 'r2', emoji: '🐱', name: 'Strandsatt katt',  desc: 'Slutför expedition',  reward: 200, xp: 250, reqs: 'Nivå 5+' },
      { id: 'r3', emoji: '🐦', name: 'Skadad fågel',     desc: 'Vinn 5 strider',      reward: 350, xp: 400, reqs: 'Nivå 10+' },
      { id: 'r4', emoji: '🦊', name: 'Räddad räv',       desc: 'Fiska 10 fiskar',     reward: 500, xp: 600, reqs: 'Nivå 15+' },
      { id: 'r5', emoji: '🐻', name: 'Förlorad björn',   desc: 'Nå Platina-rang',     reward: 800, xp: 1000, reqs: 'Nivå 20+' },
    ]
    const rescuedKey = 'k0509_rescued'
    const rescued: string[] = JSON.parse(localStorage.getItem(rescuedKey) ?? '[]')
    const attemptRescue = (m: typeof MISSIONS[0]) => {
      if (rescued.includes(m.id)) { showToast('Redan räddad!', 'info'); return }
      const minLevel = parseInt(m.reqs.replace('Nivå ','').replace('+',''))
      if (pet.level < minLevel) { showToast(`Kräver nivå ${minLevel}!`, 'error'); return }
      const next = [...rescued, m.id]; localStorage.setItem(rescuedKey, JSON.stringify(next))
      gainCoins(m.reward); gainXP(m.xp, 'rescue')
      showToast(`🦺 ${m.name} räddad! +${m.reward}🪙 +${m.xp} XP`, 'success')
      triggerConfetti(); audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🦺 Räddningsuppdrag</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          {rescued.length}/{MISSIONS.length} räddade · Nivå {pet.level}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MISSIONS.map(m => {
            const done = rescued.includes(m.id)
            const minLevel = parseInt(m.reqs.replace('Nivå ','').replace('+',''))
            const canDo = pet.level >= minLevel
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: done ? 'rgba(74,222,128,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${done ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14, opacity: (!done && !canDo) ? 0.5 : 1 }}>
                <div style={{ fontSize: 26 }}>{m.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.desc}</div>
                  <div style={{ fontSize: 10, color: done ? '#4ade80' : canDo ? '#fbbf24' : '#f87171', marginTop: 2 }}>{done ? '✓ Klar' : m.reqs}</div>
                </div>
                {done ? (
                  <div style={{ fontSize: 12, color: '#4ade80' }}>✓</div>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#fbbf24' }}>+{m.reward}🪙</div>
                    <button className="btn-primary" style={{ padding: '6px 10px', fontSize: 11, marginTop: 4, opacity: canDo ? 1 : 0.4 }}
                      disabled={!canDo} onClick={() => attemptRescue(m)}>Rädda!</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  if (panel === 'stats') {
    const sessionKey = 'k0509_session_start'
    const sessionStart = Number(localStorage.getItem(sessionKey) ?? Date.now())
    const sessionMins = Math.floor((Date.now() - sessionStart) / 60000)
    const coinsPerHour = sessionMins > 0 ? Math.round((pet.coins / sessionMins) * 60) : 0
    const METRICS = [
      { label: 'Nuvarande nivå',     value: String(pet.level),         emoji: '⭐' },
      { label: 'Total XP',           value: String(pet.bpassXP),       emoji: '✨' },
      { label: 'Mynt',               value: `${pet.coins}🪙`,          emoji: '💰' },
      { label: 'KC',                 value: `${pet.kc}💎`,             emoji: '💎' },
      { label: 'Totala tryck',       value: String(pet.totalTaps),     emoji: '👆' },
      { label: 'Stridssegrar',       value: String(pet.battleWins),    emoji: '⚔️' },
      { label: 'Fiskar fångade',     value: String(pet.fishCaught),    emoji: '🎣' },
      { label: 'Expeditioner',       value: String(pet.expeditionsDone), emoji: '🗺️' },
      { label: 'Inlägg',             value: String(pet.postCount),     emoji: '💬' },
      { label: 'Nuv. streak',        value: `${pet.streak} dagar`,     emoji: '🔥' },
      { label: 'Bond-poäng',         value: String(pet.bondPoints),    emoji: '💚' },
      { label: 'Prestationer',       value: String(unlockedAchievements.length), emoji: '🏆' },
      { label: 'Speltid i session',  value: `${sessionMins} min`,      emoji: '⏱️' },
      { label: 'XP per minut (snittt)', value: sessionMins > 0 ? String(Math.round(pet.bpassXP / Math.max(sessionMins, 1))) : '—', emoji: '📈' },
    ]
    if (!localStorage.getItem(sessionKey)) localStorage.setItem(sessionKey, String(Date.now()))
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>📈 Statistik</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {METRICS.map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{m.emoji}</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 900, color: '#e8e8f0' }}>{m.value}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── League Table ───────────────────────────────────────────────────────────
  if (panel === 'leaguetable') {
    const myScore = pet.level * 100 + pet.bpassXP / 10 + pet.battleWins * 20
    const LEAGUE = [
      { name: 'DragonLord',  emoji: '🐉', score: Math.round(myScore * 1.35), tier: 'Platina' },
      { name: 'StarMage',    emoji: '🌟', score: Math.round(myScore * 1.18), tier: 'Guld' },
      { name: 'CrystalFox',  emoji: '🦊', score: Math.round(myScore * 1.05), tier: 'Guld' },
      { name: pet.petName || 'Du', emoji: pet.petEmoji, score: Math.round(myScore), tier: pet.level >= 30 ? 'Guld' : pet.level >= 15 ? 'Silver' : 'Brons' },
      { name: 'NovaBear',    emoji: '🐻', score: Math.round(myScore * 0.92), tier: 'Silver' },
      { name: 'QuickHawk',   emoji: '🦅', score: Math.round(myScore * 0.78), tier: 'Silver' },
      { name: 'SwiftKitten', emoji: '🐱', score: Math.round(myScore * 0.61), tier: 'Brons' },
      { name: 'WanderPup',   emoji: '🐶', score: Math.round(myScore * 0.44), tier: 'Brons' },
    ].sort((a, b) => b.score - a.score)
    const tierColor: Record<string, string> = { Platina: '#818cf8', Guld: '#fbbf24', Silver: '#c0c0c0', Brons: '#cd7f32' }
    const myRank = LEAGUE.findIndex(e => e.name === (pet.petName || 'Du')) + 1
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🥇 Ligatabell</div>
        <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 12, color: 'var(--t3)' }}>
          Din placering: #{myRank} · Veckoliga
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {LEAGUE.map((e, i) => {
            const isMe = e.name === (pet.petName || 'Du')
            const tc = tierColor[e.tier]
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isMe ? 'rgba(99,102,241,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${isMe ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.07)'}`, borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: i < 3 ? '#fbbf24' : 'var(--t3)', minWidth: 22 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </div>
                <div style={{ fontSize: 20 }}>{e.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isMe ? '#818cf8' : '#e8e8f0' }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: tc }}>{e.tier}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--t3)' }}>{e.score.toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Badges ─────────────────────────────────────────────────────────────────
  if (panel === 'badges') {
    const ALL_BADGES = [
      { id: 'b01', emoji: '🌱', name: 'Nybörjare',      desc: 'Nå nivå 1',               earned: pet.level >= 1 },
      { id: 'b02', emoji: '⭐', name: 'Stigande',        desc: 'Nå nivå 10',              earned: pet.level >= 10 },
      { id: 'b03', emoji: '🌟', name: 'Veteran',         desc: 'Nå nivå 25',              earned: pet.level >= 25 },
      { id: 'b04', emoji: '💫', name: 'Legend',          desc: 'Nå nivå 50',              earned: pet.level >= 50 },
      { id: 'b05', emoji: '🎣', name: 'Fiskaren',        desc: 'Fånga 5 fiskar',          earned: pet.fishCaught >= 5 },
      { id: 'b06', emoji: '🎣', name: 'Mästerfiskare',   desc: 'Fånga 50 fiskar',         earned: pet.fishCaught >= 50 },
      { id: 'b07', emoji: '⚔️', name: 'Krigaren',        desc: '10 stridssegrar',         earned: pet.battleWins >= 10 },
      { id: 'b08', emoji: '⚔️', name: 'Krigsherren',     desc: '100 stridssegrar',        earned: pet.battleWins >= 100 },
      { id: 'b09', emoji: '🔥', name: 'Dedikerad',       desc: '7 dagars streak',         earned: pet.streak >= 7 },
      { id: 'b10', emoji: '🔥', name: 'Oövervinnerlig',  desc: '30 dagars streak',        earned: pet.streak >= 30 },
      { id: 'b11', emoji: '🗺️', name: 'Äventyrare',     desc: '5 expeditioner',          earned: pet.expeditionsDone >= 5 },
      { id: 'b12', emoji: '💎', name: 'Rik',             desc: 'Samla 1000 KC',           earned: pet.kc >= 1000 },
      { id: 'b13', emoji: '🏆', name: 'Prestation',      desc: '10 prestationer',         earned: unlockedAchievements.length >= 10 },
      { id: 'b14', emoji: '🏆', name: 'Samlaren',        desc: '30 prestationer',         earned: unlockedAchievements.length >= 30 },
      { id: 'b15', emoji: '👆', name: 'Klickare',        desc: '1000 totala tryck',       earned: pet.totalTaps >= 1000 },
      { id: 'b16', emoji: '💬', name: 'Social',          desc: '10 inlägg',               earned: pet.postCount >= 10 },
    ]
    const earnedCount = ALL_BADGES.filter(b => b.earned).length
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>🎖️ Märken</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>{earnedCount}/{ALL_BADGES.length} upplåsta</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ALL_BADGES.map(b => (
            <div key={b.id} style={{ background: b.earned ? 'rgba(168,85,247,.1)' : 'rgba(255,255,255,.03)', border: `1px solid ${b.earned ? 'rgba(168,85,247,.3)' : 'rgba(255,255,255,.06)'}`, borderRadius: 12, padding: '10px', textAlign: 'center', opacity: b.earned ? 1 : 0.4 }}>
              <div style={{ fontSize: 26 }}>{b.earned ? b.emoji : '🔒'}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: b.earned ? '#e8e8f0' : '#555', marginTop: 4 }}>{b.name}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Wishlist ───────────────────────────────────────────────────────────────
  if (panel === 'wishlist') {
    const WISHABLE = [
      { id: 'w1', emoji: '👑', name: 'Kungakronan', cost: 1500, type: 'Smedjan' },
      { id: 'w2', emoji: '💎', name: 'Diamantaura', cost: 2000, type: 'Aura' },
      { id: 'w3', emoji: '🐉', name: 'Drake-skin', cost: 3000, type: 'Skin' },
      { id: 'w4', emoji: '🌟', name: 'Stjärntitel', cost: 500, type: 'Titel' },
      { id: 'w5', emoji: '⚡', name: 'Åskbult-accessoar', cost: 800, type: 'Accessoar' },
      { id: 'w6', emoji: '🔮', name: 'Kristallkula', cost: 1200, type: 'Dekor' },
    ]
    const wlKey = 'k0509_wishlist'
    const wishlist: string[] = JSON.parse(localStorage.getItem(wlKey) ?? '[]')
    const toggle = (id: string) => {
      const next = wishlist.includes(id) ? wishlist.filter(w => w !== id) : [...wishlist, id]
      localStorage.setItem(wlKey, JSON.stringify(next))
      showToast(wishlist.includes(id) ? 'Borttagen från önskelista' : '✍️ Tillagd till önskelista!', 'success')
      audio.click()
    }
    return (
      <div className={styles.panelRoot}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
        <div className={styles.panelTitle}>✍️ Önskelista</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 14 }}>
          {wishlist.length} sparade · 🪙{pet.coins} tillgängliga
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {WISHABLE.map(item => {
            const wished = wishlist.includes(item.id)
            const canAfford = pet.coins >= item.cost
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: wished ? 'rgba(99,102,241,.1)' : 'rgba(255,255,255,.04)', border: `1px solid ${wished ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 26 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{item.type} · {item.cost}🪙</div>
                  {canAfford && <div style={{ fontSize: 10, color: '#4ade80', marginTop: 2 }}>✓ Har råd!</div>}
                </div>
                <button onClick={() => toggle(item.id)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, background: wished ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.06)', border: `1px solid ${wished ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.1)'}`, color: wished ? '#818cf8' : '#888', cursor: 'pointer' }}>
                  {wished ? '✓ Önskad' : '+ Spara'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Meditation ─────────────────────────────────────────────────────────────
  if (panel === 'meditation') {
    const [medState, setMedState] = useState<'idle' | 'breathing' | 'done'>('idle')
    const [breathCount, setBreathCount] = useState(0)
    const BREATHS = 5
    const startMed = () => { setMedState('breathing'); setBreathCount(0) }
    const doBreath = () => {
      const next = breathCount + 1
      setBreathCount(next)
      audio.tap()
      if (next >= BREATHS) {
        setMedState('done')
        gainXP(30, 'game')
        setStat('mood', Math.min(100, pet.mood + 20))
        setStat('energy', Math.min(100, pet.energy + 10))
        showToast('🧘 Meditation klar! +20 humör +10 energi', 'success')
      }
    }
    const medKey = `k0509_med_${new Date().toDateString()}`
    const alreadyDone = !!localStorage.getItem(medKey)
    if (medState === 'done' && !alreadyDone) localStorage.setItem(medKey, '1')
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🧘 Meditation</div>
        <div className={styles.panelNote}>Lugna ner husdjuret & boosta humör</div>
        <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {medState === 'idle' && (
            <>
              <div style={{ fontSize: 64 }}>🧘</div>
              <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 240, lineHeight: 1.6 }}>
                Andas djupt {BREATHS} gånger för att lugna ditt husdjur.<br />
                Bonus: +20 humör, +10 energi, +30 XP
              </div>
              {alreadyDone && <div style={{ fontSize: 12, color: '#fbbf24' }}>✓ Redan mediterat idag</div>}
              <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={startMed}>Börja meditera</button>
            </>
          )}
          {medState === 'breathing' && (
            <>
              <div style={{ fontSize: 64, animation: 'pulse 2s ease-in-out infinite' }}>🫁</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#60a5fa' }}>
                Andetag {breathCount}/{BREATHS}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: BREATHS }).map((_, i) => (
                  <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: i < breathCount ? '#4ade80' : 'rgba(255,255,255,.15)' }} />
                ))}
              </div>
              <button style={{ padding: '18px 40px', borderRadius: 16, fontSize: 18, fontWeight: 900, background: 'rgba(96,165,250,.2)', border: '2px solid rgba(96,165,250,.4)', color: '#60a5fa', cursor: 'pointer' }} onClick={doBreath}>
                🫁 Andas in
              </button>
            </>
          )}
          {medState === 'done' && (
            <>
              <div style={{ fontSize: 64 }}>✨</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 900, color: '#4ade80' }}>Meditationen klar!</div>
              <div style={{ fontSize: 13, color: 'var(--t3)' }}>+20 humör · +10 energi · +30 XP</div>
              <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={startMed}>Meditera igen</button>
            </>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          {[['😊', 'Humör', pet.mood], ['⚡', 'Energi', pet.energy], ['🍖', 'Hunger', pet.hunger], ['💖', 'Välmående', Math.round((pet.mood + pet.energy) / 2)]].map(([em, label, val]) => (
            <div key={String(label)} style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: 22 }}>{em}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{label}</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: Number(val) >= 70 ? '#4ade80' : Number(val) >= 40 ? '#fbbf24' : '#f87171' }}>{Math.round(Number(val))}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Pet Diary ──────────────────────────────────────────────────────────────
  if (panel === 'petdiary') {
    const diaryKey = 'k0509_diary_entries'
    const entries: { date: string; text: string }[] = JSON.parse(localStorage.getItem(diaryKey) ?? '[]')
    const today = new Date().toLocaleDateString('sv-SE')
    const autoEntry = `${pet.petEmoji} ${pet.petName} är på nivå ${pet.level} med ${pet.coins}🪙. Humör: ${Math.round(pet.mood)}/100, Energi: ${Math.round(pet.energy)}/100. Totalt ${pet.totalTaps} tryck, ${pet.fishCaught} fiskar fångade, ${pet.battleWins} strider vunna.`
    const hasToday = entries.some(e => e.date === today)
    const [diaryEntries, setDiaryEntries] = useState(entries)
    const addEntry = () => {
      if (hasToday) return
      const newEntries = [{ date: today, text: autoEntry }, ...entries].slice(0, 30)
      localStorage.setItem(diaryKey, JSON.stringify(newEntries))
      setDiaryEntries(newEntries)
      gainXP(15, 'game')
      showToast('📓 Dagboksanteckning sparad! +15 XP', 'success')
      audio.coin()
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>📓 Husdjursdagbok</div>
        <div className={styles.panelNote}>Automatiska dagliga anteckningar om {pet.petName}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: '12px 14px', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, marginBottom: 6 }}>📅 Dagens anteckning</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>{autoEntry}</div>
            {hasToday
              ? <div style={{ fontSize: 11, color: '#4ade80', marginTop: 8 }}>✓ Redan sparad idag</div>
              : <button className="btn-primary" style={{ marginTop: 10, padding: '8px 20px', fontSize: 13 }} onClick={addEntry}>Spara i dagboken</button>
            }
          </div>
          <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 700 }}>Tidigare anteckningar ({diaryEntries.length})</div>
          {diaryEntries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--t3)', fontSize: 13 }}>Inga anteckningar än</div>
          )}
          {diaryEntries.map((e, i) => (
            <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, marginBottom: 4 }}>📅 {e.date}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>{e.text}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Pet Showcase ───────────────────────────────────────────────────────────
  if (panel === 'petshowcase') {
    const bondLabel = ['Okänd', 'Bekant', 'Vän', 'Nära vän', 'Bestis', 'Odelbar'][Math.min(5, pet.bondTier ?? 0)]
    const prestige = pet.prestigeLevel ?? 0
    const shareText = `${pet.petEmoji} ${pet.petName} · Nivå ${pet.level} · ${bondLabel} · ${pet.coins}🪙`
    const [copied, setCopied] = useState(false)
    const copyShare = () => {
      navigator.clipboard?.writeText(shareText).catch(() => {})
      setCopied(true)
      showToast('📋 Kopierat till urklipp!', 'success')
      audio.coin()
      setTimeout(() => setCopied(false), 2000)
    }
    const rankBadge = pet.level >= 50 ? '👑 Legendarisk' : pet.level >= 30 ? '💎 Diamant' : pet.level >= 20 ? '🥇 Guld' : pet.level >= 10 ? '🥈 Silver' : '🥉 Brons'
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🌟 Husdjurs-Showcase</div>
        <div className={styles.panelNote}>Visa upp {pet.petName} för världen</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '20px 16px', background: 'linear-gradient(135deg, rgba(99,102,241,.15), rgba(168,85,247,.1))', border: '2px solid rgba(99,102,241,.3)', borderRadius: 20, width: '100%' }}>
            <div style={{ fontSize: 72 }}>{pet.petEmoji}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 8 }}>{pet.petName}</div>
            <div style={{ fontSize: 13, color: '#818cf8', marginTop: 4 }}>{rankBadge} · Nivå {pet.level}</div>
            {prestige > 0 && <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 4 }}>✨ Prestige {prestige}</div>}
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{bondLabel} 💕</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
            {[['🪙', 'Mynt', pet.coins], ['⭐', 'XP', pet.bpassXP], ['💎', 'KC', pet.kc], ['⚔️', 'Strider', pet.battleWins], ['🎣', 'Fiskar', pet.fishCaught], ['👆', 'Tryck', pet.totalTaps]].map(([em, label, val]) => (
              <div key={String(label)} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,.04)', borderRadius: 10 }}>
                <div style={{ fontSize: 20 }}>{em}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{label}</div>
                <div style={{ fontWeight: 900, fontSize: 14, color: '#e8e8f0' }}>{Number(val).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <button onClick={copyShare} style={{ padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 900, background: copied ? 'rgba(74,222,128,.2)' : 'rgba(99,102,241,.15)', border: `1px solid ${copied ? 'rgba(74,222,128,.4)' : 'rgba(99,102,241,.3)'}`, color: copied ? '#4ade80' : '#818cf8', cursor: 'pointer', width: '100%' }}>
            {copied ? '✓ Kopierat!' : '📋 Dela ditt husdjur'}
          </button>
        </div>
      </div>
    )
  }

  // ── Pet Gym ────────────────────────────────────────────────────────────────
  if (panel === 'petgym') {
    const gymKey = `k0509_gym_${new Date().toDateString()}`
    const doneExercises: string[] = JSON.parse(localStorage.getItem(gymKey) ?? '[]')
    const [done, setDone] = useState<string[]>(doneExercises)
    const EXERCISES = [
      { id: 'pushup', emoji: '💪', name: 'Armhävningar', desc: '+5 styrka', stat: 'energy' as const, boost: 5, xp: 20 },
      { id: 'run', emoji: '🏃', name: 'Sprint', desc: '+5 energi', stat: 'energy' as const, boost: 5, xp: 25 },
      { id: 'yoga', emoji: '🧘', name: 'Yoga', desc: '+5 humör', stat: 'mood' as const, boost: 5, xp: 20 },
      { id: 'swim', emoji: '🏊', name: 'Simning', desc: '+4 energi +3 humör', stat: 'energy' as const, boost: 7, xp: 30 },
    ]
    const doExercise = (ex: typeof EXERCISES[0]) => {
      if (done.includes(ex.id)) return
      const newDone = [...done, ex.id]
      setDone(newDone)
      localStorage.setItem(gymKey, JSON.stringify(newDone))
      setStat(ex.stat, Math.min(100, (pet[ex.stat] as number) + ex.boost))
      gainXP(ex.xp, 'game')
      gainCoins(5)
      showToast(`${ex.emoji} ${ex.name} klar! +${ex.boost} ${ex.stat === 'mood' ? 'humör' : 'energi'} +${ex.xp} XP`, 'success')
      audio.coin()
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🏋️ Husdjursgym</div>
        <div className={styles.panelNote}>Träna {pet.petName} varje dag för bättre stats</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {EXERCISES.map(ex => {
            const isDone = done.includes(ex.id)
            return (
              <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isDone ? 'rgba(74,222,128,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${isDone ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 28 }}>{ex.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{ex.desc} · +{ex.xp} XP · +5🪙</div>
                </div>
                <button onClick={() => doExercise(ex)} disabled={isDone} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: isDone ? 'rgba(74,222,128,.15)' : 'rgba(99,102,241,.15)', border: `1px solid ${isDone ? 'rgba(74,222,128,.3)' : 'rgba(99,102,241,.3)'}`, color: isDone ? '#4ade80' : '#818cf8', cursor: isDone ? 'default' : 'pointer' }}>
                  {isDone ? '✓ Klar' : 'Träna!'}
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Dagens träning</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>{done.length}/{EXERCISES.length} övningar</span>
        </div>
      </div>
    )
  }

  // ── Hatchery ───────────────────────────────────────────────────────────────
  if (panel === 'hatchery') {
    const EGGS = [
      { id: 'common', emoji: '🥚', name: 'Vanligt ägg', cost: 50, time: 60, reward: '10-30🪙', coins: [10, 30] as [number, number] },
      { id: 'rare', emoji: '🪺', name: 'Sällsynt ägg', cost: 200, time: 300, reward: '50-150🪙', coins: [50, 150] as [number, number] },
      { id: 'epic', emoji: '✨', name: 'Episkt ägg', cost: 500, time: 900, reward: '200-500🪙', coins: [200, 500] as [number, number] },
    ]
    const hKey = 'k0509_hatchery'
    const saved: { id: string; startTime: number } | null = JSON.parse(localStorage.getItem(hKey) ?? 'null')
    const now = Date.now()
    const [hatching, setHatching] = useState(saved)
    const [justHatched, setJustHatched] = useState<string | null>(null)
    const startHatch = (egg: typeof EGGS[0]) => {
      if (!spendCoins(egg.cost)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      const entry = { id: egg.id, startTime: now }
      localStorage.setItem(hKey, JSON.stringify(entry))
      setHatching(entry)
      showToast(`${egg.emoji} Ägg ruvar! Kom tillbaka om ${egg.time >= 60 ? egg.time / 60 + ' min' : egg.time + 's'}`, 'success')
      audio.coin()
    }
    const collectEgg = (egg: typeof EGGS[0]) => {
      const coins = egg.coins[0] + Math.floor(Math.random() * (egg.coins[1] - egg.coins[0]))
      gainCoins(coins)
      gainXP(coins * 2, 'game')
      localStorage.removeItem(hKey)
      setHatching(null)
      setJustHatched(egg.emoji)
      showToast(`${egg.emoji} Ägg kläcktes! +${coins}🪙 +${coins * 2} XP`, 'success')
      audio.achievement()
      triggerConfetti()
      setTimeout(() => setJustHatched(null), 2000)
    }
    const activeEgg = hatching ? EGGS.find(e => e.id === hatching.id) : null
    const elapsed = hatching ? (now - hatching.startTime) / 1000 : 0
    const isReady = activeEgg ? elapsed >= activeEgg.time : false
    const progress = activeEgg ? Math.min(1, elapsed / activeEgg.time) : 0
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🥚 Ruveri</div>
        <div className={styles.panelNote}>Kläck ägg och få belöningar</div>
        {justHatched && <div style={{ textAlign: 'center', fontSize: 64, padding: '10px 0', animation: 'pulse 0.5s' }}>{justHatched}</div>}
        {hatching && activeEgg ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
            <div style={{ fontSize: 56 }}>{isReady ? '🐣' : activeEgg.emoji}</div>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#e8e8f0' }}>{activeEgg.name}</div>
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: isReady ? '#4ade80' : '#818cf8', borderRadius: 4, transition: 'width .5s' }} />
            </div>
            {isReady
              ? <button className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }} onClick={() => collectEgg(activeEgg)}>🐣 Kläck ägget!</button>
              : <div style={{ fontSize: 12, color: 'var(--t3)' }}>Ruvar... {Math.round(progress * 100)}% klar</div>
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {EGGS.map(egg => (
              <div key={egg.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14 }}>
                <div style={{ fontSize: 28 }}>{egg.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{egg.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{egg.cost}🪙 · {egg.time >= 60 ? egg.time / 60 + ' min' : egg.time + 's'} · {egg.reward}</div>
                </div>
                <button onClick={() => startHatch(egg)} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: pet.coins >= egg.cost ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.06)', border: `1px solid ${pet.coins >= egg.cost ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.1)'}`, color: pet.coins >= egg.cost ? '#818cf8' : '#666', cursor: pet.coins >= egg.cost ? 'pointer' : 'default' }}>
                  Ruva
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Cosmic Map ─────────────────────────────────────────────────────────────
  if (panel === 'cosmicmap') {
    const ZONES = [
      { id: 'moon', emoji: '🌙', name: 'Månen', desc: 'Nära hemmet', cost: 0, reward: 20, unlocked: true },
      { id: 'mars', emoji: '🔴', name: 'Mars', desc: 'Det röda planeten', cost: 100, reward: 60, unlocked: pet.level >= 5 },
      { id: 'asteroid', emoji: '☄️', name: 'Asteroidbältet', desc: 'Rikt på mineraler', cost: 300, reward: 150, unlocked: pet.level >= 10 },
      { id: 'jupiter', emoji: '🪐', name: 'Jupiter', desc: 'Gasjätten', cost: 600, reward: 300, unlocked: pet.level >= 20 },
      { id: 'blackhole', emoji: '🕳️', name: 'Svart hål', desc: 'Extremt farligt', cost: 1500, reward: 800, unlocked: pet.level >= 30 },
    ]
    const mapKey = `k0509_cosmap_${new Date().toDateString()}`
    const visitedToday: string[] = JSON.parse(localStorage.getItem(mapKey) ?? '[]')
    const [visited, setVisited] = useState<string[]>(visitedToday)
    const explore = (zone: typeof ZONES[0]) => {
      if (!zone.unlocked || visited.includes(zone.id)) return
      if (zone.cost > 0 && !spendCoins(zone.cost)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      const coins = zone.reward + Math.floor(Math.random() * zone.reward / 2)
      const newVisited = [...visited, zone.id]
      setVisited(newVisited)
      localStorage.setItem(mapKey, JSON.stringify(newVisited))
      gainCoins(coins)
      gainXP(coins * 3, 'game')
      showToast(`${zone.emoji} Utforskade ${zone.name}! +${coins}🪙`, 'success')
      audio.achievement()
      triggerConfetti()
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🗺️ Kosmisk Karta</div>
        <div className={styles.panelNote}>Utforska galaxen en gång per dag</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ZONES.map(zone => {
            const isDone = visited.includes(zone.id)
            const locked = !zone.unlocked
            return (
              <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isDone ? 'rgba(74,222,128,.08)' : locked ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.04)', border: `1px solid ${isDone ? 'rgba(74,222,128,.2)' : locked ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14, opacity: locked ? 0.5 : 1 }}>
                <div style={{ fontSize: 28 }}>{zone.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{zone.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{zone.desc} · {zone.cost > 0 ? `${zone.cost}🪙 · ` : ''}+{zone.reward}-{zone.reward + Math.floor(zone.reward / 2)}🪙</div>
                  {locked && <div style={{ fontSize: 10, color: '#f87171' }}>🔒 Kräver nivå {zone.id === 'mars' ? 5 : zone.id === 'asteroid' ? 10 : zone.id === 'jupiter' ? 20 : 30}</div>}
                </div>
                <button onClick={() => explore(zone)} disabled={isDone || locked} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: isDone ? 'rgba(74,222,128,.15)' : locked ? 'rgba(255,255,255,.04)' : 'rgba(99,102,241,.2)', border: `1px solid ${isDone ? 'rgba(74,222,128,.3)' : 'rgba(99,102,241,.3)'}`, color: isDone ? '#4ade80' : locked ? '#555' : '#818cf8', cursor: isDone || locked ? 'default' : 'pointer' }}>
                  {isDone ? '✓ Klar' : locked ? '🔒' : 'Utforska'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Pet School ─────────────────────────────────────────────────────────────
  if (panel === 'petschool') {
    const TRICKS = [
      { id: 'sit', emoji: '🪑', name: 'Sitt', desc: 'Baslektionen', cost: 0, xp: 50, level: 1, stat: 'mood' as const, boost: 3 },
      { id: 'paw', emoji: '🐾', name: 'Tass', desc: 'Skaka hand', cost: 30, xp: 80, level: 3, stat: 'mood' as const, boost: 5 },
      { id: 'roll', emoji: '🔄', name: 'Rulla', desc: 'Rulla runt', cost: 60, xp: 120, level: 5, stat: 'energy' as const, boost: 5 },
      { id: 'dance', emoji: '💃', name: 'Dansa', desc: 'Avancerad dans', cost: 150, xp: 200, level: 10, stat: 'mood' as const, boost: 10 },
      { id: 'fly', emoji: '🦋', name: 'Flyg', desc: 'Magisk förmåga', cost: 400, xp: 500, level: 20, stat: 'energy' as const, boost: 15 },
    ]
    const schoolKey = 'k0509_school_learned'
    const learned: string[] = JSON.parse(localStorage.getItem(schoolKey) ?? '[]')
    const [learnedTricks, setLearnedTricks] = useState<string[]>(learned)
    const learnTrick = (trick: typeof TRICKS[0]) => {
      if (learnedTricks.includes(trick.id)) return
      if (pet.level < trick.level) { showToast(`Kräver nivå ${trick.level}!`, 'error'); return }
      if (trick.cost > 0 && !spendCoins(trick.cost)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      const newLearned = [...learnedTricks, trick.id]
      setLearnedTricks(newLearned)
      localStorage.setItem(schoolKey, JSON.stringify(newLearned))
      gainXP(trick.xp, 'game')
      setStat(trick.stat, Math.min(100, (pet[trick.stat] as number) + trick.boost))
      showToast(`${trick.emoji} ${pet.petName} lärde sig ${trick.name}! +${trick.xp} XP`, 'success')
      audio.achievement()
      triggerConfetti()
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🎓 Husdjursskola</div>
        <div className={styles.panelNote}>Lär {pet.petName} nya tricks · {learnedTricks.length}/{TRICKS.length} inlärda</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TRICKS.map(trick => {
            const isLearned = learnedTricks.includes(trick.id)
            const locked = pet.level < trick.level
            return (
              <div key={trick.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isLearned ? 'rgba(74,222,128,.08)' : locked ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.04)', border: `1px solid ${isLearned ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14, opacity: locked ? 0.6 : 1 }}>
                <div style={{ fontSize: 28 }}>{trick.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{trick.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{trick.desc} · Niv {trick.level}+ · {trick.cost > 0 ? `${trick.cost}🪙 · ` : 'Gratis · '}+{trick.xp} XP</div>
                </div>
                <button onClick={() => learnTrick(trick)} disabled={isLearned || locked} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: isLearned ? 'rgba(74,222,128,.15)' : locked ? 'rgba(255,255,255,.04)' : 'rgba(99,102,241,.2)', border: `1px solid ${isLearned ? 'rgba(74,222,128,.3)' : 'rgba(99,102,241,.3)'}`, color: isLearned ? '#4ade80' : locked ? '#555' : '#818cf8', cursor: isLearned || locked ? 'default' : 'pointer' }}>
                  {isLearned ? '✓ Klar' : locked ? `Niv ${trick.level}` : 'Lär!'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Mystery Box ────────────────────────────────────────────────────────────
  if (panel === 'mysterybox') {
    const mbKey = `k0509_mb_${new Date().toDateString()}`
    const openedToday = Number(localStorage.getItem(mbKey) ?? 0)
    const MAX_DAILY = 3
    const [opened, setOpened] = useState(openedToday)
    const [lastReward, setLastReward] = useState<string | null>(null)
    const BOX_COST = [0, 50, 150]
    const openBox = (tier: number) => {
      if (opened >= MAX_DAILY) { showToast('Max 3 lådor per dag!', 'error'); return }
      const cost = BOX_COST[tier]
      if (cost > 0 && !spendCoins(cost)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      const roll = Math.random()
      let reward = '', coins = 0, xp = 0
      if (tier === 0) { coins = 10 + Math.floor(Math.random() * 40); xp = 20; reward = `+${coins}🪙 +${xp} XP` }
      else if (tier === 1) {
        if (roll < 0.05) { coins = 500; reward = '🎉 JACKPOT! +500🪙' }
        else if (roll < 0.3) { coins = 100; reward = `+100🪙 +50 XP` }
        else { coins = 30; reward = `+30🪙 +30 XP` }
        xp = 50
      } else {
        if (roll < 0.1) { coins = 1000; reward = '🏆 MEGA JACKPOT! +1000🪙' }
        else if (roll < 0.4) { coins = 300; reward = `+300🪙 +200 XP` }
        else { coins = 100; reward = `+100🪙 +100 XP` }
        xp = 100
      }
      gainCoins(coins); gainXP(xp, 'game')
      const newOpened = opened + 1
      setOpened(newOpened); localStorage.setItem(mbKey, String(newOpened))
      setLastReward(reward)
      showToast(`🎁 ${reward}`, 'success')
      audio.achievement()
      if (coins >= 500) triggerConfetti()
    }
    const TIERS = [
      { emoji: '📦', name: 'Vanlig låda', cost: 0, desc: '10-50🪙' },
      { emoji: '🎁', name: 'Silver låda', cost: 50, desc: '30-500🪙' },
      { emoji: '💎', name: 'Guld låda', cost: 150, desc: '100-1000🪙' },
    ]
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🎁 Mystery Box</div>
        <div className={styles.panelNote}>{MAX_DAILY - opened} lådor kvar idag · Återställs vid midnatt</div>
        {lastReward && <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 12, fontSize: 14, color: '#fbbf24', fontWeight: 700 }}>🎉 {lastReward}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14 }}>
              <div style={{ fontSize: 32 }}>{t.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{t.cost > 0 ? `${t.cost}🪙 · ` : 'Gratis · '}{t.desc}</div>
              </div>
              <button onClick={() => openBox(i)} disabled={opened >= MAX_DAILY} style={{ padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 900, background: opened >= MAX_DAILY ? 'rgba(255,255,255,.04)' : 'rgba(251,191,36,.2)', border: `1px solid ${opened >= MAX_DAILY ? 'rgba(255,255,255,.1)' : 'rgba(251,191,36,.4)'}`, color: opened >= MAX_DAILY ? '#555' : '#fbbf24', cursor: opened >= MAX_DAILY ? 'default' : 'pointer' }}>
                {opened >= MAX_DAILY ? '🔒' : 'Öppna!'}
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
          {Array.from({ length: MAX_DAILY }).map((_, i) => (
            <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: i < opened ? 'rgba(74,222,128,.4)' : 'rgba(255,255,255,.08)', border: `1px solid ${i < opened ? 'rgba(74,222,128,.5)' : 'rgba(255,255,255,.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              {i < opened ? '✓' : ''}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Pet Fusion ─────────────────────────────────────────────────────────────
  if (panel === 'petfusion') {
    const ELEMENTS = [
      { id: 'fire', emoji: '🔥', name: 'Eld', owned: pet.battleWins >= 5 },
      { id: 'water', emoji: '💧', name: 'Vatten', owned: pet.fishCaught >= 5 },
      { id: 'earth', emoji: '🌱', name: 'Jord', owned: pet.expeditionsDone >= 3 },
      { id: 'air', emoji: '💨', name: 'Luft', owned: pet.level >= 5 },
      { id: 'lightning', emoji: '⚡', name: 'Blixt', owned: pet.battleWins >= 20 },
      { id: 'shadow', emoji: '🌑', name: 'Skugga', owned: pet.level >= 30 },
    ]
    const FUSIONS = [
      { id: 'steam', emoji: '♨️', name: 'Ånga', requires: ['fire', 'water'], reward: 200, xp: 300 },
      { id: 'storm', emoji: '⛈️', name: 'Storm', requires: ['air', 'lightning'], reward: 400, xp: 500 },
      { id: 'magma', emoji: '🌋', name: 'Magma', requires: ['fire', 'earth'], reward: 350, xp: 400 },
      { id: 'void', emoji: '🌀', name: 'Tomrum', requires: ['shadow', 'lightning'], reward: 1000, xp: 1000 },
    ]
    const fusionKey = 'k0509_fusions'
    const done: string[] = JSON.parse(localStorage.getItem(fusionKey) ?? '[]')
    const [fused, setFused] = useState<string[]>(done)
    const doFusion = (fusion: typeof FUSIONS[0]) => {
      if (fused.includes(fusion.id)) return
      const missing = fusion.requires.filter(r => !ELEMENTS.find(e => e.id === r)?.owned)
      if (missing.length > 0) { showToast(`Saknar element!`, 'error'); return }
      const newFused = [...fused, fusion.id]
      setFused(newFused)
      localStorage.setItem(fusionKey, JSON.stringify(newFused))
      gainCoins(fusion.reward)
      gainXP(fusion.xp, 'game')
      showToast(`${fusion.emoji} ${fusion.name} fusionerat! +${fusion.reward}🪙 +${fusion.xp} XP`, 'success')
      audio.achievement(); triggerConfetti()
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>⚗️ Pet Fusion</div>
        <div className={styles.panelNote}>Kombinera element för kraftfulla belöningar</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8, fontWeight: 700 }}>Dina element</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ELEMENTS.map(el => (
              <div key={el.id} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 13, background: el.owned ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.04)', border: `1px solid ${el.owned ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.08)'}`, color: el.owned ? '#e8e8f0' : '#444', opacity: el.owned ? 1 : 0.5 }}>
                {el.emoji} {el.name}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8, fontWeight: 700 }}>Fusioner</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FUSIONS.map(fusion => {
            const isDone = fused.includes(fusion.id)
            const canDo = fusion.requires.every(r => ELEMENTS.find(e => e.id === r)?.owned)
            return (
              <div key={fusion.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isDone ? 'rgba(74,222,128,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${isDone ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ fontSize: 28 }}>{fusion.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{fusion.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{fusion.requires.map(r => ELEMENTS.find(e => e.id === r)?.emoji).join(' + ')} · +{fusion.reward}🪙 +{fusion.xp} XP</div>
                </div>
                <button onClick={() => doFusion(fusion)} disabled={isDone || !canDo} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: isDone ? 'rgba(74,222,128,.15)' : canDo ? 'rgba(168,85,247,.2)' : 'rgba(255,255,255,.04)', border: `1px solid ${isDone ? 'rgba(74,222,128,.3)' : canDo ? 'rgba(168,85,247,.4)' : 'rgba(255,255,255,.08)'}`, color: isDone ? '#4ade80' : canDo ? '#c084fc' : '#555', cursor: isDone || !canDo ? 'default' : 'pointer' }}>
                  {isDone ? '✓ Klar' : !canDo ? '🔒' : 'Fusionera!'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Carnival ───────────────────────────────────────────────────────────────
  if (panel === 'carnival') {
    const carnKey = `k0509_carn_${new Date().toDateString()}`
    const playsLeft = Math.max(0, 5 - Number(localStorage.getItem(carnKey) ?? 0))
    const [plays, setPlays] = useState(5 - playsLeft)
    const [lastResult, setLastResult] = useState<string | null>(null)
    const GAMES2 = [
      { id: 'darts', emoji: '🎯', name: 'Pilkast', cost: 20, maxReward: 100 },
      { id: 'ring', emoji: '💍', name: 'Ringkastning', cost: 30, maxReward: 150 },
      { id: 'balloon', emoji: '🎈', name: 'Ballongskjutning', cost: 50, maxReward: 300 },
    ]
    const play = (game: typeof GAMES2[0]) => {
      if (plays >= 5) { showToast('Inga fler spel idag!', 'error'); return }
      if (!spendCoins(game.cost)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      const newPlays = plays + 1
      setPlays(newPlays)
      localStorage.setItem(carnKey, String(newPlays))
      const roll = Math.random()
      const coins = roll > 0.7 ? Math.floor(game.maxReward * (0.5 + Math.random() * 0.5)) : roll > 0.3 ? Math.floor(game.cost * 1.5) : 0
      const won = coins > 0
      if (won) { gainCoins(coins); gainXP(coins * 2, 'game') }
      const res = won ? `🎉 Vann ${coins}🪙!` : '😢 Inte den här gången'
      setLastResult(res)
      showToast(`${game.emoji} ${res}`, won ? 'success' : 'error')
      if (won) audio.coin(); else audio.click()
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🎡 Karneval</div>
        <div className={styles.panelNote}>{5 - plays} spel kvar idag · Återställs imorgon</div>
        {lastResult && <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(251,191,36,.1)', borderRadius: 10, fontSize: 13, color: '#fbbf24' }}>{lastResult}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GAMES2.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14 }}>
              <div style={{ fontSize: 28 }}>{g.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{g.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{g.cost}🪙 · Vinn upp till {g.maxReward}🪙</div>
              </div>
              <button onClick={() => play(g)} disabled={plays >= 5} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: plays >= 5 ? 'rgba(255,255,255,.04)' : 'rgba(251,191,36,.2)', border: `1px solid ${plays >= 5 ? 'rgba(255,255,255,.08)' : 'rgba(251,191,36,.4)'}`, color: plays >= 5 ? '#555' : '#fbbf24', cursor: plays >= 5 ? 'default' : 'pointer' }}>
                {plays >= 5 ? '🔒' : 'Spela!'}
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: i < plays ? 'rgba(251,191,36,.4)' : 'rgba(255,255,255,.08)', border: `1px solid ${i < plays ? 'rgba(251,191,36,.5)' : 'rgba(255,255,255,.15)'}` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Pet Birthday ────────────────────────────────────────────────────────────
  if (panel === 'petbirthday') {
    const bdKey = 'k0509_birthday'
    const lastBd = localStorage.getItem(bdKey)
    const today = new Date().toDateString()
    const [celebrated, setCelebrated] = useState(lastBd === today)
    const celebrate = () => {
      if (celebrated) return
      localStorage.setItem(bdKey, today)
      setCelebrated(true)
      gainCoins(200); gainXP(500, 'game')
      setStat('mood', 100); setStat('energy', 100)
      showToast('🎂 Grattis på husdjursdagen! +200🪙 +500 XP +100 humör!', 'success')
      audio.achievement(); triggerConfetti()
    }
    const age = Math.floor(pet.level / 10) + 1
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🎂 Husdjurets Födelsedag</div>
        <div className={styles.panelNote}>Fira {pet.petName}s speciella dag!</div>
        <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 72 }}>{pet.petEmoji}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>🎂 {age} år gammal!</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 240 }}>
            {pet.petName} har levt ett fantastiskt liv!<br />
            Nivå {pet.level} · {pet.battleWins} strider · {pet.fishCaught} fiskar
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['🎂','🎁','🎈','🎉','🎊','🥳','🍰','🕯️'].map((e, i) => (
              <span key={i} style={{ fontSize: 24 }}>{e}</span>
            ))}
          </div>
          {!celebrated
            ? <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={celebrate}>🎂 Fira! (+200🪙 +500 XP)</button>
            : <div style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', fontSize: 14, color: '#4ade80', fontWeight: 700 }}>✓ Firat idag! 🎉</div>
          }
        </div>
      </div>
    )
  }

  // ── Royalty Tree ────────────────────────────────────────────────────────────
  if (panel === 'royaltytree') {
    const prestige = pet.prestigeLevel ?? 0
    const ANCESTORS = [
      { gen: 3, name: 'Urförälder', emoji: '👴', level: 1, coins: 100 },
      { gen: 2, name: 'Farförälder', emoji: '🧓', level: 5, coins: 500 },
      { gen: 1, name: 'Förälder', emoji: '🧑', level: 15, coins: 1500 },
      { gen: 0, name: pet.petName, emoji: pet.petEmoji, level: pet.level, coins: pet.coins },
    ]
    const TITLE = pet.level >= 50 ? '👑 Kung/Drottning' : pet.level >= 30 ? '🏰 Prins/Prinsessa' : pet.level >= 15 ? '⚔️ Riddare' : pet.level >= 5 ? '🏅 Adelsman' : '🌱 Bonde'
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>👑 Stamtavla</div>
        <div className={styles.panelNote}>{pet.petName}s kungliga arv · Prestige {prestige}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {ANCESTORS.map((a, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: 2, height: 20, background: 'rgba(251,191,36,.3)' }} />}
              <div style={{ padding: '10px 20px', background: i === 3 ? 'rgba(251,191,36,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${i === 3 ? 'rgba(251,191,36,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                <div style={{ fontSize: 28 }}>{a.emoji}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>Niv {a.level} · {a.coins.toLocaleString()}🪙</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, textAlign: 'center', padding: '12px', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 12 }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>👑</div>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#fbbf24' }}>{TITLE}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Prestige {prestige} · Nivå {pet.level}</div>
        </div>
      </div>
    )
  }

  // ── Speedrun ────────────────────────────────────────────────────────────────
  if (panel === 'speedrun') {
    const CHALLENGES = [
      { id: 'taps100', emoji: '👆', name: '100 Tryck', goal: 100, current: pet.totalTaps, unit: 'tryck', reward: 300 },
      { id: 'battles10', emoji: '⚔️', name: '10 Strider', goal: 10, current: pet.battleWins, unit: 'vinster', reward: 500 },
      { id: 'fish20', emoji: '🎣', name: '20 Fiskar', goal: 20, current: pet.fishCaught, unit: 'fångade', reward: 400 },
      { id: 'level10', emoji: '⬆️', name: 'Nivå 10', goal: 10, current: pet.level, unit: 'nivå', reward: 600 },
      { id: 'kc50', emoji: '💎', name: '50 KC', goal: 50, current: pet.kc, unit: 'KC', reward: 800 },
    ]
    const srKey = 'k0509_speedrun_claimed'
    const claimed: string[] = JSON.parse(localStorage.getItem(srKey) ?? '[]')
    const [claimedList, setClaimedList] = useState<string[]>(claimed)
    const claimReward = (ch: typeof CHALLENGES[0]) => {
      if (claimedList.includes(ch.id) || ch.current < ch.goal) return
      const newClaimed = [...claimedList, ch.id]
      setClaimedList(newClaimed)
      localStorage.setItem(srKey, JSON.stringify(newClaimed))
      gainCoins(ch.reward); gainXP(ch.reward * 2, 'game')
      showToast(`⏱️ ${ch.name} klar! +${ch.reward}🪙`, 'success')
      audio.achievement(); triggerConfetti()
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>⏱️ Speedrun-utmaningar</div>
        <div className={styles.panelNote}>Nå milstolpar för bonusar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CHALLENGES.map(ch => {
            const done = claimedList.includes(ch.id)
            const progress = Math.min(1, ch.current / ch.goal)
            const ready = ch.current >= ch.goal && !done
            return (
              <div key={ch.id} style={{ padding: '12px 14px', background: done ? 'rgba(74,222,128,.06)' : 'rgba(255,255,255,.04)', border: `1px solid ${done ? 'rgba(74,222,128,.2)' : ready ? 'rgba(251,191,36,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{ch.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{ch.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{ch.current}/{ch.goal} {ch.unit} · +{ch.reward}🪙</div>
                    </div>
                  </div>
                  {done
                    ? <span style={{ fontSize: 16 }}>✅</span>
                    : ready
                    ? <button onClick={() => claimReward(ch)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900, background: 'rgba(251,191,36,.2)', border: '1px solid rgba(251,191,36,.4)', color: '#fbbf24', cursor: 'pointer' }}>Hämta!</button>
                    : null
                  }
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: done ? '#4ade80' : ready ? '#fbbf24' : '#818cf8', borderRadius: 2 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Collectibles ────────────────────────────────────────────────────────────
  if (panel === 'collectibles') {
    const ITEMS = [
      { id: 'c1', emoji: '🏺', name: 'Urna', rarity: 'Vanlig', unlock: pet.level >= 1 },
      { id: 'c2', emoji: '🗝️', name: 'Gammal nyckel', rarity: 'Vanlig', unlock: pet.battleWins >= 1 },
      { id: 'c3', emoji: '🪬', name: 'Amuletten', rarity: 'Sällsynt', unlock: pet.fishCaught >= 10 },
      { id: 'c4', emoji: '🔮', name: 'Kristallkula', rarity: 'Sällsynt', unlock: pet.level >= 10 },
      { id: 'c5', emoji: '🏅', name: 'Guldmedalj', rarity: 'Episk', unlock: pet.battleWins >= 20 },
      { id: 'c6', emoji: '👑', name: 'Kronan', rarity: 'Legendarisk', unlock: pet.level >= 50 },
      { id: 'c7', emoji: '🌌', name: 'Galaxsten', rarity: 'Legendarisk', unlock: pet.kc >= 200 },
      { id: 'c8', emoji: '⚡', name: 'Blixtjuvel', rarity: 'Episk', unlock: pet.totalTaps >= 500 },
    ]
    const rarityColor: Record<string, string> = { 'Vanlig': '#9ca3af', 'Sällsynt': '#60a5fa', 'Episk': '#a855f7', 'Legendarisk': '#fbbf24' }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🏺 Samlarföremål</div>
        <div className={styles.panelNote}>{ITEMS.filter(i => i.unlock).length}/{ITEMS.length} upplåsta föremål</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ITEMS.map(item => (
            <div key={item.id} style={{ padding: '12px', background: item.unlock ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)', border: `1px solid ${item.unlock ? rarityColor[item.rarity] + '30' : 'rgba(255,255,255,.06)'}`, borderRadius: 14, textAlign: 'center', opacity: item.unlock ? 1 : 0.4 }}>
              <div style={{ fontSize: 36, filter: item.unlock ? 'none' : 'grayscale(1)' }}>{item.unlock ? item.emoji : '❓'}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e8f0', marginTop: 6 }}>{item.unlock ? item.name : '???'}</div>
              <div style={{ fontSize: 10, color: rarityColor[item.rarity], marginTop: 2 }}>{item.rarity}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Pet Parade ──────────────────────────────────────────────────────────────
  if (panel === 'petparade') {
    const PETS_IN_PARADE = [
      { emoji: '🐱', name: 'Whiskers', level: 12, score: 1200 },
      { emoji: '🦊', name: 'Foxy', level: 18, score: 1800 },
      { emoji: '🐶', name: 'Buddy', level: 8, score: 800 },
      { emoji: pet.petEmoji, name: pet.petName, level: pet.level, score: pet.level * 100 + pet.battleWins * 10 },
      { emoji: '🐸', name: 'Croaky', level: 15, score: 1500 },
      { emoji: '🐻', name: 'Bruno', level: 22, score: 2200 },
    ].sort((a, b) => b.score - a.score)
    const myRank = PETS_IN_PARADE.findIndex(p => p.name === pet.petName) + 1
    const ppKey = `k0509_parade_${new Date().toDateString()}`
    const [joined, setJoined] = useState(!!localStorage.getItem(ppKey))
    const joinParade = () => {
      if (joined) return
      localStorage.setItem(ppKey, '1')
      setJoined(true)
      gainCoins(50); gainXP(100, 'game')
      showToast('🎪 Du gick med i paraden! +50🪙 +100 XP', 'success')
      audio.achievement()
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>🎪 Husdjursparad</div>
        <div className={styles.panelNote}>Daglig parade · Din plats: #{myRank}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PETS_IN_PARADE.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: p.name === pet.petName ? 'rgba(129,140,248,.1)' : 'rgba(255,255,255,.04)', border: `1px solid ${p.name === pet.petName ? 'rgba(129,140,248,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#fb923c' : '#555', minWidth: 20 }}>#{i + 1}</span>
              <span style={{ fontSize: 24 }}>{p.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.name === pet.petName ? '#818cf8' : '#e8e8f0' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>Niv {p.level}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#fbbf24' }}>{p.score}p</span>
            </div>
          ))}
        </div>
        {!joined
          ? <button className="btn-primary" style={{ marginTop: 10, padding: '12px' }} onClick={joinParade}>🎪 Gå med i paraden! (+50🪙)</button>
          : <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: '#4ade80', padding: '10px', background: 'rgba(74,222,128,.08)', borderRadius: 10 }}>✓ Du är med i dagens parade!</div>
        }
      </div>
    )
  }

  // ── Shrine ─────────────────────────────────────────────────────────────────
  if (panel === 'shrine') {
    const shrineKey = `k0509_shrine_${new Date().toDateString()}`
    const offeredToday = Number(localStorage.getItem(shrineKey) ?? 0)
    const MAX_OFFERINGS = 3
    const [offerings, setOfferings] = useState(offeredToday)
    const [blessing, setBlessing] = useState<string | null>(null)
    const OFFERINGS2 = [
      { id: 'flower', emoji: '🌸', name: 'Blomma', cost: 10, blessingType: 'mood' },
      { id: 'candle', emoji: '🕯️', name: 'Ljus', cost: 25, blessingType: 'energy' },
      { id: 'gem', emoji: '💎', name: 'Ädelsten', cost: 100, blessingType: 'luck' },
    ]
    const offer = (o: typeof OFFERINGS2[0]) => {
      if (offerings >= MAX_OFFERINGS) { showToast('Max 3 offer per dag!', 'error'); return }
      if (!spendCoins(o.cost)) { showToast('Inte tillräckligt med mynt!', 'error'); return }
      const newOffs = offerings + 1
      setOfferings(newOffs)
      localStorage.setItem(shrineKey, String(newOffs))
      let b = ''
      if (o.blessingType === 'mood') { setStat('mood', Math.min(100, pet.mood + 15)); b = '+15 humör ✨' }
      else if (o.blessingType === 'energy') { setStat('energy', Math.min(100, pet.energy + 15)); b = '+15 energi ✨' }
      else { gainCoins(200); b = '+200🪙 ✨' }
      gainXP(50, 'game')
      setBlessing(b)
      showToast(`⛩️ Altaret välsignade dig! ${b}`, 'success')
      audio.achievement()
      setTimeout(() => setBlessing(null), 3000)
    }
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>⛩️ Altaret</div>
        <div className={styles.panelNote}>Offra för välsignelser · {MAX_OFFERINGS - offerings} kvar idag</div>
        {blessing && <div style={{ textAlign: 'center', fontSize: 14, color: '#fbbf24', padding: '8px', background: 'rgba(251,191,36,.1)', borderRadius: 10 }}>⛩️ {blessing}</div>}
        <div style={{ textAlign: 'center', fontSize: 56, padding: '16px 0' }}>⛩️</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OFFERINGS2.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14 }}>
              <div style={{ fontSize: 28 }}>{o.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{o.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{o.cost}🪙 · {o.blessingType === 'mood' ? '+15 humör' : o.blessingType === 'energy' ? '+15 energi' : '+200🪙'}</div>
              </div>
              <button onClick={() => offer(o)} disabled={offerings >= MAX_OFFERINGS} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, background: offerings >= MAX_OFFERINGS ? 'rgba(255,255,255,.04)' : 'rgba(251,191,36,.2)', border: `1px solid ${offerings >= MAX_OFFERINGS ? 'rgba(255,255,255,.08)' : 'rgba(251,191,36,.4)'}`, color: offerings >= MAX_OFFERINGS ? '#555' : '#fbbf24', cursor: offerings >= MAX_OFFERINGS ? 'default' : 'pointer' }}>
                {offerings >= MAX_OFFERINGS ? '🙏 Klart' : 'Offra'}
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Time Capsule ────────────────────────────────────────────────────────────
  if (panel === 'timecapsule') {
    const tcKey = 'k0509_timecapsule'
    const capsules: { date: string; message: string; open: string }[] = JSON.parse(localStorage.getItem(tcKey) ?? '[]')
    const [list, setList] = useState(capsules)
    const [draft, setDraft] = useState('')
    const [days, setDays] = useState(7)
    const today = new Date()
    const openDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    const addCapsule = () => {
      if (!draft.trim()) return
      const entry = { date: today.toLocaleDateString('sv-SE'), message: draft.trim(), open: openDate.toLocaleDateString('sv-SE') }
      const newList = [entry, ...list].slice(0, 5)
      setList(newList); localStorage.setItem(tcKey, JSON.stringify(newList)); setDraft('')
      gainXP(30, 'game'); gainCoins(10)
      showToast('💌 Tidskapsel förseglas! Öppnas om ' + days + ' dagar.', 'success')
      audio.coin()
    }
    const isOpen = (openStr: string) => new Date(openStr.split('.').reverse().join('-')) <= today
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>💌 Tidskapsel</div>
        <div className={styles.panelNote}>Skriv ett meddelande till ditt framtida jag</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            maxLength={200}
            style={{ padding: '10px 12px', borderRadius: 12, fontSize: 13, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#e8e8f0', resize: 'none', height: 80, outline: 'none', lineHeight: 1.5 }}
            placeholder={`Hej framtida ${pet.petName}! Idag är...`}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Öppna om:</span>
            {[3, 7, 30].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: days === d ? 900 : 400, background: days === d ? 'rgba(129,140,248,.2)' : 'rgba(255,255,255,.04)', border: `1px solid ${days === d ? 'rgba(129,140,248,.4)' : 'rgba(255,255,255,.1)'}`, color: days === d ? '#818cf8' : '#888', cursor: 'pointer' }}>
                {d}d
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={addCapsule} disabled={!draft.trim()} style={{ padding: '10px' }}>💌 Försegla kapsel</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 700, marginBottom: 8 }}>Dina kapslar ({list.length}/5)</div>
        {list.map((c, i) => {
          const open = isOpen(c.open)
          return (
            <div key={i} style={{ padding: '10px 12px', background: open ? 'rgba(74,222,128,.06)' : 'rgba(255,255,255,.03)', border: `1px solid ${open ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.06)'}`, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: open ? '#4ade80' : '#fbbf24', fontWeight: 700, marginBottom: 4 }}>
                {open ? '📬 Öppnad!' : `🔒 Öppnas ${c.open}`} · Skapad {c.date}
              </div>
              <div style={{ fontSize: 12, color: open ? '#e8e8f0' : 'rgba(255,255,255,.2)', lineHeight: 1.5 }}>
                {open ? c.message : '████████████████'}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Constellation ──────────────────────────────────────────────────────────
  if (panel === 'constellation') {
    const month = new Date().getMonth()
    const SIGNS = [
      { name: 'Stenbocken', emoji: '♑', months: [11, 0], trait: 'Disciplinerad & tålmodig', bonus: 'Fiske ger +10% XP' },
      { name: 'Vattumannen', emoji: '♒', months: [1, 2], trait: 'Kreativ & frihetälskande', bonus: 'Craft kostar -5%' },
      { name: 'Fiskarnas', emoji: '♓', months: [2, 3], trait: 'Empatisk & drömmare', bonus: '+5 humör på meditation' },
      { name: 'Vädurens', emoji: '♈', months: [3, 4], trait: 'Modig & energisk', bonus: 'Strid ger +10% belöning' },
      { name: 'Oxens', emoji: '♉', months: [4, 5], trait: 'Stabil & uthållig', bonus: 'Bank ger +5% ränta' },
      { name: 'Tvillingarnas', emoji: '♊', months: [5, 6], trait: 'Nyfiken & anpassningsbar', bonus: 'Expedition XP +15%' },
      { name: 'Krabban', emoji: '♋', months: [6, 7], trait: 'Omtänksam & intuitiv', bonus: 'Husdjurets humör +2/dag' },
      { name: 'Lejonets', emoji: '♌', months: [7, 8], trait: 'Karismatisk & generös', bonus: 'Boss Raid +20% belöning' },
      { name: 'Jungfruns', emoji: '♍', months: [8, 9], trait: 'Analytisk & noggrann', bonus: 'Sudoku ger 2× XP' },
      { name: 'Vågens', emoji: '♎', months: [9, 10], trait: 'Diplomatisk & rättvis', bonus: 'Auktionspris +5%' },
      { name: 'Skorpionens', emoji: '♏', months: [10, 11], trait: 'Intensiv & passionerad', bonus: 'Boss HP -10%' },
      { name: 'Skytten', emoji: '♐', months: [11, 0], trait: 'Optimistisk & äventyrlig', bonus: 'Expedition tid -10%' },
    ]
    const mySign = SIGNS.find(s => s.months.includes(month)) ?? SIGNS[0]
    const petSign = SIGNS[pet.level % SIGNS.length]
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelTitle}>✨ Stjärnbild</div>
        <div className={styles.panelNote}>{pet.petName}s kosmiska öde</div>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 64 }}>{petSign.emoji}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 8 }}>{petSign.name}</div>
          <div style={{ fontSize: 13, color: '#818cf8', marginTop: 4 }}>{petSign.trait}</div>
          <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 8, padding: '8px 16px', background: 'rgba(251,191,36,.08)', borderRadius: 10 }}>⭐ {petSign.bonus}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {SIGNS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '8px 4px', background: s.name === petSign.name ? 'rgba(129,140,248,.15)' : s.name === mySign.name ? 'rgba(251,191,36,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${s.name === petSign.name ? 'rgba(129,140,248,.3)' : 'rgba(255,255,255,.06)'}`, borderRadius: 10 }}>
              <div style={{ fontSize: 18 }}>{s.emoji}</div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>{s.name.split(' ')[0]}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
          {pet.petName} är under {petSign.name} (Nivå {pet.level % SIGNS.length === 0 ? SIGNS.length : pet.level % SIGNS.length})
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
