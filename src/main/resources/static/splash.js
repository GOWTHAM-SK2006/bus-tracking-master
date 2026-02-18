/* =========================================
   DYGON - Cinematic Web Splash Screen
   JS Animation Engine — matches Android
   ========================================= */

(function () {
  // Only show splash once per session
  if (sessionStorage.getItem("dygon_splash_shown")) {
    const overlay = document.getElementById("splashOverlay");
    if (overlay) overlay.remove();
    return;
  }

  const overlay = document.getElementById("splashOverlay");
  if (!overlay) return;

  // Mark as shown
  sessionStorage.setItem("dygon_splash_shown", "1");

  // ---- Build splash DOM ----
  const scene = document.createElement("div");
  scene.className = "splash-scene";

  // Radial glow
  const radialGlow = el("div", "splash-radial-glow");
  scene.appendChild(radialGlow);

  // Inner glow
  const innerGlow = el("div", "splash-inner-glow");
  scene.appendChild(innerGlow);

  // Ring pulses
  const ring1 = el("div", "splash-ring");
  const ring2 = el("div", "splash-ring");
  scene.appendChild(ring1);
  scene.appendChild(ring2);

  // Light rays (6)
  const rayAngles = [0, 30, 60, 90, 120, 150];
  const rays = rayAngles.map((angle) => {
    const r = el("div", "splash-ray");
    r.style.transform = `rotate(${angle}deg) scaleY(0)`;
    scene.appendChild(r);
    return r;
  });

  // Particles (6)
  const particleConfigs = [
    { size: 8, x: -80, y: -80 },
    { size: 6, x: 90, y: -60 },
    { size: 10, x: 70, y: 85 },
    { size: 7, x: -95, y: 50 },
    { size: 5, x: 20, y: -100 },
    { size: 9, x: -50, y: 95 },
  ];
  const particles = particleConfigs.map((cfg) => {
    const p = el("div", "splash-particle");
    p.style.width = cfg.size + "px";
    p.style.height = cfg.size + "px";
    p.style.transform = `translate(${cfg.x}px, ${cfg.y}px) scale(0.3)`;
    p._startX = cfg.x;
    p._startY = cfg.y;
    scene.appendChild(p);
    return p;
  });

  // Flash burst
  const flash = el("div", "splash-flash");
  scene.appendChild(flash);

  // Shimmer
  const shimmer = el("div", "splash-shimmer");
  scene.appendChild(shimmer);

  // Logo
  const logo = document.createElement("img");
  logo.className = "splash-logo";
  logo.src = "./logo.png";
  logo.alt = "DYGON";
  scene.appendChild(logo);

  overlay.appendChild(scene);

  // ---- AudioContext for web sounds ----
  let audioCtx = null;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Browsers block AudioContext until user gesture — try to resume
    if (audioCtx.state === 'suspended') {
      const unlock = () => {
        audioCtx.resume();
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
        document.removeEventListener('keydown', unlock);
      };
      document.addEventListener('click', unlock);
      document.addEventListener('touchstart', unlock);
      document.addEventListener('keydown', unlock);
    }
  } catch (e) {
    // No audio support
  }

  // ---- ANIMATION PHASES ----

  // PHASE 1 (200ms): Particles emerge
  delay(200, () => {
    playDarkWind();
    particles.forEach((p, i) => {
      delay(i * 60, () => {
        animate(
          p,
          {
            opacity: [0, 0.8, 0.4, 0.9],
            transform: [
              `translate(${p._startX * 1.5}px, ${p._startY * 1.5}px) scale(0.3)`,
              `translate(${p._startX * 0.3}px, ${p._startY * 0.3}px) scale(0.8)`,
            ],
          },
          2500,
          "ease-out",
        );

        delay(2000, () => {
          animate(p, { opacity: [null, 0] }, 400);
        });
      });
    });
  });

  // PHASE 2 (350ms): Inner glow ignites
  delay(350, () => {
    animate(
      innerGlow,
      {
        opacity: [0, 0.7],
        transform: ["scale(0.3)", "scale(1)"],
      },
      800,
      "ease-out",
    );
  });

  // PHASE 3 (450ms): Light rays ignite
  delay(450, () => {
    playTensionRise();
    rays.forEach((ray, i) => {
      const angle = rayAngles[i];
      delay(i * 70, () => {
        animate(
          ray,
          {
            opacity: [0, 0.8],
            transform: [
              `rotate(${angle}deg) scaleY(0)`,
              `rotate(${angle}deg) scaleY(1)`,
            ],
          },
          600,
          "ease-in-out",
        );

        // Slow rotation
        ray.style.transition = "none";
        let currentAngle = angle;
        const rotateInterval = setInterval(() => {
          currentAngle += 0.5;
          ray.style.transform = `rotate(${currentAngle}deg) scaleY(1)`;
        }, 16);

        // Fade out rays
        delay(500, () => {
          animate(ray, { opacity: [0.8, 0] }, 800);
          delay(800, () => clearInterval(rotateInterval));
        });
      });
    });
  });

  // PHASE 4 (600ms): First ring pulse
  delay(600, () => {
    playBellRing();
    animate(
      ring1,
      {
        opacity: [0, 0.9, 0],
        transform: ["scale(0.3)", "scale(2.5)"],
      },
      900,
      "ease-out",
    );
  });

  // PHASE 5 (750ms): Radial glow bloom
  delay(750, () => {
    animate(
      radialGlow,
      {
        opacity: [0, 0.9],
        transform: ["scale(0.2)", "scale(1.3)"],
      },
      1400,
      "ease-out",
    );
  });

  // PHASE 6 (950ms): Logo dramatic zoom-in
  delay(950, () => {
    playBraaam();
    animate(
      logo,
      {
        transform: ["scale(8) rotate(15deg)", "scale(0.9) rotate(-2deg)"],
        opacity: [0, 1],
      },
      1100,
      "cubic-bezier(0.0, 0.0, 0.2, 1)",
    );
  });

  // PHASE 7 (1500ms): Second ring + flash burst
  delay(1500, () => {
    playThunderCrack();
    animate(
      ring2,
      {
        opacity: [0, 0.7, 0],
        transform: ["scale(0.5)", "scale(3)"],
      },
      800,
      "ease-out",
    );

    delay(100, () => {
      animate(
        flash,
        {
          opacity: [0, 0.5, 0],
          transform: ["scale(0)", "scale(2.8)"],
        },
        450,
        "ease-out",
      );
    });
  });

  // PHASE 8 (1900ms): Logo elastic settle
  delay(1900, () => {
    playLockSnap();
    logo.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
    logo.style.transform = "scale(1) rotate(0deg)";

    animate(innerGlow, { opacity: [0.7, 1, 0.5] }, 600);
  });

  // PHASE 9 (2200ms): Shimmer sweep
  delay(2200, () => {
    playGlassSparkle();
    animate(
      shimmer,
      {
        opacity: [0, 0.7, 0.7, 0],
        transform: [
          "translateX(-200px) rotate(15deg)",
          "translateX(200px) rotate(15deg)",
        ],
      },
      700,
      "ease-in-out",
    );
  });

  // PHASE 10 (2600ms): Glow breathing + logo pulse
  delay(2600, () => {
    animate(
      radialGlow,
      {
        opacity: [0.9, 0.4, 0.7, 0.5],
        transform: ["scale(1.3)", "scale(1.1)", "scale(1.25)"],
      },
      1200,
    );

    delay(200, () => {
      animate(
        logo,
        {
          transform: ["scale(1)", "scale(1.03)", "scale(1)"],
        },
        800,
      );
    });
  });

  // PHASE 11 (3500ms): Cinematic exit
  delay(3500, () => {
    playDarkWooshOut();

    animate(
      ring1,
      {
        opacity: [0, 0.5, 0],
        transform: ["scale(0.5)", "scale(4)"],
      },
      600,
      "ease-out",
    );

    // Fade everything out
    delay(300, () => {
      animate(radialGlow, { opacity: [null, 0] }, 500);
      animate(innerGlow, { opacity: [null, 0] }, 500);
      animate(
        logo,
        { opacity: [1, 0], transform: ["scale(1)", "scale(1.15)"] },
        500,
      );

      delay(500, () => {
        overlay.classList.add("fade-out");
        delay(600, () => {
          overlay.remove();
        });
      });
    });
  });

  // ---- UTILITY FUNCTIONS ----

  function el(tag, className) {
    const e = document.createElement(tag);
    e.className = className;
    return e;
  }

  function delay(ms, fn) {
    setTimeout(fn, ms);
  }

  function animate(element, keyframes, duration, easing) {
    try {
      element.animate(keyframes, {
        duration: duration || 400,
        easing: easing || "ease",
        fill: "forwards",
      });
    } catch (e) {
      // Fallback for older browsers — apply final state directly
      const lastVals = {};
      for (const prop in keyframes) {
        const vals = keyframes[prop];
        if (Array.isArray(vals)) {
          lastVals[prop] = vals[vals.length - 1];
        }
      }
      Object.assign(element.style, lastVals);
    }
  }

  // ---- WEB AUDIO SOUND EFFECTS ----
  // Film-trailer style — matching Android SplashSoundFX.java

  function playTone(createFn, durationSec) {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === "suspended") audioCtx.resume();
      createFn(audioCtx, durationSec || 1);
    } catch (e) {
      /* silent fail */
    }
  }

  function playDarkWind() {
    playTone((ctx) => {
      const duration = 1.0;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const p = i / bufferSize;
        const env = Math.sin(Math.PI * p) * 0.8;
        let noise = 0;
        for (let h = 1; h <= 8; h++) {
          const freq = 150 + h * 47 + 30 * Math.sin(2 * Math.PI * 0.5 * t);
          noise += Math.sin(2 * Math.PI * freq * t + h * 1.3) * (1.0 / h);
        }
        noise += Math.sin(2 * Math.PI * 80 * t) * 0.3 * Math.sin(Math.PI * p);
        data[i] = noise * env * 0.12;
      }
      playAudioBuffer(ctx, buffer);
    });
  }

  function playTensionRise() {
    playTone((ctx) => {
      const duration = 0.6;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const p = i / bufferSize;
        const env = p * (1 - p * 0.2);
        let wave = 0;
        for (let oct = 0; oct < 4; oct++) {
          const baseFreq = 110 * Math.pow(2, oct + p * 1.5);
          let octEnv = Math.sin((Math.PI * (oct + p * 1.5)) / 5.0);
          octEnv = Math.max(0, octEnv);
          wave += Math.sin(2 * Math.PI * baseFreq * t) * octEnv * 0.25;
        }
        data[i] = wave * env * 0.25;
      }
      playAudioBuffer(ctx, buffer);
    });
  }

  function playBellRing() {
    playTone((ctx) => {
      const duration = 0.7;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const p = i / bufferSize;
        let wave =
          Math.sin(2 * Math.PI * 440 * t) * 0.35 * Math.exp(-p * 3) +
          Math.sin(2 * Math.PI * 587 * t) * 0.25 * Math.exp(-p * 4) +
          Math.sin(2 * Math.PI * 1174 * t) * 0.15 * Math.exp(-p * 5) +
          Math.sin(2 * Math.PI * 1760 * t) * 0.1 * Math.exp(-p * 6) +
          Math.sin(2 * Math.PI * 2637 * t) * 0.08 * Math.exp(-p * 7);
        wave += (Math.random() - 0.5) * 0.3 * Math.exp(-p * 30);
        data[i] = wave * 0.3;
      }
      playAudioBuffer(ctx, buffer);
    });
  }

  function playBraaam() {
    playTone((ctx) => {
      const duration = 0.8;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      const freq = 65.41;
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const p = i / bufferSize;
        const env = Math.min(p * 20, 1.0) * Math.exp(-p * 1.5);
        let wave =
          Math.sin(2 * Math.PI * freq * t) * 0.4 +
          Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +
          Math.sin(2 * Math.PI * freq * 3 * t) * 0.15 +
          Math.sin(2 * Math.PI * freq * 4 * t) * 0.08 +
          Math.sin(2 * Math.PI * freq * 5 * t) * 0.05 +
          Math.sin(2 * Math.PI * freq * 7 * t) * 0.03;
        wave +=
          Math.sin(2 * Math.PI * freq * 6 * t) *
          0.04 *
          Math.sin(2 * Math.PI * 3 * t);
        data[i] = wave * env * 0.4;
      }
      playAudioBuffer(ctx, buffer);
    });
  }

  function playThunderCrack() {
    playTone((ctx) => {
      const duration = 0.4;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const p = i / bufferSize;
        const crack = (Math.random() - 0.5) * Math.exp(-p * 18) * 1.2;
        const rumble =
          Math.sin(2 * Math.PI * 55 * t) * 0.4 * Math.exp(-p * 3) +
          Math.sin(2 * Math.PI * 40 * t) * 0.3 * Math.exp(-p * 2.5);
        let body = 0;
        for (let h = 1; h <= 5; h++) {
          body +=
            Math.sin(2 * Math.PI * (100 + h * 73) * t) *
            (0.15 / h) *
            Math.exp(-p * (4 + h));
        }
        data[i] = (crack + rumble + body) * 0.35;
      }
      playAudioBuffer(ctx, buffer);
    });
  }

  function playLockSnap() {
    playTone((ctx) => {
      const duration = 0.15;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const p = i / bufferSize;
        const click =
          Math.sin(2 * Math.PI * 4000 * t) * 0.3 * Math.exp(-p * 50);
        const thud = Math.sin(2 * Math.PI * 200 * t) * 0.5 * Math.exp(-p * 15);
        const snap = (Math.random() - 0.5) * 0.6 * Math.exp(-p * 40);
        data[i] = (click + thud + snap) * 0.3;
      }
      playAudioBuffer(ctx, buffer);
    });
  }

  function playGlassSparkle() {
    playTone((ctx) => {
      const duration = 0.8;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const p = i / bufferSize;
        const sweepFreq = 1500 + 3000 * p;
        const env = Math.sin(Math.PI * p) * Math.exp(-p * 1.5);
        let wave =
          Math.sin(2 * Math.PI * sweepFreq * t) * 0.25 +
          Math.sin(2 * Math.PI * (sweepFreq * 1.5) * t) * 0.2 +
          Math.sin(2 * Math.PI * (sweepFreq * 2.0) * t) * 0.12 +
          Math.sin(2 * Math.PI * (sweepFreq * 0.75) * t) * 0.15;
        if (Math.random() < 0.05) wave += (Math.random() - 0.5) * 0.2;
        data[i] = wave * env * 0.18;
      }
      playAudioBuffer(ctx, buffer);
    });
  }

  function playDarkWooshOut() {
    playTone((ctx) => {
      const duration = 0.55;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const p = i / bufferSize;
        const freq = 800 * (1 - p) * (1 - p) + 35;
        const env = Math.exp(-p * 2) * (1 - p);
        let wave =
          Math.sin(2 * Math.PI * freq * t) * 0.4 +
          Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.25 +
          Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.1;
        wave += (Math.random() - 0.5) * 0.15 * env * Math.exp(-p * 4);
        wave += Math.sin(2 * Math.PI * 35 * t) * 0.2 * p;
        data[i] = wave * env * 0.3;
      }
      playAudioBuffer(ctx, buffer);
    });
  }

  function playAudioBuffer(ctx, buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }
})();
