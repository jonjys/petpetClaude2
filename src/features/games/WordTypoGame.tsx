import { memo, useState, useCallback, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const ROUNDS = 10

const WORD_SETS: { correct: string; typo: string }[] = [
  { correct: 'skola', typo: 'skolla' },
  { correct: 'hund', typo: 'hunnd' },
  { correct: 'katt', typo: 'kaat' },
  { correct: 'cykel', typo: 'cykkel' },
  { correct: 'blomma', typo: 'blomm' },
  { correct: 'dator', typo: 'daator' },
  { correct: 'bord', typo: 'boord' },
  { correct: 'stol', typo: 'stooll' },
  { correct: 'lampa', typo: 'lammpa' },
  { correct: 'fönster', typo: 'fönstter' },
  { correct: 'dörr', typo: 'dörrr' },
  { correct: 'golv', typo: 'golov' },
  { correct: 'tak', typo: 'tacck' },
  { correct: 'vägg', typo: 'väg' },
  { correct: 'soffa', typo: 'sofa' },
  { correct: 'sång', typo: 'sångng' },
  { correct: 'musik', typo: 'mussik' },
  { correct: 'bok', typo: 'bbok' },
  { correct: 'penna', typo: 'pena' },
  { correct: 'glass', typo: 'glas' },
  { correct: 'tårta', typo: 'tårtta' },
  { correct: 'banan', typo: 'bannan' },
  { correct: 'äpple', typo: 'äppple' },
  { correct: 'mango', typo: 'manggo' },
  { correct: 'fisk', typo: 'fissk' },
]

function makeRound(usedIdx: Set<number>) {
  const available = WORD_SETS.filter((_, i) => !usedIdx.has(i))
  const picked: typeof WORD_SETS = []
  const pickedIdx: number[] = []
  while (picked.length < 4 && available.length > 0) {
    const i = Math.floor(Math.random() * available.length)
    const origIdx = WORD_SETS.indexOf(available[i])
    if (!pickedIdx.includes(origIdx)) { picked.push(available[i]); pickedIdx.push(origIdx) }
    available.splice(i, 1)
  }
  const typoIdx = Math.floor(Math.random() * picked.length)
  const typoOrigIdx = pickedIdx[typoIdx]
  const options = picked.map((w, i) => i === typoIdx ? w.typo : w.correct)
  const shuffled = options.map((word, i) => ({ word, isTypo: i === typoIdx })).sort(() => Math.random() - 0.5)
  return { options: shuffled, typoWord: picked[typoIdx].typo, typoOrigIdx }
}

export const WordTypoGame = memo(function WordTypoGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'feedback' | 'done'>('ready')
  const [round, setRound] = useState(0)
  const [q, setQ] = useState<ReturnType<typeof makeRound> | null>(null)
  const [score, setScore] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [chosen, setChosen] = useState('')
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_wtg_best') ?? 0))
  const scoreRef = useRef(0)
  const usedRef = useRef<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRound = useCallback((r: number) => {
    if (r >= ROUNDS) {
      const s = scoreRef.current
      const prev = Number(localStorage.getItem('k0509_wtg_best') ?? 0)
      if (s > prev) localStorage.setItem('k0509_wtg_best', String(s))
      onWin(s * 20, s * 60)
      setPhase('done')
      audio.achievement()
      return
    }
    const qdata = makeRound(usedRef.current)
    usedRef.current.add(qdata.typoOrigIdx)
    setQ(qdata)
    setChosen('')
    setRound(r)
    setPhase('play')
  }, [onWin])

  const start = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    usedRef.current = new Set()
    nextRound(0)
  }, [nextRound])

  const answer = useCallback((word: string, isTypo: boolean) => {
    if (phase !== 'play') return
    setChosen(word)
    const correct = isTypo
    setWasCorrect(correct)
    if (correct) { scoreRef.current++; setScore(scoreRef.current); audio.coin() } else { audio.click() }
    setPhase('feedback')
    timerRef.current = setTimeout(() => nextRound(round + 1), 1100)
  }, [phase, round, nextRound])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🔍 Stavfelsjägaren</span>
        <span className={styles.scoreDisplay}>{score}/{ROUNDS}</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🔍</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Stavfelsjägaren</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Ett av fyra ord är felstavat — hitta det! 10 ronder.
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore}/{ROUNDS}</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'play' && q && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>Hitta stavfelet! ({round + 1}/{ROUNDS})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(opt.word, opt.isTypo)}
                style={{
                  padding: '16px 20px', borderRadius: 14, fontSize: 18, fontWeight: 900,
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,.12)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  letterSpacing: 1,
                }}
              >{opt.word}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && q && (
        <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 52 }}>{wasCorrect ? '✅' : '❌'}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? '#4ade80' : '#f87171' }}>
            {wasCorrect ? `Rätt! "${q.typoWord}" är felstavat` : `Fel! Det felstavade ordet var "${q.typoWord}"`}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52 }}>{score >= 8 ? '🏆' : score >= 5 ? '⭐' : '🔍'}</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{score} / {ROUNDS}</div>
          <div style={{ fontSize: 13, color: score >= 8 ? '#4ade80' : '#fbbf24' }}>
            {score === 10 ? 'PERFEKT! 🏆' : score >= 8 ? 'Utmärkt! ⭐' : score >= 5 ? 'Bra! 👍' : 'Öva mer! 🔍'}
          </div>
          {score > bestScore && <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 900 }}>🏆 NYTT REKORD!</div>}
          <div style={{ fontSize: 13, color: '#fbbf24' }}>+{score * 20}🪙 +{score * 60} XP</div>
          <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={start}>Spela igen!</button>
        </div>
      )}
    </div>
  )
})
