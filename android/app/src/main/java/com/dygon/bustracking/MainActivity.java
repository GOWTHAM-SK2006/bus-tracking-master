package com.dygon.bustracking;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.LinearInterpolator;
import android.view.animation.OvershootInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final long SPLASH_DURATION = 4200;
    private Handler handler = new Handler(Looper.getMainLooper());
    private View splashOverlay;
    private Vibrator vibrator;
    private SplashSoundFX soundFX;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(0xFF000000);
        getWindow().setNavigationBarColor(0xFF000000);

        // Initialize vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            vibrator = vm.getDefaultVibrator();
        } else {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        }

        // Initialize sound effects
        soundFX = new SplashSoundFX();

        addSplashOverlay();
    }

    /** Haptic pulse — intensity mapped to animation energy */
    private void vibrate(int ms, int amplitude) {
        try {
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(ms, amplitude));
                } else {
                    vibrator.vibrate(ms);
                }
            }
        } catch (Exception ignored) {}
    }

    /** Haptic pattern — for complex effects like rumble */
    private void vibratePattern(long[] pattern, int[] amplitudes) {
        try {
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, amplitudes, -1));
                } else {
                    vibrator.vibrate(pattern, -1);
                }
            }
        } catch (Exception ignored) {}
    }

    private void addSplashOverlay() {
        splashOverlay = getLayoutInflater().inflate(R.layout.activity_splash, null);
        addContentView(splashOverlay, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // === VIEWS ===
        View radialGlow = splashOverlay.findViewById(R.id.radialGlow);
        View innerGlow = splashOverlay.findViewById(R.id.innerGlow);
        View ringPulse1 = splashOverlay.findViewById(R.id.ringPulse1);
        View ringPulse2 = splashOverlay.findViewById(R.id.ringPulse2);
        View flashBurst = splashOverlay.findViewById(R.id.flashBurst);
        View shimmer = splashOverlay.findViewById(R.id.shimmerSweep);
        ImageView logoView = splashOverlay.findViewById(R.id.splashLogo);

        View[] rays = {
            splashOverlay.findViewById(R.id.lightRay1),
            splashOverlay.findViewById(R.id.lightRay2),
            splashOverlay.findViewById(R.id.lightRay3),
            splashOverlay.findViewById(R.id.lightRay4),
            splashOverlay.findViewById(R.id.lightRay5),
            splashOverlay.findViewById(R.id.lightRay6)
        };

        View[] particles = {
            splashOverlay.findViewById(R.id.particle1),
            splashOverlay.findViewById(R.id.particle2),
            splashOverlay.findViewById(R.id.particle3),
            splashOverlay.findViewById(R.id.particle4),
            splashOverlay.findViewById(R.id.particle5),
            splashOverlay.findViewById(R.id.particle6)
        };

        // =============================================
        //  ULTRA CINEMATIC LAUNCH SEQUENCE
        //  WebView loads underneath while this plays
        // =============================================

        // ---- PHASE 1 (200ms): PARTICLES EMERGE from darkness ----
        handler.postDelayed(() -> {
            // Ethereal wind as particles emerge from void
            vibrate(15, 50);
            soundFX.playDarkWind();

            for (int i = 0; i < particles.length; i++) {
                View p = particles[i];
                long delay = i * 60L;
                float startX = p.getTranslationX();
                float startY = p.getTranslationY();

                handler.postDelayed(() -> {
                    // Particles drift inward toward center
                    AnimatorSet pAnim = new AnimatorSet();
                    pAnim.playTogether(
                        ObjectAnimator.ofFloat(p, "alpha", 0f, 0.8f, 0.4f, 0.9f).setDuration(1200),
                        ObjectAnimator.ofFloat(p, "translationX", startX * 1.5f, startX * 0.3f).setDuration(2500),
                        ObjectAnimator.ofFloat(p, "translationY", startY * 1.5f, startY * 0.3f).setDuration(2500),
                        ObjectAnimator.ofFloat(p, "scaleX", 0.3f, 1.5f, 0.8f).setDuration(2500),
                        ObjectAnimator.ofFloat(p, "scaleY", 0.3f, 1.5f, 0.8f).setDuration(2500)
                    );
                    pAnim.setInterpolator(new DecelerateInterpolator(1.5f));
                    pAnim.start();

                    // Particles fade out as they reach center
                    handler.postDelayed(() -> {
                        p.animate().alpha(0f).setDuration(400).start();
                    }, 2000);
                }, delay);
            }
        }, 200);

        // ---- PHASE 2 (350ms): INNER GLOW ignites ----
        handler.postDelayed(() -> {
            AnimatorSet igAnim = new AnimatorSet();
            igAnim.playTogether(
                ObjectAnimator.ofFloat(innerGlow, "alpha", 0f, 0.7f).setDuration(500),
                ObjectAnimator.ofFloat(innerGlow, "scaleX", 0.3f, 1.0f).setDuration(800),
                ObjectAnimator.ofFloat(innerGlow, "scaleY", 0.3f, 1.0f).setDuration(800)
            );
            igAnim.setInterpolator(new DecelerateInterpolator(2f));
            igAnim.start();
        }, 350);

        // ---- PHASE 3 (450ms): LIGHT RAYS IGNITE with staggered sweep ----
        handler.postDelayed(() -> {
            // Tension riser as rays fire
            soundFX.playTensionRise();
            vibrate(40, 100);

            for (int i = 0; i < rays.length; i++) {
                View ray = rays[i];
                long rayDelay = i * 70L;

                handler.postDelayed(() -> {
                    ray.setScaleY(0f);
                    ray.setPivotY(ray.getHeight() / 2f);

                    AnimatorSet rayAnim = new AnimatorSet();
                    rayAnim.playTogether(
                        ObjectAnimator.ofFloat(ray, "alpha", 0f, 0.8f).setDuration(250),
                        ObjectAnimator.ofFloat(ray, "scaleY", 0f, 1.2f, 1f).setDuration(600)
                    );
                    rayAnim.setInterpolator(new AccelerateDecelerateInterpolator());
                    rayAnim.start();

                    // Slow continuous rotation
                    ObjectAnimator rotate = ObjectAnimator.ofFloat(ray, "rotation",
                        ray.getRotation(), ray.getRotation() + 120f);
                    rotate.setDuration(4000);
                    rotate.setInterpolator(new LinearInterpolator());
                    rotate.start();

                    // Rays pulse then fade
                    handler.postDelayed(() -> {
                        ObjectAnimator pulse = ObjectAnimator.ofFloat(ray, "alpha", 0.8f, 0.3f, 0.6f, 0f);
                        pulse.setDuration(800);
                        pulse.start();
                    }, 500);
                }, rayDelay);
            }
        }, 450);

        // ---- PHASE 4 (600ms): FIRST RING PULSE expands outward ----
        handler.postDelayed(() -> {
            // Metallic bell ring as ring expands
            soundFX.playBellRing();
            vibrate(25, 90);

            AnimatorSet ring1 = new AnimatorSet();
            ring1.playTogether(
                ObjectAnimator.ofFloat(ringPulse1, "alpha", 0f, 0.9f, 0f).setDuration(900),
                ObjectAnimator.ofFloat(ringPulse1, "scaleX", 0.3f, 2.5f).setDuration(900),
                ObjectAnimator.ofFloat(ringPulse1, "scaleY", 0.3f, 2.5f).setDuration(900)
            );
            ring1.setInterpolator(new DecelerateInterpolator(2f));
            ring1.start();
        }, 600);

        // ---- PHASE 5 (750ms): RADIAL GLOW BLOOM ----
        handler.postDelayed(() -> {
            AnimatorSet glowAnim = new AnimatorSet();
            glowAnim.playTogether(
                ObjectAnimator.ofFloat(radialGlow, "alpha", 0f, 0.9f).setDuration(700),
                ObjectAnimator.ofFloat(radialGlow, "scaleX", 0.2f, 1.3f).setDuration(1400),
                ObjectAnimator.ofFloat(radialGlow, "scaleY", 0.2f, 1.3f).setDuration(1400)
            );
            glowAnim.setInterpolator(new DecelerateInterpolator(2.5f));
            glowAnim.start();
        }, 750);

        // ---- PHASE 6 (950ms): LOGO DRAMATIC ZOOM-IN with slight rotation ----
        handler.postDelayed(() -> {
            // BRAAAM — Inception-style horn as logo slams in
            soundFX.playBraaam();
            vibrate(100, 220);

            logoView.setScaleX(8.0f);
            logoView.setScaleY(8.0f);
            logoView.setAlpha(0f);
            logoView.setRotation(15f);

            AnimatorSet logoAnim = new AnimatorSet();
            logoAnim.playTogether(
                ObjectAnimator.ofFloat(logoView, "scaleX", 8.0f, 0.9f).setDuration(1100),
                ObjectAnimator.ofFloat(logoView, "scaleY", 8.0f, 0.9f).setDuration(1100),
                ObjectAnimator.ofFloat(logoView, "alpha", 0f, 1f).setDuration(350),
                ObjectAnimator.ofFloat(logoView, "rotation", 15f, -2f).setDuration(1100)
            );
            logoAnim.setInterpolator(new DecelerateInterpolator(3.5f));
            logoAnim.start();
        }, 950);

        // ---- PHASE 7 (1500ms): SECOND RING PULSE + FLASH BURST ----
        handler.postDelayed(() -> {
            // Thunder crack — explosive flash
            soundFX.playThunderCrack();
            vibratePattern(
                new long[]{0, 40, 20, 80},
                new int[]  {0, 255, 0,  180}
            );

            // Ring pulse 2
            AnimatorSet ring2 = new AnimatorSet();
            ring2.playTogether(
                ObjectAnimator.ofFloat(ringPulse2, "alpha", 0f, 0.7f, 0f).setDuration(800),
                ObjectAnimator.ofFloat(ringPulse2, "scaleX", 0.5f, 3.0f).setDuration(800),
                ObjectAnimator.ofFloat(ringPulse2, "scaleY", 0.5f, 3.0f).setDuration(800)
            );
            ring2.setInterpolator(new DecelerateInterpolator(1.5f));
            ring2.start();

            // Flash burst
            AnimatorSet flashAnim = new AnimatorSet();
            flashAnim.playTogether(
                ObjectAnimator.ofFloat(flashBurst, "alpha", 0f, 0.5f, 0f).setDuration(450),
                ObjectAnimator.ofFloat(flashBurst, "scaleX", 0f, 2.8f).setDuration(450),
                ObjectAnimator.ofFloat(flashBurst, "scaleY", 0f, 2.8f).setDuration(450)
            );
            flashAnim.setInterpolator(new DecelerateInterpolator());
            flashAnim.setStartDelay(100);
            flashAnim.start();
        }, 1500);

        // ---- PHASE 8 (1900ms): LOGO ELASTIC SETTLE ----
        handler.postDelayed(() -> {
            // Lock snap as logo settles in place
            soundFX.playLockSnap();
            vibrate(15, 150);

            // Overshoot bounce to final position
            AnimatorSet settle = new AnimatorSet();
            settle.playTogether(
                ObjectAnimator.ofFloat(logoView, "scaleX", 0.9f, 1.08f, 0.97f, 1.0f).setDuration(600),
                ObjectAnimator.ofFloat(logoView, "scaleY", 0.9f, 1.08f, 0.97f, 1.0f).setDuration(600),
                ObjectAnimator.ofFloat(logoView, "rotation", -2f, 0.5f, 0f).setDuration(600)
            );
            settle.setInterpolator(new OvershootInterpolator(1.2f));
            settle.start();

            // Inner glow pulse
            ObjectAnimator igPulse = ObjectAnimator.ofFloat(innerGlow, "alpha", 0.7f, 1f, 0.5f);
            igPulse.setDuration(600);
            igPulse.start();
        }, 1900);

        // ---- PHASE 9 (2200ms): SHIMMER SWEEP across logo ----
        handler.postDelayed(() -> {
            // Glass sparkle — shimmering sweep
            soundFX.playGlassSparkle();
            vibratePattern(
                new long[]{0, 10, 40, 10, 40, 10},
                new int[]  {0, 60, 0,  80, 0,  50}
            );

            shimmer.setAlpha(0f);
            AnimatorSet shimmerAnim = new AnimatorSet();
            shimmerAnim.playTogether(
                ObjectAnimator.ofFloat(shimmer, "alpha", 0f, 0.7f, 0.7f, 0f).setDuration(700),
                ObjectAnimator.ofFloat(shimmer, "translationX", -200f, 200f).setDuration(700)
            );
            shimmerAnim.setInterpolator(new AccelerateDecelerateInterpolator());
            shimmerAnim.start();
        }, 2200);

        // ---- PHASE 10 (2600ms): GLOW BREATHING + subtle logo pulse ----
        handler.postDelayed(() -> {
            // Outer glow breathes
            ObjectAnimator glowBreathe = ObjectAnimator.ofFloat(radialGlow, "alpha", 0.9f, 0.4f, 0.7f, 0.5f);
            glowBreathe.setDuration(1200);
            glowBreathe.start();

            ObjectAnimator glowScale = ObjectAnimator.ofFloat(radialGlow, "scaleX", 1.3f, 1.1f, 1.25f);
            glowScale.setDuration(1200);
            glowScale.start();
            ObjectAnimator glowScaleY = ObjectAnimator.ofFloat(radialGlow, "scaleY", 1.3f, 1.1f, 1.25f);
            glowScaleY.setDuration(1200);
            glowScaleY.start();

            // Subtle logo pulse
            ObjectAnimator logoPulse = ObjectAnimator.ofFloat(logoView, "scaleX", 1f, 1.03f, 1f);
            logoPulse.setDuration(800);
            logoPulse.setStartDelay(200);
            logoPulse.start();
            ObjectAnimator logoPulseY = ObjectAnimator.ofFloat(logoView, "scaleY", 1f, 1.03f, 1f);
            logoPulseY.setDuration(800);
            logoPulseY.setStartDelay(200);
            logoPulseY.start();
        }, 2600);

        // ---- PHASE 11 (3500ms): CINEMATIC EXIT ----
        handler.postDelayed(() -> {
            // Dark woosh out — cinematic exit
            soundFX.playDarkWooshOut();
            vibrate(50, 80);

            // Final ring burst on exit
            AnimatorSet exitRing = new AnimatorSet();
            exitRing.playTogether(
                ObjectAnimator.ofFloat(ringPulse1, "alpha", 0f, 0.5f, 0f).setDuration(600),
                ObjectAnimator.ofFloat(ringPulse1, "scaleX", 0.5f, 4f).setDuration(600),
                ObjectAnimator.ofFloat(ringPulse1, "scaleY", 0.5f, 4f).setDuration(600)
            );
            exitRing.start();

            // Logo zooms out slightly and everything fades
            AnimatorSet exitAnim = new AnimatorSet();
            exitAnim.playTogether(
                ObjectAnimator.ofFloat(splashOverlay, "alpha", 1f, 0f).setDuration(600),
                ObjectAnimator.ofFloat(logoView, "scaleX", 1f, 1.5f).setDuration(600),
                ObjectAnimator.ofFloat(logoView, "scaleY", 1f, 1.5f).setDuration(600),
                ObjectAnimator.ofFloat(logoView, "alpha", 1f, 0f).setDuration(500)
            );
            exitAnim.setInterpolator(new AccelerateInterpolator(1.5f));
            exitAnim.setStartDelay(100);
            exitAnim.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    if (splashOverlay != null && splashOverlay.getParent() != null) {
                        ((ViewGroup) splashOverlay.getParent()).removeView(splashOverlay);
                        splashOverlay = null;
                    }
                }
            });
            exitAnim.start();
        }, SPLASH_DURATION);
    }
}
