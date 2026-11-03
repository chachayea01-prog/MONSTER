// Monster Roster & Procedural Graphics Engine
const MONSTERS_DATA = {
  pyrorex: {
    id: 'pyrorex',
    name: '炎獄巨龍・伊格尼斯',
    nameEn: 'Pyrorex - Ignis',
    avatar: 'assets/avatar_pyrorex.jpg',
    colorTheme: '#ff4400',
    accentColor: '#ffbb00',
    type: '烈焰系 (Fire Kaiju)',
    desc: '熔岩核心孕育的遠古炎龍，體內流動著上千度的毀滅地漿，擅長強力的火炎撕裂與隕石召喚。',
    hp: 1000,
    atk: 95,
    def: 80,
    spd: 85,
    width: 140,
    height: 170,
    special1Name: '熾熱炎彈 (Fireball)',
    special2Name: '地獄烈焰衝刺 (Flame Dash)',
    ultName: '滅世火殞 (Cataclysm Flare)'
  },
  mecha: {
    id: 'mecha',
    name: '鋼鐵霸主・泰坦-09',
    nameEn: 'Mecha Titan-09',
    avatar: 'assets/avatar_mecha.jpg',
    colorTheme: '#00d0ff',
    accentColor: '#ffffff',
    type: '機械系 (Cybernetic)',
    desc: '極限科技打造的終極殲滅兵器，裝載電磁能量護盾與高能脈衝光炮，防禦力無懈可擊。',
    hp: 1150,
    atk: 90,
    def: 100,
    spd: 70,
    width: 145,
    height: 175,
    special1Name: '追蹤微型導彈 (Homing Rocket)',
    special2Name: '推進重錘破壞 (Booster Slam)',
    ultName: '殲滅全彈發射 (Total Annihilation)'
  },
  viper: {
    id: 'viper',
    name: '深淵幽影・魔蛇拉',
    nameEn: 'Shadow Viper - Nidhogg',
    avatar: null, // Will use procedural avatar badge
    colorTheme: '#b800ff',
    accentColor: '#00f7ff',
    type: '虛空毒系 (Void / Venom)',
    desc: '從黑洞深淵誕生的暗影魔蛇，具備極致的敏捷度與致命毒素，能在陰影間穿梭突襲。',
    hp: 850,
    atk: 105,
    def: 65,
    spd: 110,
    width: 130,
    height: 165,
    special1Name: '幽冥毒爆 (Venom Spit)',
    special2Name: '暗影瞬間閃襲 (Shadow Warp)',
    ultName: '虛空黑洞吞噬 (Void Singularity)'
  },
  voltgor: {
    id: 'voltgor',
    name: '雷霆暴君・電角狂犀',
    nameEn: 'Thunder Voltgor',
    avatar: null, // Will use procedural avatar badge
    colorTheme: '#ffea00',
    accentColor: '#00e1ff',
    type: '雷電系 (Thunder Beast)',
    desc: '吞噬萬千雷暴的狂暴巨獸，雙角釋放百萬伏特高壓電弧，攻擊帶有高頻連段與硬直效果。',
    hp: 950,
    atk: 100,
    def: 75,
    spd: 95,
    width: 140,
    height: 170,
    special1Name: '雷鳴閃電球 (Thunder Orb)',
    special2Name: '雷光極速暴衝 (Volt Blitz)',
    ultName: '神罰降世九天雷 (Wrath of Thunder)'
  }
};

// Procedural Monster Renderer
class MonsterRenderer {
  static drawMonster(ctx, fighter) {
    ctx.save();

    // Position at fighter coordinates
    ctx.translate(fighter.x, fighter.y);
    if (fighter.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Hit Recoil Shake / Flash
    if (fighter.hitFlashTimer > 0) {
      ctx.filter = 'brightness(2.5) contrast(1.5)';
    }

    const t = fighter.animTimer;
    const isAttacking = fighter.state === 'attack' || fighter.state === 'special' || fighter.state === 'ult';
    const isJumping = !fighter.isGrounded;
    const isCrouching = fighter.state === 'crouch';
    const isDead = fighter.state === 'ko';

    // Dying fade / fall
    if (isDead) {
      ctx.rotate(fighter.facing === 1 ? -Math.PI / 4 : Math.PI / 4);
      ctx.translate(0, 40);
      ctx.globalAlpha = Math.max(0.2, 1.0 - fighter.deadTimer / 60);
    }

    // Draw Monster Specific Model
    switch (fighter.monsterId) {
      case 'pyrorex':
        this.drawPyrorex(ctx, fighter, t, isAttacking, isJumping, isCrouching);
        break;
      case 'mecha':
        this.drawMechaTitan(ctx, fighter, t, isAttacking, isJumping, isCrouching);
        break;
      case 'viper':
        this.drawShadowViper(ctx, fighter, t, isAttacking, isJumping, isCrouching);
        break;
      case 'voltgor':
        this.drawThunderVoltgor(ctx, fighter, t, isAttacking, isJumping, isCrouching);
        break;
    }

    // Draw Guard Shield if guarding
    if (fighter.isGuarding) {
      this.drawGuardShield(ctx, fighter);
    }

    // Draw Hitbox / Hurtbox debug if enabled
    if (fighter.game && fighter.game.debugHitboxes) {
      this.drawDebugBoxes(ctx, fighter);
    }

    ctx.restore();
  }

  // --- 1. PYROREX (炎獄巨龍) ---
  static drawPyrorex(ctx, fighter, t, isAttacking, isJumping, isCrouching) {
    const breath = Math.sin(t * 3) * 4;
    const crouchOffset = isCrouching ? 25 : 0;
    const jumpOffset = isJumping ? -10 : 0;

    // A. Tail with molten spikes
    ctx.save();
    ctx.translate(-35, 10 + crouchOffset);
    ctx.strokeStyle = '#241010';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const tailWag1 = Math.sin(t * 4) * 15;
    const tailWag2 = Math.cos(t * 4) * 25;
    ctx.quadraticCurveTo(-40 + tailWag1, 10, -80 + tailWag2, -10);
    ctx.stroke();

    // Tail fire flame tip
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(-80 + tailWag2, -10, 10 + Math.sin(t * 8) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // B. Back Wing (fiery demonic bat wing)
    ctx.save();
    ctx.translate(-15, -45 + breath * 0.5 + crouchOffset);
    ctx.rotate(-0.2 + Math.sin(t * 3) * 0.1);
    ctx.fillStyle = '#6e1100';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-45, -60);
    ctx.lineTo(-20, -40);
    ctx.lineTo(-35, -20);
    ctx.closePath();
    ctx.fill();
    // Wing veins
    ctx.strokeStyle = '#ff7700';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // C. Legs & Claws
    ctx.fillStyle = '#1c0909';
    // Back leg
    ctx.beginPath();
    ctx.ellipse(-15, 60 + crouchOffset, 16, 25, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Front leg
    ctx.fillStyle = '#2b0e0e';
    const legWalk = fighter.vx !== 0 ? Math.sin(t * 12) * 15 : 0;
    ctx.beginPath();
    ctx.ellipse(15 + legWalk, 60 + crouchOffset, 18, 26, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Claws
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(22 + legWalk, 80 + crouchOffset, 6, 0, Math.PI * 2);
    ctx.fill();

    // D. Main Torso (Heavy dragon chest with magma cracks)
    ctx.save();
    ctx.translate(0, 5 + breath + crouchOffset);
    ctx.fillStyle = '#1a0b0b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 48, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Magma chest glowing core
    const magmaPulse = Math.sin(t * 6) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(255, 90, 0, ${magmaPulse})`;
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-15, -20);
    ctx.lineTo(15, -18);
    ctx.lineTo(8, 25);
    ctx.lineTo(-10, 20);
    ctx.closePath();
    ctx.fill();

    // Chest rock plates
    ctx.strokeStyle = '#421515';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // E. Head & Flaming Jaw
    ctx.save();
    let headX = 25;
    let headY = -50 + breath + crouchOffset;
    ctx.translate(headX, headY);

    if (fighter.attackType === 'atk1') {
      headX += 15;
    }

    // Horns
    ctx.fillStyle = '#3a0d0d';
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.quadraticCurveTo(-30, -45, -45, -35);
    ctx.quadraticCurveTo(-25, -20, -5, -5);
    ctx.fill();

    // Head skull
    ctx.fillStyle = '#260a0a';
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(35, 5);
    ctx.lineTo(30, 25);
    ctx.lineTo(-5, 20);
    ctx.closePath();
    ctx.fill();

    // Glowing Eye
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(10, 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Fiery Maw teeth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(15, 18);
    ctx.lineTo(20, 26);
    ctx.lineTo(25, 18);
    ctx.lineTo(30, 26);
    ctx.lineTo(35, 18);
    ctx.fill();

    // Breathing flames if attacking or charging
    if (fighter.attackType === 'sp1' || fighter.attackType === 'ult') {
      ctx.fillStyle = 'rgba(255, 180, 0, 0.85)';
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(35, 18);
      ctx.lineTo(60 + Math.random() * 20, 15 + (Math.random() - 0.5) * 15);
      ctx.lineTo(35, 26);
      ctx.fill();
    }
    ctx.restore();

    // F. Arms & Claw attack
    ctx.save();
    let armX = 15;
    let armY = 5 + crouchOffset;
    let armAngle = 0.3;

    if (fighter.attackType === 'atk1') {
      armAngle = -1.2 + Math.sin(fighter.attackProgress * Math.PI) * 2.2;
      armX += 20;
    } else if (fighter.attackType === 'atk2') {
      armAngle = 1.0 - Math.sin(fighter.attackProgress * Math.PI) * 2.0;
    }

    ctx.translate(armX, armY);
    ctx.rotate(armAngle);
    ctx.fillStyle = '#2e0f0f';
    ctx.beginPath();
    ctx.roundRect(0, -10, 40, 20, 8);
    ctx.fill();

    // Claws
    ctx.fillStyle = '#ff7700';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(40, -8);
    ctx.lineTo(55, -4);
    ctx.lineTo(40, 0);
    ctx.lineTo(55, 6);
    ctx.lineTo(40, 12);
    ctx.fill();
    ctx.restore();
  }

  // --- 2. MECHA TITAN-09 (鋼鐵巨神) ---
  static drawMechaTitan(ctx, fighter, t, isAttacking, isJumping, isCrouching) {
    const pulse = Math.sin(t * 5) * 0.2 + 0.8;
    const crouchOffset = isCrouching ? 22 : 0;

    // Thruster smoke particles behind back
    if (fighter.vx !== 0 || fighter.attackType === 'sp2') {
      window.particleSystem.createDust(fighter.x - fighter.facing * 30, fighter.y + 20, fighter.facing);
    }

    // A. Heavy Steel Legs
    ctx.fillStyle = '#1c2833';
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 1.5;

    // Left leg
    ctx.beginPath();
    ctx.roundRect(-25, 40 + crouchOffset, 22, 45, 6);
    ctx.fill();
    ctx.stroke();

    // Right leg
    const walkSwing = fighter.vx !== 0 ? Math.sin(t * 10) * 15 : 0;
    ctx.fillStyle = '#273746';
    ctx.beginPath();
    ctx.roundRect(10 + walkSwing, 40 + crouchOffset, 25, 45, 6);
    ctx.fill();
    ctx.stroke();

    // Foot hydraulic pistons
    ctx.fillStyle = '#566573';
    ctx.fillRect(8 + walkSwing, 80 + crouchOffset, 32, 10);

    // B. Torso (Armored cockpit + Arc Reactor Core)
    ctx.save();
    ctx.translate(0, 0 + crouchOffset);
    ctx.fillStyle = '#1b2631';
    ctx.beginPath();
    ctx.roundRect(-35, -35, 70, 75, 10);
    ctx.fill();

    // Armor plating highlights
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Cyber Cyan glowing energy lines
    ctx.strokeStyle = `rgba(0, 240, 255, ${pulse})`;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-25, -20);
    ctx.lineTo(-5, 0);
    ctx.lineTo(25, -20);
    ctx.moveTo(-20, 20);
    ctx.lineTo(0, 10);
    ctx.lineTo(20, 20);
    ctx.stroke();

    // Central Arc Reactor Core
    ctx.fillStyle = `rgba(0, 240, 255, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, -5, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // C. Shoulder Missile Launchers
    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-42, -50 + crouchOffset, 22, 25, 4);
    ctx.fill();
    ctx.stroke();
    // Missile tubes
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(-35, -42 + crouchOffset, 4, 0, Math.PI * 2);
    ctx.arc(-35, -33 + crouchOffset, 4, 0, Math.PI * 2);
    ctx.fill();

    // D. Robot Head & Visor
    ctx.save();
    ctx.translate(10, -55 + crouchOffset);
    ctx.fillStyle = '#212f3d';
    ctx.beginPath();
    ctx.moveTo(-15, 15);
    ctx.lineTo(25, 15);
    ctx.lineTo(20, -15);
    ctx.lineTo(-10, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Neon Cyan Visor
    ctx.fillStyle = '#00f7ff';
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 14;
    ctx.fillRect(5, -5, 16, 7);
    ctx.restore();

    // E. Arms & Railgun / Rocket Arm
    ctx.save();
    let armX = 15;
    let armY = -10 + crouchOffset;
    let armAngle = 0.2;

    if (fighter.attackType === 'atk1') {
      armAngle = -0.1;
      armX += 28 * Math.sin(fighter.attackProgress * Math.PI);
    } else if (fighter.attackType === 'atk2') {
      armAngle = 0.8 - Math.sin(fighter.attackProgress * Math.PI) * 1.5;
    } else if (fighter.attackType === 'sp1' || fighter.attackType === 'ult') {
      armAngle = 0;
      armX += 10;
    }

    ctx.translate(armX, armY);
    ctx.rotate(armAngle);
    // Upper arm
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, -10, 25, 20);
    // Railgun Cannon
    ctx.fillStyle = '#17202a';
    ctx.fillRect(25, -14, 45, 28);
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(25, -14, 45, 28);

    // Muzzle energy glow
    if (fighter.attackType === 'sp1' || fighter.attackType === 'ult') {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f7ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(70, 0, 10 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- 3. SHADOW VIPER (深淵魔蛇) ---
  static drawShadowViper(ctx, fighter, t, isAttacking, isJumping, isCrouching) {
    const crouchOffset = isCrouching ? 20 : 0;
    const wave1 = Math.sin(t * 6) * 12;
    const wave2 = Math.cos(t * 6) * 18;

    // Dark void particles around body
    if (Math.random() < 0.4) {
      window.particleSystem.createFireEmber(fighter.x + (Math.random() - 0.5) * 50, fighter.y + (Math.random() - 0.5) * 50, '#a855f7');
    }

    // A. Sinister Coiled Serpent Body
    ctx.save();
    ctx.translate(0, 30 + crouchOffset);
    ctx.strokeStyle = '#1e112a';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-40, 40);
    ctx.quadraticCurveTo(-60 + wave1, 10, -20, -10);
    ctx.quadraticCurveTo(20 + wave2, -20, 10, -45);
    ctx.stroke();

    // Bioluminescent Violet spine pattern
    ctx.strokeStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // B. Void Wings / Hood (Cobra-like flared dark hood)
    ctx.save();
    ctx.translate(10, -35 + crouchOffset);
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.moveTo(-10, 20);
    ctx.quadraticCurveTo(-45, -10, -30, -50);
    ctx.quadraticCurveTo(0, -30, 25, -20);
    ctx.closePath();
    ctx.fill();

    // Mystic runes on hood
    ctx.strokeStyle = '#e879f9';
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // C. Sinister Dragon/Viper Head
    ctx.save();
    let headX = 25;
    let headY = -50 + crouchOffset;
    if (fighter.attackType === 'atk1') {
      headX += 30 * Math.sin(fighter.attackProgress * Math.PI);
    }
    ctx.translate(headX, headY);

    // Head shape
    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(25, -10);
    ctx.lineTo(40, 5);
    ctx.lineTo(20, 20);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    ctx.fill();

    // Glowing Venomous Eyes
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(15, -2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Toxic Fangs
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(25, 10);
    ctx.lineTo(28, 22);
    ctx.lineTo(31, 10);
    ctx.fill();

    // Poison mist when attacking
    if (fighter.attackType === 'sp1' || fighter.attackType === 'ult') {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
      ctx.beginPath();
      ctx.arc(45, 8, 15 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- 4. THUNDER VOLTGOR (雷霆暴君) ---
  static drawThunderVoltgor(ctx, fighter, t, isAttacking, isJumping, isCrouching) {
    const crouchOffset = isCrouching ? 22 : 0;
    const spark = Math.random() < 0.3;

    // Lightning sparks around body
    if (spark) {
      window.particleSystem.createLightning(
        fighter.x + (Math.random() - 0.5) * 40,
        fighter.y + (Math.random() - 0.5) * 60,
        fighter.x + (Math.random() - 0.5) * 60,
        fighter.y + (Math.random() - 0.5) * 80,
        '#facc15'
      );
    }

    // A. Muscular Quadrupedal/Bipedal Beast Body
    ctx.save();
    ctx.translate(0, 10 + crouchOffset);
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 38, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Golden Armor / Electric Spikes on back
    ctx.fillStyle = '#ca8a04';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 10;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 15 - 10, -25);
      ctx.lineTo(i * 15, -45 - Math.abs(i) * 5);
      ctx.lineTo(i * 15 + 10, -25);
      ctx.fill();
    }
    ctx.restore();

    // B. Powerful Beast Legs
    ctx.fillStyle = '#292524';
    // Back legs
    ctx.beginPath();
    ctx.roundRect(-30, 45 + crouchOffset, 20, 40, 6);
    ctx.fill();
    // Front legs
    const legSwing = fighter.vx !== 0 ? Math.sin(t * 12) * 14 : 0;
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.roundRect(15 + legSwing, 45 + crouchOffset, 22, 40, 6);
    ctx.fill();

    // Golden Electric Talons
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 8;
    ctx.fillRect(15 + legSwing, 80 + crouchOffset, 24, 6);

    // C. Armored Beast Head & Giant Lightning Horn
    ctx.save();
    let headX = 25;
    let headY = -35 + crouchOffset;
    if (fighter.attackType === 'atk2') {
      headY -= 20 * Math.sin(fighter.attackProgress * Math.PI);
    }
    ctx.translate(headX, headY);

    // Skull
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(30, 0);
    ctx.lineTo(35, 25);
    ctx.lineTo(-5, 25);
    ctx.closePath();
    ctx.fill();

    // Glowing Golden Horn (Main weapon)
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(15, -5);
    ctx.quadraticCurveTo(45, -50, 65, -45);
    ctx.quadraticCurveTo(40, -15, 25, 0);
    ctx.closePath();
    ctx.fill();

    // Glowing Amber Eyes
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(15, 8, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Electrified Jaw
    ctx.fillStyle = '#fde047';
    ctx.fillRect(15, 20, 18, 5);
    ctx.restore();
  }

  // --- Defense Shield Barrier ---
  static drawGuardShield(ctx, fighter) {
    ctx.save();
    ctx.translate(fighter.facing === 1 ? 40 : -40, 10);
    const radius = 65;
    const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(0, 247, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(0, 150, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 247, 255, 0.8)');

    ctx.fillStyle = gradient;
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.fill();

    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Hexagon pattern lines on shield
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -40); ctx.lineTo(15, -20); ctx.lineTo(15, 20); ctx.lineTo(0, 40);
    ctx.stroke();
    ctx.restore();
  }

  // --- Debug Boxes ---
  static drawDebugBoxes(ctx, fighter) {
    // Hurtbox (Green)
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(-fighter.width / 2, -fighter.height / 2, fighter.width, fighter.height);

    // Hitbox (Red) if attack active
    if (fighter.isHitboxActive) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      const hb = fighter.getCurrentHitbox();
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
      ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
    }
  }
}

window.MONSTERS_DATA = MONSTERS_DATA;
window.MonsterRenderer = MonsterRenderer;
