/**
 * Celebration module — confetti + dancing chicken nugget mascot + popup.
 * Call showCelebration(sectionName) when a user gets 100% on a review quiz.
 * Pure client-side, no dependencies. Self-contained.
 */

let isShowing = false;

export function showCelebration(sectionName: string, isReview = false) {
  if (isShowing) return;
  isShowing = true;

  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "celeb-overlay";

  // Confetti canvas
  const canvas = document.createElement("canvas");
  canvas.className = "celeb-confetti";
  overlay.appendChild(canvas);

  // Modal
  const modal = document.createElement("div");
  modal.className = "celeb-modal";

  // Dancing mascot
  const mascot = document.createElement("div");
  mascot.className = "celeb-mascot";
  mascot.textContent = "🍗";
  modal.appendChild(mascot);

  // Title
  const title = document.createElement("h2");
  title.className = "celeb-title";
  title.textContent = isReview ? "Section Complete!" : "Perfect Score!";
  modal.appendChild(title);

  // Message
  const msg = document.createElement("p");
  msg.className = "celeb-msg";
  msg.textContent = isReview
    ? `You aced the ${sectionName} review with a perfect score! Time to move on to the next adventure.`
    : `You nailed every single question! Keep that momentum going.`;
  modal.appendChild(msg);

  // Close button
  const btn = document.createElement("button");
  btn.className = "celeb-btn";
  btn.textContent = "Keep Going!";
  btn.addEventListener("click", () => close());
  modal.appendChild(btn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add("celeb-active");
  });

  // Start confetti
  const stopConfetti = startConfetti(canvas);

  // Close on overlay click (outside modal)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  // Close on Escape
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);

  function close() {
    overlay.classList.remove("celeb-active");
    document.removeEventListener("keydown", onKey);
    stopConfetti();
    setTimeout(() => {
      overlay.remove();
      isShowing = false;
    }, 300);
  }
}

/** Confetti particle system on a canvas */
function startConfetti(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;
  let running = true;
  let particles: Particle[] = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotSpeed: number;
    life: number;
  }

  const colors = [
    "#58a6ff",
    "#7ee787",
    "#f0883e",
    "#d2a8ff",
    "#f47067",
    "#ffd700",
    "#ff69b4",
    "#00ced1",
  ];

  // Burst of particles
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width * (0.3 + Math.random() * 0.4),
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }

  function animate() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.vy += 0.15; // gravity
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life -= 0.005;

      if (p.life <= 0 || p.y > canvas.height + 20) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }
  animate();

  // Continuous gentle rain after burst
  const interval = setInterval(() => {
    if (!running) return;
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 1,
      });
    }
  }, 100);

  return () => {
    running = false;
    clearInterval(interval);
    window.removeEventListener("resize", resize);
  };
}
