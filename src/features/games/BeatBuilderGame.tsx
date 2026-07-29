import { memo, useState, useCallback, useEffect, useRef } from 'react'
import styles from './GamesView.module.css'
import { audio } from '@/services/AudioService'

interface Props {
  onExit: () => void
  onWin: (coins: number, xp: number) => void
}

const STEPS = 16
const TRACKS = 4
const TRACK_NAMES = ['Trumma', 'Bastrumma', 'Hi-Hat', 'Clap']
const TRACK_EMOJIS = ['🥁', '💥', '🎵', '👏']
const BPM = 120

type Pattern = boolean[][]

function emptyPattern(): Pattern {
  return Array.from({ length: TRACKS }, () => Array(STEPS).fill(false))
}

const REWARDS = [
  { minBeats: 8, label: '🥉 Nybörjare', xp: 50, coins: 40 },
  { minBeats: 16, label: '🥈 Rytmiker', xp: 120, coins: 90 },
  { minBeats: 24, label: '🥇 Beatmaker', xp: 220, coins: 170 },
  { minBeats: 32, label: '💎 Producent', xp: 360, coins: 280 },
]

export const BeatBuilderGame = memo(function BeatBuilderGame({ onExit, onWin }: Props) {
  const [phase, setPhase] = useState<'ready' | 'build' | 'done'>('ready')
  const [pattern, setPattern] = useState<Pattern>(emptyPattern())
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [bestScore] = useState(() => Number(localStorage.getItem('k0509_bb_best') ?? 0))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(-1)

  const toggleCell = useCallback((track: number, step: number) => {
    setPattern(prev => prev.map((t, ti) => ti === track ? t.map((v, si) => si === step ? !v : v) : t))
  }, [])

  const totalBeats = pattern.flat().filter(Boolean).length

  const startPlay = useCallback(() => {
    if (playing) return
    setPlaying(true)
    stepRef.current = -1
    const msPerStep = (60 / BPM / 4) * 1000
    intervalRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % STEPS
      setCurrentStep(stepRef.current)
      pattern.forEach((track, ti) => {
        if (track[stepRef.current]) {
          if (ti === 0) audio.tap()
          else if (ti === 1) audio.coin()
          else audio.click()
        }
      })
    }, msPerStep)
  }, [playing, pattern])

  const stopPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(false); setCurrentStep(-1)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const submit = useCallback(() => {
    stopPlay()
    const reward = [...REWARDS].reverse().find(r => totalBeats >= r.minBeats) ?? { xp: 0, coins: 0, label: '— Tomt' }
    const pts = reward.xp
    const prev = Number(localStorage.getItem('k0509_bb_best') ?? 0)
    if (pts > prev) localStorage.setItem('k0509_bb_best', String(pts))
    if (pts > 0) { onWin(reward.coins, pts); audio.achievement() }
    setPhase('done')
  }, [stopPlay, totalBeats, onWin])

  const start = useCallback(() => {
    setPattern(emptyPattern()); setPlaying(false); setCurrentStep(-1)
    setPhase('build')
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={styles.gameHeader}>
        <button className={styles.backBtn} onClick={onExit}>←</button>
        <span className={styles.gameTitle}>🎹 Beat Builder</span>
        <span className={styles.scoreDisplay}>{totalBeats} beats</span>
      </div>

      {phase === 'ready' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>🎹</div>
          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Beat Builder</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 260, lineHeight: 1.6 }}>
            Bygg din beatsekvens på 4 spår × 16 steg! Aktivera fler beats = mer poäng. Spela upp och lyssna!
          </div>
          {bestScore > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 Rekord: {bestScore} XP</div>}
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={start}>Starta!</button>
        </div>
      )}

      {phase === 'build' && (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>{totalBeats} av {STEPS * TRACKS} beats aktiva</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={playing ? stopPlay : startPlay} style={{ padding: '6px 12px', borderRadius: 8, background: playing ? 'rgba(248,113,113,.15)' : 'rgba(74,222,128,.15)', border: `1px solid ${playing ? 'rgba(248,113,113,.3)' : 'rgba(74,222,128,.3)'}`, color: playing ? '#f87171' : '#4ade80', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                {playing ? '⏹ Stop' : '▶ Play'}
              </button>
              <button onClick={submit} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)', color: '#fbbf24', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Submit →</button>
            </div>
          </div>

          {pattern.map((track, ti) => (
            <div key={ti} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: 16, flexShrink: 0 }}>{TRACK_EMOJIS[ti]}</div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${STEPS}, 1fr)`, gap: 2 }}>
                {track.map((active, si) => (
                  <button
                    key={si}
                    onClick={() => toggleCell(ti, si)}
                    style={{
                      height: 32, borderRadius: 4,
                      background: active
                        ? currentStep === si ? '#fff' : ['rgba(248,113,113,.7)', 'rgba(96,165,250,.7)', 'rgba(74,222,128,.7)', 'rgba(251,191,36,.7)'][ti]
                        : currentStep === si ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.05)',
                      border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,.08)'}`,
                      cursor: 'pointer',
                      transition: 'background .1s',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {REWARDS.map((r, i) => (
              <div key={i} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: totalBeats >= r.minBeats ? 'rgba(74,222,128,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${totalBeats >= r.minBeats ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.08)'}`, color: totalBeats >= r.minBeats ? '#4ade80' : 'var(--t3)', whiteSpace: 'nowrap' }}>
                {r.label} ({r.minBeats}+)
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#4ade80', fontSize: 20 }}>🎹 {totalBeats} beats!</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={start}>Bygg igen!</button>
        </div>
      )}
    </div>
  )
})
