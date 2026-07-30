import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const GAME_DURATION = 60
const WORD_INTERVAL = 2200

const WORDS = [
  'katt','hund','fisk','fågel','björn','tiger','lejon','räv','häst','ko',
  'sol','måne','stjärna','moln','regn','snö','vind','storm','hav','flod',
  'bok','stol','bord','lampa','dörr','fönster','golv','tak','mur','trapp',
  'äpple','päron','banan','apelsin','citron','druva','melon','plommon','körsbär','mango',
  'röd','blå','grön','gul','vit','svart','rosa','lila','orange','brun',
  'ett','två','tre','fyra','fem','sex','sju','åtta','nio','tio',
  'spring','hoppa','simma','flyga','klättra','dansa','sjunga','rita','skriva','läsa',
  'glad','ledsen','arg','rädd','lugn','trött','hungrig','törstig','varm','kall',
]

interface FloatingWord {
  id: number
  word: string
  x: number
  spawnTime: number
}

export const WordFlowGame = memo(function WordFlowGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [input, setInput] = useState('')
  const [words, setWords] = useState<FloatingWord[]>([])
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wf_best') ?? 0))
  const wordsRef = useRef<FloatingWord[]>([])
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0; setScore(0); setMissed(0)
    wordsRef.current = []; idRef.current = 0
    setWords([]); setInput(''); setTimeLeft(GAME_DURATION); setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopAll()
          const s = scoreRef.current
          const prev = Number(localStorage.getItem('k0509_wf_best') ?? 0)
          if (s > prev) localStorage.setItem('k0509_wf_best', String(s))
          if (s > 0) onWin(Math.round(s * 4), s * 15)
          setPhase('done')
          return 0
        }
        const now = Date.now()
        const escaped = wordsRef.current.filter(w => now - w.spawnTime > 5000)
        if (escaped.length > 0) {
          setMissed(m => m + escaped.length)
          wordsRef.current = wordsRef.current.filter(w => now - w.spawnTime <= 5000)
          setWords([...wordsRef.current])
        }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setInterval(() => {
      const word = WORDS[Math.floor(Math.random() * WORDS.length)]
      const fw: FloatingWord = {
        id: idRef.current++,
        word,
        x: 5 + Math.random() * 80,
        spawnTime: Date.now(),
      }
      wordsRef.current = [...wordsRef.current, fw]
      setWords([...wordsRef.current])
    }, WORD_INTERVAL)
  }, [onWin, stopAll])

  const handleInput = useCallback((val: string) => {
    setInput(val)
    const trimmed = val.trim().toLowerCase()
    const idx = wordsRef.current.findIndex(w => w.word.toLowerCase() === trimmed)
    if (idx !== -1) {
      audio.coin()
      scoreRef.current++; setScore(scoreRef.current)
      wordsRef.current = wordsRef.current.filter((_, i) => i !== idx)
      setWords([...wordsRef.current])
      setInput('')
    }
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  const timerPct = (timeLeft / GAME_DURATION) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🌊 Ordflödet</span>
        <span className={styles.scoreDisplay}>{score}p · {timeLeft}s</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🌊</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordflödet</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Svenska ord dyker upp — skriv dem innan de försvinner! 60 sekunder. Snabbare = fler poäng.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct <= 30 ? '#f87171' : '#60a5fa', transition: 'width 1s linear' }} />
          </div>
          <div style={{ position: 'relative', height: 180, background: 'rgba(255,255,255,.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            {words.map(fw => {
              const age = (Date.now() - fw.spawnTime) / 5000
              const opacity = Math.max(0.3, 1 - age * 0.6)
              return (
                <div key={fw.id} style={{
                  position: 'absolute',
                  left: `${fw.x}%`,
                  top: `${10 + age * 70}%`,
                  transform: 'translateX(-50%)',
                  fontFamily: 'var(--ff-head)', fontSize: 15, fontWeight: 900,
                  color: '#60a5fa',
                  opacity,
                  textShadow: '0 0 8px #60a5fa',
                  pointerEvents: 'none',
                  transition: 'opacity .2s',
                  whiteSpace: 'nowrap',
                }}>{fw.word}</div>
              )
            })}
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder="Skriv ordet här..."
            style={{
              background: 'rgba(255,255,255,.07)', border: '2px solid rgba(96,165,250,.3)',
              borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 16,
              fontFamily: 'var(--ff-head)', outline: 'none',
            }}
          />
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>Missade: {missed}</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#60a5fa', fontSize: 20 }}>🌊 {score} ord!</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Missade: {missed}</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
