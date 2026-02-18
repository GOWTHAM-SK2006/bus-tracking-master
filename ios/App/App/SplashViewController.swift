import UIKit
import Capacitor

/// Custom CAPBridgeViewController with cinematic splash overlay.
/// Matches the Android 11-phase animation exactly.
class SplashViewController: CAPBridgeViewController {

    // MARK: - Properties

    private static let splashDuration: TimeInterval = 4.2
    private let accentColor = UIColor(red: 233/255, green: 69/255, blue: 96/255, alpha: 1) // #e94560

    private var splashOverlay: UIView!
    private var radialGlow: UIView!
    private var innerGlow: UIView!
    private var ringPulse1: UIView!
    private var ringPulse2: UIView!
    private var rays: [UIView] = []
    private var particles: [UIView] = []
    private var flashBurst: UIView!
    private var shimmerSweep: UIView!
    private var logoView: UIImageView!

    private var soundFX: SplashSoundFX!
    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)
    private let impactRigid = UIImpactFeedbackGenerator(style: .rigid)

    // Particle start positions
    private let particleConfigs: [(size: CGFloat, x: CGFloat, y: CGFloat)] = [
        (8, -80, -80), (6, 90, -60), (10, 70, 85),
        (7, -95, 50),  (5, 20, -100), (9, -50, 95)
    ]

    // Ray angles
    private let rayAngles: [CGFloat] = [0, 30, 60, 90, 120, 150]

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        soundFX = SplashSoundFX()
        impactLight.prepare()
        impactMedium.prepare()
        impactHeavy.prepare()
        impactRigid.prepare()
        buildSplashOverlay()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        runSplashAnimation()
    }

    // MARK: - Build Splash Overlay

    private func buildSplashOverlay() {
        let bounds = view.bounds

        // Full-screen black overlay
        splashOverlay = UIView(frame: bounds)
        splashOverlay.backgroundColor = .black
        splashOverlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(splashOverlay)

        let cx = bounds.midX
        let cy = bounds.midY

        // Radial glow (500pt)
        radialGlow = makeGlowView(size: 500, colors: [
            accentColor.withAlphaComponent(0.27).cgColor,
            accentColor.withAlphaComponent(0.08).cgColor,
            UIColor.clear.cgColor
        ])
        radialGlow.center = CGPoint(x: cx, y: cy)
        radialGlow.alpha = 0
        splashOverlay.addSubview(radialGlow)

        // Inner glow (280pt)
        innerGlow = makeGlowView(size: 280, colors: [
            accentColor.withAlphaComponent(0.4).cgColor,
            accentColor.withAlphaComponent(0.2).cgColor,
            UIColor.clear.cgColor
        ])
        innerGlow.center = CGPoint(x: cx, y: cy)
        innerGlow.alpha = 0
        splashOverlay.addSubview(innerGlow)

        // Ring pulses
        ringPulse1 = makeRingView(size: 200)
        ringPulse1.center = CGPoint(x: cx, y: cy)
        ringPulse1.alpha = 0
        splashOverlay.addSubview(ringPulse1)

        ringPulse2 = makeRingView(size: 200)
        ringPulse2.center = CGPoint(x: cx, y: cy)
        ringPulse2.alpha = 0
        splashOverlay.addSubview(ringPulse2)

        // Light rays (6)
        for angle in rayAngles {
            let ray = makeRayView(width: 3, height: 200)
            ray.center = CGPoint(x: cx, y: cy)
            ray.alpha = 0
            ray.transform = CGAffineTransform(rotationAngle: angle * .pi / 180).scaledBy(x: 1, y: 0)
            splashOverlay.addSubview(ray)
            rays.append(ray)
        }

        // Particles (6)
        for config in particleConfigs {
            let particle = makeParticleView(size: config.size)
            particle.center = CGPoint(x: cx + config.x * 1.5, y: cy + config.y * 1.5)
            particle.alpha = 0
            particle.transform = CGAffineTransform(scaleX: 0.3, y: 0.3)
            splashOverlay.addSubview(particle)
            particles.append(particle)
        }

        // Flash burst (400pt)
        flashBurst = makeGlowView(size: 400, colors: [
            UIColor.white.cgColor,
            UIColor.white.withAlphaComponent(0.4).cgColor,
            UIColor.clear.cgColor
        ])
        flashBurst.center = CGPoint(x: cx, y: cy)
        flashBurst.alpha = 0
        flashBurst.transform = CGAffineTransform(scaleX: 0, y: 0)
        splashOverlay.addSubview(flashBurst)

        // Shimmer sweep
        shimmerSweep = makeShimmerView(width: 60, height: 220)
        shimmerSweep.center = CGPoint(x: cx - 200, y: cy)
        shimmerSweep.alpha = 0
        shimmerSweep.transform = CGAffineTransform(rotationAngle: 15 * .pi / 180)
        splashOverlay.addSubview(shimmerSweep)

        // DYGON Logo (200pt)
        logoView = UIImageView(frame: CGRect(x: 0, y: 0, width: 200, height: 200))
        logoView.contentMode = .scaleAspectFit
        logoView.image = UIImage(named: "DygonLogo")
        logoView.center = CGPoint(x: cx, y: cy)
        logoView.alpha = 0
        splashOverlay.addSubview(logoView)
    }

    // MARK: - View Factories

    private func makeGlowView(size: CGFloat, colors: [CGColor]) -> UIView {
        let v = UIView(frame: CGRect(x: 0, y: 0, width: size, height: size))
        let gradient = CAGradientLayer()
        gradient.type = .radial
        gradient.colors = colors
        gradient.startPoint = CGPoint(x: 0.5, y: 0.5)
        gradient.endPoint = CGPoint(x: 1.0, y: 1.0)
        gradient.frame = v.bounds
        gradient.cornerRadius = size / 2
        v.layer.addSublayer(gradient)
        return v
    }

    private func makeRingView(size: CGFloat) -> UIView {
        let v = UIView(frame: CGRect(x: 0, y: 0, width: size, height: size))
        v.layer.cornerRadius = size / 2
        v.layer.borderWidth = 2
        v.layer.borderColor = accentColor.withAlphaComponent(0.67).cgColor
        v.backgroundColor = .clear
        return v
    }

    private func makeRayView(width: CGFloat, height: CGFloat) -> UIView {
        let v = UIView(frame: CGRect(x: 0, y: 0, width: width, height: height))
        let gradient = CAGradientLayer()
        gradient.colors = [
            UIColor.clear.cgColor,
            accentColor.withAlphaComponent(0.33).cgColor,
            UIColor.clear.cgColor
        ]
        gradient.locations = [0, 0.5, 1]
        gradient.frame = v.bounds
        v.layer.addSublayer(gradient)
        return v
    }

    private func makeParticleView(size: CGFloat) -> UIView {
        let v = UIView(frame: CGRect(x: 0, y: 0, width: size, height: size))
        let gradient = CAGradientLayer()
        gradient.type = .radial
        gradient.colors = [accentColor.cgColor, accentColor.withAlphaComponent(0).cgColor]
        gradient.startPoint = CGPoint(x: 0.5, y: 0.5)
        gradient.endPoint = CGPoint(x: 1, y: 1)
        gradient.frame = v.bounds
        gradient.cornerRadius = size / 2
        v.layer.addSublayer(gradient)
        return v
    }

    private func makeShimmerView(width: CGFloat, height: CGFloat) -> UIView {
        let v = UIView(frame: CGRect(x: 0, y: 0, width: width, height: height))
        let gradient = CAGradientLayer()
        gradient.colors = [
            UIColor.clear.cgColor,
            accentColor.withAlphaComponent(0.73).cgColor,
            UIColor.clear.cgColor
        ]
        gradient.startPoint = CGPoint(x: 0, y: 0.5)
        gradient.endPoint = CGPoint(x: 1, y: 0.5)
        gradient.frame = v.bounds
        v.layer.addSublayer(gradient)
        return v
    }

    // MARK: - 11-Phase Animation Sequence

    private func runSplashAnimation() {
        let cx = view.bounds.midX
        let cy = view.bounds.midY

        // PHASE 1 (200ms): Particles emerge from darkness
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
            guard let self = self else { return }
            self.impactLight.impactOccurred()
            self.soundFX.playWaterDrops()

            for (i, particle) in self.particles.enumerated() {
                let config = self.particleConfigs[i]
                DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.06) {
                    UIView.animateKeyframes(withDuration: 2.5, delay: 0, options: [], animations: {
                        UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.2) {
                            particle.alpha = 0.8
                        }
                        UIView.addKeyframe(withRelativeStartTime: 0.2, relativeDuration: 0.3) {
                            particle.alpha = 0.4
                        }
                        UIView.addKeyframe(withRelativeStartTime: 0.5, relativeDuration: 0.2) {
                            particle.alpha = 0.9
                        }
                        UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 1.0) {
                            particle.center = CGPoint(x: cx + config.x * 0.3, y: cy + config.y * 0.3)
                            particle.transform = CGAffineTransform(scaleX: 0.8, y: 0.8)
                        }
                    }, completion: nil)

                    // Fade out after 2s
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                        UIView.animate(withDuration: 0.4) {
                            particle.alpha = 0
                        }
                    }
                }
            }
        }

        // PHASE 2 (350ms): Inner glow ignites
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            guard let self = self else { return }
            self.innerGlow.transform = CGAffineTransform(scaleX: 0.3, y: 0.3)
            UIView.animate(withDuration: 0.8, delay: 0, options: .curveEaseOut) {
                self.innerGlow.alpha = 0.7
                self.innerGlow.transform = .identity
            }
        }

        // PHASE 3 (450ms): Light rays ignite with staggered sweep
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { [weak self] in
            guard let self = self else { return }
            self.soundFX.playWindChime()
            self.impactMedium.impactOccurred()

            for (i, ray) in self.rays.enumerated() {
                let angle = self.rayAngles[i]
                DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.07) {
                    // Animate ray in
                    UIView.animate(withDuration: 0.6, delay: 0, options: .curveEaseInOut) {
                        ray.alpha = 0.8
                        ray.transform = CGAffineTransform(rotationAngle: angle * .pi / 180)
                    }

                    // Start slow rotation
                    UIView.animate(withDuration: 4.0, delay: 0, options: [.curveLinear]) {
                        ray.transform = CGAffineTransform(rotationAngle: (angle + 120) * .pi / 180)
                    }

                    // Fade out rays
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        UIView.animate(withDuration: 0.8) {
                            ray.alpha = 0
                        }
                    }
                }
            }
        }

        // PHASE 4 (600ms): First ring pulse expands outward
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
            guard let self = self else { return }
            self.soundFX.playSingingBowl()
            self.impactMedium.impactOccurred()

            self.ringPulse1.transform = CGAffineTransform(scaleX: 0.3, y: 0.3)
            UIView.animateKeyframes(withDuration: 0.9, delay: 0, options: [], animations: {
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.4) {
                    self.ringPulse1.alpha = 0.9
                }
                UIView.addKeyframe(withRelativeStartTime: 0.4, relativeDuration: 0.6) {
                    self.ringPulse1.alpha = 0
                }
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 1.0) {
                    self.ringPulse1.transform = CGAffineTransform(scaleX: 2.5, y: 2.5)
                }
            }, completion: nil)
        }

        // PHASE 5 (750ms): Radial glow bloom
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) { [weak self] in
            guard let self = self else { return }
            self.radialGlow.transform = CGAffineTransform(scaleX: 0.2, y: 0.2)
            UIView.animate(withDuration: 1.4, delay: 0, options: .curveEaseOut) {
                self.radialGlow.alpha = 0.9
                self.radialGlow.transform = CGAffineTransform(scaleX: 1.3, y: 1.3)
            }
        }

        // PHASE 6 (950ms): Logo dramatic zoom-in with slight rotation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.95) { [weak self] in
            guard let self = self else { return }
            self.soundFX.playDeepGong()
            self.impactHeavy.impactOccurred()

            self.logoView.transform = CGAffineTransform(scaleX: 8, y: 8).rotated(by: 15 * .pi / 180)
            self.logoView.alpha = 0

            UIView.animate(withDuration: 1.1, delay: 0, usingSpringWithDamping: 0.7, initialSpringVelocity: 0, options: []) {
                self.logoView.alpha = 1
                self.logoView.transform = CGAffineTransform(scaleX: 0.9, y: 0.9).rotated(by: -2 * .pi / 180)
            }
        }

        // PHASE 7 (1500ms): Second ring pulse + flash burst
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            guard let self = self else { return }
            self.soundFX.playCrystalShatter()
            self.impactRigid.impactOccurred()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.06) {
                self.impactHeavy.impactOccurred()
            }

            // Ring pulse 2
            self.ringPulse2.transform = CGAffineTransform(scaleX: 0.5, y: 0.5)
            UIView.animateKeyframes(withDuration: 0.8, delay: 0, options: [], animations: {
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.35) {
                    self.ringPulse2.alpha = 0.7
                }
                UIView.addKeyframe(withRelativeStartTime: 0.35, relativeDuration: 0.65) {
                    self.ringPulse2.alpha = 0
                }
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 1.0) {
                    self.ringPulse2.transform = CGAffineTransform(scaleX: 3.0, y: 3.0)
                }
            }, completion: nil)

            // Flash burst
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                UIView.animateKeyframes(withDuration: 0.45, delay: 0, options: [], animations: {
                    UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.4) {
                        self.flashBurst.alpha = 0.5
                        self.flashBurst.transform = CGAffineTransform(scaleX: 2.8, y: 2.8)
                    }
                    UIView.addKeyframe(withRelativeStartTime: 0.4, relativeDuration: 0.6) {
                        self.flashBurst.alpha = 0
                    }
                }, completion: nil)
            }
        }

        // PHASE 8 (1900ms): Logo elastic settle
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.9) { [weak self] in
            guard let self = self else { return }
            self.soundFX.playCrystalClick()
            self.impactLight.impactOccurred()

            // Overshoot bounce to final position
            UIView.animate(withDuration: 0.6, delay: 0, usingSpringWithDamping: 0.4, initialSpringVelocity: 0.5, options: []) {
                self.logoView.transform = .identity
            }

            // Inner glow pulse
            UIView.animateKeyframes(withDuration: 0.6, delay: 0, options: [], animations: {
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.5) {
                    self.innerGlow.alpha = 1.0
                }
                UIView.addKeyframe(withRelativeStartTime: 0.5, relativeDuration: 0.5) {
                    self.innerGlow.alpha = 0.5
                }
            }, completion: nil)
        }

        // PHASE 9 (2200ms): Shimmer sweep across logo
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) { [weak self] in
            guard let self = self else { return }
            self.soundFX.playFairyDust()
            // Triple light haptic pattern
            self.impactLight.impactOccurred()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                self.impactLight.impactOccurred()
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                self.impactLight.impactOccurred()
            }

            let cx = self.view.bounds.midX

            UIView.animateKeyframes(withDuration: 0.7, delay: 0, options: [], animations: {
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.3) {
                    self.shimmerSweep.alpha = 0.7
                }
                UIView.addKeyframe(withRelativeStartTime: 0.7, relativeDuration: 0.3) {
                    self.shimmerSweep.alpha = 0
                }
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 1.0) {
                    self.shimmerSweep.center = CGPoint(x: cx + 200, y: self.view.bounds.midY)
                }
            }, completion: nil)
        }

        // PHASE 10 (2600ms): Glow breathing + subtle logo pulse
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.6) { [weak self] in
            guard let self = self else { return }

            // Outer glow breathes
            UIView.animateKeyframes(withDuration: 1.2, delay: 0, options: [], animations: {
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.33) {
                    self.radialGlow.alpha = 0.4
                    self.radialGlow.transform = CGAffineTransform(scaleX: 1.1, y: 1.1)
                }
                UIView.addKeyframe(withRelativeStartTime: 0.33, relativeDuration: 0.33) {
                    self.radialGlow.alpha = 0.7
                    self.radialGlow.transform = CGAffineTransform(scaleX: 1.25, y: 1.25)
                }
                UIView.addKeyframe(withRelativeStartTime: 0.66, relativeDuration: 0.34) {
                    self.radialGlow.alpha = 0.5
                }
            }, completion: nil)

            // Subtle logo pulse
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                UIView.animateKeyframes(withDuration: 0.8, delay: 0, options: [], animations: {
                    UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.5) {
                        self.logoView.transform = CGAffineTransform(scaleX: 1.03, y: 1.03)
                    }
                    UIView.addKeyframe(withRelativeStartTime: 0.5, relativeDuration: 0.5) {
                        self.logoView.transform = .identity
                    }
                }, completion: nil)
            }
        }

        // PHASE 11 (3500ms): Cinematic exit
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.5) { [weak self] in
            guard let self = self else { return }
            self.soundFX.playEtherealFade()
            self.impactMedium.impactOccurred()

            // Final ring burst on exit
            self.ringPulse1.alpha = 0
            self.ringPulse1.transform = CGAffineTransform(scaleX: 0.5, y: 0.5)
            UIView.animateKeyframes(withDuration: 0.6, delay: 0, options: [], animations: {
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.4) {
                    self.ringPulse1.alpha = 0.5
                }
                UIView.addKeyframe(withRelativeStartTime: 0.4, relativeDuration: 0.6) {
                    self.ringPulse1.alpha = 0
                }
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 1.0) {
                    self.ringPulse1.transform = CGAffineTransform(scaleX: 4, y: 4)
                }
            }, completion: nil)

            // Everything fades out
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                UIView.animate(withDuration: 0.5, delay: 0, options: .curveEaseIn) {
                    self.radialGlow.alpha = 0
                    self.innerGlow.alpha = 0
                }

                UIView.animate(withDuration: 0.5, delay: 0, options: .curveEaseIn) {
                    self.logoView.alpha = 0
                    self.logoView.transform = CGAffineTransform(scaleX: 1.5, y: 1.5)
                }

                // Final overlay fade
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    UIView.animate(withDuration: 0.6, animations: {
                        self.splashOverlay.alpha = 0
                    }, completion: { _ in
                        self.splashOverlay.removeFromSuperview()
                        self.splashOverlay = nil
                        self.soundFX.cleanup()
                    })
                }
            }
        }
    }
}
