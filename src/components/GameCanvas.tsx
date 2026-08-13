import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { soundManager } from '../utils/sound';

interface GameCanvasProps {
  currentScene: string;
  onSceneChange: (scene: string) => void;
  triggerDialogue: (speaker: string, avatar: string, lines: string[], onComplete: () => void) => void;
  triggerChoices: (title: string, optionA: string, optionB: string, onSelect: (choice: 'A' | 'B') => void) => void;
  updateParty: (partyMember: string) => void;
  onGameComplete: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentScene,
  onSceneChange,
  triggerDialogue,
  triggerChoices,
  updateParty,
  onGameComplete,
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    // Destroy any existing global game instance to prevent duplicates during HMR/Strict Mode
    if ((window as any).activePhaserGame) {
      try {
        (window as any).activePhaserGame.destroy(true);
      } catch (e) {
        console.error('Error destroying existing Phaser game:', e);
      }
      (window as any).activePhaserGame = null;
    }

    // Clear any previous canvas element
    gameRef.current.innerHTML = '';

    // Config for Phaser Game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      pixelArt: true,
      scene: [BootScene, SchoolScene, BattleScene, UVCEScene, SAPScene, EndingScene],
    };

    // Instantiate Phaser
    const game = new Phaser.Game(config);
    phaserGameRef.current = game;
    (window as any).activePhaserGame = game;

    // Pass React callback references to game registry so Phaser can talk to React
    game.registry.set('onSceneChange', onSceneChange);
    game.registry.set('triggerDialogue', triggerDialogue);
    game.registry.set('triggerChoices', triggerChoices);
    game.registry.set('updateParty', updateParty);
    game.registry.set('onGameComplete', onGameComplete);
    game.registry.set('currentSceneState', currentScene);

    return () => {
      game.destroy(true);
      phaserGameRef.current = null;
      if ((window as any).activePhaserGame === game) {
        (window as any).activePhaserGame = null;
      }
    };
  }, []);

  // Sync scene change from React
  useEffect(() => {
    if (phaserGameRef.current) {
      const activeScene = phaserGameRef.current.registry.get('currentSceneState');
      console.log("[GameCanvas] Sync effect: activeScene =", activeScene, "currentScene =", currentScene);
      if (activeScene !== currentScene) {
        phaserGameRef.current.registry.set('currentSceneState', currentScene);
        
        // Let Phaser handle scene transitions dynamically
        const sceneManager = phaserGameRef.current.scene;
        console.log("[GameCanvas] Transitioning scene to:", currentScene);
        if (currentScene === 'SCHOOL') {
          sceneManager.stop('BattleScene');
          sceneManager.stop('UVCEScene');
          sceneManager.stop('SAPScene');
          sceneManager.stop('EndingScene');
          sceneManager.start('SchoolScene');
        } else if (currentScene === 'BATTLE') {
          sceneManager.stop('SchoolScene');
          sceneManager.start('BattleScene');
        } else if (currentScene === 'UVCE') {
          sceneManager.stop('BattleScene');
          sceneManager.start('UVCEScene');
        } else if (currentScene === 'SAP') {
          sceneManager.stop('UVCEScene');
          sceneManager.start('SAPScene');
        } else if (currentScene === 'ENDING') {
          sceneManager.stop('SAPScene');
          sceneManager.start('EndingScene');
        }
      }
    }
  }, [currentScene]);

  return (
    <div className="w-full h-full flex justify-center items-center relative bg-neutral-900 border-4 border-white retro-border shadow-2xl">
      <div ref={gameRef} className="w-full h-full max-w-full max-h-full" />
    </div>
  );
};

// ==========================================
// 1. BOOT SCENE (Texture Keying & Scaling)
// ==========================================
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.add.text(400, 300, 'Loading Journey...', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Load Backgrounds
    this.load.image('school_hallway', '/images/bg_school_hallway.png');
    this.load.image('classroom_battle', '/images/bg_classroom_battle.png');
    this.load.image('uvce_campus', '/images/bg_uvce_campus.png');
    this.load.image('sap_labs', '/images/bg_sap_labs.png');
    this.load.image('kalyan_nagar_cafe', '/images/bg_kalyan_nagar_cafe.png');
    this.load.image('sunset_crossroads', '/images/bg_sunset_crossroads.png');

    // Load Character Sprite files
    this.load.image('char_ryan', '/images/Rayan.png');
    this.load.image('char_sanketh', '/images/Sanketh.png');
    this.load.image('char_anam', '/images/Anam.png');
    this.load.image('char_student_male', '/images/char_student_male.png');
    this.load.image('char_student_female', '/images/char_student_female.png');
    this.load.image('char_teacher', '/images/char_teacher.png');
    this.load.image('char_boss_core_gargoyle', '/images/boss_core_gargoyle.jpg');
  }

  create() {
    // Process character textures to remove white background and crop whitespace
    this.processCharacterTexture('char_ryan');
    this.processCharacterTexture('char_sanketh');
    this.processCharacterTexture('char_anam');
    this.processCharacterTexture('char_student_male');
    this.processCharacterTexture('char_student_female');
    this.processCharacterTexture('char_teacher');
    this.processCharacterTexture('char_boss_core_gargoyle');

    let target = 'SchoolScene';
    const current = this.registry.get('currentSceneState');
    console.log("[BootScene] currentSceneState =", current);
    if (current === 'BATTLE') target = 'BattleScene';
    else if (current === 'UVCE') target = 'UVCEScene';
    else if (current === 'SAP') target = 'SAPScene';
    else if (current === 'ENDING') target = 'EndingScene';
    console.log("[BootScene] Starting target scene:", target);
    this.scene.start(target);
  }

  private processCharacterTexture(key: string) {
    try {
      const texture = this.textures.get(key);
      if (!texture) return;
      const originalTexture = texture.getSourceImage() as HTMLImageElement;
      if (!originalTexture) return;

      const originalWidth = originalTexture.width || originalTexture.naturalWidth;
      const originalHeight = originalTexture.height || originalTexture.naturalHeight;

      if (!originalWidth || !originalHeight) return;

      // Downscale target height: 256px max, to keep it crisp but lightweight
      const targetHeight = 256;
      const scale = targetHeight / originalHeight;
      const targetWidth = Math.round(originalWidth * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw original image scaled down
      ctx.drawImage(originalTexture, 0, 0, targetWidth, targetHeight);

      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;

      // Flood fill background removal on the downscaled image
      const visited = new Uint8Array(targetWidth * targetHeight);
      const queue: [number, number][] = [];

      // Add borders to flood fill queue
      for (let x = 0; x < targetWidth; x++) {
        queue.push([x, 0]);
        queue.push([x, targetHeight - 1]);
      }
      for (let y = 0; y < targetHeight; y++) {
        queue.push([0, y]);
        queue.push([targetWidth - 1, y]);
      }

      const isNearWhite = (r: number, g: number, b: number) => {
        return r > 240 && g > 240 && b > 240;
      };

      let head = 0;
      while (head < queue.length) {
        const curr = queue[head++];
        const [x, y] = curr;
        const idx = y * targetWidth + x;

        if (visited[idx]) continue;
        visited[idx] = 1;

        const pixelIdx = idx * 4;
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];

        if (isNearWhite(r, g, b)) {
          data[pixelIdx + 3] = 0; // Transparent

          // 4-way neighbors
          if (x > 0) queue.push([x - 1, y]);
          if (x < targetWidth - 1) queue.push([x + 1, y]);
          if (y > 0) queue.push([x, y - 1]);
          if (y < targetHeight - 1) queue.push([x, y + 1]);
        }
      }

      // Bounding box calculation
      let minX = targetWidth;
      let maxX = 0;
      let minY = targetHeight;
      let maxY = 0;
      let foundPixels = false;

      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          const pixelIdx = (y * targetWidth + x) * 4;
          const alpha = data[pixelIdx + 3];
          if (alpha > 0) {
            foundPixels = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      const croppedWidth = maxX - minX + 1;
      const croppedHeight = maxY - minY + 1;

      if (foundPixels && croppedWidth > 0 && croppedHeight > 0) {
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = croppedWidth;
        croppedCanvas.height = croppedHeight;
        const croppedCtx = croppedCanvas.getContext('2d');
        if (croppedCtx) {
          croppedCtx.drawImage(canvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
          this.textures.addCanvas(`${key}_clean`, croppedCanvas);
        }
      } else {
        this.textures.addCanvas(`${key}_clean`, canvas);
      }
    } catch (e) {
      console.error(`Error in processCharacterTexture:`, e);
      // Fallback
      try {
        const texture = this.textures.get(key);
        const originalTexture = texture?.getSourceImage() as HTMLImageElement;
        if (originalTexture) {
          const canvas = document.createElement('canvas');
          canvas.width = originalTexture.width || 64;
          canvas.height = originalTexture.height || 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(originalTexture, 0, 0);
            this.textures.addCanvas(`${key}_clean`, canvas);
          }
        }
      } catch (err) {
        console.error(`Error in fallback texture creation:`, err);
      }
    }
  }
}

// ==========================================
// 2. SCHOOL SCENE (LEVEL 1: STEALTH)
// ==========================================
class SchoolScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private sankethToken!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private maryGeraldineSprite!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private npcs!: Phaser.Physics.Arcade.Group;
  private visionCones!: Phaser.GameObjects.Graphics[];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private isSpotted = false;
  private exclamationMark!: Phaser.GameObjects.Text;
  private isLevelComplete = false;
  private schoolPhase = 1; // 1 = walk right to Sanketh, 2 = walk left to Mary Geraldine, 3 = walk right back to Sanketh
  private instructionText!: Phaser.GameObjects.Text;

  constructor() {
    super('SchoolScene');
  }

  create() {
    this.isSpotted = false;
    this.isLevelComplete = false;
    this.schoolPhase = 1;
    this.visionCones = [];

    // Background
    const bg = this.add.image(400, 300, 'school_hallway');
    bg.setDisplaySize(800, 600);

    // BGM
    soundManager.playBGM('school');

    // Title Instructions
    this.add.text(400, 30, 'Level 1: School Hallway (The Stranger Era)', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5).setStroke('#000000', 4);

    this.instructionText = this.add.text(400, 65, 'Phase 1: Walk to the right and meet Sanketh at the door!', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '9px',
      color: '#f6ad55',
    }).setOrigin(0.5).setStroke('#000000', 4);

    // Player (Ryan Token) - spawn bottom-left
    this.player = this.physics.add.sprite(80, 450, 'char_ryan_clean');
    const ryanRatio = this.player.width / this.player.height;
    this.player.setDisplaySize(115 * ryanRatio, 115);
    this.player.setCollideWorldBounds(true);

    // Alert exclamation mark
    this.exclamationMark = this.add.text(this.player.x, this.player.y - 70, '!', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '36px',
      color: '#ff0000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false);

    // Spawn Sanketh on the right door (End Goal)
    this.sankethToken = this.physics.add.image(720, 220, 'char_sanketh_clean');
    const sankethRatio = this.sankethToken.width / this.sankethToken.height;
    this.sankethToken.setDisplaySize(115 * sankethRatio, 115);
    this.sankethToken.setImmovable(true);

    // Spawn Teacher (Mary Geraldine) on the far left door (Inactive at first)
    this.maryGeraldineSprite = this.physics.add.image(80, 220, 'char_teacher_clean');
    const teacherRatio = this.maryGeraldineSprite.width / this.maryGeraldineSprite.height;
    this.maryGeraldineSprite.setDisplaySize(115 * teacherRatio, 115);
    this.maryGeraldineSprite.setImmovable(true);
    this.maryGeraldineSprite.setActive(false).setVisible(false);

    // Spawn Patrolling Student NPCs (generic models, size 110px)
    this.npcs = this.physics.add.group();

    // NPC 1: Rahul (Male uniform)
    const npc1 = this.npcs.create(280, 300, 'char_student_male_clean');
    const maleRatio = npc1.width / npc1.height;
    npc1.setDisplaySize(110 * maleRatio, 110);
    npc1.setData('name', 'Rahul');
    npc1.setData('direction', 1);
    npc1.setData('rangeY', [180, 520]);
    npc1.setData('speed', 130);

    // NPC 2: Simran (Female student)
    const npc2 = this.npcs.create(480, 400, 'char_student_female_clean');
    const femaleRatio = npc2.width / npc2.height;
    npc2.setDisplaySize(110 * femaleRatio, 110);
    npc2.setData('name', 'Simran');
    npc2.setData('direction', -1);
    npc2.setData('rangeY', [180, 520]);
    npc2.setData('speed', 150);

    // NPC 3: Prajwal (Male uniform)
    const npc3 = this.npcs.create(620, 300, 'char_student_male_clean');
    npc3.setDisplaySize(110 * maleRatio, 110);
    npc3.setData('name', 'Prajwal');
    npc3.setData('direction', 1);
    npc3.setData('rangeY', [180, 520]);
    npc3.setData('speed', 120);

    // Bind vision cone graphics
    this.npcs.getChildren().forEach(() => {
      const g = this.add.graphics();
      this.visionCones.push(g);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;

    // Collisions
    this.physics.add.collider(this.player, this.sankethToken, this.reachSanketh, undefined, this);
    this.physics.add.collider(this.player, this.maryGeraldineSprite, this.talkToMaryGeraldine, undefined, this);
  }

  update() {
    if (this.isSpotted || this.isLevelComplete) {
      this.player.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;
    const speed = 240;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;

    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

    this.player.setVelocity(vx, vy);

    // Walk bobbing origin hop
    if (vx !== 0 || vy !== 0) {
      const time = this.time.now;
      const hop = Math.abs(Math.sin(time * 0.015)) * 0.12;
      this.player.setOrigin(0.5, 0.5 + hop);
    } else {
      this.player.setOrigin(0.5, 0.5);
    }

    // NPC movement & visual vision cones
    const npcArray = this.npcs.getChildren() as Phaser.Physics.Arcade.Image[];
    npcArray.forEach((npc, index) => {
      let dirY = npc.getData('direction');
      const [minY, maxY] = npc.getData('rangeY');
      const npcSpeed = npc.getData('speed');

      npc.setVelocityY(npcSpeed * dirY);

      if (npc.y >= maxY) npc.setData('direction', -1);
      else if (npc.y <= minY) npc.setData('direction', 1);

      const coneGraphics = this.visionCones[index];
      coneGraphics.clear();
      coneGraphics.fillStyle(0xff0000, 0.22);

      const coneLength = 150;
      const coneWidth = 100;
      const npcDir = npc.body!.velocity.y > 0 ? 1 : -1;
      
      const p1x = npc.x;
      const p1y = npc.y;
      const p2x = npc.x - coneWidth / 2;
      const p2y = npc.y + coneLength * npcDir;
      const p3x = npc.x + coneWidth / 2;
      const p3y = npc.y + coneLength * npcDir;

      coneGraphics.fillTriangle(p1x, p1y, p2x, p2y, p3x, p3y);

      // Check collision
      if (this.pointInTriangle(this.player.x, this.player.y + 35, p1x, p1y, p2x, p2y, p3x, p3y)) {
        this.triggerSpotted(npc.getData('name'));
      }
    });

    if (this.exclamationMark.visible) {
      this.exclamationMark.setPosition(this.player.x, this.player.y - 70);
    }
  }

  private pointInTriangle(px: number, py: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    const areaOrig = Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0);
    const area1 = Math.abs((px * (y2 - y3) + x2 * (y3 - py) + x3 * (py - y2)) / 2.0);
    const area2 = Math.abs((x1 * (py - y3) + px * (y3 - y1) + x3 * (y1 - py)) / 2.0);
    const area3 = Math.abs((x1 * (y2 - py) + x2 * (py - y1) + px * (y1 - y2)) / 2.0);
    return Math.abs(areaOrig - (area1 + area2 + area3)) < 1.0;
  }

  private triggerSpotted(spottedBy: string) {
    this.isSpotted = true;
    soundManager.playSFX('exclamation');
    this.exclamationMark.setVisible(true);

    this.tweens.add({
      targets: this.player,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.exclamationMark.setVisible(false);
        this.isSpotted = false;
        
        // Reset player back to starting corridor based on phase
        if (this.schoolPhase === 2) {
          // Reset to right side
          this.player.setPosition(680, 450);
        } else {
          // Reset to left side
          this.player.setPosition(80, 450);
        }

        const triggerDialogue = this.registry.get('triggerDialogue');
        triggerDialogue(
          spottedBy,
          `/images/char_student_${spottedBy === 'Simran' ? 'female' : 'male'}.png`,
          [
            `Hey Ryan! No running in the corridor!`,
            `Locking eyes means you have to start this path again!`
          ],
          () => {}
        );
      },
    });
  }

  private reachSanketh() {
    if (this.isLevelComplete) return;

    if (this.schoolPhase === 1) {
      this.player.setVelocity(0, 0);
      soundManager.playSFX('exclamation');
      const alert = this.add.text(this.sankethToken.x, this.sankethToken.y - 70, '!', {
        fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
        fontSize: '28px',
        color: '#f6ad55',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.time.delayedCall(500, () => {
        alert.destroy();

        const triggerDialogue = this.registry.get('triggerDialogue');
        triggerDialogue(
          'Sanketh',
          '/images/Sanketh.png',
          [
            'Hey Ryan! Ready for our final exam?',
            'Wait... did you get your Hall Ticket? You cannot enter the classroom without it!',
            'Oh no! You forgot it?',
            'I think Mary Geraldine (our teacher) is holding it at the registration table on the far left!',
            'Go back and get it from her quickly, then come back here!'
          ],
          () => {
            this.schoolPhase = 2;
            this.instructionText.setText('Phase 2: Walk left to Mary Geraldine to retrieve your Hall Ticket!');

            // Activate Mary Geraldine on the far left
            if (this.maryGeraldineSprite) {
              this.maryGeraldineSprite.setActive(true).setVisible(true);
            }

            // Spawn Janardhan in the middle to block the way!
            const npc4 = this.npcs.create(380, 350, 'char_student_male_clean');
            const maleRatio = npc4.width / npc4.height;
            npc4.setDisplaySize(110 * maleRatio, 110);
            npc4.setData('name', 'Janardhan');
            npc4.setData('direction', 1);
            npc4.setData('rangeY', [180, 520]);
            npc4.setData('speed', 170);

            const g = this.add.graphics();
            this.visionCones.push(g);

            // Speed up the other student NPCs to raise difficulty
            this.npcs.getChildren().forEach((npc: any) => {
              const currentSpeed = npc.getData('speed');
              npc.setData('speed', currentSpeed + 30);
            });
          }
        );
      });

    } else if (this.schoolPhase === 3) {
      this.isLevelComplete = true;
      this.player.setVelocity(0, 0);

      soundManager.playSFX('exclamation');
      const alertText = this.add.text(this.sankethToken.x, this.sankethToken.y - 70, '!', {
        fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
        fontSize: '28px',
        color: '#f6ad55',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.time.delayedCall(500, () => {
        alertText.destroy();

        const triggerDialogue = this.registry.get('triggerDialogue');
        triggerDialogue(
          'Sanketh',
          '/images/Sanketh.png',
          [
            'Awesome, you got the Hall Ticket! Let us head inside.',
            'Wait... locking eyes means it is time for a battle!',
            'Let us head over to Aakash Coaching Center and duel it out like the old days!'
          ],
          () => {
            const onSceneChange = this.registry.get('onSceneChange');
            onSceneChange('BATTLE');
          }
        );
      });
    }
  }

  private talkToMaryGeraldine() {
    if (this.schoolPhase !== 2) return;
    this.player.setVelocity(0, 0);

    soundManager.playSFX('victory');
    const alert = this.add.text(this.maryGeraldineSprite.x, this.maryGeraldineSprite.y - 70, '!', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '28px',
      color: '#ff0000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.time.delayedCall(500, () => {
      alert.destroy();

      const triggerDialogue = this.registry.get('triggerDialogue');
      triggerDialogue(
        'Mary Geraldine',
        '/images/char_teacher.png',
        [
          'Ah, Ryan Sailani! Here is your Hall Ticket.',
          'Please do not lose it this time! Hurry, the exam gates are closing soon.',
          'Head back to Sanketh at the door!'
        ],
        () => {
          this.schoolPhase = 3;
          this.instructionText.setText('Phase 3: Walk back right to Sanketh with your Hall Ticket!');

          // Mary Geraldine goes inside
          if (this.maryGeraldineSprite) {
            this.maryGeraldineSprite.destroy();
          }

          // Speed up student NPCs for the final run
          this.npcs.getChildren().forEach((npc: any) => {
            const currentSpeed = npc.getData('speed');
            npc.setData('speed', currentSpeed + 40);
          });
        }
      );
    });
  }
}

// ==========================================
// 3. BATTLE SCENE (LEVEL 2: CLASSROOM)
// ==========================================
class BattleScene extends Phaser.Scene {
  private ryanBattleSprite!: Phaser.GameObjects.Image;
  private sankethBattleSprite!: Phaser.GameObjects.Image;
  private battleLogText!: Phaser.GameObjects.Text;
  
  private playerHp = 100;
  private enemyHp = 100;
  private playerMaxHp = 100;
  private enemyMaxHp = 100;

  private playerHpBar!: Phaser.GameObjects.Graphics;
  private enemyHpBar!: Phaser.GameObjects.Graphics;

  private isBattleOver = false;
  private isTurnExecuting = false;

  constructor() {
    super('BattleScene');
  }

  create() {
    this.isBattleOver = false;
    this.isTurnExecuting = false;
    this.playerHp = 100;
    this.enemyHp = 100;

    // BGM
    soundManager.playBGM('battle');

    const bg = this.add.image(400, 300, 'classroom_battle');
    bg.setDisplaySize(800, 600);

    // Platforms
    const graphics = this.add.graphics();
    graphics.fillStyle(0x38a169, 0.4);
    graphics.fillEllipse(250, 450, 300, 80);
    graphics.fillEllipse(580, 250, 240, 60);

    // Characters sized nicely (Ryan back, Sanketh front)
    this.ryanBattleSprite = this.add.image(-150, 380, 'char_ryan_clean');
    const ryanRatio = this.ryanBattleSprite.width / this.ryanBattleSprite.height;
    this.ryanBattleSprite.setDisplaySize(200 * ryanRatio, 200);
    this.tweens.add({
      targets: this.ryanBattleSprite,
      x: 250,
      duration: 800,
      ease: 'Power2',
    });

    this.sankethBattleSprite = this.add.image(950, 200, 'char_sanketh_clean');
    const sankethRatio = this.sankethBattleSprite.width / this.sankethBattleSprite.height;
    this.sankethBattleSprite.setDisplaySize(160 * sankethRatio, 160);
    this.tweens.add({
      targets: this.sankethBattleSprite,
      x: 580,
      duration: 800,
      ease: 'Power2',
    });

    // HP Box HUD - Player (Positioned at bottom-right above text box to prevent overlap)
    this.add.rectangle(580, 440, 260, 55, 0x1a202c, 0.85).setStrokeStyle(3, 0xffffff);
    this.add.text(470, 423, 'RYAN  Lv.24', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#ffffff',
    });
    this.playerHpBar = this.add.graphics();

    // HP Box HUD - Enemy
    this.add.rectangle(580, 115, 260, 55, 0x1a202c, 0.85).setStrokeStyle(3, 0xffffff);
    this.add.text(470, 98, 'SANKETH Lv.24', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#ffffff',
    });
    this.enemyHpBar = this.add.graphics();

    this.updateHpBars();

    // Text box bottom
    this.add.rectangle(400, 540, 760, 80, 0x16171d, 0.9).setStrokeStyle(3, 0x4a5568);
    this.battleLogText = this.add.text(50, 520, 'What will RYAN do?', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#ffffff',
      wordWrap: { width: 700 }
    });

    this.createBattleMenu();
  }

  private createBattleMenu() {
    const buttons = [
      { text: 'Sarcastic Jibe', x: 180, y: 565, action: () => this.executeTurn('jibe') },
      { text: 'Nostalgia Blast', x: 400, y: 565, action: () => this.executeTurn('blast') },
      { text: 'Mubarak Beam', x: 620, y: 565, action: () => this.executeTurn('beam') }
    ];

    buttons.forEach((btn) => {
      const t = this.add.text(btn.x, btn.y, btn.text, {
        fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
        fontSize: '10px',
        color: '#68d391',
        backgroundColor: '#2d3748',
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      t.on('pointerover', () => t.setColor('#ffffff'));
      t.on('pointerout', () => t.setColor('#68d391'));
      t.on('pointerdown', () => {
        if (this.isBattleOver || this.isTurnExecuting) return;
        soundManager.playSFX('click');
        btn.action();
      });
    });
  }

  private updateHpBars() {
    this.playerHpBar.clear();
    this.playerHpBar.fillStyle(0x4a5568, 1);
    this.playerHpBar.fillRect(470, 445, 220, 10);
    
    const playerPct = Math.max(0, this.playerHp / this.playerMaxHp);
    const playerColor = playerPct > 0.5 ? 0x48bb78 : playerPct > 0.2 ? 0xecc94b : 0xf56565;
    this.playerHpBar.fillStyle(playerColor, 1);
    this.playerHpBar.fillRect(470, 445, 220 * playerPct, 10);

    this.enemyHpBar.clear();
    this.enemyHpBar.fillStyle(0x4a5568, 1);
    this.enemyHpBar.fillRect(470, 120, 220, 10);

    const enemyPct = Math.max(0, this.enemyHp / this.enemyMaxHp);
    const enemyColor = enemyPct > 0.5 ? 0x48bb78 : enemyPct > 0.2 ? 0xecc94b : 0xf56565;
    this.enemyHpBar.fillStyle(enemyColor, 1);
    this.enemyHpBar.fillRect(470, 120, 220 * enemyPct, 10);
  }

  private executeTurn(attackType: 'jibe' | 'blast' | 'beam') {
    this.isTurnExecuting = true;
    let damage = 0;
    let logMsg = '';

    if (attackType === 'jibe') {
      damage = 25;
      logMsg = 'Ryan uses Sarcastic Jibe!\nIt is super effective!';
    } else if (attackType === 'blast') {
      damage = 35;
      logMsg = 'Ryan conjures a Nostalgia Blast!\nOld memories deal solid emotional damage!';
    } else if (attackType === 'beam') {
      damage = 60;
      logMsg = 'Ryan unleashes the Mubarak Beam!\nPure wedding energy engulfs the classroom!';
    }

    this.battleLogText.setText(logMsg);

    this.tweens.add({
      targets: this.ryanBattleSprite,
      x: this.ryanBattleSprite.x + 20,
      yoyo: true,
      duration: 100,
      onComplete: () => {
        soundManager.playSFX('hit');
        this.tweens.add({
          targets: this.sankethBattleSprite,
          alpha: 0.1,
          duration: 80,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.enemyHp = Math.max(0, this.enemyHp - damage);
            this.updateHpBars();

            if (this.enemyHp <= 0) {
              this.handleVictory();
            } else {
              this.time.delayedCall(1500, () => this.executeEnemyTurn());
            }
          }
        });
      }
    });
  }

  private executeEnemyTurn() {
    const attacks = [
      { name: 'Physics Trivia', dmg: 20, log: 'Sanketh casts Physics Trivia!\nYour brain is slightly overwhelmed!' },
      { name: 'Debate Spike', dmg: 25, log: 'Sanketh unleashes a Debate Spike!\nLogical arguments score a critical hit!' }
    ];

    const move = attacks[Math.floor(Math.random() * attacks.length)];
    this.battleLogText.setText(move.log);

    this.tweens.add({
      targets: this.sankethBattleSprite,
      x: this.sankethBattleSprite.x - 20,
      yoyo: true,
      duration: 100,
      onComplete: () => {
        soundManager.playSFX('hit');
        this.tweens.add({
          targets: this.ryanBattleSprite,
          alpha: 0.1,
          duration: 80,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.playerHp = Math.max(0, this.playerHp - move.dmg);
            this.updateHpBars();

            if (this.playerHp <= 0) {
              this.handleDefeat();
            } else {
              this.time.delayedCall(1200, () => {
                this.battleLogText.setText('What will RYAN do?');
                this.isTurnExecuting = false;
              });
            }
          }
        });
      }
    });
  }

  private handleVictory() {
    this.isBattleOver = true;
    soundManager.stopBGM();
    soundManager.playSFX('victory');
    this.battleLogText.setText('Sanketh has been defeated!');

    this.tweens.add({
      targets: this.sankethBattleSprite,
      y: 700,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        const triggerDialogue = this.registry.get('triggerDialogue');
        triggerDialogue(
          'Sanketh',
          '/images/Sanketh.png',
          [
            'Oof! That Mubarak Beam was too strong. You are definitely ready for engineering college!',
            'Alright, you win. As promised, I am joining your party!',
            'Let us go build something cool in IEEE at UVCE campus. Level 2 complete!'
          ],
          () => {
            const updateParty = this.registry.get('updateParty');
            updateParty('Sanketh');

            const onSceneChange = this.registry.get('onSceneChange');
            onSceneChange('UVCE');
          }
        );
      }
    });
  }

  private handleDefeat() {
    this.isBattleOver = true;
    soundManager.stopBGM();
    soundManager.playSFX('defeat');
    this.battleLogText.setText('Ryan collapsed...!');
    this.time.delayedCall(2000, () => {
      this.scene.restart();
    });
  }
}

// ==========================================
// 4. UVCE SCENE (LEVEL 3: IEEE CO-OP BATTLE)
// ==========================================
class UVCEScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private sankethSprite!: Phaser.GameObjects.Image;
  private ieeeBoss!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private isLevelComplete = false;

  // Synergy Meter Dual Battle variables
  private inBattle = false;
  private bossHp = 100;
  private playerHp = 100;
  private bossMaxHp = 100;
  private playerMaxHp = 100;
  private synergyMeter = 0;

  private bossSpriteInBattle!: Phaser.GameObjects.Image;
  private ryanSpriteInBattle!: Phaser.GameObjects.Image;
  private sankethSpriteInBattle!: Phaser.GameObjects.Image;
  private battleLogText!: Phaser.GameObjects.Text;
  
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private synergyBar!: Phaser.GameObjects.Graphics;
  private synergyText!: Phaser.GameObjects.Text;
  
  private battleUIElements: Phaser.GameObjects.GameObject[] = [];
  private choiceUIElements: Phaser.GameObjects.GameObject[] = [];
  private vfxGraphics!: Phaser.GameObjects.Graphics;
  private dimOverlay!: Phaser.GameObjects.Graphics;

  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private introActive = false;

  constructor() {
    super('UVCEScene');
  }

  create() {
    console.log("[UVCEScene] create() called!");
    this.isLevelComplete = false;
    this.inBattle = false;
    this.introActive = true;
    this.bossHp = 100;
    this.playerHp = 100;
    this.synergyMeter = 0;
    this.battleUIElements = [];
    this.choiceUIElements = [];

    // Background
    const bg = this.add.image(400, 300, 'uvce_campus');
    bg.setDisplaySize(800, 600);

    soundManager.playBGM('school'); // upbeat campus overworld BGM

    // Overworld setup
    this.titleText = this.add.text(400, 40, 'Level 3: UVCE Quad (The Core-Gargoyle Duel)', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5).setStroke('#000000', 4);

    this.instructionText = this.add.text(400, 75, 'Walk up to Core-Gargoyle to start the battle!', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '9px',
      color: '#63b3ed',
    }).setOrigin(0.5).setStroke('#000000', 4);

    // Ryan overworld
    this.player = this.physics.add.sprite(150, 450, 'char_ryan_clean');
    const ryanRatio = this.player.width / this.player.height;
    this.player.setDisplaySize(115 * ryanRatio, 115);
    this.player.setCollideWorldBounds(true);

    // Sanketh follows Ryan on map
    this.sankethSprite = this.add.image(100, 470, 'char_sanketh_clean');
    const sankethRatio = this.sankethSprite.width / this.sankethSprite.height;
    this.sankethSprite.setDisplaySize(115 * sankethRatio, 115);

    // Core-Gargoyle Boss overworld setup
    this.ieeeBoss = this.physics.add.image(620, 260, 'char_boss_core_gargoyle_clean');
    const bossRatio = this.ieeeBoss.width / this.ieeeBoss.height;
    this.ieeeBoss.setDisplaySize(140 * bossRatio, 140);
    this.ieeeBoss.setImmovable(true);

    // Pulsing effect on boss
    this.tweens.add({
      targets: this.ieeeBoss,
      scaleX: this.ieeeBoss.scaleX * 1.05,
      scaleY: this.ieeeBoss.scaleY * 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;

    this.physics.add.collider(this.player, this.ieeeBoss, this.startIEEEBattle, undefined, this);

    // Create persistent graphics layer for VFX
    this.vfxGraphics = this.add.graphics();
    this.vfxGraphics.setDepth(10);

    // Trigger initial story context and instructions
    this.time.delayedCall(500, () => {
      const triggerDialogue = this.registry.get('triggerDialogue');
      triggerDialogue(
        'Sanketh',
        '/images/Sanketh.png',
        [
          'Oh no, Ryan! Look at that massive shadow blocking the quad entrance... It\'s the Core-Gargoyle!',
          'It represents all our incomplete assignments, pending lab records, and final project deadlines! My system is lagging, and my code won\'t compile. I\'m completely locked out! 😭'
        ],
        () => {
          triggerDialogue(
            'Ryan',
            '/images/Rayan.png',
            [
              'Don\'t panic, Sanketh! We\'ve hacked through tougher problems than this. Remember the compiler error crawls and all-nighters? We\'ll defeat it together!',
              'To beat the Core-Gargoyle, we need to build our Synergy Meter. As we face its stress, we\'ll sync up our choices. Aligning our minds will unlock our ultimate overclock!'
            ],
            () => {
              triggerDialogue(
                'Sanketh',
                '/images/Sanketh.png',
                [
                  'You\'re right, let\'s do this! Let\'s walk up to it and show it what we\'ve got. I\'ll follow your lead!'
                ],
                () => {
                  triggerDialogue(
                    'System',
                    '',
                    [
                      '💡 HOW TO PLAY:\n1. Use ARROWS / WASD to move Ryan on the map.\n2. Walk up to the Core-Gargoyle to initiate the battle.\n3. Make choice selections in the bottom console during breaks to build your Synergy.\n4. Defeat the gargoyle using your combined strength!'
                    ],
                    () => {
                      this.introActive = false;
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }

  update() {
    if (this.isLevelComplete) return;

    if (this.introActive) {
      this.player.setVelocity(0, 0);
      return;
    }
    
    if (!this.inBattle) {
      // Overworld controls
      let vx = 0;
      let vy = 0;
      const speed = 240;

      if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
      else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;

      if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
      else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

      this.player.setVelocity(vx, vy);

      // Walking hop animation
      if (vx !== 0 || vy !== 0) {
        const time = this.time.now;
        const hop = Math.abs(Math.sin(time * 0.015)) * 0.12;
        this.player.setOrigin(0.5, 0.5 + hop);
        
        // Sanketh follows behind
        this.sankethSprite.setPosition(this.player.x - 60, this.player.y + 10);
        this.sankethSprite.setOrigin(0.5, 0.5 + hop);
      } else {
        this.player.setOrigin(0.5, 0.5);
        this.sankethSprite.setOrigin(0.5, 0.5);
      }
    } else {
      this.player.setVelocity(0, 0);
    }
  }

  private startIEEEBattle() {
    if (this.inBattle) return;
    this.inBattle = true;
    soundManager.stopBGM();
    soundManager.playSFX('exclamation');

    // Flash white, and transition after the flash completes (300ms)
    this.cameras.main.flash(300, 255, 255, 255);
    this.time.delayedCall(300, () => {
      soundManager.playBGM('battle');
      this.setupBattleUI();
      this.startPhase1();
    });
  }

  private setupBattleUI() {
    console.log("[UVCEScene] setupBattleUI() called!");
    // Stop the pulsing overworld boss tween
    this.tweens.killTweensOf(this.ieeeBoss);

    // Hide/destroy overworld assets
    this.player.setVisible(false);
    this.sankethSprite.setVisible(false);
    if (this.ieeeBoss) {
      this.ieeeBoss.destroy();
    }
    if (this.titleText) {
      this.titleText.destroy();
    }
    if (this.instructionText) {
      this.instructionText.destroy();
    }

    // Battle platforms (depth: 0)
    const baseGraphics = this.add.graphics();
    baseGraphics.fillStyle(0x38bdf8, 0.2); // Cyan theme for UVCE
    baseGraphics.fillEllipse(220, 460, 320, 80); // player side
    baseGraphics.fillEllipse(580, 250, 240, 60); // boss side
    baseGraphics.setDepth(0);
    this.battleUIElements.push(baseGraphics);

    // Dim overlay for dialogue breaks (depth: 1)
    this.dimOverlay = this.add.graphics();
    this.dimOverlay.fillStyle(0x0f172a, 0);
    this.dimOverlay.fillRect(0, 0, 800, 600);
    this.dimOverlay.setVisible(false);
    this.dimOverlay.setDepth(1);
    this.battleUIElements.push(this.dimOverlay);

    // Ryan Battle sprite (depth: 2)
    this.ryanSpriteInBattle = this.add.image(180, 390, 'char_ryan_clean');
    const ryanRatio = this.ryanSpriteInBattle.width / this.ryanSpriteInBattle.height;
    this.ryanSpriteInBattle.setDisplaySize(180 * ryanRatio, 180);
    this.ryanSpriteInBattle.setDepth(2);
    this.battleUIElements.push(this.ryanSpriteInBattle);

    // Sanketh Battle sprite (depth: 2)
    this.sankethSpriteInBattle = this.add.image(280, 400, 'char_sanketh_clean');
    const sankethRatio = this.sankethSpriteInBattle.width / this.sankethSpriteInBattle.height;
    this.sankethSpriteInBattle.setDisplaySize(180 * sankethRatio, 180);
    this.sankethSpriteInBattle.setDepth(2);
    this.battleUIElements.push(this.sankethSpriteInBattle);

    // Core-Gargoyle Boss Battle sprite (depth: 2)
    this.bossSpriteInBattle = this.add.image(580, 200, 'char_boss_core_gargoyle_clean');
    const bossRatio = this.bossSpriteInBattle.width / this.bossSpriteInBattle.height;
    this.bossSpriteInBattle.setDisplaySize(180 * bossRatio, 180);
    this.bossSpriteInBattle.setDepth(2);
    this.battleUIElements.push(this.bossSpriteInBattle);

    // Player HUD box (depth: 3)
    const hud1 = this.add.rectangle(580, 440, 260, 55, 0x1a202c, 0.85).setStrokeStyle(3, 0xffffff);
    hud1.setDepth(3);
    const text1 = this.add.text(470, 423, 'PARTY HP', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '10px',
      color: '#ffffff',
    });
    text1.setDepth(3);
    this.playerHpBar = this.add.graphics();
    this.playerHpBar.setDepth(3);
    this.battleUIElements.push(hud1, text1, this.playerHpBar);

    // Boss HUD box (depth: 3)
    const hud2 = this.add.rectangle(580, 115, 260, 55, 0x1a202c, 0.85).setStrokeStyle(3, 0xffffff);
    hud2.setDepth(3);
    const text2 = this.add.text(470, 98, 'CORE-GARGOYLE Lv.50', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '10px',
      color: '#f87171',
    });
    text2.setDepth(3);
    this.bossHpBar = this.add.graphics();
    this.bossHpBar.setDepth(3);
    this.battleUIElements.push(hud2, text2, this.bossHpBar);

    // Synergy HUD box (depth: 3)
    const hud3 = this.add.rectangle(400, 50, 300, 45, 0x1a202c, 0.85).setStrokeStyle(2, 0x38bdf8);
    hud3.setDepth(3);
    const text3 = this.add.text(400, 40, 'SYNERGY METER', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '9px',
      color: '#38bdf8',
    }).setOrigin(0.5);
    text3.setDepth(3);
    this.synergyBar = this.add.graphics();
    this.synergyBar.setDepth(3);
    this.synergyText = this.add.text(400, 58, '0%', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '9px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.synergyText.setDepth(3);
    this.battleUIElements.push(hud3, text3, this.synergyBar, this.synergyText);

    // Text box bottom (depth: 3)
    const boxBg = this.add.rectangle(400, 540, 760, 80, 0x16171d, 0.9).setStrokeStyle(3, 0x4a5568);
    boxBg.setDepth(3);
    this.battleLogText = this.add.text(50, 520, 'Core-Gargoyle blocks your path!', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#ffffff',
      wordWrap: { width: 700 }
    });
    this.battleLogText.setDepth(3);
    this.battleUIElements.push(boxBg, this.battleLogText);

    this.updateHUD();
  }

  private updateHUD() {
    // Player HP Bar
    this.playerHpBar.clear();
    this.playerHpBar.fillStyle(0x4a5568, 1);
    this.playerHpBar.fillRect(470, 445, 220, 10);
    const pPct = Math.max(0, this.playerHp / this.playerMaxHp);
    const pCol = pPct > 0.5 ? 0x48bb78 : pPct > 0.2 ? 0xecc94b : 0xf56565;
    this.playerHpBar.fillStyle(pCol, 1);
    this.playerHpBar.fillRect(470, 445, 220 * pPct, 10);

    // Boss HP Bar
    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(0x4a5568, 1);
    this.bossHpBar.fillRect(470, 120, 220, 10);
    const bPct = Math.max(0, this.bossHp / this.bossMaxHp);
    const bCol = bPct > 0.5 ? 0x48bb78 : bPct > 0.2 ? 0xecc94b : 0xf56565;
    this.bossHpBar.fillStyle(bCol, 1);
    this.bossHpBar.fillRect(470, 120, 220 * bPct, 10);

    // Synergy Meter Bar
    this.synergyBar.clear();
    this.synergyBar.fillStyle(0x334155, 1);
    this.synergyBar.fillRect(270, 50, 260, 8);
    const sPct = Math.min(1.0, this.synergyMeter / 100);
    this.synergyBar.fillStyle(0x38bdf8, 1);
    this.synergyBar.fillRect(270, 50, 260 * sPct, 8);
    this.synergyText.setText(`${Math.round(this.synergyMeter)}%`);
  }

  private animateSynergyGain(targetVal: number, callback?: () => void) {
    this.tweens.add({
      targets: this,
      synergyMeter: targetVal,
      duration: 1000,
      onUpdate: () => this.updateHUD(),
      onComplete: () => {
        soundManager.playSFX('victory'); // chime
        if (callback) callback();
      }
    });
  }

  // ==========================================
  // PHASE 1: The Initial Encounter
  // ==========================================
  private startPhase1() {
    this.time.delayedCall(1000, () => {
      this.battleLogText.setText('Core-Gargoyle unleashes Git Merge Conflict!');
      
      // Boss attack animation: shake
      this.tweens.add({
        targets: this.bossSpriteInBattle,
        x: '-=20',
        yoyo: true,
        duration: 80,
        repeat: 5,
        onComplete: () => {
          soundManager.playSFX('hit');
          
          // Flash player sprites red
          this.tweens.add({
            targets: [this.ryanSpriteInBattle, this.sankethSpriteInBattle],
            alpha: 0.3,
            yoyo: true,
            duration: 100,
            repeat: 2,
            onComplete: () => {
              // Deal 30% damage to party
              this.playerHp = 70;
              this.updateHUD();

              this.time.delayedCall(1000, () => {
                const triggerDialogue = this.registry.get('triggerDialogue');
                triggerDialogue(
                  'Sanketh',
                  '/images/Sanketh.png',
                  [
                    'Man, this IEEE Hackathon deadline is brutal... feels like we\'re fighting a literal gargoyle.'
                  ],
                  () => {
                    triggerDialogue(
                      'Ryan',
                      '/images/Rayan.png',
                      [
                        'We didn\'t come all the way to UVCE to give up now. Let\'s talk strategy.'
                      ],
                      () => this.startPhase2()
                    );
                  }
                );
              });
            }
          });
        }
      });
    });
  }

  // ==========================================
  // PHASE 2: Canteen Break Dialogue #1
  // ==========================================
  private startPhase2() {
    // Transition to quad rooftop dialogue layout
    this.dimOverlay.clear();
    this.dimOverlay.fillStyle(0x0f172a, 0.4);
    this.dimOverlay.fillRect(0, 0, 800, 600);
    this.dimOverlay.setVisible(true);
    
    // Hide boss
    this.bossSpriteInBattle.setVisible(false);

    // Move sprites together in the center facing each other
    this.tweens.add({
      targets: this.ryanSpriteInBattle,
      x: 340,
      duration: 600,
    });
    this.tweens.add({
      targets: this.sankethSpriteInBattle,
      x: 460,
      duration: 600,
      onComplete: () => {
        // Trigger Sanketh conversation
        const triggerDialogue = this.registry.get('triggerDialogue');
        triggerDialogue(
          'Sanketh',
          '/images/Sanketh.png',
          [
            'Remember when we barely knew each other back in school and Aakash? Look at us now, hacking together at 2 AM.'
          ],
          () => this.showChoicePhase2()
        );
      }
    });
  }

  private showChoicePhase2() {
    this.showChoices(
      'From strangers in hallways to building core architecture together—we came a long way!',
      'I\'m just here so we don\'t fail the lab exam!',
      (choice) => {
        const gain = choice === 'A' ? 35 : 20;
        this.animateSynergyGain(gain, () => {
          const triggerDialogue = this.registry.get('triggerDialogue');
          triggerDialogue(
            'System',
            '',
            ['Their shared history strengthens the party\'s focus!'],
            () => this.startPhase3()
          );
        });
      }
    );
  }

  // ==========================================
  // PHASE 3: Core-Gargoyle Strikes Back
  // ==========================================
  private startPhase3() {
    // Restore battle scene
    this.dimOverlay.setVisible(false);
    this.bossSpriteInBattle.setVisible(true);

    this.tweens.add({
      targets: this.ryanSpriteInBattle,
      x: 180,
      duration: 600,
    });
    this.tweens.add({
      targets: this.sankethSpriteInBattle,
      x: 280,
      duration: 600,
      onComplete: () => {
        this.battleLogText.setText('Core-Gargoyle uses Surprise Lab Viva!');

        // Boss attacks
        this.tweens.add({
          targets: this.bossSpriteInBattle,
          x: '-=20',
          yoyo: true,
          duration: 80,
          repeat: 3,
          onComplete: () => {
            // Sanketh slides forward to block
            this.tweens.add({
              targets: this.sankethSpriteInBattle,
              x: 230,
              duration: 200,
              yoyo: true,
              repeat: 1,
              onComplete: () => {
                // Play defensive sound and show Grit Shield effect
                soundManager.playSFX('victory'); // block chime
                this.drawShieldEffect();

                this.time.delayedCall(1200, () => {
                  this.vfxGraphics.clear();
                  
                  const triggerDialogue = this.registry.get('triggerDialogue');
                  triggerDialogue(
                    'Sanketh',
                    '/images/Sanketh.png',
                    [
                      'I\'ll cover the defense! Ryan, what\'s our long-term plan after college?'
                    ],
                    () => this.startPhase4()
                  );
                });
              }
            });
          }
        });
      }
    });
  }

  private drawShieldEffect() {
    this.vfxGraphics.clear();
    // Draw expanding gold/blue shield arcs
    this.vfxGraphics.lineStyle(4, 0x38bdf8, 0.8);
    this.vfxGraphics.strokeCircle(200, 390, 80);
    this.vfxGraphics.lineStyle(2, 0xfacc15, 0.6);
    this.vfxGraphics.strokeCircle(200, 390, 95);
    
    // Add pulsing shield tween
    this.tweens.add({
      targets: this.vfxGraphics,
      alpha: 0,
      duration: 1000,
    });
  }

  // ==========================================
  // PHASE 4: Canteen Break Dialogue #2
  // ==========================================
  private startPhase4() {
    // Hide boss
    this.bossSpriteInBattle.setVisible(false);

    // Dim background to dark starry night
    this.dimOverlay.clear();
    this.dimOverlay.fillStyle(0x020617, 0.85); // starry sky bg
    this.dimOverlay.fillRect(0, 0, 800, 600);
    this.dimOverlay.setVisible(true);

    this.drawStarrySky();

    // Move sprites closer
    this.tweens.add({
      targets: this.ryanSpriteInBattle,
      x: 340,
      duration: 600,
    });
    this.tweens.add({
      targets: this.sankethSpriteInBattle,
      x: 460,
      duration: 600,
      onComplete: () => {
        // Removed tea cups to maintain visual style consistency

        const triggerDialogue = this.registry.get('triggerDialogue');
        triggerDialogue(
          'Sanketh',
          '/images/Sanketh.png',
          [
            'Seriously though... where do you see us in a few years? Think we\'ll actually make it in tech?'
          ],
          () => this.showChoicePhase4()
        );
      }
    });
  }

  private drawStarrySky() {
    const r = new Phaser.Math.RandomDataGenerator();
    for (let i = 0; i < 40; i++) {
      const x = r.between(20, 780);
      const y = r.between(20, 400);
      const size = r.between(1, 3);
      const opacity = r.realInRange(0.4, 1.0);
      this.dimOverlay.fillStyle(0xffffff, opacity);
      this.dimOverlay.fillRect(x, y, size, size);
    }
  }

  // Removed drawTeaCups implementation

  private showChoicePhase4() {
    this.showChoices(
      'We\'re going to flourish. Big tech, big products, side projects—whatever comes next, we\'ll dominate it.',
      'As long as there\'s good coffee and code, we\'ll figure it out.',
      (choice) => {
        const gain = choice === 'A' ? 35 : 25;
        const targetVal = this.synergyMeter + gain;
        this.animateSynergyGain(targetVal, () => {
          const triggerDialogue = this.registry.get('triggerDialogue');
          triggerDialogue(
            'System',
            '',
            ['A shared vision for the future fuels the battle!'],
            () => this.startPhase5()
          );
        });
      }
    );
  }

  // ==========================================
  // PHASE 5: The Final Surge & All-Nighter Overclock
  // ==========================================
  private startPhase5() {
    this.dimOverlay.setVisible(false);
    this.vfxGraphics.clear();
    this.bossSpriteInBattle.setVisible(true);

    this.tweens.add({
      targets: this.ryanSpriteInBattle,
      x: 180,
      duration: 600,
    });
    this.tweens.add({
      targets: this.sankethSpriteInBattle,
      x: 280,
      duration: 600,
      onComplete: () => {
        this.bossSpriteInBattle.setTint(0xff5555); // red glow
        this.battleLogText.setText('Core-Gargoyle enters Rage Mode and activates External Examiner Interrogation!');
        
        // Exposed chest board yellow flashes
        this.tweens.add({
          targets: this.bossSpriteInBattle,
          tint: 0xfacc15,
          duration: 150,
          yoyo: true,
          repeat: -1
        });

        this.time.delayedCall(1200, () => {
          const triggerDialogue = this.registry.get('triggerDialogue');
          triggerDialogue(
            'Sanketh',
            '/images/Sanketh.png',
            [
              'Synergy is maxing out! Time to combine our moves—Data Surge + Grit Shield!'
            ],
            () => this.showChoicePhase5()
          );
        });
      }
    });
  }

  private showChoicePhase5() {
    this.showChoices(
      'Execute \'All-Nighter Overclock\'!',
      '',
      () => {
        this.animateSynergyGain(100, () => {
          this.executeOverclockSequence();
        });
      }
    );
  }

  private executeOverclockSequence() {
    this.battleLogText.setText('Ryan and Sanketh execute All-Nighter Overclock!');
    this.bossSpriteInBattle.setTint(0xff3333);

    // Sprites float slightly
    this.tweens.add({
      targets: [this.ryanSpriteInBattle, this.sankethSpriteInBattle],
      y: '-=30',
      yoyo: true,
      repeat: 1,
      duration: 800,
    });

    let animationTimer = 0;
    const interval = this.time.addEvent({
      delay: 50,
      callback: () => {
        animationTimer += 50;
        this.vfxGraphics.clear();
        this.vfxGraphics.setAlpha(1.0);

        // Lightning coordinates (Sanketh to center)
        this.vfxGraphics.lineStyle(3, 0x38bdf8, 1.0);
        this.vfxGraphics.beginPath();
        let lx = 280;
        let ly = 370;
        const targetX = 430;
        const targetY = 290;
        
        this.vfxGraphics.moveTo(lx, ly);
        const steps = 4;
        for (let s = 1; s <= steps; s++) {
          const px = lx + (targetX - lx) * (s / steps) + Phaser.Math.Between(-15, 15);
          const py = ly + (targetY - ly) * (s / steps) + Phaser.Math.Between(-15, 15);
          this.vfxGraphics.lineTo(px, py);
        }
        this.vfxGraphics.strokePath();

        // Gold beam coordinates (Ryan to center)
        this.vfxGraphics.lineStyle(6, 0xfacc15, 0.9);
        this.vfxGraphics.beginPath();
        this.vfxGraphics.moveTo(180, 360);
        this.vfxGraphics.lineTo(targetX, targetY);
        this.vfxGraphics.strokePath();
        
        this.vfxGraphics.lineStyle(2, 0xffffff, 1.0);
        this.vfxGraphics.beginPath();
        this.vfxGraphics.moveTo(180, 360);
        this.vfxGraphics.lineTo(targetX, targetY);
        this.vfxGraphics.strokePath();

        if (animationTimer >= 1000) {
          interval.destroy();
          this.executeCombinedBurst();
        }
      },
      callbackScope: this,
      loop: true
    });

    soundManager.playSFX('text'); // Static sound
  }

  private executeCombinedBurst() {
    this.tweens.killTweensOf(this.bossSpriteInBattle);
    this.vfxGraphics.clear();
    
    soundManager.playSFX('hit');
    this.cameras.main.shake(600, 0.025);

    const burstCircle = this.add.circle(430, 290, 10, 0xffffff);
    this.tweens.add({
      targets: burstCircle,
      radius: 200,
      alpha: 0,
      duration: 600,
      onComplete: () => burstCircle.destroy()
    });

    this.tweens.add({
      targets: this.bossSpriteInBattle,
      x: '+=30',
      yoyo: true,
      duration: 50,
      repeat: 8,
      onComplete: () => {
        this.bossHp = 0;
        this.updateHUD();

        // Spin, shrink, shatter
        this.tweens.add({
          targets: this.bossSpriteInBattle,
          scaleX: 0,
          scaleY: 0,
          angle: 720,
          alpha: 0,
          duration: 1200,
          onComplete: () => {
            soundManager.playSFX('victory');
            this.battleLogText.setText('Core-Gargoyle was debugged and defeated! Level 3 cleared!');

            this.time.delayedCall(2000, () => {
              const triggerDialogue = this.registry.get('triggerDialogue');
              triggerDialogue(
                'Sanketh',
                '/images/Sanketh.png',
                [
                  'We did it, Ryan! That overclock fully debugged their deadlines and exams.',
                  'That is Level 3 complete. Now, we are entering the real corporate arena.',
                  'Let us head over to SAP Labs to face our next big boss battle!'
                ],
                () => {
                  const onSceneChange = this.registry.get('onSceneChange');
                  onSceneChange('SAP');
                }
              );
            });
          }
        });
      }
    });
  }

  // ==========================================
  // HELPER: Interactive Choice Box Renderer
  // ==========================================
  private showChoices(
    optionAText: string,
    optionBText: string,
    onSelect: (choice: 'A' | 'B') => void
  ) {
    const triggerChoices = this.registry.get('triggerChoices');
    triggerChoices(
      "CHOOSE RYAN'S RESPONSE:",
      optionAText,
      optionBText,
      onSelect
    );
  }
}

// ==========================================
// 5. SAP LABS & KALYAN NAGAR SCENE (LEVEL 4)
// ==========================================
class SAPScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private sankethSprite!: Phaser.GameObjects.Image;
  private anamSprite!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private sapBoss!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private barista!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // Progression Flags
  private staminaRestored = false;
  private anamRecruited = false;
  private shieldBroken = false;
  private isLevelComplete = false;

  // Battle variables
  private inBattle = false;
  private playerHp = 150;
  private playerMaxHp = 150;
  private bossHp = 200;
  private bossMaxHp = 200;
  private isTurnExecuting = false;

  // Battle visual sprites
  private bossSpriteInBattle!: Phaser.GameObjects.Image;
  private ryanSpriteInBattle!: Phaser.GameObjects.Image;
  private sankethSpriteInBattle!: Phaser.GameObjects.Image;
  private anamSpriteInBattle!: Phaser.GameObjects.Image;
  private battleLogText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  
  private overworldUIElements: any[] = [];
  private battleUIElements: any[] = [];

  constructor() {
    super('SAPScene');
  }

  create() {
    this.staminaRestored = false;
    this.anamRecruited = false;
    this.shieldBroken = false;
    this.isLevelComplete = false;
    this.inBattle = false;
    this.isTurnExecuting = false;
    
    this.overworldUIElements = [];
    this.battleUIElements = [];

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;

    this.loadSAPLocation();
  }

  private loadSAPLocation() {
    // Clear previous visual items
    this.overworldUIElements.forEach(el => el.destroy());
    this.overworldUIElements = [];

    // Background
    const bg = this.add.image(400, 300, 'sap_labs');
    bg.setDisplaySize(800, 600);
    this.overworldUIElements.push(bg);

    soundManager.playBGM('battle'); // office background uses driving sound

    const title = this.add.text(400, 40, 'Level 4: SAP Labs Office Lobby', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setStroke('#000000', 4);
    this.overworldUIElements.push(title);

    // Ryan overworld
    this.player = this.physics.add.sprite(150, 450, 'char_ryan_clean');
    const ryanRatio = this.player.width / this.player.height;
    this.player.setDisplaySize(115 * ryanRatio, 115);
    this.player.setCollideWorldBounds(true);
    this.overworldUIElements.push(this.player);

    // Sanketh follows
    this.sankethSprite = this.add.image(100, 470, 'char_sanketh_clean');
    const sankethRatio = this.sankethSprite.width / this.sankethSprite.height;
    this.sankethSprite.setDisplaySize(115 * sankethRatio, 115);
    this.overworldUIElements.push(this.sankethSprite);

    // Corporate Outage Boss
    this.sapBoss = this.physics.add.image(620, 260, 'char_anam_clean');
    this.sapBoss.setTint(0x5555ff); // Corporate blue tint
    const bossRatio = this.sapBoss.width / this.sapBoss.height;
    this.sapBoss.setDisplaySize(130 * bossRatio, 130);
    this.sapBoss.setImmovable(true);
    this.physics.add.collider(this.player, this.sapBoss, this.touchSAPBoss, undefined, this);
    this.overworldUIElements.push(this.sapBoss);

    // Anam (Spawns in Part 2)
    if (this.staminaRestored && !this.anamRecruited) {
      this.anamSprite = this.physics.add.image(400, 400, 'char_anam_clean');
      const anamRatio = this.anamSprite.width / this.anamSprite.height;
      this.anamSprite.setDisplaySize(110 * anamRatio, 110);
      this.anamSprite.setImmovable(true);
      this.physics.add.collider(this.player, this.anamSprite, this.talkToAnam, undefined, this);
      this.overworldUIElements.push(this.anamSprite);
      
      const promptText = this.add.text(400, 330, 'Talk to Anam!', {
        fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
        fontSize: '9px',
        color: '#63b3ed',
      }).setOrigin(0.5).setStroke('#000000', 3);
      this.overworldUIElements.push(promptText);
    }
  }

  private loadKalyanNagarLocation() {
    this.overworldUIElements.forEach(el => el.destroy());
    this.overworldUIElements = [];

    // Cafe Background
    const bg = this.add.image(400, 300, 'kalyan_nagar_cafe');
    bg.setDisplaySize(800, 600);
    this.overworldUIElements.push(bg);

    soundManager.playBGM('cafe'); // Cozy café theme

    const title = this.add.text(400, 40, 'Kalyan Nagar Café (Refill Loop)', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setStroke('#000000', 4);
    this.overworldUIElements.push(title);

    const helpText = this.add.text(400, 75, 'Walk to the counter and talk to the Barista!', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '9px',
      color: '#f6ad55',
    }).setOrigin(0.5).setStroke('#000000', 4);
    this.overworldUIElements.push(helpText);

    // Ryan overworld
    this.player = this.physics.add.sprite(150, 450, 'char_ryan_clean');
    const ryanRatio = this.player.width / this.player.height;
    this.player.setDisplaySize(115 * ryanRatio, 115);
    this.player.setCollideWorldBounds(true);
    this.overworldUIElements.push(this.player);

    // Sanketh follows
    this.sankethSprite = this.add.image(100, 470, 'char_sanketh_clean');
    const sankethRatio = this.sankethSprite.width / this.sankethSprite.height;
    this.sankethSprite.setDisplaySize(115 * sankethRatio, 115);
    this.overworldUIElements.push(this.sankethSprite);

    // Barista (Cafe Clerk NPC)
    this.barista = this.physics.add.image(550, 280, 'char_anam_clean');
    const baristaRatio = this.barista.width / this.barista.height;
    this.barista.setDisplaySize(110 * baristaRatio, 110);
    this.barista.setImmovable(true);
    this.physics.add.collider(this.player, this.barista, this.talkToBarista, undefined, this);
    this.overworldUIElements.push(this.barista);
  }

  update() {
    if (this.isLevelComplete || this.inBattle) {
      if (this.player) this.player.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;
    const speed = 240;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;

    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

    this.player.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      const time = this.time.now;
      const hop = Math.abs(Math.sin(time * 0.015)) * 0.12;
      this.player.setOrigin(0.5, 0.5 + hop);
      this.sankethSprite.setPosition(this.player.x - 60, this.player.y + 10);
      this.sankethSprite.setOrigin(0.5, 0.5 + hop);
    } else {
      this.player.setOrigin(0.5, 0.5);
      this.sankethSprite.setOrigin(0.5, 0.5);
    }
  }

  private touchSAPBoss() {
    if (this.inBattle) return;

    if (!this.staminaRestored) {
      // Scripted Wipeout Battle
      this.inBattle = true;
      soundManager.stopBGM();
      soundManager.playSFX('exclamation');

      const triggerDialogue = this.registry.get('triggerDialogue');
      triggerDialogue(
        'SAP Outage Boss',
        '/images/Anam.png',
        [
          'SERVER OUTAGE COMPROMISED! OVERTIME DETECTED!',
          'Your stamina levels are too low to process this bug!',
          'BEHOLD MY CORE CRITICAL SHIFT ERUPTION!'
        ],
        () => {
          this.executeWipeout();
        }
      );
    } else if (!this.anamRecruited) {
      // Boss has Unresolved Bug Shield
      soundManager.playSFX('exclamation');
      const triggerDialogue = this.registry.get('triggerDialogue');
      triggerDialogue(
        'Sanketh',
        '/images/Sanketh.png',
        [
          'Oh no! The Corporate Outage Boss activated the [Unresolved Bug Shield]!',
          'Our attacks are dealing 0 damage! We cannot break through!',
          'A text hint appears: "You need a backend wizard who knows the logic!"',
          'Let us find Anam! She was seen in the office lobby area nearby!'
        ],
        () => {
          this.loadSAPLocation(); // Refresh to spawn Anam
        }
      );
    } else {
      // Real Final Fight!
      this.inBattle = true;
      soundManager.stopBGM();
      this.cameras.main.flash(300, 255, 255, 255);
      this.time.delayedCall(300, () => {
        soundManager.playBGM('battle');
        this.setupFinalBattleUI();
      });
    }
  }

  private executeWipeout() {
    this.cameras.main.flash(200, 255, 0, 0);
    soundManager.playSFX('hit');

    this.cameras.main.fadeOut(1000, 0, 0, 0, (_camera: any, progress: number) => {
      if (progress === 1) {
        soundManager.playSFX('defeat');
        const triggerDialogue = this.registry.get('triggerDialogue');
        triggerDialogue(
          'Narrator',
          '/images/Rayan.png',
          [
            'Ryan and Sanketh collapsed under overtime pressure...!',
            'Stamina too low! Go refresh at Kalyan Nagar Café!'
          ],
          () => {
            this.cameras.main.fadeIn(500, 0, 0, 0);
            this.loadKalyanNagarLocation();
            this.inBattle = false;
          }
        );
      }
    });
  }

  private talkToBarista() {
    soundManager.playSFX('click');
    const triggerDialogue = this.registry.get('triggerDialogue');
    triggerDialogue(
      'Barista Clerk',
      '/images/Anam.png',
      [
        'Welcome to Café Pokémon Center! You guys look absolutely drained.',
        'Here is our Special Espresso Brew, freshly ground and whipped!',
        'Drink up to fully restore your health and overtime stamina!'
      ],
      () => {
        soundManager.playSFX('victory');
        this.cameras.main.flash(500, 255, 255, 100);
        
        triggerDialogue(
          'Narrator',
          '/images/Rayan.png',
          [
            'Ryan and Sanketh drank the Special Espresso Brew!',
            'HP restored to full! Stamina is fully replenished!',
            'Let us return to SAP Labs lobby and face the boss!'
          ],
          () => {
            this.staminaRestored = true;
            this.loadSAPLocation();
          }
        );
      }
    );
  }

  private talkToAnam() {
    soundManager.playSFX('click');
    const triggerDialogue = this.registry.get('triggerDialogue');
    triggerDialogue(
      'Anam',
      '/images/Anam.png',
      [
        'Hey guys! I heard there is a critical server crash and shield issue.',
        'Need a backend wizard who actually knows the logical flow?',
        'Count me in! I will use [Clutch Assist] to override that Outage Shield.',
        'Let us go crush this corporate overtime once and for all!'
      ],
      () => {
        soundManager.playSFX('victory');
        const updateParty = this.registry.get('updateParty');
        updateParty('Anam');
        this.anamRecruited = true;
        this.loadSAPLocation();
      }
    );
  }

  private setupFinalBattleUI() {
    // Hide overworld
    this.overworldUIElements.forEach(el => el.setVisible(false));

    // platforms
    const graphics = this.add.graphics();
    graphics.fillStyle(0x3182ce, 0.4);
    graphics.fillEllipse(250, 460, 360, 80); // player base
    graphics.fillEllipse(580, 240, 240, 60); // boss base
    this.battleUIElements.push(graphics);

    // Ryan Battle sprite
    this.ryanSpriteInBattle = this.add.image(150, 400, 'char_ryan_clean');
    const ryanRatio = this.ryanSpriteInBattle.width / this.ryanSpriteInBattle.height;
    this.ryanSpriteInBattle.setDisplaySize(160 * ryanRatio, 160);
    this.battleUIElements.push(this.ryanSpriteInBattle);

    // Sanketh Battle sprite
    this.sankethSpriteInBattle = this.add.image(240, 410, 'char_sanketh_clean');
    const sankethRatio = this.sankethSpriteInBattle.width / this.sankethSpriteInBattle.height;
    this.sankethSpriteInBattle.setDisplaySize(160 * sankethRatio, 160);
    this.battleUIElements.push(this.sankethSpriteInBattle);

    // Anam Battle sprite
    this.anamSpriteInBattle = this.add.image(320, 410, 'char_anam_clean');
    const anamRatio = this.anamSpriteInBattle.width / this.anamSpriteInBattle.height;
    this.anamSpriteInBattle.setDisplaySize(160 * anamRatio, 160);
    this.battleUIElements.push(this.anamSpriteInBattle);

    // SAP Boss Battle sprite
    this.bossSpriteInBattle = this.add.image(580, 190, 'char_anam_clean');
    this.bossSpriteInBattle.setTint(0x5555ff);
    const bossRatio = this.bossSpriteInBattle.width / this.bossSpriteInBattle.height;
    this.bossSpriteInBattle.setDisplaySize(150 * bossRatio, 150);
    this.battleUIElements.push(this.bossSpriteInBattle);

    // Player HUD (Positioned at bottom-right above text box to prevent overlap)
    const hud1 = this.add.rectangle(580, 440, 260, 55, 0x1a202c, 0.85).setStrokeStyle(3, 0xffffff);
    const text1 = this.add.text(470, 423, 'PARTY HP', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#ffffff',
    });
    this.playerHpBar = this.add.graphics();
    this.battleUIElements.push(hud1, text1, this.playerHpBar);

    // Boss HUD
    const hud2 = this.add.rectangle(580, 115, 260, 55, 0x1a202c, 0.85).setStrokeStyle(3, 0xffffff);
    const text2 = this.add.text(470, 98, 'SAP OUTAGE BOSS', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#ffffff',
    });
    this.bossHpBar = this.add.graphics();
    this.battleUIElements.push(hud2, text2, this.bossHpBar);

    this.updateHpBars();

    // Box bottom
    const boxBg = this.add.rectangle(400, 540, 760, 80, 0x16171d, 0.9).setStrokeStyle(3, 0x4a5568);
    this.battleLogText = this.add.text(50, 520, 'Outage Shield is active! Attacks deal 0 damage!', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '10px',
      color: '#ffffff',
      wordWrap: { width: 700 }
    });
    this.battleUIElements.push(boxBg, this.battleLogText);

    this.createFinalBattleMenu();
  }

  private createFinalBattleMenu() {
    const buttons = [
      { text: 'Clutch Assist (Anam)', x: 180, y: 565, action: () => this.executeFinalTurn('anam') },
      { text: 'Data Surge (Sanketh)', x: 400, y: 565, action: () => this.executeFinalTurn('sanketh') },
      { text: 'Mubarak Beam (Ryan)', x: 620, y: 565, action: () => this.executeFinalTurn('ryan') }
    ];

    buttons.forEach((btn) => {
      const t = this.add.text(btn.x, btn.y, btn.text, {
        fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
        fontSize: '9px',
        color: '#f687b3',
        backgroundColor: '#2d3748',
        padding: { x: 8, y: 5 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.battleUIElements.push(t);

      t.on('pointerover', () => t.setColor('#ffffff'));
      t.on('pointerout', () => t.setColor('#f687b3'));
      t.on('pointerdown', () => {
        if (this.isLevelComplete || this.isTurnExecuting) return;
        soundManager.playSFX('click');
        btn.action();
      });
    });
  }

  private updateHpBars() {
    // Player HP
    this.playerHpBar.clear();
    this.playerHpBar.fillStyle(0x4a5568, 1);
    this.playerHpBar.fillRect(470, 445, 220, 10);
    const pPct = Math.max(0, this.playerHp / this.playerMaxHp);
    const pCol = pPct > 0.5 ? 0x48bb78 : pPct > 0.2 ? 0xecc94b : 0xf56565;
    this.playerHpBar.fillStyle(pCol, 1);
    this.playerHpBar.fillRect(470, 445, 220 * pPct, 10);

    // Boss HP
    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(0x4a5568, 1);
    this.bossHpBar.fillRect(470, 120, 220, 10);
    const bPct = Math.max(0, this.bossHp / this.bossMaxHp);
    const bCol = bPct > 0.5 ? 0x48bb78 : bPct > 0.2 ? 0xecc94b : 0xf56565;
    this.bossHpBar.fillStyle(bCol, 1);
    this.bossHpBar.fillRect(470, 120, 220 * bPct, 10);
  }

  private executeFinalTurn(attacker: 'anam' | 'sanketh' | 'ryan') {
    this.isTurnExecuting = true;
    let damage = 0;
    let log = '';

    if (attacker === 'anam') {
      this.shieldBroken = true;
      damage = 40;
      log = 'Anam uses Clutch Assist!\nThe SAP Outage Shield has been completely shattered!';
    } else if (attacker === 'sanketh') {
      damage = this.shieldBroken ? 50 : 0;
      log = this.shieldBroken 
        ? 'Sanketh casts Data Surge!\nThe crash is bypassed!'
        : 'Sanketh casts Data Surge!\nBut the shield absorbs the impact (0 damage)!';
    } else if (attacker === 'ryan') {
      damage = this.shieldBroken ? 90 : 0;
      log = this.shieldBroken
        ? 'Ryan triggers the Mubarak Beam!\nWedding energy completely compromises the bugs!'
        : 'Ryan triggers the Mubarak Beam!\nBut the corporate shield deflects it (0 damage)!';
    }

    this.battleLogText.setText(log);

    // Shake attacker
    let targetSprite = this.ryanSpriteInBattle;
    if (attacker === 'anam') targetSprite = this.anamSpriteInBattle;
    else if (attacker === 'sanketh') targetSprite = this.sankethSpriteInBattle;

    this.tweens.add({
      targets: targetSprite,
      x: '+=20',
      yoyo: true,
      duration: 100,
      onComplete: () => {
        soundManager.playSFX('hit');
        this.tweens.add({
          targets: this.bossSpriteInBattle,
          alpha: 0.2,
          duration: 80,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.bossHp = Math.max(0, this.bossHp - damage);
            this.updateHpBars();

            if (this.bossHp <= 0) {
              this.handleVictory();
            } else {
              this.time.delayedCall(1500, () => this.executeBossTurn());
            }
          }
        });
      }
    });
  }

  private executeBossTurn() {
    const attacks = [
      { name: 'Overtime Shift', dmg: 25, log: 'SAP Boss casts Overtime Shift!\nYour stamina takes a hit!' },
      { name: 'Production Crash', dmg: 35, log: 'SAP Boss triggers a Production Crash!\nCritical server failure!' }
    ];

    const move = attacks[Math.floor(Math.random() * attacks.length)];
    this.battleLogText.setText(move.log);

    this.tweens.add({
      targets: this.bossSpriteInBattle,
      x: '-=20',
      yoyo: true,
      duration: 100,
      onComplete: () => {
        soundManager.playSFX('hit');
        this.tweens.add({
          targets: [this.ryanSpriteInBattle, this.sankethSpriteInBattle, this.anamSpriteInBattle],
          alpha: 0.2,
          duration: 80,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.playerHp = Math.max(0, this.playerHp - move.dmg);
            this.updateHpBars();

            if (this.playerHp <= 0) {
              this.handleDefeat();
            } else {
              this.time.delayedCall(1200, () => {
                this.battleLogText.setText(this.shieldBroken ? 'What will your party do?' : 'Shield is active! Break it first!');
                this.isTurnExecuting = false;
              });
            }
          }
        });
      }
    });
  }

  private handleVictory() {
    this.isLevelComplete = true;
    soundManager.stopBGM();
    soundManager.playSFX('victory');
    this.battleLogText.setText('SAP Outage Boss has been defeated!');

    this.tweens.add({
      targets: this.bossSpriteInBattle,
      y: 700,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        const triggerDialogue = this.registry.get('triggerDialogue');
        triggerDialogue(
          'Anam',
          '/images/Anam.png',
          [
            'Logical bugs: solved! Server status: green and stable!',
            'Ryan, you are finally free from SAP overtime shift!',
            'Level 4 complete. Now, a golden reveal awaits you!'
          ],
          () => {
            const onSceneChange = this.registry.get('onSceneChange');
            onSceneChange('ENDING');
          }
        );
      }
    });
  }

  private handleDefeat() {
    soundManager.stopBGM();
    soundManager.playSFX('defeat');
    this.battleLogText.setText('Your party fainted...');
    this.time.delayedCall(2000, () => {
      this.scene.restart();
    });
  }
}

// ==========================================
// 6. ENDING SCENE (CROSSROADS & POKEBALL)
// ==========================================
class EndingScene extends Phaser.Scene {
  private ryanSprite!: Phaser.GameObjects.Image;
  private sankethSprite!: Phaser.GameObjects.Image;
  private pokeball!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private isPokeballClickable = false;

  constructor() {
    super('EndingScene');
  }

  create() {
    this.isPokeballClickable = false;

    // Background (Sunset Crossroads)
    const bg = this.add.image(400, 300, 'sunset_crossroads');
    bg.setDisplaySize(800, 600);

    soundManager.playBGM('ending'); // nostalgic emotional ending BGM

    this.add.text(400, 40, 'The Crossroads (Ash & Brock Farewell)', {
      fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setStroke('#000000', 4);

    // Characters sized nicely (Ryan left, Sanketh right)
    this.ryanSprite = this.add.image(280, 400, 'char_ryan_clean');
    const ryanRatio = this.ryanSprite.width / this.ryanSprite.height;
    this.ryanSprite.setDisplaySize(115 * ryanRatio, 115);

    this.sankethSprite = this.add.image(520, 400, 'char_sanketh_clean');
    const sankethRatio = this.sankethSprite.width / this.sankethSprite.height;
    this.sankethSprite.setDisplaySize(115 * sankethRatio, 115);

    // Trigger farewell dialogue
    this.time.delayedCall(1000, () => {
      const triggerDialogue = this.registry.get('triggerDialogue');
      triggerDialogue(
        'Sanketh',
        '/images/Sanketh.png',
        [
          'We conquered School, Aakash, UVCE, and SAP together...',
          'But my next journey takes me across the ocean.',
          'It is time for us to walk our separate paths.'
        ],
        () => {
          triggerDialogue(
            'Ryan',
            '/images/Rayan.png',
            [
              'No matter how far the map stretches, Sanketh...',
              'Our party line-up never changes.'
            ],
            () => {
              this.executeFarewellAnimation();
            }
          );
        }
      );
    });
  }

  private executeFarewellAnimation() {
    soundManager.playSFX('click'); // high five sound

    // Show a quick flash
    this.cameras.main.flash(200, 255, 255, 255);

    // Walk away down separate paths
    this.tweens.add({
      targets: this.ryanSprite,
      x: 80,
      alpha: 0.7,
      duration: 2500,
      ease: 'Power1'
    });

    this.tweens.add({
      targets: this.sankethSprite,
      x: 720,
      alpha: 0.7,
      duration: 2500,
      ease: 'Power1',
      onComplete: () => {
        // Drop Golden Pokéball
        this.dropGoldenPokeball();
      }
    });
  }

  private dropGoldenPokeball() {
    soundManager.playSFX('exclamation');
    
    // Spawn Pokéball at top
    this.pokeball = this.physics.add.image(400, -50, 'char_ryan_clean'); // placeholder texture, we will draw a golden ball
    this.pokeball.setTint(0xffd700); // Golden color
    this.pokeball.setDisplaySize(50, 50);

    // Bounce animation
    this.tweens.add({
      targets: this.pokeball,
      y: 400,
      ease: 'Bounce',
      duration: 1200,
      onComplete: () => {
        // Sparkle text
        const sparkles = this.add.text(400, 340, 'CLICK ME!', {
          fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
          fontSize: '11px',
          color: '#ffd700',
        }).setOrigin(0.5);

        this.tweens.add({
          targets: sparkles,
          alpha: 0.2,
          yoyo: true,
          repeat: -1,
          duration: 400
        });

        // Make pokeball clickable
        this.pokeball.setInteractive({ useHandCursor: true });
        this.isPokeballClickable = true;
        this.pokeball.on('pointerdown', () => {
          if (!this.isPokeballClickable) return;
          this.isPokeballClickable = false;
          soundManager.playSFX('victory');
          
          // Trigger final game complete React callback
          const onGameComplete = this.registry.get('onGameComplete');
          onGameComplete();
        });
      }
    });
  }
}
