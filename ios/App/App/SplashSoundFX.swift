import AVFoundation

/// Crystalline / magical synthesized sound effects for splash screen.
/// Matches Android SplashSoundFX.java exactly.
class SplashSoundFX {

    private let sampleRate: Double = 44100
    private var audioEngine: AVAudioEngine?
    private var playerNodes: [AVAudioPlayerNode] = []

    init() {
        setupAudioSession()
    }

    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            // Silent fail — sound is optional
        }
    }

    // MARK: - Water Drops

    /// Delicate plinking as particles appear
    func playWaterDrops() {
        let duration = 0.9
        let samples = Int(sampleRate * duration)
        var buffer = [Float](repeating: 0, count: samples)

        let dropTimes: [Double] = [0.0, 0.12, 0.28, 0.45, 0.6]
        let dropFreqs: [Double] = [2800, 3200, 2500, 3600, 2000]

        for i in 0..<samples {
            let t = Double(i) / sampleRate
            var wave: Double = 0
            for d in 0..<dropTimes.count {
                let dt = t - dropTimes[d]
                if dt >= 0 && dt < 0.25 {
                    let dp = dt / 0.25
                    let env = exp(-dp * 12) * sin(.pi * min(dp * 15, 1))
                    let freq = dropFreqs[d] * (1.0 - dp * 0.15)
                    wave += sin(2 * .pi * freq * dt) * env * 0.35
                    wave += sin(2 * .pi * freq * 0.5 * dt) * env * 0.12
                }
            }
            buffer[i] = Float(wave * 0.6)
        }
        playBuffer(buffer)
    }

    // MARK: - Wind Chime

    /// Tinkling metallic notes as rays appear
    func playWindChime() {
        let duration = 0.8
        let samples = Int(sampleRate * duration)
        var buffer = [Float](repeating: 0, count: samples)

        let notes: [Double] = [2093, 2349, 2637, 3136, 3520, 4186]
        let starts: [Double] = [0.0, 0.06, 0.14, 0.2, 0.28, 0.35]

        for i in 0..<samples {
            let t = Double(i) / sampleRate
            var wave: Double = 0
            for n in 0..<notes.count {
                let nt = t - starts[n]
                if nt >= 0 {
                    let np = nt / 0.6
                    let env = exp(-np * 5)
                    wave += sin(2 * .pi * notes[n] * nt) * env * 0.22
                    wave += sin(2 * .pi * notes[n] * 2.76 * nt) * env * 0.08
                    wave += sin(2 * .pi * notes[n] * 5.41 * nt) * env * 0.03
                }
            }
            buffer[i] = Float(wave * 0.5)
        }
        playBuffer(buffer)
    }

    // MARK: - Singing Bowl

    /// Deep resonant ring for expanding pulse
    func playSingingBowl() {
        let duration = 1.0
        let samples = Int(sampleRate * duration)
        var buffer = [Float](repeating: 0, count: samples)

        for i in 0..<samples {
            let t = Double(i) / sampleRate
            let p = Double(i) / Double(samples)
            let f1: Double = 220
            let f2: Double = 220.8
            let env = min(p * 12, 1.0) * exp(-p * 2)
            var wave = sin(2 * .pi * f1 * t) * 0.30
                     + sin(2 * .pi * f2 * t) * 0.28
                     + sin(2 * .pi * f1 * 2.71 * t) * 0.15 * exp(-p * 3)
                     + sin(2 * .pi * f1 * 4.16 * t) * 0.08 * exp(-p * 4)
                     + sin(2 * .pi * f1 * 5.93 * t) * 0.05 * exp(-p * 5)
            wave += sin(2 * .pi * 110 * t) * 0.12 * env
            buffer[i] = Float(wave * env * 0.7)
        }
        playBuffer(buffer)
    }

    // MARK: - Deep Gong

    /// Massive resonant strike for logo reveal
    func playDeepGong() {
        let duration = 1.2
        let samples = Int(sampleRate * duration)
        var buffer = [Float](repeating: 0, count: samples)

        for i in 0..<samples {
            let t = Double(i) / sampleRate
            let p = Double(i) / Double(samples)
            let strike = (Double.random(in: -0.5...0.5)) * 0.8 * exp(-p * 35)
            let wobble = 1.0 + 0.003 * sin(2 * .pi * 2.5 * t)
            let env = min(p * 30, 1.0) * exp(-p * 1.8)
            let wave = sin(2 * .pi * 82.4 * wobble * t) * 0.35
                     + sin(2 * .pi * 164.8 * wobble * t) * 0.20
                     + sin(2 * .pi * 123.5 * t) * 0.15
                     + sin(2 * .pi * 207.7 * t) * 0.10
                     + sin(2 * .pi * 329.6 * t) * 0.06 * exp(-p * 3)
            buffer[i] = Float((wave * env + strike) * 0.75)
        }
        playBuffer(buffer)
    }

    // MARK: - Crystal Shatter

    /// Bright explosive burst
    func playCrystalShatter() {
        let duration = 0.45
        let samples = Int(sampleRate * duration)
        var buffer = [Float](repeating: 0, count: samples)

        for i in 0..<samples {
            let t = Double(i) / sampleRate
            let p = Double(i) / Double(samples)
            var attack: Double = 0
            for h in 0..<12 {
                let freq = 1800.0 + Double(h) * 370.0 + Double.random(in: -25...25)
                attack += sin(2 * .pi * freq * t) * exp(-p * (6 + Double(h) * 0.5)) * 0.1
            }
            let shatter = Double.random(in: -0.3...0.3) * exp(-p * 15)
            let ring = sin(2 * .pi * 3520 * t) * 0.15 * exp(-p * 4)
                     + sin(2 * .pi * 4698 * t) * 0.08 * exp(-p * 5)
            buffer[i] = Float((attack + shatter + ring) * 0.6)
        }
        playBuffer(buffer)
    }

    // MARK: - Crystal Click

    /// Tiny precise placement sound
    func playCrystalClick() {
        let duration = 0.12
        let samples = Int(sampleRate * duration)
        var buffer = [Float](repeating: 0, count: samples)

        for i in 0..<samples {
            let t = Double(i) / sampleRate
            let p = Double(i) / Double(samples)
            let wave = sin(2 * .pi * 5274 * t) * 0.4 * exp(-p * 50)
                     + sin(2 * .pi * 3520 * t) * 0.25 * exp(-p * 25)
                     + sin(2 * .pi * 7040 * t) * 0.15 * exp(-p * 60)
            buffer[i] = Float(wave * 0.6)
        }
        playBuffer(buffer)
    }

    // MARK: - Fairy Dust

    /// Magical ascending sparkle
    func playFairyDust() {
        let duration = 0.7
        let samples = Int(sampleRate * duration)
        var buffer = [Float](repeating: 0, count: samples)

        let scale: [Double] = [1760, 2093, 2349, 2637, 3136]

        for i in 0..<samples {
            let t = Double(i) / sampleRate
            let p = Double(i) / Double(samples)
            let env = sin(.pi * p) * 0.9
            let phase = t * 12
            let noteIdx = Int(phase) % 5
            var freq = scale[noteIdx]
            let noteP = phase - Double(Int(phase))
            if noteIdx < 4 {
                freq = freq + (scale[noteIdx + 1] - freq) * noteP * 0.3
            }
            var wave = sin(2 * .pi * freq * t) * 0.30
                     + sin(2 * .pi * freq * 2 * t) * 0.12
                     + sin(2 * .pi * freq * 3 * t) * 0.05
            if Double.random(in: 0...1) < 0.03 {
                wave += sin(2 * .pi * (4000 + Double.random(in: 0...3000)) * t) * 0.15
            }
            buffer[i] = Float(wave * env * 0.45)
        }
        playBuffer(buffer)
    }

    // MARK: - Ethereal Fade

    /// Soft airy dissolve for exit
    func playEtherealFade() {
        let duration = 0.6
        let samples = Int(sampleRate * duration)
        var buffer = [Float](repeating: 0, count: samples)

        for i in 0..<samples {
            let t = Double(i) / sampleRate
            let p = Double(i) / Double(samples)
            let env = (1 - p) * (1 - p)
            var wave = sin(2 * .pi * 220 * t) * 0.20
                     + sin(2 * .pi * 261.6 * t) * 0.18
                     + sin(2 * .pi * 329.6 * t) * 0.15
                     + sin(2 * .pi * 392 * t) * 0.12
                     + sin(2 * .pi * 440 * t) * 0.08
            let vibrato = 1.0 + 0.005 * sin(2 * .pi * 4.5 * t)
            wave *= vibrato
            wave += sin(2 * .pi * 1760 * t) * 0.06 * exp(-p * 3)
            buffer[i] = Float(wave * env * 0.65)
        }
        playBuffer(buffer)
    }

    // MARK: - Audio Playback

    private func playBuffer(_ samples: [Float]) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }

            let engine = AVAudioEngine()
            let playerNode = AVAudioPlayerNode()
            engine.attach(playerNode)

            let format = AVAudioFormat(standardFormatWithSampleRate: self.sampleRate, channels: 1)!
            engine.connect(playerNode, to: engine.mainMixerNode, format: format)

            guard let pcmBuffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(samples.count)) else { return }
            pcmBuffer.frameLength = AVAudioFrameCount(samples.count)

            if let channelData = pcmBuffer.floatChannelData {
                for i in 0..<samples.count {
                    channelData[0][i] = samples[i]
                }
            }

            // Apply volume
            engine.mainMixerNode.outputVolume = 0.5

            do {
                try engine.start()
                playerNode.scheduleBuffer(pcmBuffer, completionHandler: {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        engine.stop()
                    }
                })
                playerNode.play()

                // Keep engine alive until playback finishes
                DispatchQueue.main.async {
                    self.playerNodes.append(playerNode)
                    if self.audioEngine == nil {
                        self.audioEngine = engine
                    }
                }
            } catch {
                // Silent fail — sound is optional
            }
        }
    }

    /// Cleanup when done
    func cleanup() {
        audioEngine?.stop()
        audioEngine = nil
        playerNodes.removeAll()
    }
}
