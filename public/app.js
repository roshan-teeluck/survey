(function () {
  "use strict";

  // ------------------------------------------------------------
  // Copy: what the No button says as the user keeps refusing
  // ------------------------------------------------------------
  const NO_LABELS = [
    "No",
    "Are you sure?",
    "Really sure?",
    "Think about it...",
    "Pookie please",
    "Last chance!",
    "Surely not?",
    "You're breaking my heart 💔",
    "I'm gonna cry",
    "Don't do this to me",
    "You're being very mean",
    "I'll tell your mum",
    "Fine. Have it your way",
    "Just kidding, say yes",
    "The button is getting smaller, hurry",
    "Ok this is embarrassing for both of us",
    "Is this about the dishes?",
    "I'll do the dishes",
    "FOREVER",
    "No is not an option anymore",
  ];

  const SUBTITLES = [
    "Please answer honestly. This is a scientific survey.",
    "Interesting choice. Let's try that again.",
    "The Yes button has noticed your hesitation.",
    "Studies show 100% of people who say yes get cake.",
    "The No button is starting to feel unwelcome.",
    "Your refusal has been logged. Legally.",
    "Have you considered that the Yes button is bigger and therefore correct?",
    "At this point the No button is more of a suggestion.",
    "We have notified your emergency contact.",
    "The Yes button is now load-bearing.",
  ];

  const HERO_EMOJIS = ["💍", "🥺", "😢", "😭", "🙏", "😩", "🫠", "😤", "🥲", "🫶"];

  const THANKS_LINES = [
    (n) => `You said yes on your very first try. Either true love or you didn't read the buttons. We'll take it.`,
    (n) => `It only took you ${n} try. One. Uno. We were braced for worse.`,
    (n) => `It only took you ${n} tries. Honestly, that's below the industry average.`,
    (n) => `It took you ${n} tries. The Yes button had to grow ${n} times to get here. It's exhausted. So are we.`,
    (n) => `${n} tries. ${n}! The No button has filed a formal complaint. Application approved anyway.`,
    (n) => `${n} tries. At this point the Yes button was the entire screen and you had no choice. We call that destiny.`,
  ];

  // ------------------------------------------------------------
  // State
  // ------------------------------------------------------------
  const state = {
    noCount: 0,
    sessionId: makeSessionId(),
    pending: [],       // rows waiting to be flushed to Supabase
    synced: 0,
    failed: 0,
  };

  // ------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const screens = {
    question: $("#screen-question"),
    reason: $("#screen-reason"),
    thanks: $("#screen-thanks"),
  };
  const btnYes = $("#btn-yes");
  const btnNo = $("#btn-no");
  const subtitle = $("#subtitle");
  const heroEmoji = $("#hero-emoji");
  const counter = $("#counter");
  const form = $("#reason-form");
  const btnSubmit = $("#btn-submit");
  const reasonError = $("#reason-error");
  const messageInput = $("#custom-message");
  const charCount = $("#char-count");
  const thanksMessage = $("#thanks-message");
  const receipt = $("#receipt");
  const syncStatus = $("#sync-status");

  // ------------------------------------------------------------
  // Supabase
  // ------------------------------------------------------------
  const cfg = window.SUPABASE_CONFIG || {};
  const supabaseConfigured =
    typeof window.supabase !== "undefined" &&
    cfg.url && cfg.anonKey &&
    !cfg.url.startsWith("YOUR_") && !cfg.anonKey.startsWith("YOUR_");

  const client = supabaseConfigured
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null;

  if (!supabaseConfigured) {
    console.warn(
      "[proposal] Supabase not configured. Fill in supabase-config.js. " +
      "Responses will be logged to the console instead."
    );
  }

  async function record(eventType, extra = {}) {
    const row = {
      session_id: state.sessionId,
      event_type: eventType,
      attempt_number: state.noCount,
      button_label: extra.buttonLabel ?? null,
      reason: extra.reason ?? null,
      message: extra.message ?? null,
      user_agent: navigator.userAgent,
    };

    if (!client) {
      console.log("[proposal] would insert:", row);
      return { ok: true, offline: true };
    }

    try {
      const { error } = await client.from(cfg.table || "proposal_responses").insert(row);
      if (error) throw error;
      state.synced += 1;
      return { ok: true };
    } catch (err) {
      state.failed += 1;
      console.error("[proposal] Supabase insert failed:", err);
      return { ok: false, error: err };
    }
  }

  // ------------------------------------------------------------
  // Screen 1: Will you marry me?
  // ------------------------------------------------------------
  function pick(arr, i) {
    return arr[Math.min(i, arr.length - 1)];
  }

  function growYes() {
    // Grow with each refusal, but size against the actual screen so the
    // word "Yes" never wraps or overflows on any device.
    const n = state.noCount;
    const screenW = btnYes.closest(".screen").clientWidth;
    const screenH = btnYes.closest(".screen").clientHeight;

    // "Yes 💖" is roughly 3.3em wide; leave room for padding.
    const maxFont = Math.floor((screenW - 48 - 32) / 3.3);
    const fontSize = Math.min(18 + n * 6, maxFont);
    const padY = Math.min(14 + n * 6, Math.floor(screenH * 0.22));
    const padX = n >= 6 ? 16 : Math.min(40 + n * 10, 80);

    btnYes.style.fontSize = fontSize + "px";
    btnYes.style.padding = `${padY}px ${padX}px`;

    if (n >= 6) {
      btnYes.style.width = "100%";
      btnYes.style.borderRadius = "32px";
    }
  }

  function shrinkNo() {
    const n = state.noCount;
    const fontSize = Math.max(16 - n * 0.6, 9);
    const padY = Math.max(12 - n * 0.5, 5);
    const padX = Math.max(32 - n, 12);
    btnNo.style.fontSize = fontSize + "px";
    btnNo.style.padding = `${padY}px ${padX}px`;
    btnNo.style.opacity = String(Math.max(1 - n * 0.03, 0.55));
  }

  function updateCounter() {
    if (state.noCount === 0) {
      counter.textContent = "";
    } else if (state.noCount === 1) {
      counter.textContent = "Refusals so far: 1. Noted.";
    } else {
      counter.textContent = `Refusals so far: ${state.noCount}. All recorded.`;
    }
  }

  btnNo.addEventListener("click", () => {
    const label = btnNo.textContent;
    state.noCount += 1;

    btnNo.textContent = pick(NO_LABELS, state.noCount);
    subtitle.textContent = pick(SUBTITLES, state.noCount);
    heroEmoji.textContent = pick(HERO_EMOJIS, state.noCount);

    growYes();
    shrinkNo();
    updateCounter();

    screens.question.classList.remove("shake");
    // force reflow so the animation replays
    void screens.question.offsetWidth;
    screens.question.classList.add("shake");

    record("no", { buttonLabel: label });
  });

  btnYes.addEventListener("click", () => {
    record("yes", { buttonLabel: btnYes.textContent });
    showScreen("reason");
  });

  // ------------------------------------------------------------
  // Screen 2: Reason
  // ------------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const chosen = form.querySelector('input[name="reason"]:checked');
    if (!chosen) {
      reasonError.hidden = false;
      return;
    }
    reasonError.hidden = true;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Processing your feelings...";

    const message = messageInput.value.trim() || null;
    const result = await record("reason", { reason: chosen.value, message });

    renderThanks(chosen.value, message, result);
    showScreen("thanks");
    launchConfetti();
  });

  // ------------------------------------------------------------
  // Screen 3: Thank you
  // ------------------------------------------------------------
  messageInput.addEventListener("input", () => {
    charCount.textContent = `${messageInput.value.length} / ${messageInput.maxLength}`;
  });

  function renderThanks(reason, message, result) {
    const n = state.noCount;
    let line;
    if (n === 0) line = THANKS_LINES[0](n);
    else if (n === 1) line = THANKS_LINES[1](n);
    else if (n <= 4) line = THANKS_LINES[2](n);
    else if (n <= 9) line = THANKS_LINES[3](n);
    else if (n <= 14) line = THANKS_LINES[4](n);
    else line = THANKS_LINES[5](n);
    thanksMessage.textContent = line;

    receipt.innerHTML = `
      <div>APPLICATION #${state.sessionId.slice(-6).toUpperCase()}</div>
      <div>Status: <strong>APPROVED</strong></div>
      <div>Times you said no: <strong>${n}</strong></div>
      <div>Times you said yes: <strong>1</strong> (the one that counts)</div>
      <div>Stated reason: <strong>${escapeHtml(reason)}</strong></div>
      ${message ? `<div>In their own words: <strong>"${escapeHtml(message)}"</strong></div>` : ""}
      <div>Refund policy: <strong>none</strong></div>
    `;

    if (!supabaseConfigured) {
      syncStatus.textContent = "Supabase not configured. Responses logged to the browser console only.";
    } else if (result.ok && state.failed === 0) {
      syncStatus.textContent = "All responses saved. There is no escaping the database.";
    } else {
      syncStatus.textContent = "Some responses could not be saved. The proposal still stands.";
    }
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function makeSessionId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ------------------------------------------------------------
  // Confetti (tiny, dependency-free)
  // ------------------------------------------------------------
  function launchConfetti() {
    const canvas = document.getElementById("confetti");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const colors = ["#ff5c8a", "#ffd166", "#06d6a0", "#118ab2", "#ef476f", "#ffffff"];
    const pieces = Array.from({ length: 160 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const start = performance.now();
    function frame(now) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < window.innerHeight + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive && now - start < 6000) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    requestAnimationFrame(frame);
  }
})();
