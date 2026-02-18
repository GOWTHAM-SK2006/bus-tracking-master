package com.dygon.bustracking;

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;

/**
 * Cinematic film-trailer style sound effects for splash screen.
 * Dark, atmospheric, premium feel — like Marvel/DC intros.
 */
public class SplashSoundFX {

    private static final int SAMPLE_RATE = 44100;

    /** Ethereal wind — dark atmosphere as particles appear from void */
    public void playDarkWind() {
        new Thread(() -> {
            int durationMs = 1000;
            int samples = SAMPLE_RATE * durationMs / 1000;
            short[] buffer = new short[samples];
            double phase = 0;

            for (int i = 0; i < samples; i++) {
                double t = (double) i / SAMPLE_RATE;
                double p = (double) i / samples;
                double envelope = Math.sin(Math.PI * p) * 0.8;
                // Filtered noise — wind-like texture
                double noise = 0;
                for (int h = 1; h <= 8; h++) {
                    double freq = 150 + h * 47 + 30 * Math.sin(2 * Math.PI * 0.5 * t);
                    noise += Math.sin(2 * Math.PI * freq * t + h * 1.3) * (1.0 / h);
                }
                // Add breathy sub-layer
                noise += Math.sin(2 * Math.PI * 80 * t) * 0.3 * Math.sin(Math.PI * p);
                buffer[i] = (short) (noise * envelope * 4000);
            }
            playBuffer(buffer);
        }).start();
    }

    /** Tension riser — building energy, frequency climbing with vibrato */
    public void playTensionRise() {
        new Thread(() -> {
            int durationMs = 600;
            int samples = SAMPLE_RATE * durationMs / 1000;
            short[] buffer = new short[samples];

            for (int i = 0; i < samples; i++) {
                double t = (double) i / SAMPLE_RATE;
                double p = (double) i / samples;
                double envelope = p * (1 - p * 0.2);
                // Shepard tone illusion — feels like it's always rising
                double wave = 0;
                for (int oct = 0; oct < 4; oct++) {
                    double baseFreq = 110 * Math.pow(2, oct + p * 1.5);
                    double octEnv = Math.sin(Math.PI * (oct + p * 1.5) / 5.0);
                    octEnv = Math.max(0, octEnv);
                    wave += Math.sin(2 * Math.PI * baseFreq * t) * octEnv * 0.25;
                }
                buffer[i] = (short) (wave * envelope * 9000);
            }
            playBuffer(buffer);
        }).start();
    }

    /** Metallic ring — expanding pulse, like hitting a massive bell */
    public void playBellRing() {
        new Thread(() -> {
            int durationMs = 700;
            int samples = SAMPLE_RATE * durationMs / 1000;
            short[] buffer = new short[samples];

            for (int i = 0; i < samples; i++) {
                double t = (double) i / SAMPLE_RATE;
                double p = (double) i / samples;
                // Bell: non-harmonic partials with different decay rates
                double wave = Math.sin(2 * Math.PI * 440 * t) * 0.35 * Math.exp(-p * 3)
                            + Math.sin(2 * Math.PI * 587 * t) * 0.25 * Math.exp(-p * 4)   // minor 3rd
                            + Math.sin(2 * Math.PI * 1174 * t) * 0.15 * Math.exp(-p * 5)  // octave+
                            + Math.sin(2 * Math.PI * 1760 * t) * 0.10 * Math.exp(-p * 6)  // 2 octaves
                            + Math.sin(2 * Math.PI * 2637 * t) * 0.08 * Math.exp(-p * 7); // high partial
                // Initial strike transient
                wave += (Math.random() - 0.5) * 0.3 * Math.exp(-p * 30);
                buffer[i] = (short) (wave * 10000);
            }
            playBuffer(buffer);
        }).start();
    }

    /** BRAAAM — the Inception-style horn blast for logo reveal */
    public void playBraaam() {
        new Thread(() -> {
            int durationMs = 800;
            int samples = SAMPLE_RATE * durationMs / 1000;
            short[] buffer = new short[samples];

            for (int i = 0; i < samples; i++) {
                double t = (double) i / SAMPLE_RATE;
                double p = (double) i / samples;
                // Sharp attack, long sustain, gradual decay
                double envelope = Math.min(p * 20, 1.0) * Math.exp(-p * 1.5);
                // Rich brass-like tone — fundamental + odd harmonics
                double freq = 65.41; // C2 — deep and powerful
                double wave = Math.sin(2 * Math.PI * freq * t) * 0.40
                            + Math.sin(2 * Math.PI * freq * 2 * t) * 0.25
                            + Math.sin(2 * Math.PI * freq * 3 * t) * 0.15
                            + Math.sin(2 * Math.PI * freq * 4 * t) * 0.08
                            + Math.sin(2 * Math.PI * freq * 5 * t) * 0.05
                            + Math.sin(2 * Math.PI * freq * 7 * t) * 0.03;
                // Add growl/grit
                wave += Math.sin(2 * Math.PI * freq * 6 * t) * 0.04 * Math.sin(2 * Math.PI * 3 * t);
                buffer[i] = (short) (wave * envelope * 14000);
            }
            playBuffer(buffer);
        }).start();
    }

    /** Thunder crack — flash burst explosion */
    public void playThunderCrack() {
        new Thread(() -> {
            int durationMs = 400;
            int samples = SAMPLE_RATE * durationMs / 1000;
            short[] buffer = new short[samples];

            for (int i = 0; i < samples; i++) {
                double t = (double) i / SAMPLE_RATE;
                double p = (double) i / samples;
                // Sharp initial crack (white noise burst)
                double crack = (Math.random() - 0.5) * Math.exp(-p * 18) * 1.2;
                // Rumbling tail
                double rumble = Math.sin(2 * Math.PI * 55 * t) * 0.4 * Math.exp(-p * 3)
                              + Math.sin(2 * Math.PI * 40 * t) * 0.3 * Math.exp(-p * 2.5);
                // Mid-range body crackle
                double body = 0;
                for (int h = 1; h <= 5; h++) {
                    body += Math.sin(2 * Math.PI * (100 + h * 73) * t) * (0.15 / h) * Math.exp(-p * (4 + h));
                }
                buffer[i] = (short) ((crack + rumble + body) * 12000);
            }
            playBuffer(buffer);
        }).start();
    }

    /** Lock-in snap — logo settling into place */
    public void playLockSnap() {
        new Thread(() -> {
            int durationMs = 150;
            int samples = SAMPLE_RATE * durationMs / 1000;
            short[] buffer = new short[samples];

            for (int i = 0; i < samples; i++) {
                double t = (double) i / SAMPLE_RATE;
                double p = (double) i / samples;
                double envelope = Math.exp(-p * 25);
                // Two-part snap: high click + low thud
                double click = Math.sin(2 * Math.PI * 4000 * t) * 0.3 * Math.exp(-p * 50);
                double thud = Math.sin(2 * Math.PI * 200 * t) * 0.5 * Math.exp(-p * 15);
                double snap = (Math.random() - 0.5) * 0.6 * Math.exp(-p * 40);
                buffer[i] = (short) ((click + thud + snap) * 11000);
            }
            playBuffer(buffer);
        }).start();
    }

    /** Glass sparkle — shimmering light sweep */
    public void playGlassSparkle() {
        new Thread(() -> {
            int durationMs = 800;
            int samples = SAMPLE_RATE * durationMs / 1000;
            short[] buffer = new short[samples];

            for (int i = 0; i < samples; i++) {
                double t = (double) i / SAMPLE_RATE;
                double p = (double) i / samples;
                // Sweeping sparkle — frequency rises as shimmer moves
                double sweepFreq = 1500 + 3000 * p;
                double envelope = Math.sin(Math.PI * p) * Math.exp(-p * 1.5);
                // Multiple detuned high tones for glass texture
                double wave = Math.sin(2 * Math.PI * sweepFreq * t) * 0.25
                            + Math.sin(2 * Math.PI * (sweepFreq * 1.5) * t) * 0.20
                            + Math.sin(2 * Math.PI * (sweepFreq * 2.0) * t) * 0.12
                            + Math.sin(2 * Math.PI * (sweepFreq * 0.75) * t) * 0.15;
                // Tiny glitter noise
                if (Math.random() < 0.05) {
                    wave += (Math.random() - 0.5) * 0.2;
                }
                buffer[i] = (short) (wave * envelope * 6000);
            }
            playBuffer(buffer);
        }).start();
    }

    /** Dark woosh out — cinematic exit to black */
    public void playDarkWooshOut() {
        new Thread(() -> {
            int durationMs = 550;
            int samples = SAMPLE_RATE * durationMs / 1000;
            short[] buffer = new short[samples];

            for (int i = 0; i < samples; i++) {
                double t = (double) i / SAMPLE_RATE;
                double p = (double) i / samples;
                // Starts mid, swoops down to sub-bass
                double freq = 800 * (1 - p) * (1 - p) + 35;
                double envelope = Math.exp(-p * 2) * (1 - p);
                double wave = Math.sin(2 * Math.PI * freq * t) * 0.4
                            + Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.25
                            + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.1;
                // Filtered noise whoosh
                wave += (Math.random() - 0.5) * 0.15 * envelope * Math.exp(-p * 4);
                // Deep sub at the end
                wave += Math.sin(2 * Math.PI * 35 * t) * 0.2 * p;
                buffer[i] = (short) (wave * envelope * 10000);
            }
            playBuffer(buffer);
        }).start();
    }

    private void playBuffer(short[] buffer) {
        try {
            int bufSize = Math.max(
                buffer.length * 2,
                AudioTrack.getMinBufferSize(SAMPLE_RATE,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT)
            );

            AudioTrack track = new AudioTrack.Builder()
                .setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_GAME)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build())
                .setAudioFormat(new AudioFormat.Builder()
                    .setSampleRate(SAMPLE_RATE)
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build())
                .setBufferSizeInBytes(bufSize)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build();

            track.write(buffer, 0, buffer.length);
            track.setNotificationMarkerPosition(buffer.length);
            track.setPlaybackPositionUpdateListener(new AudioTrack.OnPlaybackPositionUpdateListener() {
                @Override
                public void onMarkerReached(AudioTrack t) {
                    t.release();
                }
                @Override
                public void onPeriodicNotification(AudioTrack t) {}
            });
            track.play();
        } catch (Exception e) {
            // Silently fail — sound is optional
        }
    }
}
