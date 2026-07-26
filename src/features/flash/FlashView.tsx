import { memo, useState, useCallback } from 'react'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { formatNumber } from '@/utils/format'
import { audio } from '@/services/AudioService'
import { FLASH_SAMPLE_POSTS } from '@/constants/config'
import type { FlashPost } from '@/types/game'
import styles from './FlashView.module.css'

type SubTab = 'feed' | 'explore' | 'missions'

const TRENDING = ['#levelup', '#battle', '#fishing', '#streak', '#boss', '#karma', '#daily']

export const FlashView = memo(function FlashView() {
  const [subTab, setSubTab] = useState<SubTab>('feed')
  const [posts, setPosts] = useState<FlashPost[]>(FLASH_SAMPLE_POSTS)
  const [newCaption, setNewCaption] = useState('')
  const [posting, setPosting] = useState(false)
  const { awardXP, awardCoins } = useGame()
  const pet = useGameStore(s => s.pet)
  const showToast = useUIStore(s => s.showToast)
  const pushNotif = useUIStore(s => s.pushNotif)

  const handleLike = useCallback((id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
    awardXP(5, 'like')
    audio.tap()
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
    pushNotif('📸', `Ditt Flash-inlägg publicerades!`)
    showToast('📸 Inlägg publicerat! +30 XP', 'success')
    audio.achievement()
  }, [newCaption, pet, awardXP, awardCoins, showToast, pushNotif])

  return (
    <div className={styles.root}>
      {/* Sub-tab bar */}
      <div className={styles.subTabs}>
        {(['feed', 'explore', 'missions'] as const).map(t => (
          <button key={t} className={`${styles.subTab} ${subTab === t ? styles.subTabActive : ''}`} onClick={() => setSubTab(t)}>
            {t === 'feed' ? '🏠 För dig' : t === 'explore' ? '🔍 Utforska' : '📋 Uppdrag'}
          </button>
        ))}
      </div>

      {/* Trending strip */}
      <div className={styles.trendStrip}>
        {TRENDING.map(tag => (
          <span key={tag} className={styles.trendTag}>{tag}</span>
        ))}
      </div>

      {subTab === 'feed' && (
        <>
          {/* Post creator */}
          {!posting ? (
            <button className={styles.postBtn} onClick={() => setPosting(true)}>
              {pet.petEmoji} Dela med dig... +30 XP
            </button>
          ) : (
            <div className={styles.postEditor}>
              <textarea
                className={styles.postInput}
                placeholder="Vad händer med ditt husdjur?"
                value={newCaption}
                onChange={e => setNewCaption(e.target.value)}
                rows={3}
                maxLength={200}
              />
              <div className={styles.postActions}>
                <button className="btn-ghost" onClick={() => setPosting(false)}>Avbryt</button>
                <button className="btn-primary" onClick={handlePost} disabled={!newCaption.trim()}>Publicera 📸</button>
              </div>
            </div>
          )}

          {/* Feed */}
          <div className={styles.feed}>
            {posts.map(post => (
              <div key={post.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardPet}>{post.petEmoji}</span>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardUsername}>{post.username}</span>
                    <span className={styles.cardLevel}>LV{post.petLevel}</span>
                  </div>
                  <span className={styles.cardTag}>{post.tag}</span>
                </div>
                <p className={styles.cardCaption}>{post.caption}</p>
                <div className={styles.cardFooter}>
                  <button className={`${styles.likeBtn} ${post.liked ? styles.liked : ''}`} onClick={() => handleLike(post.id)}>
                    {post.liked ? '❤️' : '🤍'} {post.likes}
                  </button>
                  <button className={styles.collectBtn} onClick={() => handleCollect(post)}>
                    ⭐ +{post.xpReward} XP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {subTab === 'explore' && (
        <div className={styles.explore}>
          <div className={styles.exploreGrid}>
            {posts.slice(0, 6).map(post => (
              <div key={post.id} className={styles.exploreCard} onClick={() => { setSubTab('feed') }}>
                <span className={styles.exploreEmoji}>{post.petEmoji}</span>
                <span className={styles.exploreTag}>{post.tag}</span>
              </div>
            ))}
          </div>
          <div className={styles.hotSection}>
            <div className={styles.hotTitle}>🔥 Trendande nu</div>
            {TRENDING.map(tag => (
              <div key={tag} className={styles.hotRow}>
                <span className={styles.hotTag}>{tag}</span>
                <span className={styles.hotCount}>{Math.floor(Math.random() * 500 + 100)} inlägg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'missions' && (
        <div className={styles.missions}>
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
        </div>
      )}
    </div>
  )
})

const MissionCard = memo(function MissionCard({ emoji, sponsor, title, desc, reward, disabled, onClaim }: {
  emoji: string; sponsor: string; title: string; desc: string; reward: string; disabled?: boolean; onClaim: () => void
}) {
  const [done, setDone] = useState(false)
  return (
    <div className={styles.missionCard}>
      <div className={styles.missionSponsor}>{emoji} {sponsor}</div>
      <div className={styles.missionTitle}>{title}</div>
      <div className={styles.missionDesc}>{desc}</div>
      <div className={styles.missionFooter}>
        <span className={styles.missionReward}>💰 {reward}</span>
        <button
          className={done ? 'btn-ghost' : 'btn-gold'}
          style={{ fontSize: 13, padding: '7px 14px' }}
          disabled={disabled || done}
          onClick={() => { setDone(true); onClaim() }}
        >
          {done ? '✅ Klart' : disabled ? '🔒 Låst' : 'Hämta'}
        </button>
      </div>
    </div>
  )
})
