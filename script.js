// =====================
// EASY CUSTOMIZATION
// =====================
const CONFIG = {
    name: "Alyssa", // <- optional; changes the main question text
    questionTemplate: "{name} will you be my valentine?",
    yesText: "Yes",
    noText: "No",
  
    // Button behavior
    yesGrowthPerNo: 0.18,
    noMovePadding: 10,
  
    // Effects
    vibrateMs: 60,
    heartsPerSuccess: 18,
    confettiDurationMs: 900,
  };
  
  // Decoy + real password (Clue 1)
  const DECOY_PASSWORD_CLUE1 = "Alyssa loves Jacob more";
  const REAL_PASSWORD_CLUE1 = "Jacob loves Alyssa more";
  
  // Scavenger hunt steps (passwords are case-insensitive)
  const SCAVENGER = [
    {
      clue:
        "Your first clue awaits where my things mysteriously appear — the spot you always swear I *shouldn’t* leave anything.",
      password: REAL_PASSWORD_CLUE1,
    },
    {
      clue:
        "A mountain rises here without warning. Sometimes it stands proud… sometimes it collapses in a soft avalanche — but it always returns.",
      password: "Hey sexy",
    },
    {
      clue:
        "Your final gift waits where you insist I steal all the space… yet somehow, every night, I arrive to find you perfectly centered.",
      password: null, // last step
    },
  ];
  
  // Smug/teasing messages when she types the DECOY on clue 1
  const DECOY_MESSAGES = [
    "Bold claim 😏 …and extremely suspicious. Try again.",
    "Nice try 😈 That sounds like something *you* would write on the front of the card.",
    "Mmm… biased. Wrong. Flip it over.",
    "I love the confidence. Incorrect. 😌",
    "That password is adorable… and totally fake. 😏",
  ];
  
  // =====================
  // DOM
  // =====================
  const askView = document.getElementById("askView");
  const scavengerView = document.getElementById("scavengerView");
  const finalView = document.getElementById("finalView");
  
  const questionText = document.getElementById("questionText");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const buttonsArea = document.getElementById("buttonsArea");
  
  const clueTitle = document.getElementById("clueTitle");
  const clueText = document.getElementById("clueText");
  const passwordArea = document.getElementById("passwordArea");
  const passwordInput = document.getElementById("passwordInput");
  const submitPasswordBtn = document.getElementById("submitPasswordBtn");
  const errorText = document.getElementById("errorText");
  
  const resetBtn = document.getElementById("resetBtn");
  const resetBtn2 = document.getElementById("resetBtn2");
  
  // Music
  const bgMusic = document.getElementById("bgMusic");
  const musicBtn = document.getElementById("musicBtn");
  
  // Effects layers
  const fxLayer = document.getElementById("fxLayer");
  const confettiCanvas = document.getElementById("confettiCanvas");
  const ctx = confettiCanvas.getContext("2d");
  
  // =====================
  // STATE
  // =====================
  let yesScale = 1;
  let currentClueIndex = 0;
  let confettiRunning = false;
  
  let musicPlaying = false;
  
  // =====================
  // Helpers
  // =====================
  function applyConfig() {
    const q = CONFIG.questionTemplate.replace("{name}", CONFIG.name);
    questionText.textContent = q;
  
    yesBtn.textContent = CONFIG.yesText;
    noBtn.textContent = CONFIG.noText;
  }
  
  function randBetween(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  // Normalize: trim, lower, collapse multiple spaces
  function normalize(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }
  
  function moveNoButton() {
    const areaRect = buttonsArea.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();
    const pad = CONFIG.noMovePadding;
  
    const maxLeft = areaRect.width - noRect.width - pad;
    const maxTop = areaRect.height - noRect.height - pad;
  
    const left = randBetween(pad, Math.max(pad, maxLeft));
    const top = randBetween(pad, Math.max(pad, maxTop));
  
    noBtn.style.left = `${left}px`;
    noBtn.style.top = `${top}px`;
    noBtn.style.transform = `translate(0, 0)`;
  }
  
  function growYesButton() {
    yesScale += CONFIG.yesGrowthPerNo;
    yesBtn.style.transform = `scale(${yesScale})`;
  }
  
  // =====================
  // Views
  // =====================
  function showAsk() {
    askView.classList.remove("hidden");
    scavengerView.classList.add("hidden");
    finalView.classList.add("hidden");
  
    yesScale = 1;
    yesBtn.style.transform = "scale(1)";
  
    noBtn.style.left = "68%";
    noBtn.style.top = "56%";
    noBtn.style.transform = "translate(-50%, -50%)";
  
    errorText.classList.add("hidden");
    errorText.textContent = "Hmm… that doesn’t seem quite right 💭";
  }
  
  function showScavenger() {
    askView.classList.add("hidden");
    scavengerView.classList.remove("hidden");
    finalView.classList.add("hidden");
  
    currentClueIndex = 0;
    showClue(0);
  }
  
  function showFinal() {
    askView.classList.add("hidden");
    scavengerView.classList.add("hidden");
    finalView.classList.remove("hidden");
  }
  
  // =====================
  // Scavenger
  // =====================
  function showClue(index) {
    const step = SCAVENGER[index];
    clueTitle.textContent = `Clue ${index + 1}`;
    clueText.textContent = step.clue;
  
    passwordInput.value = "";
    errorText.classList.add("hidden");
  
    if (!step.password) {
      passwordArea.style.display = "none";
    } else {
      passwordArea.style.display = "grid";
    }
  }
  
  function successFX() {
    // Vibration (mobile)
    try {
      if (navigator.vibrate) navigator.vibrate(CONFIG.vibrateMs);
    } catch (_) {}
  
    // Hearts
    spawnHearts(CONFIG.heartsPerSuccess);
  
    // Confetti
    runConfetti(CONFIG.confettiDurationMs);
  }
  
  function wrongFXTiny() {
    try {
      if (navigator.vibrate) navigator.vibrate(20);
    } catch (_) {}
  }
  
  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  submitPasswordBtn.addEventListener("click", () => {
    const step = SCAVENGER[currentClueIndex];
    if (!step.password) return;
  
    const entered = normalize(passwordInput.value);
    const expected = normalize(step.password);
  
    // Special handling for clue 1 decoy password
    if (currentClueIndex === 0 && entered === normalize(DECOY_PASSWORD_CLUE1)) {
      errorText.textContent = randomFrom(DECOY_MESSAGES);
      errorText.classList.remove("hidden");
      wrongFXTiny();
      return;
    }
  
    if (entered === expected) {
      errorText.classList.add("hidden");
      successFX();
  
      currentClueIndex++;
  
      if (currentClueIndex < SCAVENGER.length) {
        showClue(currentClueIndex);
  
        // If next clue is final (no password), add extra hearts
        if (!SCAVENGER[currentClueIndex].password) {
          setTimeout(() => spawnHearts(28), 120);
        }
      } else {
        showFinal();
      }
    } else {
      errorText.textContent = "Nope 😌 Try again.";
      errorText.classList.remove("hidden");
      wrongFXTiny();
    }
  });
  
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitPasswordBtn.click();
  });
  
  // =====================
  // Yes/No behavior
  // =====================
  noBtn.addEventListener("mouseenter", () => {
    moveNoButton();
    growYesButton();
  });
  noBtn.addEventListener("click", () => {
    moveNoButton();
    growYesButton();
  });
  
  // Start scavenger + attempt to start music (allowed after user gesture)
  yesBtn.addEventListener("click", async () => {
    showScavenger();
  
    try {
      await bgMusic.play();
      musicPlaying = true;
      musicBtn.textContent = "⏸ Pause music";
    } catch (_) {
      // user can tap play if blocked
    }
  });
  
  // =====================
  // Music
  // =====================
  async function toggleMusic() {
    try {
      if (!musicPlaying) {
        await bgMusic.play();
        musicPlaying = true;
        musicBtn.textContent = "⏸ Pause music";
      } else {
        bgMusic.pause();
        musicPlaying = false;
        musicBtn.textContent = "▶ Play music";
      }
    } catch (e) {
      alert(
        "Music couldn’t start. Make sure 'the-only-exception.mp3' is in the same folder as index.html, then tap Play again."
      );
    }
  }
  
  musicBtn.addEventListener("click", toggleMusic);
  
  // =====================
  // Hearts FX
  // =====================
  const HEARTS = ["💗", "💖", "💞", "💕", "❤️"];
  
  function spawnHearts(count) {
    const w = window.innerWidth;
    const h = window.innerHeight;
  
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "floatingHeart";
      el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  
      const x = randBetween(40, w - 40);
      const y = randBetween(h * 0.55, h - 60);
  
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.fontSize = `${randBetween(18, 30)}px`;
  
      const drift = randBetween(-40, 40);
      el.style.transform = `translateY(0) translateX(${drift}px)`;
  
      fxLayer.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }
  }
  
  // =====================
  // Confetti FX (canvas)
  // =====================
  function resizeCanvasToCard() {
    const rect = confettiCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
  
    confettiCanvas.width = Math.floor(rect.width * dpr);
    confettiCanvas.height = Math.floor(rect.height * dpr);
  
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  
  window.addEventListener("resize", resizeCanvasToCard);
  
  function runConfetti(durationMs) {
    if (confettiRunning) return;
    confettiRunning = true;
  
    resizeCanvasToCard();
  
    const rect = confettiCanvas.getBoundingClientRect();
    const pieces = [];
    const pieceCount = 140;
  
    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        x: randBetween(0, rect.width),
        y: randBetween(-rect.height * 0.2, rect.height * 0.2),
        r: randBetween(3, 7),
        vx: randBetween(-2.4, 2.4),
        vy: randBetween(2.2, 5.2),
        rot: randBetween(0, Math.PI * 2),
        vr: randBetween(-0.2, 0.2),
        hue: randBetween(0, 360),
        life: randBetween(0.75, 1.0),
      });
    }
  
    const start = performance.now();
  
    function frame(now) {
      const t = now - start;
      ctx.clearRect(0, 0, rect.width, rect.height);
  
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
  
        const progress = t / durationMs;
        const alpha = Math.max(0, 1 - progress) * p.life;
  
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, 1)`;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }
  
      if (t < durationMs) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        confettiRunning = false;
      }
    }
  
    requestAnimationFrame(frame);
  }
  
  // =====================
  // Reset
  // =====================
  function resetAll() {
    showAsk();
  }
  
  resetBtn.addEventListener("click", resetAll);
  resetBtn2.addEventListener("click", resetAll);
  
  // =====================
  // Init
  // =====================
  applyConfig();
  setTimeout(() => moveNoButton(), 300);
  