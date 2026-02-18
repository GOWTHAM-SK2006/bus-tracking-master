package com.dygon.bustracking;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.LinearInterpolator;
import android.view.animation.OvershootInterpolator;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class SplashActivity extends AppCompatActivity {

    private static final long SPLASH_DURATION = 3500;
    private Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Dismiss Android 12 system splash instantly
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        // Full screen immersive - pure black
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );
        getWindow().setStatusBarColor(0xFF000000);
        getWindow().setNavigationBarColor(0xFF000000);

        setContentView(R.layout.activity_splash);

        // Hide system bars completely
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }

        // Get views
        View radialGlow = findViewById(R.id.radialGlow);
        View flashBurst = findViewById(R.id.flashBurst);
        View ray1 = findViewById(R.id.lightRay1);
        View ray2 = findViewById(R.id.lightRay2);
        View ray3 = findViewById(R.id.lightRay3);
        View ray4 = findViewById(R.id.lightRay4);
        ImageView logoView = findViewById(R.id.splashLogo);
        View[] rays = { ray1, ray2, ray3, ray4 };

        // ============================================
        //  CINEMATIC LAUNCH SEQUENCE
        // ============================================

        // ------ PHASE 1 (0ms): BLACK SILENCE ------
        // Screen stays pure black for dramatic tension

        // ------ PHASE 2 (400ms): LIGHT RAYS SWEEP IN ------
        handler.postDelayed(() -> {
            for (int i = 0; i < rays.length; i++) {
                View ray = rays[i];
                long rayDelay = i * 80L;

                handler.postDelayed(() -> {
                    ray.setScaleY(0f);
                    AnimatorSet rayAnim = new AnimatorSet();
                    rayAnim.playTogether(
                        ObjectAnimator.ofFloat(ray, "alpha", 0f, 0.7f).setDuration(300),
                        ObjectAnimator.ofFloat(ray, "scaleY", 0f, 1f).setDuration(500)
                    );
                    rayAnim.setInterpolator(new AccelerateInterpolator());
                    rayAnim.start();

                    // Rays slowly rotate
                    ObjectAnimator rotate = ObjectAnimator.ofFloat(ray, "rotation",
                        ray.getRotation(), ray.getRotation() + 90f);
                    rotate.setDuration(3000);
                    rotate.setInterpolator(new LinearInterpolator());
                    rotate.start();

                    // Rays fade out after impact
                    handler.postDelayed(() -> {
                        ray.animate().alpha(0f).setDuration(600).start();
                    }, 600);
                }, rayDelay);
            }
        }, 400);

        // ------ PHASE 3 (700ms): RADIAL GLOW EXPANDS ------
        handler.postDelayed(() -> {
            AnimatorSet glowAnim = new AnimatorSet();
            glowAnim.playTogether(
                ObjectAnimator.ofFloat(radialGlow, "alpha", 0f, 1f).setDuration(600),
                ObjectAnimator.ofFloat(radialGlow, "scaleX", 0.3f, 1.2f).setDuration(1200),
                ObjectAnimator.ofFloat(radialGlow, "scaleY", 0.3f, 1.2f).setDuration(1200)
            );
            glowAnim.setInterpolator(new DecelerateInterpolator(2f));
            glowAnim.start();
        }, 700);

        // ------ PHASE 4 (900ms): LOGO DRAMATIC ZOOM-IN ------
        // Netflix-style: starts huge and far, zooms TO the viewer
        handler.postDelayed(() -> {
            logoView.setScaleX(5.0f);
            logoView.setScaleY(5.0f);
            logoView.setAlpha(0f);

            AnimatorSet logoAnim = new AnimatorSet();

            // Zoom from 5x down to 1x (coming toward you)
            ObjectAnimator zoomX = ObjectAnimator.ofFloat(logoView, "scaleX", 5.0f, 1.0f);
            zoomX.setDuration(1000);
            ObjectAnimator zoomY = ObjectAnimator.ofFloat(logoView, "scaleY", 5.0f, 1.0f);
            zoomY.setDuration(1000);

            // Fade in quickly at the start
            ObjectAnimator fadeIn = ObjectAnimator.ofFloat(logoView, "alpha", 0f, 1f);
            fadeIn.setDuration(300);

            logoAnim.playTogether(zoomX, zoomY, fadeIn);
            logoAnim.setInterpolator(new DecelerateInterpolator(3f));
            logoAnim.start();
        }, 900);

        // ------ PHASE 5 (1200ms): FLASH BURST ON LOGO LAND ------
        handler.postDelayed(() -> {
            AnimatorSet flashAnim = new AnimatorSet();
            flashAnim.playTogether(
                ObjectAnimator.ofFloat(flashBurst, "alpha", 0f, 0.6f, 0f).setDuration(500),
                ObjectAnimator.ofFloat(flashBurst, "scaleX", 0f, 2.5f).setDuration(500),
                ObjectAnimator.ofFloat(flashBurst, "scaleY", 0f, 2.5f).setDuration(500)
            );
            flashAnim.setInterpolator(new DecelerateInterpolator());
            flashAnim.start();
        }, 1500);

        // ------ PHASE 6 (1800ms): LOGO SETTLE + GLOW PULSE ------
        handler.postDelayed(() -> {
            // Small overshoot bounce
            AnimatorSet settle = new AnimatorSet();
            settle.playTogether(
                ObjectAnimator.ofFloat(logoView, "scaleX", 1.0f, 0.95f, 1.02f, 1.0f).setDuration(400),
                ObjectAnimator.ofFloat(logoView, "scaleY", 1.0f, 0.95f, 1.02f, 1.0f).setDuration(400)
            );
            settle.start();

            // Radial glow pulses
            ObjectAnimator glowPulse = ObjectAnimator.ofFloat(radialGlow, "alpha", 1f, 0.5f, 0.8f);
            glowPulse.setDuration(800);
            glowPulse.start();
        }, 1800);

        // ------ PHASE 8 (3000ms): CINEMATIC FADE OUT ------
        handler.postDelayed(() -> {
            View rootView = findViewById(R.id.splashRoot);

            // Everything scales up slightly while fading (zoom-through effect)
            AnimatorSet exitAnim = new AnimatorSet();
            exitAnim.playTogether(
                ObjectAnimator.ofFloat(rootView, "alpha", 1f, 0f).setDuration(500),
                ObjectAnimator.ofFloat(logoView, "scaleX", 1f, 1.3f).setDuration(500),
                ObjectAnimator.ofFloat(logoView, "scaleY", 1f, 1.3f).setDuration(500),
                ObjectAnimator.ofFloat(radialGlow, "alpha", 0.8f, 0f).setDuration(400)
            );
            exitAnim.setInterpolator(new AccelerateInterpolator());
            exitAnim.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    navigateToMain();
                }
            });
            exitAnim.start();
        }, SPLASH_DURATION);
    }

    private void navigateToMain() {
        Intent intent = new Intent(SplashActivity.this, MainActivity.class);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
    }
}
