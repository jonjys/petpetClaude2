import { memo, useState, useEffect } from 'react'
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

const ITEM_ACCENTS: Record<string, string> = {
  spin: 'gold', lucky: 'purple', shop: 'green', expedition: 'blue',
  achievements: 'gold', craft: 'purple', fortune: 'orange',
  wardrobe: 'pink', battlepass: 'purple', leaderboard: 'gold',
  quests: 'green', records: 'blue',
}
const ITEM_BADGES: Record<string, { label: string; color: string }> = {
  spin:       { label: 'DAGLIG', color: 'var(--gold)'   },
  lucky:      { label: 'NY',     color: 'var(--purple)' },
  battlepass: { label: 'S1',     color: 'var(--purple)' },
  craft:      { label: 'CRAFT',  color: 'var(--blue)'   },
  expedition: { label: 'ÄVENTYR',color: 'var(--green)'  },
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
    const BP_SEASON_MAX = 2000
    const tiers = [
      { xp: 100, free: '50🪙',        freeCoins: 50,  freeKC: 0,  label: 'Tier 1' },
      { xp: 300, free: '100🪙',       freeCoins: 100, freeKC: 0,  label: 'Tier 2' },
      { xp: 600, free: '200🪙',       freeCoins: 200, freeKC: 0,  label: 'Tier 3' },
      { xp: 1000, free: '3💎 KC',     freeCoins: 0,   freeKC: 3,  label: 'Tier 4' },
      { xp: 2000, free: '10💎 KC',    freeCoins: 0,   freeKC: 10, label: 'Tier 5 MAX' },
    ]
    const claimedKey = 'k0509_bp_claimed'
    const claimed: number[] = JSON.parse(localStorage.getItem(claimedKey) ?? '[]')

    const claimTier = (idx: number, coins: number, kc: number) => {
      const next = [...claimed, idx]
      localStorage.setItem(claimedKey, JSON.stringify(next))
      if (coins > 0) gainCoins(coins)
      if (kc > 0) gainKC(kc)
      showToast(`🎫 Tier ${idx + 1} hämtad!${coins > 0 ? ` +${coins}🪙` : ''}${kc > 0 ? ` +${kc}💎` : ''}`, 'success')
      triggerConfetti(); audio.achievement()
    }

    return (
      <div className={styles.panelRoot}>
        <BackBtn />
        <div className={styles.panelTitle}>🎫 Battle Pass — Säsong 1</div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: '#888' }}>Säsong XP: {formatNumber(pet.bpassXP)}</div>
            <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700 }}>{Math.round((pet.bpassXP / BP_SEASON_MAX) * 100)}%</div>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (pet.bpassXP / BP_SEASON_MAX) * 100)}%`, background: 'linear-gradient(90deg,#a855f7,#ec4899)', borderRadius: 5, transition: 'width .6s' }} />
          </div>
        </div>
        {tiers.map((t, i) => {
          const reached = pet.bpassXP >= t.xp
          const isClaimed = claimed.includes(i)
          const canClaim = reached && !isClaimed
          return (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: reached ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${reached ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, marginBottom: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16, width: 28 }}>{isClaimed ? '✅' : reached ? '🎁' : '🔒'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#888' }}>{t.label} · {formatNumber(t.xp)} BP XP</div>
                <div style={{ fontSize: 13, color: '#e8e8f0' }}>{t.free}</div>
              </div>
              {canClaim && (
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
                  onClick={() => { claimTier(i, t.freeCoins, t.freeKC) }}
                >
                  Hämta!
                </button>
              )}
              {isClaimed && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>Hämtad</span>}
              {!reached && <span style={{ fontSize: 11, color: '#555' }}>{formatNumber(t.xp - pet.bpassXP)} XP kvar</span>}
            </div>
          )
        })}
        <div style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 8 }}>
          Battle Pass XP = 10% av all tjänad XP
        </div>
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
