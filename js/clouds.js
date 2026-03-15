/* ============================================
   CLOUD CANVAS ANIMATION
   Painterly cloud effect inspired by omswami.com
   ============================================ */

class CloudAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.clouds = [];
    this.animating = true;
    this.opacity = 1;
    this.dispersing = false;
    this.disperseProgress = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cx = this.canvas.width / 2;
    this.cy = this.canvas.height / 2;
  }

  init() {
    this.clouds = [];
    const colors = [
      { r: 180, g: 140, b: 90 },   // warm ochre
      { r: 200, g: 160, b: 110 },   // light ochre
      { r: 190, g: 120, b: 70 },    // orange-brown
      { r: 170, g: 100, b: 60 },    // deep orange
      { r: 220, g: 190, b: 140 },   // cream
      { r: 160, g: 110, b: 70 },    // dark warm
      { r: 200, g: 140, b: 80 },    // amber
    ];

    // Create cloud clusters around edges
    const positions = [
      // Top clouds
      { x: 0.15, y: 0.1, size: 1.3 },
      { x: 0.35, y: 0.05, size: 1.1 },
      { x: 0.55, y: 0.08, size: 1.0 },
      { x: 0.8, y: 0.1, size: 1.2 },
      // Left clouds
      { x: 0.05, y: 0.35, size: 1.4 },
      { x: 0.08, y: 0.6, size: 1.2 },
      // Right clouds
      { x: 0.9, y: 0.3, size: 1.3 },
      { x: 0.92, y: 0.55, size: 1.5 },
      { x: 0.85, y: 0.75, size: 1.1 },
      // Bottom clouds
      { x: 0.2, y: 0.85, size: 1.2 },
      { x: 0.45, y: 0.9, size: 1.4 },
      { x: 0.65, y: 0.85, size: 1.1 },
      { x: 0.85, y: 0.9, size: 1.3 },
      // Corner fills
      { x: 0.0, y: 0.0, size: 1.6 },
      { x: 1.0, y: 0.0, size: 1.5 },
      { x: 0.0, y: 1.0, size: 1.5 },
      { x: 1.0, y: 1.0, size: 1.6 },
    ];

    positions.forEach(pos => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const baseSize = Math.min(this.canvas.width, this.canvas.height) * 0.25 * pos.size;

      // Each "cloud" is a cluster of soft circles
      for (let j = 0; j < 8; j++) {
        this.clouds.push({
          x: pos.x * this.canvas.width + (Math.random() - 0.5) * baseSize * 0.6,
          y: pos.y * this.canvas.height + (Math.random() - 0.5) * baseSize * 0.6,
          baseX: pos.x * this.canvas.width + (Math.random() - 0.5) * baseSize * 0.6,
          baseY: pos.y * this.canvas.height + (Math.random() - 0.5) * baseSize * 0.6,
          radius: baseSize * (0.4 + Math.random() * 0.6),
          color: { ...color },
          alpha: 0.5 + Math.random() * 0.4,
          drift: {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.2,
          },
          phase: Math.random() * Math.PI * 2,
          speed: 0.002 + Math.random() * 0.003,
          // Disperse direction (away from center)
          disperseAngle: Math.atan2(
            pos.y * this.canvas.height - this.cy,
            pos.x * this.canvas.width - this.cx
          ),
          disperseSpeed: 2 + Math.random() * 4,
        });
      }
    });
  }

  draw(time) {
    if (!this.animating) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dark background in center
    this.ctx.fillStyle = `rgba(30, 28, 25, ${this.opacity})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.clouds.forEach(cloud => {
      let x = cloud.baseX + Math.sin(time * cloud.speed + cloud.phase) * 15;
      let y = cloud.baseY + Math.cos(time * cloud.speed * 0.7 + cloud.phase) * 10;

      // Apply disperse
      if (this.dispersing) {
        const disperseDist = this.disperseProgress * cloud.disperseSpeed * 200;
        x += Math.cos(cloud.disperseAngle) * disperseDist;
        y += Math.sin(cloud.disperseAngle) * disperseDist;
      }

      cloud.x = x;
      cloud.y = y;

      const alpha = cloud.alpha * (1 - this.disperseProgress * 0.8) * this.opacity;
      if (alpha <= 0) return;

      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, cloud.radius);
      gradient.addColorStop(0, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, 0)`);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();

      // Draw soft blobby cloud shape
      const points = 8;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wobble = 1 + Math.sin(angle * 3 + time * 0.001) * 0.15;
        const px = x + Math.cos(angle) * cloud.radius * wobble;
        const py = y + Math.sin(angle) * cloud.radius * wobble;
        if (i === 0) {
          this.ctx.moveTo(px, py);
        } else {
          const prevAngle = ((i - 1) / points) * Math.PI * 2;
          const cpAngle = (angle + prevAngle) / 2;
          const cpWobble = 1 + Math.sin(cpAngle * 3 + time * 0.001) * 0.15;
          const cpx = x + Math.cos(cpAngle) * cloud.radius * cpWobble * 1.1;
          const cpy = y + Math.sin(cpAngle) * cloud.radius * cpWobble * 1.1;
          this.ctx.quadraticCurveTo(cpx, cpy, px, py);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
    });

    if (this.animating) {
      requestAnimationFrame((t) => this.draw(t));
    }
  }

  start() {
    this.init();
    this.animating = true;
    this.canvas.classList.add('active');
    requestAnimationFrame((t) => this.draw(t));
  }

  disperse(callback) {
    this.dispersing = true;
    const startTime = performance.now();
    const duration = 1800;

    const animate = (now) => {
      this.disperseProgress = Math.min((now - startTime) / duration, 1);

      // Ease out
      this.disperseProgress = 1 - Math.pow(1 - this.disperseProgress, 3);

      if (this.disperseProgress >= 0.7) {
        this.opacity = 1 - ((this.disperseProgress - 0.7) / 0.3);
      }

      if (this.disperseProgress >= 1) {
        this.animating = false;
        this.canvas.classList.remove('active');
        this.canvas.classList.add('fade-out');
        if (callback) setTimeout(callback, 300);
        return;
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // For page transitions
  converge(callback) {
    this.dispersing = false;
    this.disperseProgress = 0;
    this.opacity = 0;
    this.animating = true;
    this.canvas.classList.remove('fade-out');
    this.canvas.classList.add('active');
    this.init();

    const startTime = performance.now();
    const duration = 1200;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      this.opacity = Math.pow(progress, 2);

      if (progress >= 1) {
        this.opacity = 1;
        if (callback) callback();
        return;
      }
      requestAnimationFrame(animate);
    };

    requestAnimationFrame((t) => this.draw(t));
    requestAnimationFrame(animate);
  }
}

window.CloudAnimation = CloudAnimation;
