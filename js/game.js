// Main Monster Brawl Engine
class Fighter {
  constructor(monsterId, isPlayer1, game) {
    this.game = game;
    this.monsterId = monsterId;
    this.data = window.MONSTERS_DATA[monsterId];
    this.isP1 = isPlayer1;

    // Dimensions & Position
    this.width = this.data.width;
    this.height = this.data.height;
    this.groundY = 350; // Raised stage floor level so feet are clearly visible
    this.x = isPlayer1 ? 260 : 700;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.facing = isPlayer1 ? 1 : -1;

    // Combat Stats
    this.maxHp = this.data.hp;
    this.hp = this.maxHp;
    this.redHp = this.maxHp; // Trailing health for damage visual
    this.energy = 20; // 0 to 100
    this.maxEnergy = 100;
    this.speed = (this.data.spd / 100) * 6.5;

    // States
    this.state = 'idle'; // idle, walk, jump, crouch, guard, attack, special, ult, hitstun, knockdown, ko
    this.isGrounded = true;
    this.isGuarding = false;
    this.isParrying = false;
    this.parryWindow = 0;
    this.canDoubleJump = true;

    // Attack details
    this.attackType = null; // atk1, atk2, sp1, sp2, ult
    this.attackTimer = 0;
    this.attackDuration = 0;
    this.attackProgress = 0;
    this.isHitboxActive = false;
    this.hasHitOpponent = false;

    // Hit reaction
    this.hitStunTimer = 0;
    this.hitFlashTimer = 0;
    this.comboCount = 0;
    this.lastHitTime = 0;
    this.invulnerableTimer = 0;
    this.deadTimer = 0;

    // Visuals & Animation
    this.animTimer = 0;
  }

  reset(x, facing) {
    this.x = x;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.maxHp;
    this.redHp = this.maxHp;
    this.energy = 30;
    this.state = 'idle';
    this.isGrounded = true;
    this.isGuarding = false;
    this.attackType = null;
    this.attackTimer = 0;
    this.isHitboxActive = false;
    this.hitStunTimer = 0;
    this.hitFlashTimer = 0;
    this.invulnerableTimer = 0;
    this.deadTimer = 0;
    this.comboCount = 0;
  }

  update(dt, opponent) {
    this.animTimer += 0.05 * dt;

    // Handle Trailing Red HP reduction
    if (this.redHp > this.hp) {
      this.redHp = Math.max(this.hp, this.redHp - 1.8 * dt);
    }

    // Decay Timers
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.parryWindow > 0) this.parryWindow -= dt;

    // Combo reset if too long without hit
    if (Date.now() - this.lastHitTime > 2000 && this.comboCount > 0) {
      this.comboCount = 0;
    }

    // Death state
    if (this.hp <= 0) {
      this.state = 'ko';
      this.deadTimer += dt;
      return;
    }

    // Handle Hit-Stun
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      this.x += this.vx * dt;
      this.vx *= 0.88;
      if (this.hitStunTimer <= 0) {
        this.state = this.isGrounded ? 'idle' : 'jump';
      }
      this.applyPhysics(dt);
      return;
    }

    // Auto-Face opponent if not in locked action
    if (this.state !== 'attack' && this.state !== 'special' && this.state !== 'ult' && this.state !== 'guard') {
      if (this.x < opponent.x - 20) this.facing = 1;
      else if (this.x > opponent.x + 20) this.facing = -1;
    }

    // Handle Active Attacks
    if (this.state === 'attack' || this.state === 'special' || this.state === 'ult') {
      this.updateAttack(dt, opponent);
    } else {
      // Normal Movement
      this.x += this.vx * dt;
    }

    // Physics (Gravity & Floor)
    this.applyPhysics(dt);

    // Arena Boundaries
    const minX = 80;
    const maxX = 880;
    if (this.x < minX) this.x = minX;
    if (this.x > maxX) this.x = maxX;
  }

  applyPhysics(dt) {
    // Gravity (tuned for high soaring Kaiju jumps)
    if (!this.isGrounded) {
      this.vy += 0.82 * dt;
      this.y += this.vy * dt;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.isGrounded = true;
        this.canDoubleJump = true;
        window.particleSystem.createDust(this.x, this.y + 85, this.facing);
        if (this.state === 'jump') this.state = 'idle';
      }
    }
  }

  // --- Actions ---

  move(dir) {
    if (this.state === 'attack' || this.state === 'special' || this.state === 'ult' || this.state === 'hitstun' || this.state === 'guard') return;
    this.vx = dir * this.speed;
    if (this.isGrounded) {
      this.state = dir === 0 ? 'idle' : 'walk';
    }
  }

  jump() {
    if (this.state === 'attack' || this.state === 'special' || this.state === 'ult' || this.state === 'hitstun' || this.state === 'guard') return;
    if (this.isGrounded) {
      this.vy = -21.0; // High soaring leap to easily clear over missiles
      this.isGrounded = false;
      this.state = 'jump';
      window.soundEngine.playJump();
      window.particleSystem.createDust(this.x, this.y + 85, this.facing);
    } else if (this.canDoubleJump) {
      this.vy = -18.0; // Powerful air double jump
      this.canDoubleJump = false;
      window.soundEngine.playJump();
      window.particleSystem.createShockwave(this.x, this.y + 50, 40, '#00f7ff', 2);
    }
  }

  crouch(isCrouching) {
    if (this.state === 'attack' || this.state === 'special' || this.state === 'ult' || this.state === 'hitstun') return;
    if (isCrouching && this.isGrounded) {
      this.state = 'crouch';
      this.vx = 0;
    } else if (this.state === 'crouch') {
      this.state = 'idle';
    }
  }

  guard(isGuarding) {
    if (this.state === 'attack' || this.state === 'special' || this.state === 'ult' || this.state === 'hitstun') return;
    if (isGuarding && !this.isGuarding) {
      this.isGuarding = true;
      this.parryWindow = 12; // 12 frames parry window
      this.state = 'guard';
      this.vx = 0;
    } else if (!isGuarding) {
      this.isGuarding = false;
      if (this.state === 'guard') this.state = 'idle';
    }
  }

  dash(dir = null) {
    if (this.state === 'attack' || this.state === 'special' || this.state === 'ult' || this.state === 'hitstun') return;
    const dashDir = dir || this.facing;
    this.vx = dashDir * (this.speed * 2.5);
    this.invulnerableTimer = 14;
    window.soundEngine.playDash();
    window.particleSystem.createDust(this.x, this.y + 60, dashDir);
  }

  // --- Attacks ---

  startAttack(type) {
    if (this.state === 'attack' || this.state === 'special' || this.state === 'ult' || this.state === 'hitstun') return false;

    // Check Energy requirement
    if (type === 'sp1' && this.energy < 25) return false;
    if (type === 'sp2' && this.energy < 35) return false;
    if (type === 'ult' && this.energy < 100) return false;

    this.attackType = type;
    this.attackTimer = 0;
    this.hasHitOpponent = false;
    this.isHitboxActive = false;

    if (type === 'atk1') {
      // Light attack: fast, combo starter
      this.state = 'attack';
      this.attackDuration = 18;
      this.vx = this.facing * 1.5;
      window.soundEngine.playHitLight();
    } else if (type === 'atk2') {
      // Heavy attack: high knockback
      this.state = 'attack';
      this.attackDuration = 28;
      this.vx = this.facing * 2.5;
      window.soundEngine.playRoar();
    } else if (type === 'sp1') {
      // Special 1: Projectile Attack
      this.state = 'special';
      this.attackDuration = 32;
      this.energy -= 25;
      this.vx = 0;
      this.launchProjectile();
    } else if (type === 'sp2') {
      // Special 2: Rushing Gap Closer
      this.state = 'special';
      this.attackDuration = 30;
      this.energy -= 35;
      this.vx = this.facing * 12; // High speed rush
      window.soundEngine.playDash();
      window.particleSystem.createShockwave(this.x, this.y, 60, this.data.colorTheme, 3);
    } else if (type === 'ult') {
      // Ultimate EX: Epic Screen Freeze & Devastating Burst
      this.state = 'ult';
      this.attackDuration = 70;
      this.energy = 0;
      this.vx = 0;
      this.game.triggerCinematicEX(this);
    }

    return true;
  }

  launchProjectile() {
    const startX = this.x + this.facing * 60;
    // Lowered flight trajectory to hip/knee level (y + 15) so jumping over is clean and reliable
    const startY = this.y + 15;

    let projType = 'fireball';
    let speed = 9;
    let damage = 85;
    let color = '#ff5500';

    if (this.monsterId === 'pyrorex') {
      projType = 'fireball';
      speed = 8.5;
      damage = 100;
      color = '#ff4400';
      window.soundEngine.playFireball();
    } else if (this.monsterId === 'mecha') {
      projType = 'rocket';
      speed = 10.0;
      damage = 110;
      color = '#00f7ff';
      window.soundEngine.playLaser();
    } else if (this.monsterId === 'viper') {
      projType = 'venom';
      speed = 7.5;
      damage = 95;
      color = '#c084fc';
      window.soundEngine.playFireball();
    } else if (this.monsterId === 'voltgor') {
      projType = 'lightning_orb';
      speed = 10.5;
      damage = 105;
      color = '#fde047';
      window.soundEngine.playElectricity();
    }

    this.game.spawnProjectile({
      owner: this,
      x: startX,
      y: startY,
      vx: this.facing * speed,
      vy: 0,
      radius: 14,
      type: projType,
      color,
      damage,
      life: 90
    });
  }

  updateAttack(dt, opponent) {
    this.attackTimer += dt;
    this.attackProgress = this.attackTimer / this.attackDuration;

    // Active Hitbox Timing Windows
    let activeStart = 0.25;
    let activeEnd = 0.65;
    if (this.attackType === 'atk1') {
      activeStart = 0.15;
      activeEnd = 0.55;
    } else if (this.attackType === 'atk2') {
      activeStart = 0.35;
      activeEnd = 0.75;
    } else if (this.attackType === 'sp2') {
      activeStart = 0.15;
      activeEnd = 0.8;
      // Spawn trail particles during rush
      window.particleSystem.createFireEmber(this.x, this.y + 20, this.data.colorTheme);
    } else if (this.attackType === 'ult') {
      activeStart = 0.4;
      activeEnd = 0.9;
    }

    this.isHitboxActive = (this.attackProgress >= activeStart && this.attackProgress <= activeEnd);

    // Check Melee Hit Collision
    if (this.isHitboxActive && !this.hasHitOpponent) {
      const hb = this.getCurrentHitbox();
      const oppHurt = opponent.getHurtbox();

      if (this.game.checkAABB(hb, oppHurt)) {
        this.hasHitOpponent = true;
        this.applyMeleeHit(opponent);
      }
    }

    // End Attack
    if (this.attackTimer >= this.attackDuration) {
      this.state = this.isGrounded ? 'idle' : 'jump';
      this.attackType = null;
      this.isHitboxActive = false;
      this.hasHitOpponent = false;
    }
  }

  applyMeleeHit(opponent) {
    let baseDamage = 40;
    let knockbackX = 6;
    let knockbackY = -4;
    let hitType = 'normal';

    if (this.attackType === 'atk1') {
      baseDamage = 50 * (this.data.atk / 100);
      knockbackX = 4;
      knockbackY = -2;
      this.energy = Math.min(this.maxEnergy, this.energy + 12);
    } else if (this.attackType === 'atk2') {
      baseDamage = 95 * (this.data.atk / 100);
      knockbackX = 11;
      knockbackY = -6;
      hitType = 'crit';
      this.energy = Math.min(this.maxEnergy, this.energy + 18);
    } else if (this.attackType === 'sp2') {
      baseDamage = 130 * (this.data.atk / 100);
      knockbackX = 14;
      knockbackY = -7;
      hitType = 'crit';
    } else if (this.attackType === 'ult') {
      baseDamage = 320 * (this.data.atk / 100);
      knockbackX = 18;
      knockbackY = -10;
      hitType = 'super';
    }

    opponent.takeDamage(baseDamage, knockbackX * this.facing, knockbackY, hitType, this);
    this.comboCount++;
    this.lastHitTime = Date.now();
  }

  takeDamage(amount, kx, ky, hitType, attacker) {
    if (this.invulnerableTimer > 0 || this.hp <= 0) return;

    // Check Guard & Parry
    if (this.isGuarding) {
      if (this.parryWindow > 0) {
        // PERFECT PARRY!
        window.soundEngine.playParry();
        window.particleSystem.addFloatingText(this.x, this.y - 40, 'PERFECT PARRY!', 'parry');
        window.particleSystem.createShockwave(this.x, this.y, 80, '#00ffff', 4);
        this.energy = Math.min(this.maxEnergy, this.energy + 25);
        this.game.triggerHitStop(120);

        // Counter stun attacker
        if (attacker) {
          attacker.hitStunTimer = 25;
          attacker.vx = -attacker.facing * 8;
        }
        return;
      } else {
        // Normal Block (mitigates 75% damage, zero knockback)
        const chipDamage = amount * 0.25;
        this.hp = Math.max(0, this.hp - chipDamage);
        this.energy = Math.min(this.maxEnergy, this.energy + 6);
        window.soundEngine.playBlock();
        window.particleSystem.addFloatingText(this.x, this.y - 30, `BLOCK -${Math.round(chipDamage)}`, 'block');
        window.particleSystem.createHitSparks(this.x + this.facing * 30, this.y, 8, '#44ccff', 3);
        return;
      }
    }

    // Normal Full Damage Take
    const defenseReduction = this.data.def / 200; // e.g. def 80 -> 40% reduction
    const finalDamage = Math.max(10, Math.round(amount * (1 - defenseReduction * 0.5)));

    this.hp = Math.max(0, this.hp - finalDamage);
    this.hitStunTimer = hitType === 'super' ? 40 : 16;
    this.hitFlashTimer = 6;
    this.vx = kx;
    this.vy = ky;
    this.isGrounded = false;
    this.state = 'hitstun';

    // Build energy on taking hits
    this.energy = Math.min(this.maxEnergy, this.energy + Math.round(finalDamage * 0.15));

    // Juice & Effects
    if (hitType === 'super' || hitType === 'crit') {
      window.soundEngine.playHitHeavy();
      this.game.triggerScreenShake(14, 25);
      this.game.triggerHitStop(70);
    } else {
      window.soundEngine.playHitLight();
      this.game.triggerScreenShake(5, 12);
      this.game.triggerHitStop(35);
    }

    window.particleSystem.createHitSparks(this.x, this.y - 10, 20, attacker ? attacker.data.colorTheme : '#ffcc00', 7);
    window.particleSystem.createShockwave(this.x, this.y - 10, 50, '#ffffff', 3);
    window.particleSystem.addFloatingText(this.x, this.y - 40, `-${finalDamage}`, hitType);

    if (attacker && attacker.comboCount > 1) {
      window.particleSystem.addFloatingText(attacker.x, attacker.y - 70, `${attacker.comboCount} COMBO!`, 'combo');
    }

    // Check K.O.
    if (this.hp <= 0) {
      this.game.handleKO(attacker, this);
    }
  }

  getCurrentHitbox() {
    const range = this.attackType === 'atk2' ? 95 : 65;
    const boxWidth = this.attackType === 'sp2' ? 110 : range;
    return {
      x: this.facing === 1 ? this.x + 10 : this.x - 10 - boxWidth,
      y: this.y - 60,
      w: boxWidth,
      h: 80
    };
  }

  getHurtbox() {
    let h = this.height;
    let offsetY = 20;

    if (this.state === 'crouch') {
      h = this.height * 0.6;
      offsetY = 0;
    } else if (!this.isGrounded) {
      // Airborne tuck: pulls up lower hurtbox so jumping cleanly clears low projectiles!
      h = this.height * 0.65;
      offsetY = 35;
    }

    return {
      x: this.x - (this.width * 0.8) / 2,
      y: this.y - h / 2 - offsetY,
      w: this.width * 0.8,
      h: h
    };
  }
}

// Full Combat Game Manager
class MonsterBattleGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.mode = 'arcade'; // arcade, pvp, training
    this.state = 'MENU'; // MENU, SELECT, FIGHT, CINEMATIC, GAMEOVER, VICTORY
    this.stage = 1; // 1, 2, 3
    this.maxStages = 3;

    // Fighters
    this.p1 = null;
    this.p2 = null; // Can be AI or local P2
    this.p1Choice = 'pyrorex';
    this.p2Choice = 'mecha';

    // Game loop & timing
    this.lastTime = 0;
    this.roundTime = 99;
    this.roundTimerInterval = null;
    this.isPaused = false;
    this.hitStopTimer = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Projectiles
    this.projectiles = [];

    // Stages & Backgrounds
    this.stageBgCity = new Image();
    this.stageBgCity.src = 'assets/arena_city.jpg';
    this.stageBgVolcano = new Image();
    this.stageBgVolcano.src = 'assets/arena_volcano.jpg';

    // Inputs
    this.keys = {};
    this.setupInputs();

    // AI logic
    this.aiTimer = 0;
    this.aiDifficulty = 'normal'; // normal, hard, boss

    // Debug
    this.debugHitboxes = false;
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Setup UI Buttons
    this.bindUI();

    // Start render loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    // Keep internal resolution 960 x 540 (16:9)
    this.canvas.width = 960;
    this.canvas.height = 540;
  }

  bindUI() {
    // Menu Mode Selection
    document.getElementById('btnModeArcade').addEventListener('click', () => {
      this.mode = 'arcade';
      window.soundEngine.playUISelect();
      this.goToSelect();
    });
    document.getElementById('btnModePVP').addEventListener('click', () => {
      this.mode = 'pvp';
      window.soundEngine.playUISelect();
      this.goToSelect();
    });
    document.getElementById('btnModeTraining').addEventListener('click', () => {
      this.mode = 'training';
      window.soundEngine.playUISelect();
      this.goToSelect();
    });

    // Audio & Settings
    document.getElementById('btnToggleSound').addEventListener('click', () => {
      const isMuted = !window.soundEngine.muted;
      window.soundEngine.setMute(isMuted);
      document.getElementById('btnToggleSound').innerText = isMuted ? '🔇 音效: 關閉' : '🔊 音效: 開啟';
    });

    // Character Selection Cards
    document.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.dataset.id;
        window.soundEngine.playUISelect();
        this.selectCharacter(id);
      });
    });

    // Confirm Selection & Start Battle
    document.getElementById('btnConfirmSelect').addEventListener('click', () => {
      window.soundEngine.playUISelect();
      this.startFight();
    });

    // Rematch / Next Stage
    document.getElementById('btnRematch').addEventListener('click', () => {
      window.soundEngine.playUISelect();
      this.startFight();
    });

    document.getElementById('btnReturnMenu').addEventListener('click', () => {
      window.soundEngine.playUISelect();
      this.goToMenu();
    });

    // Toggle Virtual On-Screen Controls
    const btnToggleVpad = document.getElementById('btnToggleVpad');
    const virtualControls = document.getElementById('virtualControls');
    if (btnToggleVpad && virtualControls) {
      btnToggleVpad.addEventListener('click', () => {
        virtualControls.classList.toggle('hidden-controls');
        const isHidden = virtualControls.classList.contains('hidden-controls');
        btnToggleVpad.innerText = isHidden ? '🎮 虛擬鍵盤: 關閉' : '🎮 虛擬鍵盤: 開啟';
      });
    }

    // Virtual Buttons (for touch / mouse clicking)
    this.setupVirtualControls();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Unlock Web Audio Context on first interaction
      window.soundEngine.ensureContext();

      // Prevent scrolling with arrows/space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Pause Game
      if (e.code === 'KeyP' && this.state === 'FIGHT') {
        this.isPaused = !this.isPaused;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupVirtualControls() {
    const bindTouch = (id, onDown, onUp) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); onDown(); });
      btn.addEventListener('mouseup', (e) => { e.preventDefault(); onUp(); });
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
    };

    bindTouch('vbtn-left', () => { if (this.p1) this.p1.move(-1); }, () => { if (this.p1 && this.p1.vx < 0) this.p1.move(0); });
    bindTouch('vbtn-right', () => { if (this.p1) this.p1.move(1); }, () => { if (this.p1 && this.p1.vx > 0) this.p1.move(0); });
    bindTouch('vbtn-up', () => { if (this.p1) this.p1.jump(); }, () => {});
    bindTouch('vbtn-down', () => { if (this.p1) this.p1.crouch(true); }, () => { if (this.p1) this.p1.crouch(false); });
    bindTouch('vbtn-atk1', () => { if (this.p1) this.p1.startAttack('atk1'); }, () => {});
    bindTouch('vbtn-atk2', () => { if (this.p1) this.p1.startAttack('atk2'); }, () => {});
    bindTouch('vbtn-sp1', () => { if (this.p1) this.p1.startAttack('sp1'); }, () => {});
    bindTouch('vbtn-sp2', () => { if (this.p1) this.p1.startAttack('sp2'); }, () => {});
    bindTouch('vbtn-guard', () => { if (this.p1) this.p1.guard(true); }, () => { if (this.p1) this.p1.guard(false); });
    bindTouch('vbtn-ult', () => { if (this.p1) this.p1.startAttack('ult'); }, () => {});
  }

  goToMenu() {
    this.state = 'MENU';
    window.soundEngine.stopBGM();
    document.getElementById('screenMenu').classList.remove('hidden');
    document.getElementById('screenSelect').classList.add('hidden');
    document.getElementById('screenHUD').classList.add('hidden');
    document.getElementById('screenVictory').classList.add('hidden');
  }

  goToSelect() {
    this.state = 'SELECT';
    document.getElementById('screenMenu').classList.add('hidden');
    document.getElementById('screenSelect').classList.remove('hidden');
    document.getElementById('screenHUD').classList.add('hidden');
    document.getElementById('screenVictory').classList.add('hidden');
    this.updateSelectPreview();
  }

  selectCharacter(id) {
    this.p1Choice = id;
    document.querySelectorAll('.char-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.id === id);
    });
    this.updateSelectPreview();
  }

  updateSelectPreview() {
    const data = window.MONSTERS_DATA[this.p1Choice];
    if (!data) return;

    document.getElementById('charPreviewName').innerText = data.name;
    document.getElementById('charPreviewType').innerText = data.type;
    document.getElementById('charPreviewDesc').innerText = data.desc;

    // Stat bars
    document.getElementById('statHp').style.width = `${(data.hp / 1200) * 100}%`;
    document.getElementById('statAtk').style.width = `${data.atk}%`;
    document.getElementById('statDef').style.width = `${data.def}%`;
    document.getElementById('statSpd').style.width = `${data.spd}%`;

    // Move names
    document.getElementById('moveSp1').innerText = data.special1Name;
    document.getElementById('moveSp2').innerText = data.special2Name;
    document.getElementById('moveUlt').innerText = data.ultName;

    // Monster preview avatar/image
    const imgElem = document.getElementById('charPreviewImg');
    if (data.avatar) {
      imgElem.src = data.avatar;
      imgElem.style.display = 'block';
    } else {
      imgElem.style.display = 'none';
    }
  }

  startFight() {
    this.state = 'FIGHT';
    document.getElementById('screenMenu').classList.add('hidden');
    document.getElementById('screenSelect').classList.add('hidden');
    document.getElementById('screenHUD').classList.remove('hidden');
    document.getElementById('screenVictory').classList.add('hidden');

    // Pick opponent
    if (this.mode === 'arcade') {
      const roster = Object.keys(window.MONSTERS_DATA).filter(id => id !== this.p1Choice);
      const enemyIndex = (this.stage - 1) % roster.length;
      this.p2Choice = roster[enemyIndex] || 'mecha';
      this.aiDifficulty = this.stage === 1 ? 'normal' : this.stage === 2 ? 'hard' : 'boss';
    } else if (this.mode === 'pvp') {
      // 2P can alternate or pick
      this.p2Choice = this.p2Choice || 'mecha';
    } else if (this.mode === 'training') {
      this.p2Choice = 'mecha';
      this.aiDifficulty = 'dummy';
    }

    // Instantiate Fighters
    this.p1 = new Fighter(this.p1Choice, true, this);
    this.p2 = new Fighter(this.p2Choice, false, this);

    this.projectiles = [];
    window.particleSystem.reset();

    // Round Timer
    this.roundTime = 99;
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);
    this.roundTimerInterval = setInterval(() => {
      if (this.state === 'FIGHT' && !this.isPaused && this.mode !== 'training') {
        this.roundTime--;
        document.getElementById('hudTimer').innerText = this.roundTime;
        if (this.roundTime <= 0) {
          this.handleTimeUp();
        }
      }
    }, 1000);

    // Update HUD Names and Avatars
    document.getElementById('p1Name').innerText = this.p1.data.name;
    document.getElementById('p2Name').innerText = this.p2.data.name + (this.mode === 'arcade' ? ` [STAGE ${this.stage}]` : '');

    // Announce Fight
    window.soundEngine.startBGM();
    this.showRoundBanner('ROUND 1', 'FIGHT!');
    window.soundEngine.announce('Round 1. Fight!');
  }

  showRoundBanner(title, subtitle) {
    const banner = document.getElementById('bannerRound');
    banner.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${subtitle}</div>`;
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
    }, 1800);
  }

  spawnProjectile(p) {
    this.projectiles.push(p);
  }

  triggerScreenShake(intensity = 10, duration = 15) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  triggerHitStop(ms = 50) {
    this.hitStopTimer = ms;
  }

  triggerCinematicEX(fighter) {
    window.soundEngine.playUltimate();
    this.triggerScreenShake(20, 45);

    // Announce EX Move
    window.soundEngine.announce('Ultra Move!');
    const banner = document.getElementById('bannerRound');
    banner.innerHTML = `<div class="banner-ex">⚡ EX BURST ⚡</div><div class="banner-ex-name">${fighter.data.ultName}</div>`;
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
    }, 1500);

    // Screen flash
    this.flashScreen = 15;

    // Trigger monster unique ultimate blast
    setTimeout(() => {
      if (!this.p1 || !this.p2) return;
      const opponent = fighter === this.p1 ? this.p2 : this.p1;

      if (fighter.monsterId === 'pyrorex') {
        // Cataclysm Flare - Raining Meteors across the stage
        for (let i = 0; i < 7; i++) {
          setTimeout(() => {
            const rx = 150 + Math.random() * 650;
            window.particleSystem.createShockwave(rx, 435, 90, '#ff3300', 6);
            window.particleSystem.createFireEmber(rx, 435, '#ffbb00');
            window.soundEngine.playExplosion();
            if (Math.abs(opponent.x - rx) < 95) {
              opponent.takeDamage(55, opponent.x > rx ? 8 : -8, -6, 'super', fighter);
            }
          }, i * 160);
        }
      } else if (fighter.monsterId === 'mecha') {
        // Laser Annihilation Cannon
        window.soundEngine.playLaser();
        window.particleSystem.createShockwave(fighter.x + fighter.facing * 80, fighter.y - 20, 120, '#00f7ff', 8);
        for (let step = 0; step < 6; step++) {
          setTimeout(() => {
            window.particleSystem.createHitSparks(opponent.x, opponent.y, 15, '#00f7ff', 8);
            opponent.takeDamage(48, fighter.facing * 5, -3, 'super', fighter);
          }, step * 100);
        }
      } else if (fighter.monsterId === 'viper') {
        // Void Singularity
        window.particleSystem.createShockwave(opponent.x, opponent.y, 100, '#a855f7', 8);
        for (let step = 0; step < 8; step++) {
          setTimeout(() => {
            window.soundEngine.playHitHeavy();
            opponent.takeDamage(38, 0, -2, 'super', fighter);
            window.particleSystem.createFireEmber(opponent.x, opponent.y, '#c084fc');
          }, step * 90);
        }
      } else if (fighter.monsterId === 'voltgor') {
        // Wrath of Thunder
        for (let bolt = 0; bolt < 6; bolt++) {
          setTimeout(() => {
            const bx = opponent.x + (Math.random() - 0.5) * 80;
            window.particleSystem.createLightning(bx, 0, bx, 435, '#facc15');
            window.particleSystem.createShockwave(bx, 435, 80, '#fde047', 5);
            window.soundEngine.playElectricity();
            opponent.takeDamage(50, (Math.random() - 0.5) * 6, -5, 'super', fighter);
          }, bolt * 120);
        }
      }
    }, 400);
  }

  handleKO(winner, loser) {
    this.state = 'GAMEOVER';
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);

    window.soundEngine.playKO();
    this.triggerScreenShake(25, 60);
    this.triggerHitStop(250);

    const isP1Win = winner === this.p1;
    this.showRoundBanner('K.O.!', isP1Win ? 'VICTORY!' : 'DEFEAT!');
    window.soundEngine.announce('Knockout! ' + (isP1Win ? 'Player 1 wins!' : 'Player 2 wins!'));

    setTimeout(() => {
      this.showVictoryScreen(isP1Win);
    }, 2500);
  }

  handleTimeUp() {
    this.state = 'GAMEOVER';
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);

    window.soundEngine.announce('Time Up!');
    const isP1Win = this.p1.hp >= this.p2.hp;
    this.showRoundBanner('TIME UP', isP1Win ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS');

    setTimeout(() => {
      this.showVictoryScreen(isP1Win);
    }, 2500);
  }

  showVictoryScreen(isP1Win) {
    document.getElementById('screenHUD').classList.add('hidden');
    const screenVic = document.getElementById('screenVictory');
    screenVic.classList.remove('hidden');

    const titleElem = document.getElementById('vicTitle');
    const descElem = document.getElementById('vicDesc');
    const btnNext = document.getElementById('btnNextStage');

    if (this.mode === 'arcade') {
      if (isP1Win) {
        if (this.stage < this.maxStages) {
          titleElem.innerText = 'STAGE CLEARED!';
          titleElem.style.color = '#00ffcc';
          descElem.innerText = `恭喜擊敗 Stage ${this.stage} 對手！準備迎接下一個強敵！`;
          btnNext.style.display = 'inline-block';
          btnNext.onclick = () => {
            this.stage++;
            this.startFight();
          };
        } else {
          titleElem.innerText = 'MONSTER CHAMPION!';
          titleElem.style.color = '#ffcc00';
          descElem.innerText = '🔥 恭喜你制霸怪獸競技場，成為至高無上的怪獸之王！ 🔥';
          btnNext.style.display = 'none';
        }
      } else {
        titleElem.innerText = 'DEFEATED (挑戰失敗)';
        titleElem.style.color = '#ff0055';
        descElem.innerText = '在怪獸巨獸的怒火中落敗... 再試一次吧！';
        btnNext.style.display = 'none';
      }
    } else {
      titleElem.innerText = isP1Win ? 'PLAYER 1 獲勝！' : 'PLAYER 2 獲勝！';
      descElem.innerText = '精彩絕倫的怪獸大決戰！';
      btnNext.style.display = 'none';
    }
  }

  // --- Main Update & Loop ---

  loop(currentTime) {
    const delta = (currentTime - this.lastTime) / (1000 / 60);
    this.lastTime = currentTime;
    const dt = Math.min(delta, 2.0); // Clamp frame lag

    if (!this.isPaused) {
      if (this.hitStopTimer > 0) {
        this.hitStopTimer -= dt * 16.6;
      } else {
        this.update(dt);
      }
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state !== 'FIGHT' && this.state !== 'GAMEOVER') return;

    // Process Inputs for P1
    this.handleP1Input();

    // Process Inputs for P2 (Local 2P or AI)
    if (this.mode === 'pvp') {
      this.handleP2Input();
    } else {
      this.updateAI(dt);
    }

    // Update Fighters
    this.p1.update(dt, this.p2);
    this.p2.update(dt, this.p1);

    // Training mode infinite energy/hp
    if (this.mode === 'training') {
      this.p1.hp = this.p1.maxHp;
      this.p1.energy = this.p1.maxEnergy;
      this.p2.hp = Math.max(100, this.p2.hp);
    }

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Particle System
    window.particleSystem.update(dt);

    // Update Screen Shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Update HUD Health Bars
    this.updateHUD();
  }

  handleP1Input() {
    if (!this.p1 || this.p1.hp <= 0) return;

    // Movement
    if (this.keys['KeyA']) {
      this.p1.move(-1);
    } else if (this.keys['KeyD']) {
      this.p1.move(1);
    } else if (this.p1.state === 'walk') {
      this.p1.move(0);
    }

    // Jump & Crouch
    if (this.keys['KeyW']) this.p1.jump();
    this.p1.crouch(!!this.keys['KeyS']);

    // Guard / Parry (L key)
    this.p1.guard(!!this.keys['KeyL']);

    // Attacks (J = Light, K = Heavy, U = Sp1, I = Sp2, O = Ult)
    if (this.keys['KeyJ']) {
      this.p1.startAttack('atk1');
      this.keys['KeyJ'] = false;
    } else if (this.keys['KeyK']) {
      this.p1.startAttack('atk2');
      this.keys['KeyK'] = false;
    } else if (this.keys['KeyU']) {
      this.p1.startAttack('sp1');
      this.keys['KeyU'] = false;
    } else if (this.keys['KeyI']) {
      this.p1.startAttack('sp2');
      this.keys['KeyI'] = false;
    } else if (this.keys['KeyO']) {
      this.p1.startAttack('ult');
      this.keys['KeyO'] = false;
    }

    // Dash (Shift or Space)
    if (this.keys['ShiftLeft'] || this.keys['Space']) {
      this.p1.dash();
      this.keys['ShiftLeft'] = false;
      this.keys['Space'] = false;
    }
  }

  handleP2Input() {
    if (!this.p2 || this.p2.hp <= 0) return;

    // Movement
    if (this.keys['ArrowLeft']) {
      this.p2.move(-1);
    } else if (this.keys['ArrowRight']) {
      this.p2.move(1);
    } else if (this.p2.state === 'walk') {
      this.p2.move(0);
    }

    // Jump & Crouch
    if (this.keys['ArrowUp']) this.p2.jump();
    this.p2.crouch(!!this.keys['ArrowDown']);

    // Guard (Numpad 3 or Comma)
    this.p2.guard(!!this.keys['Numpad3'] || !!this.keys['Comma']);

    // Attacks
    if (this.keys['Numpad1'] || this.keys['KeyN']) {
      this.p2.startAttack('atk1');
      this.keys['Numpad1'] = false;
      this.keys['KeyN'] = false;
    } else if (this.keys['Numpad2'] || this.keys['KeyM']) {
      this.p2.startAttack('atk2');
      this.keys['Numpad2'] = false;
      this.keys['KeyM'] = false;
    } else if (this.keys['Numpad4'] || this.keys['KeyH']) {
      this.p2.startAttack('sp1');
      this.keys['Numpad4'] = false;
      this.keys['KeyH'] = false;
    } else if (this.keys['Numpad5'] || this.keys['KeyY']) {
      this.p2.startAttack('sp2');
      this.keys['Numpad5'] = false;
      this.keys['KeyY'] = false;
    } else if (this.keys['Numpad6'] || this.keys['KeyT']) {
      this.p2.startAttack('ult');
      this.keys['Numpad6'] = false;
      this.keys['KeyT'] = false;
    }
  }

  // --- Smart Enemy AI ---
  updateAI(dt) {
    if (!this.p2 || this.p2.hp <= 0 || this.aiDifficulty === 'dummy') return;

    this.aiTimer += dt;
    if (this.aiTimer < 10) return; // Action decision tick every 10 frames
    this.aiTimer = 0;

    const dist = Math.abs(this.p2.x - this.p1.x);
    const isPlayerAttacking = this.p1.isHitboxActive;
    const canUseUlt = this.p2.energy >= 100;
    const canUseSp1 = this.p2.energy >= 25;
    const canUseSp2 = this.p2.energy >= 35;

    // 1. Reactive Guarding (Higher difficulty has higher reaction chance)
    const guardChance = this.aiDifficulty === 'boss' ? 0.75 : this.aiDifficulty === 'hard' ? 0.5 : 0.25;
    if (isPlayerAttacking && dist < 120 && Math.random() < guardChance) {
      this.p2.guard(true);
      setTimeout(() => { if (this.p2) this.p2.guard(false); }, 300);
      return;
    }

    // 2. Ultimate EX Usage
    if (canUseUlt && (dist < 200 || this.p1.state === 'hitstun')) {
      this.p2.startAttack('ult');
      return;
    }

    // 3. Spacing & Tactical Decision
    if (dist > 300) {
      // Long distance: approach or fire projectile
      if (canUseSp1 && Math.random() < 0.6) {
        this.p2.startAttack('sp1');
      } else {
        this.p2.move(this.p1.x > this.p2.x ? 1 : -1);
      }
    } else if (dist > 140) {
      // Mid distance: Gap closer rush or jump in
      if (canUseSp2 && Math.random() < 0.5) {
        this.p2.startAttack('sp2');
      } else if (Math.random() < 0.35) {
        this.p2.jump();
        this.p2.move(this.p1.x > this.p2.x ? 1 : -1);
      } else {
        this.p2.move(this.p1.x > this.p2.x ? 1 : -1);
      }
    } else {
      // Close distance: Combos & attacks
      this.p2.move(0);
      const attackRoll = Math.random();
      if (attackRoll < 0.45) {
        this.p2.startAttack('atk1');
      } else if (attackRoll < 0.8) {
        this.p2.startAttack('atk2');
      } else if (Math.random() < 0.3) {
        this.p2.dash(-this.p2.facing); // Backdash
      }
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Spawn projectile trail particles
      if (Math.random() < 0.5) {
        window.particleSystem.createFireEmber(p.x, p.y, p.color);
      }

      // Check Out of Bounds or expired
      if (p.life <= 0 || p.x < 30 || p.x > 930) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check Collision with opposing fighter
      const target = p.owner === this.p1 ? this.p2 : this.p1;
      const targetBox = target.getHurtbox();
      const projBox = { x: p.x - p.radius, y: p.y - p.radius, w: p.radius * 2, h: p.radius * 2 };

      // Melee Counter: If the target is attacking with an active hitbox, they DESTROY the projectile!
      if (target.isHitboxActive) {
        const targetHitbox = target.getCurrentHitbox();
        if (this.checkAABB(projBox, targetHitbox)) {
          window.soundEngine.playParry();
          window.particleSystem.createShockwave(p.x, p.y, 60, '#00ffff', 4);
          window.particleSystem.createHitSparks(p.x, p.y, 16, '#ffffff', 6);
          window.particleSystem.addFloatingText(p.x, p.y - 25, 'DESTROYED! 💥', 'parry');
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (this.checkAABB(projBox, targetBox)) {
        window.soundEngine.playExplosion();
        window.particleSystem.createShockwave(p.x, p.y, 50, p.color, 4);
        window.particleSystem.createHitSparks(p.x, p.y, 16, p.color, 6);
        target.takeDamage(p.damage, (p.vx > 0 ? 1 : -1) * 7, -3, 'crit', p.owner);
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateHUD() {
    if (!this.p1 || !this.p2) return;

    // P1 Bars
    const p1HpPercent = (this.p1.hp / this.p1.maxHp) * 100;
    const p1RedPercent = (this.p1.redHp / this.p1.maxHp) * 100;
    const p1EnergyPercent = (this.p1.energy / this.p1.maxEnergy) * 100;
    document.getElementById('p1HpFill').style.width = `${p1HpPercent}%`;
    document.getElementById('p1HpRed').style.width = `${p1RedPercent}%`;
    document.getElementById('p1EnergyFill').style.width = `${p1EnergyPercent}%`;
    document.getElementById('p1UltBadge').classList.toggle('ready', this.p1.energy >= 100);

    // P2 Bars
    const p2HpPercent = (this.p2.hp / this.p2.maxHp) * 100;
    const p2RedPercent = (this.p2.redHp / this.p2.maxHp) * 100;
    const p2EnergyPercent = (this.p2.energy / this.p2.maxEnergy) * 100;
    document.getElementById('p2HpFill').style.width = `${p2HpPercent}%`;
    document.getElementById('p2HpRed').style.width = `${p2RedPercent}%`;
    document.getElementById('p2EnergyFill').style.width = `${p2EnergyPercent}%`;
    document.getElementById('p2UltBadge').classList.toggle('ready', this.p2.energy >= 100);

    // Danger BGM toggle if either monster has < 25% HP
    const isDanger = (p1HpPercent < 25 || p2HpPercent < 25);
    window.soundEngine.setDanger(isDanger);
  }

  // --- Rendering ---

  render() {
    this.ctx.save();

    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply Screen Shake
    this.ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

    // Draw Arena Background
    this.drawArena();

    // Draw Shadows
    if (this.p1) this.drawShadow(this.p1);
    if (this.p2) this.drawShadow(this.p2);

    // Draw Fighters
    if (this.p1) window.MonsterRenderer.drawMonster(this.ctx, this.p1);
    if (this.p2) window.MonsterRenderer.drawMonster(this.ctx, this.p2);

    // Draw Projectiles
    this.drawProjectiles();

    // Draw Particle System (Sparks, Shockwaves, Damage numbers)
    window.particleSystem.draw(this.ctx);

    this.ctx.restore();
  }

  drawArena() {
    const bg = this.stage === 2 ? this.stageBgVolcano : this.stageBgCity;

    if (bg && bg.complete && bg.naturalWidth > 0) {
      this.ctx.drawImage(bg, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Fallback cyber arena gradient
      const grad = this.ctx.createLinearGradient(0, 0, 0, 540);
      grad.addColorStop(0, '#0a0d1a');
      grad.addColorStop(0.7, '#1b1233');
      grad.addColorStop(1, '#050508');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, 960, 540);
    }

    // Stage Ground Overlay & Atmosphere Vignette
    const floorY = 435;
    const floorGrad = this.ctx.createLinearGradient(0, floorY - 20, 0, 540);
    floorGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    this.ctx.fillStyle = floorGrad;
    this.ctx.fillRect(0, floorY - 20, 960, 540 - (floorY - 20));

    // Stage Border Glow Line
    this.ctx.strokeStyle = this.stage === 2 ? 'rgba(255, 68, 0, 0.45)' : 'rgba(0, 240, 255, 0.35)';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, floorY + 4);
    this.ctx.lineTo(960, floorY + 4);
    this.ctx.stroke();
  }

  drawShadow(fighter) {
    this.ctx.save();
    this.ctx.translate(fighter.x, fighter.groundY + 84);
    const scale = Math.max(0.3, 1.0 - (fighter.groundY - fighter.y) / 220);
    this.ctx.scale(scale, 0.35);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, fighter.width * 0.45, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawProjectiles() {
    for (const p of this.projectiles) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 18;

      if (p.type === 'rocket') {
        // Mecha Missile
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(-15, -6, 30, 12);
        this.ctx.fillStyle = '#ff3300';
        this.ctx.beginPath();
        this.ctx.moveTo(15, -6);
        this.ctx.lineTo(24, 0);
        this.ctx.lineTo(15, 6);
        this.ctx.fill();
      } else {
        // Energy Sphere
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Core White Brightness
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  checkAABB(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }
}

// Global Startup
window.addEventListener('DOMContentLoaded', () => {
  window.game = new MonsterBattleGame();
  window.game.init();
});
