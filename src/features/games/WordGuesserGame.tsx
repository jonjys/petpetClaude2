import { memo, useState, useCallback } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORDS = [
  { word: 'STORM', hint: 'Väder med åska och blixt' },
  { word: 'FJÄLL', hint: 'Hög terrängform i Sverige' },
  { word: 'BJÖRN', hint: 'Stort bärdjur i skogen' },
  { word: 'KYRKA', hint: 'Byggnad för gudstjänster' },
  { word: 'SNÖRE', hint: 'Tunt rep för att knyta' },
  { word: 'FLUGA', hint: 'Litet flygande insekt' },
  { word: 'PIANO', hint: 'Tangentinstrument med ivories' },
  { word: 'GRODA', hint: 'Grönt hoppande djur' },
  { word: 'TIMME', hint: '60 minuter' },
  { word: 'SKALA', hint: 'Yttre lager på fisken' },
  { word: 'BRYGD', hint: 'Tillverkningsprocess för öl' },
  { word: 'KRITA', hint: 'Vit sten för att rita' },
  { word: 'FLASK', hint: 'Behållare för vätskor' },
  { word: 'DAGER', hint: 'Dagsljus eller möjlighet' },
  { word: 'GLASS', hint: 'Söt fryst efterrätt' },
]

const MAX_WRONG = 6

export const WordGuesserGame = memo(function WordGuesserGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [wordIdx, setWordIdx] = useState(0)
  const [pool] = useState(() => [...WORDS].sort(() => Math.random() - 0.5))
  const [guessed, setGuessed] = useState<string[]>([])
  const [wrong, setWrong] = useState(0)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wg_best') ?? 0))
  const ROUNDS = 5

  const current = pool[wordIdx]

  const revealed = current ? current.word.split('').map(ch => guessed.includes(ch) ? ch : '_') : []
  const isWon = revealed.every(c => c !== '_')
  const isLost = wrong >= MAX_WRONG

  const startRound = useCallback((wi: number, r: number) => {
    setWordIdx(wi); setGuessed([]); setWrong(0); setRound(r)
  }, [])

  const start = useCallback(() => {
    setScore(0); startRound(0, 0); setPhase('playing')
  }, [startRound])

  const guess = useCallback((letter: string) => {
    if (guessed.includes(letter) || isWon || isLost) return
    const newGuessed = [...guessed, letter]
    setGuessed(newGuessed)
    if (!current.word.includes(letter)) {
      const nw = wrong + 1
      setWrong(nw); audio.tap()
      if (nw >= MAX_WRONG) {
        setTimeout(() => {
          const nr = round + 1
          if (nr >= ROUNDS) { const s = score; const prev = Number(localStorage.getItem('k0509_wg_best') ?? 0); if (s > prev) localStorage.setItem('k0509_wg_best', String(s)); if (s > 0) onWin(Math.round(s / 7), s); setPhase('done') }
          else { startRound(wordIdx + 1, nr) }
        }, 800)
      }
    } else {
      audio.coin()
      const newRevealed = current.word.split('').map(ch => newGuessed.includes(ch) ? ch : '_')
      if (newRevealed.every(c => c !== '_')) {
        const pts = (MAX_WRONG - wrong) * 40 + 80
        setScore(s => s + pts)
        audio.achievement()
        setTimeout(() => {
          const nr = round + 1
          if (nr >= ROUNDS) { const ns = score + pts; const prev = Number(localStorage.getItem('k0509_wg_best') ?? 0); if (ns > prev) localStorage.setItem('k0509_wg_best', String(ns)); if (ns > 0) onWin(Math.round(ns / 7), ns); setPhase('done') }
          else { startRound(wordIdx + 1, nr) }
        }, 800)
      }
    }
  }, [guessed, isWon, isLost, current, wrong, round, score, wordIdx, onWin, startRound])

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔤 Ordgissaren</span>
        <span className={styles.scoreDisplay}>{score}p · {round}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔤</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Ordgissaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Gissa svenska ord bokstav för bokstav. Max 6 fel — varje räddning ger mer poäng! 5 ord.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}p</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'playing' && current && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {Array.from({ length: MAX_WRONG }, (_, i) => (
              <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: i < wrong ? '#f87171' : 'rgba(255,255,255,.08)', border: `2px solid ${i < wrong ? '#f87171' : 'rgba(255,255,255,.15)'}`, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i < wrong ? '❌' : ''}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>💡 {current.hint}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {revealed.map((ch, i) => (
              <div key={i} style={{ width: 32, height: 40, borderBottom: '3px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                {ch !== '_' ? ch : ''}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {ALPHABET.split('').map(letter => {
              const used = guessed.includes(letter)
              const correct = used && current.word.includes(letter)
              return (
                <button key={letter} onClick={() => guess(letter)} disabled={used || isWon || isLost}
                  style={{ width: 32, height: 32, borderRadius: 6, fontSize: 12, fontWeight: 700, background: correct ? 'rgba(74,222,128,.2)' : used ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.08)', border: `1px solid ${correct ? 'rgba(74,222,128,.4)' : used ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.15)'}`, color: correct ? '#4ade80' : used ? 'rgba(255,255,255,.25)' : '#fff', cursor: used ? 'default' : 'pointer' }}
                >{letter}</button>
              )
            })}
          </div>
          {isLost && <div style={{ textAlign: 'center', fontSize: 13, color: '#f87171', fontWeight: 700 }}>Rätt svar: {current.word}</div>}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🔤 {score}p!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
