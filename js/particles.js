// Particle & Visual Effects Engine for Monster Brawl
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.shockwaves = [];
  }

  reset() {
    this.particles = [];
    this.texts = [];
    this.shockwaves = [];
  }

  // Spawn Hit Sparks
  createHitSparks(x, y, count = 15, color = '#ffdd44', spread = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * spread + 2;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03,
        trail: []
      });
    }
  }

  // Spawn Expanding Shockwave Ring
  createShockwave(x, y, maxRadius = 60, color = '#ffffff', width = 4) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      width,
      color,
      life: 1.0,
      growth: maxRadius / 15
    });
  }

  // Floating Combat Damage Text & Combo Callouts
  addFloatingText(x, y, text, type = 'normal') {
    let color = '#ffffff';
    let size = 22;
    let prefix = '';

    if (type === 'crit') {
      color = '#ffcc00';
      size = 32;
      prefix = 'CRIT ';
    } else if (type === 'super') {
      color = '#ff0055';
      size = 38;
      prefix = 'ULTRA! ';
    } else if (type === 'block') {
      color = '#44ccff';
      size = 18;
    } else if (type === 'parry') {
      color = '#00ffcc';
      size = 28;
      prefix = 'PARRY! ';
    } else if (type === 'combo') {
      color = '#ff8800';
      size = 26;
    }

    this.texts.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      vy: -3.5,
      text: prefix + text,
      color,
      size,
      scale: 1.4,
      life: 1.0,
      decay: 0.02
    });
  }

  // Fire Trail Embers
  createFireEmber(x, y, color = '#ff5500') {
    this.particles.push({
      type: 'ember',
      x: x + (Math.random() * 14 - 7),
      y: y + (Math.random() * 14 - 7),
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 2.5 - 0.5,
      size: Math.random() * 4 + 2,
      color,
      life: 1.0,
      decay: Math.random() * 0.03 + 0.02
    });
  }

  // Ground Dust Cloud (when landing or dashing)
  createDust(x, y, dir = 1) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 6 - 3),
        vx: -dir * (Math.random() * 2 + 1),
        vy: -Math.random() * 1.2,
        size: Math.random() * 8 + 6,
        color: 'rgba(180, 180, 190, 0.4)',
        life: 1.0,
        decay: 0.04
      });
    }
  }

  // Electric Arcs
  createLightning(x1, y1, x2, y2, color = '#00f0ff') {
    this.particles.push({
      type: 'lightning',
      x1, y1, x2, y2,
      color,
      life: 1.0,
      decay: 0.12,
      points: this.generateLightningPath(x1, y1, x2, y2)
    });
  }

  generateLightningPath(x1, y1, x2, y2) {
    const points = [{ x: x1, y: y1 }];
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 25;
      const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 25;
      points.push({ x: nx, y: ny });
    }
    points.push({ x: x2, y: y2 });
    return points;
  }

  update(dt = 1) {
    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type === 'spark') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.2 * dt; // gravity
        p.vx *= 0.94;
      } else if (p.type === 'ember') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.size *= 0.98;
      } else if (p.type === 'dust') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.size += 0.3 * dt;
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.growth * dt;
      sw.life -= (1 / 15) * dt;
      if (sw.life <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.vy *= 0.92;
      if (t.scale > 1.0) t.scale = Math.max(1.0, t.scale - 0.05 * dt);
      t.life -= t.decay * dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Draw Shockwaves
    for (const sw of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.width * sw.life;
      ctx.globalAlpha = Math.max(0, sw.life * 0.8);
      ctx.stroke();
    }

    // 2. Draw Particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ember') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'lightning') {
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < p.points.length; i++) {
          if (i === 0) ctx.moveTo(p.points[i].x, p.points[i].y);
          else ctx.lineTo(p.points[i].x, p.points[i].y);
        }
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;

    // 3. Draw Floating Texts
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      ctx.font = `900 ${t.size}px 'Rajdhani', 'Russo One', sans-serif`;
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, 0, 0);

      // Fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();
