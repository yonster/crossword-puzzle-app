// Create a victory jingle using Web Audio API
export function playCompletionJingle(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const masterGain = audioContext.createGain()
    masterGain.connect(audioContext.destination)
    masterGain.gain.value = 0.3 // Moderate volume

    // Victory melody: C5 -> E5 -> G5 -> C6 (major chord arpeggio)
    const notes = [
      { frequency: 523.25, startTime: 0, duration: 0.2 },    // C5
      { frequency: 659.25, startTime: 0.15, duration: 0.2 }, // E5
      { frequency: 783.99, startTime: 0.3, duration: 0.2 },  // G5
      { frequency: 1046.50, startTime: 0.45, duration: 0.4 }, // C6 (longer final note)
    ]

    notes.forEach(note => {
      // Create oscillator for the main tone
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(masterGain)

      // Use a triangle wave for a softer, more pleasant sound
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(note.frequency, audioContext.currentTime + note.startTime)

      // Add envelope (attack-decay-sustain-release)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.startTime)
      gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + note.startTime + 0.05) // Attack
      gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + note.startTime + 0.1)  // Decay
      gainNode.gain.setValueAtTime(0.6, audioContext.currentTime + note.startTime + note.duration - 0.1) // Sustain
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + note.startTime + note.duration) // Release

      oscillator.start(audioContext.currentTime + note.startTime)
      oscillator.stop(audioContext.currentTime + note.startTime + note.duration)

      // Add a subtle harmonic (octave) for richness
      const harmonic = audioContext.createOscillator()
      const harmonicGain = audioContext.createGain()
      
      harmonic.connect(harmonicGain)
      harmonicGain.connect(masterGain)
      
      harmonic.type = 'sine'
      harmonic.frequency.setValueAtTime(note.frequency * 2, audioContext.currentTime + note.startTime) // Octave
      
      harmonicGain.gain.setValueAtTime(0, audioContext.currentTime + note.startTime)
      harmonicGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + note.startTime + 0.05)
      harmonicGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + note.startTime + 0.1)
      harmonicGain.gain.setValueAtTime(0.15, audioContext.currentTime + note.startTime + note.duration - 0.1)
      harmonicGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + note.startTime + note.duration)
      
      harmonic.start(audioContext.currentTime + note.startTime)
      harmonic.stop(audioContext.currentTime + note.startTime + note.duration)
    })

    // Add a subtle reverb-like delay for the final note
    const delayNode = audioContext.createDelay(0.3)
    const delayGain = audioContext.createGain()
    const feedbackGain = audioContext.createGain()

    delayNode.delayTime.setValueAtTime(0.15, audioContext.currentTime)
    delayGain.gain.setValueAtTime(0.3, audioContext.currentTime)
    feedbackGain.gain.setValueAtTime(0.2, audioContext.currentTime)

    // Connect delay circuit
    delayGain.connect(delayNode)
    delayNode.connect(feedbackGain)
    feedbackGain.connect(delayNode)
    delayNode.connect(masterGain)

    // Play the final note with reverb
    const finalOsc = audioContext.createOscillator()
    const finalGain = audioContext.createGain()

    finalOsc.connect(finalGain)
    finalGain.connect(delayGain)
    finalGain.connect(masterGain)

    finalOsc.type = 'triangle'
    finalOsc.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.45) // C6

    finalGain.gain.setValueAtTime(0, audioContext.currentTime + 0.45)
    finalGain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.5)
    finalGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.2)

    finalOsc.start(audioContext.currentTime + 0.45)
    finalOsc.stop(audioContext.currentTime + 1.2)

  } catch (error) {
    console.warn('Could not play completion sound:', error)
  }
}