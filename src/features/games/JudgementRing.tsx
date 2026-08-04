// components/JudgementRing.tsx
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { audio } from '@/services/AudioService'
import styles from './JudgementRing.module.css'

export type JudgementZoneResult = { hit: boolean; critical: boolean }

export type JudgementRingResult = {
  zoneResults: JudgementZoneResult[]
  zonesCleared: number
  totalZones: number
  /** Only true when the very first zone is missed — a total whiff, per the
   *  Shadow Hearts rule "miss the first zone, the whole attack fails." A
   *  miss on a later zone still resolves with partial credit instead. */
  failed: boolean
  anyCritical: boolean
}

interface Props {
  /** How many yellow zones the needle must clear in sequence. 1 = a quick
   *  jab (basic attack), 2-3 = a bigger combo (special) with more to lose. */
  zoneCount?: number
  /** 0 (easiest: slow needle, wide zones) to 1 (hardest: fast needle,
   *  narrow zones). The caller derives this from a stat — this component
   *  has no game-specific knowledge of pets, levels, or damage. */
  difficulty?: number
  onComplete: (result: JudgementRingResult) => void
}

type Zone = { startDeg: number; widthDeg: number; critStartDeg: number }

const R = 85
const CENTER = 100
const CIRCUMFERENCE = 2 * Math.PI * R
const EASY_WIDTH_DEG = 56
const HARD_WIDTH_DEG = 24
const EASY_SPEED_DEG_PER_S = 105
const HARD_SPEED_DEG_PER_S = 320
const CRIT_FRACTION = 0.28 // trailing slice of each zone that counts as a strike/critical

function buildZones(zoneCount: number, difficulty: number): Zone[] {
  const widthDeg = EASY_WIDTH_DEG - (EASY_WIDTH_DEG - HARD_WIDTH_DEG) * difficulty
  const slot = 360 / zoneCount
  const zones: Zone[] = []
  for (let i = 0; i < zoneCount; i++) {
    const startDeg = i * slot + (slot - widthDeg) / 2
    zones.push({ startDeg, widthDeg, critStartDeg: startDeg + widthDeg * (1 - CRIT_FRACTION) })
  }
  return zones
}

function arcDashProps(startDeg: number, widthDeg: number) {
  const arcLen = (widthDeg / 360) * CIRCUMFERENCE
  return {
    strokeDasharray: `${arcLen} ${CIRCUMFERENCE - arcLen}`,
    strokeDashoffset: -(startDeg / 360) * CIRCUMFERENCE,
  }
}

function vibrate(pattern: number | number[]) {
  if (navigator.vibrate) navigator.vibrate(pattern)
}

/**
 * Shadow Hearts-style timing battle: a needle sweeps a ring split into
 * sequential yellow zones, each with a thin red "strike" slice at its
 * trailing edge for a critical. Tap/click anywhere (pointer events, so it
 * works identically on desktop and touch) while the needle is inside the
 * CURRENT zone to clear it and move to the next; miss zone 0 and the whole
 * attack whiffs, miss a later zone and the sequence ends early but keeps
 * whatever was already cleared. Pure UI/timing — it reports results and
 * leaves damage math to the caller.
 */
export const JudgementRing = memo(function JudgementRing({ zoneCount = 2, difficulty = 0.3, onComplete }: Props) {
  const clampedDifficulty = Math.max(0, Math.min(1, difficulty))
  const zonesRef = useRef<Zone[]>(buildZones(Math.max(1, Math.min(3, zoneCount)), clampedDifficulty))
  const speedDegPerS = EASY_SPEED_DEG_PER_S + (HARD_SPEED_DEG_PER_S - EASY_SPEED_DEG_PER_S) * clampedDifficulty

  const angleRef = useRef(0)
  const zoneIndexRef = useRef(0)
  const resultsRef = useRef<JudgementZoneResult[]>([])
  const doneRef = useRef(false)
  const needleEl = useRef<HTMLDivElement>(null)
  const rafId = useRef<number>(0)
  const lastTs = useRef<number | null>(null)

  const [dots, setDots] = useState<JudgementZoneResult[]>([])
  const [flash, setFlash] = useState<'hit' | 'crit' | 'miss' | null>(null)

  useEffect(() => {
    const tick = (ts: number) => {
      if (doneRef.current) return
      if (lastTs.current == null) lastTs.current = ts
      const dt = (ts - lastTs.current) / 1000
      lastTs.current = ts
      angleRef.current = (angleRef.current + speedDegPerS * dt) % 360
      if (needleEl.current) {
        needleEl.current.style.transform = `translate(-50%, -100%) rotate(${angleRef.current}deg)`
      }
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = useCallback(() => {
    doneRef.current = true
    cancelAnimationFrame(rafId.current)
    const zoneResults = resultsRef.current
    const zonesCleared = zoneResults.filter(r => r.hit).length
    onComplete({
      zoneResults,
      zonesCleared,
      totalZones: zonesRef.current.length,
      failed: zoneResults.length > 0 && zoneIndexRef.current === 0 && !zoneResults[0].hit,
      anyCritical: zoneResults.some(r => r.critical),
    })
  }, [onComplete])

  const handleTap = useCallback(() => {
    if (doneRef.current) return
    const zones = zonesRef.current
    const idx = zoneIndexRef.current
    const zone = zones[idx]
    const angle = angleRef.current
    const inZone = angle >= zone.startDeg && angle < zone.startDeg + zone.widthDeg
    const critical = inZone && angle >= zone.critStartDeg
    const hit = inZone

    resultsRef.current = [...resultsRef.current, { hit, critical }]
    setDots(resultsRef.current)

    if (hit) {
      vibrate(critical ? [30, 40, 70] : 35)
      audio.powerUp()
      setFlash(critical ? 'crit' : 'hit')
    } else {
      vibrate(90)
      audio.error()
      setFlash('miss')
    }
    setTimeout(() => setFlash(null), 260)

    const isFirstZone = idx === 0
    const clearedAll = idx + 1 >= zones.length

    if (!hit) {
      // First-zone miss = total whiff, ends now. A later miss still ends
      // the sequence (no more chances) but keeps the earlier clears.
      finish()
      return
    }
    if (clearedAll) {
      finish()
      return
    }
    zoneIndexRef.current = idx + 1
  }, [finish])

  const zones = zonesRef.current

  return (
    <div className="nb-theme" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={styles.wrap} onPointerDown={handleTap}>
        <svg className={styles.svg} viewBox="0 0 200 200">
          <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="#2a2a2a" strokeWidth={18} />
          {zones.map((z, i) => {
            const cleared = i < zoneIndexRef.current
            const active = i === zoneIndexRef.current
            const yellow = arcDashProps(z.startDeg, z.widthDeg)
            const red = arcDashProps(z.critStartDeg, z.startDeg + z.widthDeg - z.critStartDeg)
            const color = cleared ? '#39ff14' : active ? '#ffe600' : '#555'
            return (
              <g key={i} transform={`rotate(-90 ${CENTER} ${CENTER})`}>
                <circle
                  cx={CENTER} cy={CENTER} r={R} fill="none"
                  stroke={color} strokeWidth={18}
                  strokeDasharray={yellow.strokeDasharray}
                  strokeDashoffset={yellow.strokeDashoffset}
                />
                <circle
                  cx={CENTER} cy={CENTER} r={R} fill="none"
                  stroke={cleared ? '#0a8f00' : active ? '#ff007f' : '#3a3a3a'}
                  strokeWidth={18}
                  strokeDasharray={red.strokeDasharray}
                  strokeDashoffset={red.strokeDashoffset}
                />
              </g>
            )
          })}
          <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="#000" strokeWidth={4} />
        </svg>
        <div ref={needleEl} className={styles.needle} />
        <div className={styles.hub}>TAP</div>
        {flash && (
          <div
            className={`${styles.flash} ${flash === 'hit' ? styles.flashHit : flash === 'crit' ? styles.flashCrit : styles.flashMiss}`}
          />
        )}
      </div>
      <div className={styles.dots}>
        {zones.map((_, i) => {
          const r = dots[i]
          const cls = !r ? styles.dot : r.critical ? `${styles.dot} ${styles.dotCrit}` : r.hit ? `${styles.dot} ${styles.dotHit}` : `${styles.dot} ${styles.dotMiss}`
          return <div key={i} className={cls} />
        })}
      </div>
    </div>
  )
})
