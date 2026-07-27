/** Procedural Web Audio synthesizer — no external audio files needed. */
class AudioService {
  private ctx: AudioContext | null = null
  private enabled = true
  private sfxVol = 0.7
  private ambiNodes: OscillatorNode[] = []
  private ambiGain: GainNode | null = null
  private ambiRunning = false

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  setEnabled(v: boolean) { this.enabled = v }
  setVolume(v: number) { this.sfxVol = v }

  private tone(freq: number, dur: number, vol = 0.15, type: OscillatorType = 'sine', decay = 0.8) {
    if (!this.enabled) return
    try {
      const ctx = this.getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(vol * this.sfxVol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur * decay)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + dur)
    } catch {
      // AudioContext blocked
    }
  }

  startAmbient(volume = 0.04) {
    if (!this.enabled || this.ambiRunning) return
    try {
      const ctx = this.getCtx()
      this.ambiGain = ctx.createGain()
      this.ambiGain.gain.setValueAtTime(0, ctx.currentTime)
      this.ambiGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2)
      this.ambiGain.connect(ctx.destination)
      const drones = [55, 110, 165]
      this.ambiNodes = drones.map(freq => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        osc.connect(this.ambiGain!)
        osc.start()
        return osc
      })
      this.ambiRunning = true
    } catch { /* blocked */ }
  }

  stopAmbient() {
    if (!this.ambiRunning) return
    try {
      const ctx = this.getCtx()
      if (this.ambiGain) {
        this.ambiGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)
      }
      setTimeout(() => {
        this.ambiNodes.forEach(o => { try { o.stop() } catch { /* ok */ } })
        this.ambiNodes = []
        this.ambiRunning = false
      }, 1600)
    } catch { /* blocked */ }
  }

  tap() {
    this.tone(440, 0.08, 0.1, 'sine')
    this.tone(660, 0.06, 0.06, 'sine')
  }

  coin() {
    this.tone(880, 0.1, 0.12, 'triangle')
    setTimeout(() => this.tone(1100, 0.1, 0.08, 'triangle'), 60)
  }

  levelUp() {
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 0.15, 'triangle'), i * 100))
  }

  achievement() {
    const notes = [784, 988, 1175, 1568]
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 0.13, 'sine'), i * 80))
  }

  error() {
    this.tone(200, 0.2, 0.1, 'sawtooth')
    setTimeout(() => this.tone(180, 0.3, 0.08, 'sawtooth'), 150)
  }

  click() {
    this.tone(600, 0.04, 0.05, 'square')
  }

  buy() {
    this.tone(523, 0.1, 0.1, 'triangle')
    setTimeout(() => this.tone(659, 0.15, 0.12, 'triangle'), 80)
  }

  combo(multiplier: number) {
    const freq = 440 + multiplier * 80
    this.tone(freq, 0.12, 0.12, 'sawtooth')
    setTimeout(() => this.tone(freq * 1.5, 0.1, 0.08, 'square'), 60)
  }

  streak() {
    const notes = [523, 659, 784, 659, 880]
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.15, 0.12, 'triangle'), i * 90))
  }

  powerUp() {
    const notes = [440, 523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 0.1, 'sine'), i * 60))
  }

  gameOver() {
    const notes = [392, 330, 294, 220]
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 0.12, 'sawtooth'), i * 120))
  }

  notification() {
    this.tone(880, 0.08, 0.08, 'sine')
    setTimeout(() => this.tone(1100, 0.1, 0.06, 'sine'), 100)
  }
}

export const audio = new AudioService()
