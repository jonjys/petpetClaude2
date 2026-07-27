import { memo, useState, useCallback, useRef } from 'react'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { audio } from '@/services/AudioService'
import { FLASH_SAMPLE_POSTS } from '@/constants/config'
import type { FlashPost } from '@/types/game'

type SubTab = 'forYou' | 'explore' | 'uppdrag' | 'topplista'

const TRENDING = ['#levelup', '#battle', '#fishing', '#streak', '#boss', '#karma', '#daily']

const TOP_PLAYERS = [
  { rank: 1,  emoji: '🐲', name: 'DragonMaster99', level: 87, coins: 142500, streak: 45, badge: '👑' },
  { rank: 2,  emoji: '🦄', name: 'UnicornQueen',   level: 74, coins: 98300,  streak: 32, badge: '🥈' },
  { rank: 3,  emoji: '🔥', name: 'InfernoKing',    level: 68, coins: 87000,  streak: 28, badge: '🥉' },
  { rank: 4,  emoji: '🌙', name: 'MoonWalker',     level: 61, coins: 72100,  streak: 21, badge: '' },
  { rank: 5,  emoji: '⚡', name: 'ThunderGod',     level: 55, coins: 65400,  streak: 19, badge: '' },
  { rank: 6,  emoji: '🎯', name: 'PrecisionX',     level: 50, coins: 58800,  streak: 17, badge: '' },
  { rank: 7,  emoji: '🌊', name: 'OceanBreeze',    level: 46, coins: 52000,  streak: 14, badge: '' },
  { rank: 8,  emoji: '💎', name: 'CrystalKnight',  level: 42, coins: 47300,  streak: 12, badge: '' },
  { rank: 9,  emoji: '🌸', name: 'SakuraPetal',    level: 39, coins: 41100,  streak: 10, badge: '' },
  { rank: 10, emoji: '🤖', name: 'CyberBot2049',   level: 35, coins: 36500,  streak: 8,  badge: '' },
]

export const FlashView = memo(function FlashView() {
  const [subTab, setSubTab] = useState<SubTab>('forYou')
  const [posts, setPosts] = useState<FlashPost[]>(FLASH_SAMPLE_POSTS)
  const [newCaption, setNewCaption] = useState('')
  const [posting, setPosting] = useState(false)
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({})
  const reactCooldown = useRef<Record<string, number>>({})
  const { awardXP, awardCoins } = useGame()
  const pet = useGameStore(s => s.pet)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)
  const recordPost = useCallback(() => {
    useGameStore.setState(s => ({ pet: { ...s.pet, postCount: s.pet.postCount + 1 } }))
    useGameStore.getState().save()
  }, [])

  const handleLike = useCallback((id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
    awardXP(5, 'like')
    audio.tap()
  }, [awardXP])

  const handleReact = useCallback((postId: string, emoji: string) => {
    const now = Date.now()
    const key = `${postId}_${emoji}`
    if (reactCooldown.current[key] && now - reactCooldown.current[key] < 1000) return
    reactCooldown.current[key] = now
    setReactions(prev => ({
      ...prev,
      [postId]: { ...(prev[postId] ?? {}), [emoji]: ((prev[postId] ?? {})[emoji] ?? 0) + 1 },
    }))
    audio.tap()
    awardXP(2, 'react')
  }, [awardXP])

  const handleCollect = useCallback((post: FlashPost) => {
    awardXP(post.xpReward, 'flash')
    audio.coin()
    showToast(`+${post.xpReward} XP från ${post.username}!`, 'xp')
  }, [awardXP, showToast])

  const handlePost = useCallback(() => {
    if (!newCaption.trim()) return
    const newPost: FlashPost = {
      id: `user-${Date.now()}`,
      username: pet.petName,
      petEmoji: pet.petEmoji,
      petLevel: pet.level,
      caption: newCaption,
      likes: 0, xpReward: 20,
      tag: '#mypost',
      liked: false,
    }
    setPosts(prev => [newPost, ...prev])
    setNewCaption('')
    setPosting(false)
    awardXP(30, 'post')
    awardCoins(10)
    recordPost()
    pushNotif('📸', `Ditt Flash-inlägg publicerades!`)
    showToast('📸 Inlägg publicerat! +30 XP +10💰', 'success')
    audio.achievement()
  }, [newCaption, pet, awardXP, awardCoins, showToast, pushNotif])

  return (
    <>
      {/* Overlaid topbar */}
      <div className="flash-topbar">
        <div className="flash-title">⚡ Flash</div>
        <div className="flash-tabs">
          <div className={`ftab${subTab === 'forYou' ? ' on' : ''}`} onClick={() => setSubTab('forYou')}>
            För dig<span className="ftab-cnt">4</span>
          </div>
          <div className={`ftab${subTab === 'explore' ? ' on' : ''}`} onClick={() => setSubTab('explore')}>
            Utforska<span className="ftab-cnt">🔥</span>
          </div>
          <div className={`ftab${subTab === 'uppdrag' ? ' on' : ''}`} onClick={() => setSubTab('uppdrag')}>
            Uppdrag<span className="ftab-cnt">3</span>
          </div>
          <div className={`ftab${subTab === 'topplista' ? ' on' : ''}`} onClick={() => setSubTab('topplista')}>
            Topplista<span className="ftab-cnt">🏆</span>
          </div>
        </div>
      </div>

      {/* Trending strip */}
      <div className="flash-trending-strip">
        {TRENDING.map(tag => (
          <div key={tag} className="flash-trend-chip">{tag}</div>
        ))}
      </div>

      {subTab === 'forYou' && (
        <div className="video-feed" id="videoFeed" style={{ overflowY: 'auto', paddingTop: 'calc(var(--sat, 0px) + 105px)', paddingBottom: 80 }}>
          {/* Post creator */}
          {!posting ? (
            <div style={{ padding: '8px 14px' }}>
              <button
                className="flash-post-card"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px dashed rgba(255,45,120,.3)', background: 'rgba(255,45,120,.05)' }}
                onClick={() => setPosting(true)}
              >
                <span style={{ fontSize: 20 }}>{pet.petEmoji}</span>{' '}
                <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 14 }}>Dela med dig... +30 XP</span>
              </button>
            </div>
          ) : (
            <div style={{ padding: '8px 14px' }}>
              <div className="flash-post-card">
                <textarea
                  style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: 14, resize: 'none', outline: 'none', minHeight: 72, fontFamily: 'var(--ff-body)' }}
                  placeholder="Vad händer med ditt husdjur?"
                  value={newCaption}
                  onChange={e => setNewCaption(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <div className="flash-post-actions" style={{ marginTop: 10 }}>
                  <button className="flash-action-btn" onClick={() => setPosting(false)}>Avbryt</button>
                  <button
                    className="flash-action-btn"
                    style={{ color: newCaption.trim() ? 'var(--pink)' : 'rgba(255,255,255,.2)', marginLeft: 'auto' }}
                    onClick={handlePost}
                    disabled={!newCaption.trim()}
                  >
                    Publicera 📸
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feed */}
          {posts.map(post => (
            <div key={post.id} style={{ padding: '4px 14px' }}>
              <div className="flash-post-card">
                <div className="flash-post-header">
                  <div className="flash-post-avatar">{post.petEmoji}</div>
                  <div className="flash-post-meta">
                    <div className="flash-post-name">{post.username}</div>
                    <div className="flash-post-time">LV{post.petLevel}</div>
                  </div>
                  <div className="flash-post-xp-badge">+{post.xpReward} XP</div>
                </div>
                <div className="flash-post-body">{post.caption}</div>
                <div className="flash-post-tag">{post.tag}</div>
                {/* Emoji reactions */}
                <div style={{ display: 'flex', gap: 6, margin: '6px 0 2px', flexWrap: 'wrap' }}>
                  {['🔥', '💎', '⚡', '❤️', '🏆'].map(emoji => {
                    const count = (reactions[post.id] ?? {})[emoji] ?? 0
                    return (
                      <button
                        key={emoji}
                        style={{
                          background: count > 0 ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)',
                          border: `1px solid ${count > 0 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.07)'}`,
                          borderRadius: 20, padding: '3px 8px', cursor: 'pointer',
                          fontSize: 12, display: 'flex', alignItems: 'center', gap: 3,
                          transition: 'all .15s',
                        }}
                        onClick={() => handleReact(post.id, emoji)}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 700 }}>{count}</span>}
                      </button>
                    )
                  })}
                </div>
                <div className="flash-post-actions">
                  <button className={`flash-action-btn${post.liked ? ' liked' : ''}`} onClick={() => handleLike(post.id)}>
                    {post.liked ? '❤️' : '🤍'} {post.likes}
                  </button>
                  <button className="flash-action-btn" onClick={() => handleCollect(post)}>
                    ⭐ Collect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'explore' && (
        <div className="explore-grid" style={{ display: 'grid', overflowY: 'auto', paddingTop: 'calc(var(--sat, 0px) + 105px)' }}>
          {posts.slice(0, 6).map(post => (
            <div
              key={post.id}
              style={{ background: 'rgba(255,45,120,.08)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', border: '1px solid rgba(255,45,120,.2)' }}
              onClick={() => setSubTab('forYou')}
            >
              <span style={{ fontSize: 28 }}>{post.petEmoji}</span>
              <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 700 }}>{post.tag}</span>
            </div>
          ))}
        </div>
      )}

      {subTab === 'uppdrag' && (
        <div style={{ padding: '0 14px', overflowY: 'auto', paddingTop: 'calc(var(--sat, 0px) + 105px)', paddingBottom: 80 }}>
          <MissionCard
            emoji="🎬"
            sponsor="Stadium × KARMA"
            title="Dela din träningssession"
            desc="Posta ett träningsinlägg och tagga #stadium"
            reward="150 🪙 + 50 XP"
            onClaim={() => { awardCoins(150); awardXP(50, 'uppdrag'); showToast('✅ Uppdrag klarat! +150🪙', 'success'); audio.achievement() }}
          />
          <MissionCard
            emoji="☕"
            sponsor="Espresso House"
            title="Recensera vårt kaffe"
            desc="Skriv en recension och posta det"
            reward="80 🪙 + 30 XP"
            onClaim={() => { awardCoins(80); awardXP(30, 'uppdrag'); showToast('✅ +80🪙', 'success') }}
          />
          <MissionCard
            emoji="🌟"
            sponsor="Karma Daily"
            title="Logga in 7 dagar i rad"
            desc={`Din streak: ${pet.streak} dagar`}
            reward="5 KC + 200 XP"
            disabled={pet.streak < 7}
            onClaim={() => { awardXP(200, 'streak'); useGameStore.getState().gainKC(5); showToast('🔥 7-dagarsbonus! +5 KC', 'success') }}
          />
          <MissionCard
            emoji="⚔️"
            sponsor="Arena"
            title="Vinn 5 strider"
            desc={`Dina segrar: ${pet.battleWins}/5`}
            reward="100 🪙 + 3 KC"
            disabled={pet.battleWins < 5}
            onClaim={() => { awardCoins(100); useGameStore.getState().gainKC(3); showToast('⚔️ +100🪙 +3 KC!', 'success') }}
          />
          <div className="vend" />
        </div>
      )}

      {subTab === 'topplista' && (
        <div style={{ padding: '0 14px', overflowY: 'auto', paddingTop: 'calc(var(--sat, 0px) + 105px)', paddingBottom: 80 }}>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 16, fontWeight: 900, color: '#fff', margin: '12px 0 16px', textAlign: 'center', letterSpacing: 1 }}>
            🏆 TOPPLISTA — VECKANS BÄSTA
          </div>
          {TOP_PLAYERS.map((p, i) => (
            <div
              key={p.rank}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: i < 3
                  ? `rgba(${i === 0 ? '255,204,0' : i === 1 ? '200,200,200' : '205,127,50'},.08)`
                  : 'rgba(255,255,255,.03)',
                border: `1px solid ${i < 3 ? `rgba(${i === 0 ? '255,204,0' : i === 1 ? '200,200,200' : '205,127,50'},.25)` : 'rgba(255,255,255,.06)'}`,
                borderRadius: 14,
                padding: '10px 12px',
                marginBottom: 6,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: i < 3 ? 'var(--gold)' : 'var(--t3)', width: 20, textAlign: 'center' }}>
                {p.badge || `#${p.rank}`}
              </div>
              <div style={{ fontSize: 26 }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--ff-head)', fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>LV{p.level} · {p.streak}🔥 streak</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>🪙{(p.coins / 1000).toFixed(1)}k</div>
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: 'var(--t3)' }}>
            Rankning uppdateras varje måndag 00:00
          </div>
          <div style={{ textAlign: 'center', padding: '8px 14px 20px' }}>
            <div style={{ background: 'rgba(255,204,0,.08)', border: '1px solid rgba(255,204,0,.2)', borderRadius: 14, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>DIN PLACERING</div>
              <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>
                #{Math.max(11, 11 + (100 - pet.level))} · LV{pet.level}
              </div>
            </div>
          </div>
          <div className="vend" />
        </div>
      )}
    </>
  )
})

const MissionCard = memo(function MissionCard({ emoji, sponsor, title, desc, reward, disabled, onClaim }: {
  emoji: string; sponsor: string; title: string; desc: string; reward: string; disabled?: boolean; onClaim: () => void
}) {
  const [done, setDone] = useState(false)
  return (
    <div className="uc-co" style={{ marginBottom: 10 }}>
      <div className="uc-co-logo">{emoji}</div>
      <div style={{ flex: 1 }}>
        <div className="uc-co-name">{sponsor}</div>
        <div className="uc-co-type">{title}</div>
      </div>
      <div className="uc-body" style={{ padding: 0 }}>
        <div className="uc-desc">{desc}</div>
        <div className="uc-bot">
          <div className="uc-rewards">
            <div className="uc-coins">{reward}</div>
          </div>
          <button
            className={done ? 'btn btn-sm' : 'btn btn-y btn-sm'}
            disabled={disabled || done}
            onClick={() => { setDone(true); onClaim() }}
          >
            {done ? '✅ Klart' : disabled ? '🔒 Låst' : 'Hämta'}
          </button>
        </div>
      </div>
    </div>
  )
})
