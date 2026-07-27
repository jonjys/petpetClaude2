import { memo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'
import { SPIN_PRIZES, LUCKY_PRIZES, EXPEDITIONS, ALL_ACHIEVEMENTS, FEATURE_HUB_ITEMS, FORTUNE_MESSAGES, SHOP_HATS, SHOP_ACC, SHOP_AURA } from '@/constants/config'
import { SPIN_KEY, LUCKY_KEY } from '@/constants/config'
import styles from './CreateView.module.css'
import { ShopView } from '@/features/shop/ShopView'

type Panel = null | 'spin' | 'lucky' | 'expedition' | 'achievements' | 'wardrobe' | 'fortune' | 'shop' | 'records' | 'leaderboard' | 'battlepass' | 'quests' | 'craft'

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) { r -= item.weight; if (r <= 0) return item }
  return items[items.length - 1]
}

export const CreateView = memo(function CreateView() {
  const [panel, setPanel] = useState<Panel>(null)

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
      <div style={{ padding: '14px 14px 6px' }}>
        <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: 'var(--green)' }}>✨ Feature Hub</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Allt på ett ställe</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 14px 14px' }}>
        {FEATURE_HUB_ITEMS.map(item => (
          <button
            key={item.id}
            className="care-btn"
            data-accent="green"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 10px', minHeight: 80 }}
            onClick={() => setPanel(item.id as Panel)}
          >
            <span style={{ fontSize: 28 }}>{item.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--ff-head)' }}>{item.label}</span>
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>{item.desc}</span>
          </button>
        ))}
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
  const addInventoryItem = useGameStore(s => s.addInventoryItem)
  const equipItem = useGameStore(s => s.equipItem)
  const unlockedAchievements = useGameStore(s => s.unlockedAchievements)
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
    const now = Date.now()
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
                <div style={{ color: '#4ade80', fontWeight: 700 }}>Expedition klar! 🎉</div>
                <button className="btn-gold" style={{ width: '100%', padding: 14, fontSize: 16 }} onClick={claimExp}>🏆 Hämta belöning!</button>
              </>
            ) : (
              <div style={{ color: '#fbbf24', fontFamily: 'var(--ff-head)', fontSize: 24 }}>{mins}m {secs}s kvar</div>
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
  if (panel === 'achievements') return (
    <div className={styles.panelRoot}>
      <BackBtn />
      <div className={styles.panelTitle}>🏆 Prestationer <span style={{ fontSize: 14, color: '#888' }}>{unlockedAchievements.length}/{ALL_ACHIEVEMENTS.length}</span></div>
      <div className={styles.achGrid}>
        {ALL_ACHIEVEMENTS.map(ach => {
          const unlocked = unlockedAchievements.includes(ach.id)
          const rarityColor = { common: '#888', uncommon: '#4ade80', rare: '#60a5fa', epic: '#a855f7', legendary: '#fbbf24' }[ach.rarity]
          return (
            <div key={ach.id} className={`${styles.achCard} ${!unlocked ? styles.achLocked : ''}`} style={{ borderColor: unlocked ? rarityColor : 'rgba(255,255,255,0.06)' }}>
              <div className={styles.achEmoji}>{unlocked ? ach.emoji : '🔒'}</div>
              <div className={styles.achTitle} style={{ color: unlocked ? rarityColor : '#555' }}>{ach.title}</div>
              <div className={styles.achDesc}>{ach.description}</div>
              {unlocked && <div className={styles.achReward}>+{ach.reward.xp}XP{ach.reward.kc ? ` +${ach.reward.kc}KC` : ''}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )

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
      <div style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8 }}>Köp fler föremål i Shoppen!</div>
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
      <div className={styles.recordGrid}>
        <RecordRow emoji="👆" label="Totala pek" value={formatNumber(pet.totalTaps)} />
        <RecordRow emoji="⚔️" label="Strider vunna" value={formatNumber(pet.battleWins)} />
        <RecordRow emoji="🎣" label="Fiskar fångade" value={formatNumber(pet.fishCaught)} />
        <RecordRow emoji="🏃" label="Runner rekord" value={`${pet.runnerBest}m`} />
        <RecordRow emoji="🔥" label="Bästa streak" value={`${pet.streak} dagar`} />
        <RecordRow emoji="💰" label="Totala mynt" value={formatNumber(pet.totalCoinsEarned)} />
        <RecordRow emoji="🌟" label="Nuvarande nivå" value={`${pet.level}`} />
        <RecordRow emoji="📋" label="Uppdrag klara" value={formatNumber(pet.questsCompleted)} />
      </div>
    </div>
  )

  // ── Leaderboard panel ───────────────────────────────────────────────────────
  if (panel === 'leaderboard') {
    const FAKE_LB = [
      { name: 'ZenMaster', emoji: '🐼', level: 42, taps: 98234 },
      { name: 'VoidHunter', emoji: '🐺', level: 38, taps: 87122 },
      { name: 'LunaDrake', emoji: '🐉', level: 35, taps: 72341 },
      { name: pet.petName, emoji: pet.petEmoji, level: pet.level, taps: pet.totalTaps },
      { name: 'StarPaws', emoji: '🐱', level: 28, taps: 45123 },
      { name: 'AquaFisher', emoji: '🐸', level: 22, taps: 34567 },
    ].sort((a, b) => b.taps - a.taps)
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🏅 Topplista</div>
        {FAKE_LB.map((p, i) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, background: p.name === pet.petName ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${p.name === pet.petName ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--ff-head)', fontSize: 18, color: ['#fbbf24', '#888', '#cd7f32', '#888', '#888', '#888'][i], width: 28 }}>{['🥇', '🥈', '🥉', '4', '5', '6'][i]}</span>
            <span style={{ fontSize: 28 }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: p.name === pet.petName ? '#a855f7' : '#e8e8f0' }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>LV{p.level}</div>
            </div>
            <div style={{ fontSize: 13, color: '#fbbf24' }}>👆{formatNumber(p.taps)}</div>
          </div>
        ))}
      </div>
    )
  }

  // ── Battle Pass panel ────────────────────────────────────────────────────────
  if (panel === 'battlepass') {
    const tiers = [
      { xp: 100, free: '50🪙', premium: '150🪙 + 🎩' },
      { xp: 300, free: '100🪙', premium: '300🪙 + 1💎KC' },
      { xp: 600, free: '200🪙', premium: '500🪙 + 5💎KC' },
      { xp: 1000, free: '3💎KC', premium: '1000🪙 + 20💎KC' },
      { xp: 2000, free: 'Exklusiv titel', premium: 'Galax-aura + 50💎KC' },
    ]
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🎫 Battle Pass — Säsong 1</div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Säsong XP: {formatNumber(pet.bpassXP)}</div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (pet.bpassXP / 2000) * 100)}%`, background: 'linear-gradient(90deg,#a855f7,#ec4899)', borderRadius: 5 }} />
          </div>
        </div>
        {tiers.map((t, i) => {
          const reached = pet.bpassXP >= t.xp
          return (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: reached ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${reached ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 16, width: 28 }}>{reached ? '✅' : '🔒'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#888' }}>Nivå {i + 1} · {t.xp} XP</div>
                <div style={{ fontSize: 13, color: '#e8e8f0' }}>Gratis: {t.free}</div>
                <div style={{ fontSize: 13, color: '#fbbf24' }}>Premium: {t.premium}</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Quests panel ─────────────────────────────────────────────────────────────
  if (panel === 'quests') {
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>📋 Dagliga Quests</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Klara quests för att tjäna KC och XP</div>
        {[
          { title: 'Peka 100 gånger', done: pet.totalTaps >= 100, reward: '3KC + 100XP' },
          { title: 'Nå nivå 5', done: pet.level >= 5, reward: '5KC + 200XP' },
          { title: 'Vinn en strid', done: pet.battleWins >= 1, reward: '2KC + 50XP' },
          { title: 'Fånga 3 fiskar', done: pet.fishCaught >= 3, reward: '3KC + 80XP' },
          { title: 'Spring 100m i Runner', done: pet.runnerBest >= 100, reward: '4KC + 120XP' },
          { title: '7 dagars streak', done: pet.streak >= 7, reward: '10KC + 500XP' },
        ].map((q, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${q.done ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{q.done ? '✅' : '📋'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: q.done ? '#4ade80' : '#e8e8f0', fontWeight: 600 }}>{q.title}</div>
              <div style={{ fontSize: 12, color: '#fbbf24' }}>Belöning: {q.reward}</div>
            </div>
          </div>
        ))}
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
    ]
    const RARITY_CLR: Record<string, string> = { common: '#aaa', rare: '#4488ff', epic: '#aa66ff', legendary: '#ffcc00' }
    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>⚗️ Craftshop</div>
        <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 12 }}>Kombinera mynt för att skapa föremål</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {RECIPES.map(r => {
            const canAfford = pet.coins >= r.cost
            return (
              <div
                key={r.id}
                style={{
                  background: canAfford ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)',
                  border: `1px solid ${canAfford ? RARITY_CLR[r.rarity] + '55' : 'rgba(255,255,255,.06)'}`,
                  borderRadius: 14,
                  padding: 12,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  opacity: canAfford ? 1 : 0.5,
                  transition: 'all .15s',
                }}
                onClick={() => {
                  if (!canAfford) { showToast('Inte tillräckligt med mynt!', 'error'); return }
                  spendCoins(r.cost)
                  addInventoryItem({ id: r.id, name: r.name, emoji: r.emoji, description: r.desc, effect: r.effect, quantity: 1, rarity: r.rarity })
                  showToast(`${r.emoji} ${r.name} craftat!`, 'success')
                  audio.achievement()
                  if (r.effect.exp) gainXP(r.effect.exp, 'craft')
                  if (r.effect.mood) setStat('mood', Math.min(100, pet.mood + r.effect.mood))
                  if (r.effect.hunger) setStat('hunger', Math.min(100, pet.hunger + r.effect.hunger))
                  if (r.effect.energy) setStat('energy', Math.min(100, pet.energy + r.effect.energy))
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 4 }}>{r.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: RARITY_CLR[r.rarity], marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 6 }}>{r.desc}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--gold)' }}>💰 {r.cost}</div>
              </div>
            )
          })}
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
