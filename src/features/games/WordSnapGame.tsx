import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORD_TIME = 1200
const TOTAL_WORDS = 20

const CATEGORIES: { name: string; words: string[]; distractors: string[] }[] = [
  {
    name: 'Djur',
    words: ['Lejon', 'Tiger', 'Elefant', 'Giraff', 'Orm', 'Örn', 'Val', 'Panda', 'Räv', 'Varg'],
    distractors: ['Stol', 'Bord', 'Bok', 'Bil', 'Lampa', 'Dörr', 'Fönster', 'Klocka', 'Telefon', 'Nyckel'],
  },
  {
    name: 'Mat',
    words: ['Pizza', 'Sushi', 'Pasta', 'Äpple', 'Burger', 'Kaka', 'Bröd', 'Ris', 'Soppa', 'Mjölk'],
    distractors: ['Hammare', 'Penna', 'Moln', 'Flod', 'Sten', 'Flagga', 'Väg', 'Berg', 'Sand', 'Snö'],
  },
  {
    name: 'Sport',
    words: ['Tennis', 'Fotboll', 'Simning', 'Boxning', 'Löpning', 'Golf', 'Cricket', 'Hockey', 'Rugby', 'Skiing'],
    distractors: ['Penna', 'Lampa', 'Stol', 'Bok', 'Dörr', 'Klocka', 'Vägg', 'Moln', 'Nyckel', 'Bord'],
  },
  {
    name: 'Färger',
    words: ['Röd', 'Blå', 'Grön', 'Gul', 'Lila', 'Orange', 'Rosa', 'Brun', 'Svart', 'Vit'],
    distractors: ['Hus', 'Träd', 'Bil', 'Fågel', 'Fisk', 'Berg', 'Sjö', 'Skog', 'Sol', 'Måne'],
  },
  {
    name: 'Länder',
    words: ['Sverige', 'Japan', 'Frankrike', 'Brasilien', 'Kanada', 'Indien', 'Italien', 'Mexiko', 'Ryssland', 'Kina'],
    distractors: ['Trumpet', 'Gitarr', 'Piano', 'Violin', 'Trumma', 'Flöjt', 'Harpa', 'Tuba', 'Saxofon', 'Klarinett'],
  },
]

function buildWordList(catIdx: number): { word: string; isTarget: boolean }[] {
  const cat = CATEGORIES[catIdx]
  const list: { word: string; isTarget: boolean }[] = [
    ...cat.words.map(w => ({ word: w, isTarget: true })),
    ...cat.distractors.map(w => ({ word: w, isTarget: false })),
  ]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

export const WordSnapGame = memo(function WordSnapGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [catIdx] = useState(() => Math.floor(Math.random() * CATEGORIES.length))
  const [wordList, setWordList] = useState<{ word: string; isTarget: boolean }[]>([])
  const [wordIdx, setWordIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [missed, setMissed] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wsnap_best') ?? 0))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoreRef = useRef(0)
  const wordIdxRef = useRef(0)
  const wordListRef = useRef<{ word: string; isTarget: boolean }[]>([])
  const snappedRef = useRef(false)

  const advanceWord = useCallback((list: typeof wordList, idx: number) => {
    if (idx >= TOTAL_WORDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_wsnap_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_wsnap_best', String(s))
      if (s > 0) onWin(Math.round(s / 4), s)
      setPhase('done')
      return
    }
    const entry = list[idx]
    snappedRef.current = false
    wordIdxRef.current = idx
    setWordIdx(idx)
    setFeedback(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!snappedRef.current && entry.isTarget) {
        setMissed(m => m + 1)
        scoreRef.current = Math.max(0, scoreRef.current - 5)
        setScore(scoreRef.current)
        setFeedback('wrong')
        setTimeout(() => advanceWord(wordListRef.current, idx + 1), 400)
      } else {
        advanceWord(wordListRef.current, idx + 1)
      }
    }, WORD_TIME)
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setMissed(0)
    const list = buildWordList(catIdx)
    wordListRef.current = list
    setWordList(list)
    setPhase('playing')
    advanceWord(list, 0)
  }, [catIdx, advanceWord])

  const snap = useCallback(() => {
    if (phase !== 'playing' || snappedRef.current) return
    snappedRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    const entry = wordListRef.current[wordIdxRef.current]
    if (entry.isTarget) {
      audio.coin()
      scoreRef.current += 10; setScore(scoreRef.current)
      setFeedback('correct')
    } else {
      audio.tap()
      scoreRef.current = Math.max(0, scoreRef.current - 5); setScore(scoreRef.current)
      setFeedback('wrong')
    }
    setTimeout(() => advanceWord(wordListRef.current, wordIdxRef.current + 1), 350)
  }, [phase, advanceWord])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const cat = CATEGORIES[catIdx]
  const current = wordList[wordIdx]
  const progress = wordIdx / TOTAL_WORDS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎯 Word Snap</span>
        <span className={styles.scoreDisplay}>{score}p · {Math.min(wordIdx, TOTAL_WORDS)}/{TOTAL_WORDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎯</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Word Snap</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Ord blinkar ett i taget. Tryck SNAP om ordet tillhör kategorin! +10p rätt, -5p fel/missat.
          </div>
          <div style={{ padding: '8px 18px', background: 'rgba(96,165,250,.15)', border: '1px solid rgba(96,165,250,.4)', borderRadius: 10, fontSize: 13, color: '#60a5fa', fontWeight: 700 }}>
            Kategori: {cat.name}
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: '#60a5fa', borderRadius: 2, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Kategori: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{cat.name}</span></div>
          <div style={{
            minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: feedback === 'correct' ? 'rgba(74,222,128,.15)' : feedback === 'wrong' ? 'rgba(248,113,113,.15)' : 'rgba(255,255,255,.06)',
            border: `2px solid ${feedback === 'correct' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 20, width: '100%', transition: 'all .15s',
          }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 900, color: '#fff' }}>
              {current?.word ?? ''}
            </div>
          </div>
          {feedback === 'correct' && <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>✓ +10p</div>}
          {feedback === 'wrong' && <div style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>✗ -5p</div>}
          <button onClick={snap} style={{
            padding: '20px 60px', borderRadius: 20, fontSize: 22, fontWeight: 900,
            background: 'rgba(96,165,250,.2)', border: '3px solid #60a5fa', color: '#60a5fa', cursor: 'pointer',
            letterSpacing: 2,
          }}>SNAP!</button>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Missat: {missed}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🎯 {score}p!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Missade: {missed} ord</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
