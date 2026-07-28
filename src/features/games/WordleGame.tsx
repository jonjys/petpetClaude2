import { memo, useState, useCallback, useEffect } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const WORDS = [
  'BJÖRN','HAVET','SKOLA','STORM','TIGER','TRÄNA','KAFFE','TUNGA',
  'HJÄLP','SMART','SLUTA','FLUGA','GRUPP','PÄRON','ÄPPLE','KLASS',
  'MUSIK','KLART','TJOCK','VAKEN','KOMET','DRÖMT','FRYSA','LYFTE',
  'BRAND','LJUGA','FJORD','LUNCH','MJÖLK','PENNA','BULLE','CYKEL',
  'DRAKE','KVART','LEJON','BJÖRK','SNABB','ELAKT','DUNST','PRICK',
]

const KEYS = [
  ['Q','W','E','R','T','Y','U','I','O','P','Å'],
  ['A','S','D','F','G','H','J','K','L','Ö','Ä'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

const MAX_GUESSES = 6
const WORD_LEN = 5

type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd'

function tileStyle(state: LetterState) {
  if (state === 'correct') return { bg: 'rgba(74,222,128,.2)', border: 'rgba(74,222,128,.6)', color: '#4ade80' }
  if (state === 'present') return { bg: 'rgba(251,191,36,.2)', border: 'rgba(251,191,36,.6)', color: '#fbbf24' }
  if (state === 'absent') return { bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.14)', color: '#666' }
  if (state === 'tbd') return { bg: 'transparent', border: 'rgba(255,255,255,.35)', color: '#e8e8f0' }
  return { bg: 'transparent', border: 'rgba(255,255,255,.15)', color: '#444' }
}

export const WordleGame = memo(function WordleGame({ onExit, onWin }: Props) {
  const [target] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)])
  const [rows, setRows] = useState<string[]>(Array(MAX_GUESSES).fill(''))
  const [rowStates, setRowStates] = useState<LetterState[][]>(
    Array.from({ length: MAX_GUESSES }, () => Array(WORD_LEN).fill('empty'))
  )
  const [cursor, setCursor] = useState(0)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing')
  const [keyMap, setKeyMap] = useState<Record<string, LetterState>>({})
  const [wonAt, setWonAt] = useState(0)

  const submit = useCallback(() => {
    if (input.length !== WORD_LEN || phase !== 'playing') return
    const guess = input.toUpperCase()
    const newStates: LetterState[] = Array(WORD_LEN).fill('absent')
    const targetArr = target.split('')
    const used = Array(WORD_LEN).fill(false)
    for (let i = 0; i < WORD_LEN; i++) {
      if (guess[i] === targetArr[i]) { newStates[i] = 'correct'; used[i] = true }
    }
    for (let i = 0; i < WORD_LEN; i++) {
      if (newStates[i] === 'correct') continue
      const j = targetArr.findIndex((c, idx) => c === guess[i] && !used[idx])
      if (j !== -1) { newStates[i] = 'present'; used[j] = true }
    }
    const newRows = [...rows]; newRows[cursor] = guess
    const newRowStates = [...rowStates]; newRowStates[cursor] = newStates
    setRows(newRows); setRowStates(newRowStates)
    const newKeyMap = { ...keyMap }
    for (let i = 0; i < WORD_LEN; i++) {
      const k = guess[i]; const prev = newKeyMap[k]
      if (newStates[i] === 'correct') newKeyMap[k] = 'correct'
      else if (newStates[i] === 'present' && prev !== 'correct') newKeyMap[k] = 'present'
      else if (!prev || prev === 'empty') newKeyMap[k] = 'absent'
    }
    setKeyMap(newKeyMap)
    if (guess === target) { setPhase('won'); setWonAt(cursor + 1) }
    else if (cursor + 1 >= MAX_GUESSES) { setPhase('lost') }
    setCursor(c => c + 1); setInput('')
  }, [input, phase, target, rows, rowStates, cursor, keyMap])

  const handleKey = useCallback((key: string) => {
    if (phase !== 'playing') return
    if (key === 'ENTER') { submit(); return }
    if (key === '⌫' || key === 'BACKSPACE') { setInput(s => s.slice(0, -1)); audio.click(); return }
    if (input.length < WORD_LEN && /^[A-ZÅÄÖ]$/.test(key)) { setInput(s => s + key); audio.click() }
  }, [phase, input, submit])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key === 'Backspace' ? 'BACKSPACE' : e.key.toUpperCase()
      handleKey(k)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleKey])

  useEffect(() => {
    if (phase === 'won') {
      const coinMap = [300, 250, 200, 150, 100, 60]
      const c = coinMap[wonAt - 1] ?? 60
      onWin(c, c * 2)
      audio.achievement()
    } else if (phase === 'lost') {
      onWin(15, 10)
      audio.click()
    }
  }, [phase, wonAt, onWin])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🟩 Wordle SV</span>
        <span className={styles.scoreDisplay}>{cursor}/{MAX_GUESSES}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 16px' }}>
        {Array.from({ length: MAX_GUESSES }, (_, row) => {
          const isActive = row === cursor && phase === 'playing'
          const rowText = isActive ? input.padEnd(WORD_LEN, ' ') : (rows[row] || '').padEnd(WORD_LEN, ' ')
          return (
            <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
              {Array.from({ length: WORD_LEN }, (_, col) => {
                const letter = rowText[col]?.trim() ?? ''
                const state: LetterState = isActive ? (letter ? 'tbd' : 'empty') : (rowStates[row]?.[col] ?? 'empty')
                const { bg, border, color } = tileStyle(state)
                return (
                  <div key={col} style={{
                    height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: bg, border: `2px solid ${border}`, borderRadius: 8,
                    fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color,
                    transition: 'background .15s, border-color .15s',
                  }}>
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {phase !== 'playing' && (
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 900,
          color: phase === 'won' ? '#4ade80' : '#f87171', padding: '2px 0' }}>
          {phase === 'won' ? `🎉 Rätt på ${wonAt} försök!` : `Ordet var: ${target}`}
        </div>
      )}

      <div style={{ padding: '0 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {KEYS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            {row.map(k => {
              const ks = keyMap[k]
              const { bg, border, color } = tileStyle(ks ?? 'empty')
              const wide = k === 'ENTER' || k === '⌫'
              return (
                <button key={k} onClick={() => handleKey(k === '⌫' ? '⌫' : k)} style={{
                  padding: 0, width: wide ? 50 : 26, height: 36, borderRadius: 6,
                  fontSize: wide ? 9 : 11, fontWeight: 900, flexShrink: 0,
                  background: ks ? bg : 'rgba(255,255,255,.1)',
                  border: `1.5px solid ${ks ? border : 'rgba(255,255,255,.15)'}`,
                  color: ks ? color : '#ccc', cursor: 'pointer', transition: 'all .1s',
                }}>
                  {k}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {phase !== 'playing' && (
        <div style={{ textAlign: 'center', padding: '0 16px' }}>
          <button className="btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}
            onClick={() => window.location.reload()}>
            Ny omgång
          </button>
        </div>
      )}
    </div>
  )
})
