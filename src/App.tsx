import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { DialogueBox } from './components/DialogueBox';
import { soundManager } from './utils/sound';

type GameScene = 'LANDING' | 'SCHOOL' | 'BATTLE' | 'UVCE' | 'SAP' | 'ENDING';

interface DialogueState {
  speaker: string;
  avatar: string;
  lines: string[];
  currentIndex: number;
  callback: () => void;
}

interface ChoiceState {
  title: string;
  optionA: string;
  optionB: string;
  callback: (choice: 'A' | 'B') => void;
}

function App() {
  const [activeScene, setActiveScene] = useState<GameScene>('LANDING');
  const [party, setParty] = useState<string[]>(['Rayan']);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [choices, setChoices] = useState<ChoiceState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showWeddingCard, setShowWeddingCard] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

  // Check URL query parameters to jump directly to specific scenes for testing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sceneParam = params.get('scene')?.toUpperCase() as GameScene | null;
    if (sceneParam && ['SCHOOL', 'BATTLE', 'UVCE', 'SAP', 'ENDING'].includes(sceneParam)) {
      setActiveScene(sceneParam);
      // Pre-populate party based on the scene for correct rendering and mechanics
      if (sceneParam === 'UVCE' || sceneParam === 'SAP') {
        setParty(['Rayan', 'Sanketh']);
      } else if (sceneParam === 'ENDING') {
        setParty(['Rayan', 'Sanketh', 'Anam']);
      }
    }
  }, []);

  // Keyboard space listener to advance dialogue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (dialogue) {
          e.preventDefault();
          advanceDialogue();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogue]);

  const advanceDialogue = () => {
    if (!dialogue) return;

    if (dialogue.currentIndex < dialogue.lines.length - 1) {
      setDialogue({
        ...dialogue,
        currentIndex: dialogue.currentIndex + 1,
      });
    } else {
      // Done with all dialogue lines
      const callback = dialogue.callback;
      setDialogue(null);
      if (callback) callback();
    }
  };

  const handleStartGame = () => {
    soundManager.playSFX('click');
    setParty(['Rayan']);
    setShowEndScreen(false);
    setShowWeddingCard(false);
    setActiveScene('SCHOOL');
  };

  const handleCloseWeddingCard = () => {
    soundManager.playSFX('click');
    setShowWeddingCard(false);
    // Notify Phaser to start the farewell cutscene
    if ((window as any).activePhaserGame) {
      (window as any).activePhaserGame.registry.set('startFarewell', true);
    }
  };

  const handleMuteToggle = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Helper passed to Phaser to trigger dialogue from inside scenes
  const triggerDialogueFromPhaser = (
    speaker: string,
    avatar: string,
    lines: string[],
    onComplete: () => void
  ) => {
    setDialogue({
      speaker,
      avatar,
      lines,
      currentIndex: 0,
      callback: onComplete,
    });
  };

  // Helper passed to Phaser to trigger choice selections from inside scenes
  const triggerChoicesFromPhaser = (
    title: string,
    optionA: string,
    optionB: string,
    onSelect: (choice: 'A' | 'B') => void
  ) => {
    setChoices({
      title,
      optionA,
      optionB,
      callback: onSelect,
    });
  };

  // Helper to add member to party
  const updateParty = (member: string) => {
    if (!party.includes(member)) {
      setParty((prev) => [...prev, member]);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-neutral-950 font-mono relative overflow-hidden select-none">

      {/* Mute Button (Top Right) */}
      {activeScene !== 'LANDING' && (
        <button
          onClick={handleMuteToggle}
          className="absolute top-4 right-4 z-50 retro-border-green bg-neutral-900 text-green-400 text-[10px] px-3 py-2 cursor-pointer hover:bg-neutral-800"
        >
          {isMuted ? 'UNMUTE BGM 🔈' : 'MUTE BGM 🔊'}
        </button>
      )}

      {/* Outer game screen wrapper */}
      {activeScene === 'LANDING' ? (
        <div className="w-[800px] h-[600px] relative border-4 border-white retro-border bg-black overflow-hidden flex flex-col justify-between p-8 bg-radial from-emerald-900 via-neutral-900 to-neutral-950">
          {/* Retro floating details */}
          <div className="absolute top-4 left-4 text-emerald-500 text-[8px] animate-pulse">SANKETH PRESENTS</div>
          <div className="absolute top-4 right-4 text-emerald-500 text-[8px]">VERSION 1.0</div>

          <div className="flex flex-col items-center mt-16 z-10">
            {/* Game Title */}
            <h1 className="text-white text-lg md:text-2xl text-center font-bold tracking-widest leading-relaxed drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              RAYAN'S <br />
              <span className="text-yellow-400">POKÉMON</span> <br />
              JOURNEY
            </h1>
            <p className="text-neutral-400 text-[9px] mt-4 tracking-wider uppercase text-center">
              A Wedding Gift Adventure
            </p>
          </div>

          {/* Character Portraits Preview */}
          <div className="flex gap-4 justify-center items-center my-6 z-10">
            <div className="w-16 h-16 border-2 border-blue-400 rounded bg-neutral-800 overflow-hidden flex items-center justify-center">
              <img src="/images/Rayan.png" alt="Rayan" className="w-full h-full object-cover pixel-avatar" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="w-16 h-16 border-2 border-purple-400 rounded bg-neutral-800 overflow-hidden flex items-center justify-center">
              <img src="/images/Sanketh.png" alt="Sanketh" className="w-full h-full object-cover pixel-avatar" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="w-16 h-16 border-2 border-rose-400 rounded bg-neutral-800 overflow-hidden flex items-center justify-center">
              <img src="/images/Anam.png" alt="Anam" className="w-full h-full object-cover pixel-avatar" style={{ imageRendering: 'pixelated' }} />
            </div>
          </div>

          <div className="flex flex-col items-center mb-16 z-10">
            <button
              onClick={handleStartGame}
              className="retro-border bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[12px] px-8 py-3 animate-pulse cursor-pointer"
            >
              PRESS START
            </button>
            <p className="text-neutral-500 text-[8px] mt-6 tracking-wide">
              © 2026 Sanketh. All rights reserved.
            </p>
          </div>
        </div>
      ) : (
        /* The split console screen */
        <div className="flex flex-col w-[800px] bg-neutral-950 border-4 border-white retro-border overflow-hidden relative">

          {/* Top Game Viewport (800x600) */}
          <div className="w-[800px] h-[600px] relative bg-black">
            <GameCanvas
              currentScene={activeScene}
              onSceneChange={(scene) => setActiveScene(scene as GameScene)}
              triggerDialogue={triggerDialogueFromPhaser}
              triggerChoices={triggerChoicesFromPhaser}
              updateParty={updateParty}
              onGameComplete={() => {
                setShowWeddingCard(true);
              }}
              onShowEndScreen={() => {
                setShowEndScreen(true);
              }}
            />

            {/* Party Overlay HUD (Top left overlay) */}
            <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 pointer-events-none">
              <div className="text-[7px] text-gray-400 tracking-widest bg-neutral-900/80 px-2 py-1 border border-neutral-700">PARTY MEMBERS:</div>
              <div className="flex gap-2">
                {party.map((member) => (
                  <div key={member} className="flex items-center gap-1 bg-neutral-900/90 border border-white p-1 text-[9px] text-white">
                    <img
                      src={`/images/${member}.png`}
                      alt={member}
                      className="w-4 h-4 object-cover pixel-avatar"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="uppercase text-[8px]">{member}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[4px] bg-white w-full" />

          {/* Bottom Console Dialog/Status Screen (800x140) */}
          <div className="w-[800px] h-[140px] bg-neutral-950 relative flex items-center justify-center p-4">
            {dialogue ? (
              <DialogueBox
                speaker={dialogue.speaker}
                avatarUrl={dialogue.avatar}
                text={dialogue.lines[dialogue.currentIndex]}
                onComplete={advanceDialogue}
              />
            ) : choices ? (
              /* Beautiful retro choice selection UI in the bottom console! */
              <div className="w-full h-full flex flex-col justify-center text-left select-none font-sans text-neutral-400">
                <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider mb-2 font-mono">
                  {choices.title}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      soundManager.playSFX('click');
                      const callback = choices.callback;
                      setChoices(null);
                      callback('A');
                    }}
                    className="w-full text-left bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-yellow-400 text-white text-[11px] font-mono px-3 py-1.5 cursor-pointer transition-colors retro-border-small"
                  >
                    A: {choices.optionA}
                  </button>
                  {choices.optionB && (
                    <button
                      onClick={() => {
                        soundManager.playSFX('click');
                        const callback = choices.callback;
                        setChoices(null);
                        callback('B');
                      }}
                      className="w-full text-left bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-yellow-400 text-white text-[11px] font-mono px-3 py-1.5 cursor-pointer transition-colors retro-border-small"
                    >
                      B: {choices.optionB}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Beautiful retro dashboard status screen when there is no dialogue active */
              <div className="w-full h-full flex justify-between items-center text-left select-none font-sans text-neutral-400">
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] text-neutral-500 tracking-wider">CONSOLE STATUS:</span>
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest animate-pulse">● PLAYING GAME</span>
                  <span className="text-[8px] text-neutral-500">Controls: ARROWS / WASD to Move | SPACE to Advance Dialogues</span>
                </div>
                <div className="flex gap-3">
                  <div className="text-[8px] border border-neutral-750 px-2 py-1 bg-neutral-900 rounded flex items-center gap-1">
                    <span className="text-blue-400 font-bold">RAYAN:</span> LV 18
                  </div>
                  <div className="text-[8px] border border-neutral-750 px-2 py-1 bg-neutral-900 rounded flex items-center gap-1">
                    <span className="text-purple-400 font-bold">SANKETH:</span> LV 18
                  </div>
                  {party.includes('Anam') && (
                    <div className="text-[8px] border border-neutral-750 px-2 py-1 bg-neutral-900 rounded flex items-center gap-1 animate-pulse">
                      <span className="text-rose-400 font-bold">ANAM:</span> LV 18
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* The End Screen Overlay */}
          {showEndScreen && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/95 animate-[fadeIn_0.5s_ease-out]">
              <h2 className="text-yellow-400 text-2xl uppercase tracking-widest font-bold mb-2 animate-pulse text-center">
                THE END
              </h2>
              <p className="text-neutral-400 text-[10px] uppercase tracking-wider mb-8 text-center max-w-[400px]">
                Thank you for playing Rayan's Pokémon Journey!
              </p>
              <button 
                onClick={() => {
                  soundManager.playSFX('click');
                  setShowEndScreen(false);
                  setActiveScene('LANDING');
                  setParty(['Rayan']);
                }}
                className="retro-border bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[11px] px-8 py-3 cursor-pointer"
              >
                PLAY AGAIN ↩
              </button>
            </div>
          )}

          {/* The Golden Pokéball Wedding Reveal Card (Redesigned Full-Screen GBA overlay) */}
          {showWeddingCard && (
            <div 
              style={{ position: 'absolute' }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 crt-overlay animate-[fadeIn_0.5s_ease-out] overflow-hidden"
            >
              
              {/* Custom CSS Style Injection for CRT scanlines and GBA-style Animations */}
              <style>{`
                @keyframes floatUp {
                  0% {
                    transform: translateY(110vh) rotate(0deg);
                    opacity: 0;
                  }
                  10% {
                    opacity: 0.65;
                  }
                  90% {
                    opacity: 0.65;
                  }
                  100% {
                    transform: translateY(-10vh) rotate(360deg);
                    opacity: 0;
                  }
                }
                .celebrate-item {
                  position: absolute;
                  bottom: -60px;
                  animation: floatUp 8s infinite linear;
                  pointer-events: none;
                  z-index: 10;
                  color: #fbbf24; /* amber-400 */
                }
                .crt-overlay::after {
                  content: " ";
                  display: block;
                  position: absolute;
                  top: 0; left: 0; bottom: 0; right: 0;
                  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                  z-index: 20;
                  background-size: 100% 4px, 6px 100%;
                  pointer-events: none;
                }
              `}</style>

              {/* Animated Floating Celebratory Elements (Gold Sparkles) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <span className="celebrate-item text-xl" style={{ left: '10%', animationDuration: '9s', animationDelay: '0s' }}>✨</span>
                <span className="celebrate-item text-2xl" style={{ left: '25%', animationDuration: '7s', animationDelay: '2s' }}>✨</span>
                <span className="celebrate-item text-lg" style={{ left: '40%', animationDuration: '10s', animationDelay: '0.5s' }}>✨</span>
                <span className="celebrate-item text-2xl" style={{ left: '55%', animationDuration: '8s', animationDelay: '3.5s' }}>✨</span>
                <span className="celebrate-item text-xl" style={{ left: '70%', animationDuration: '6s', animationDelay: '1s' }}>✨</span>
                <span className="celebrate-item text-2xl" style={{ left: '85%', animationDuration: '11s', animationDelay: '4s' }}>✨</span>
                <span className="celebrate-item text-lg" style={{ left: '15%', animationDuration: '10s', animationDelay: '5s' }}>✨</span>
                <span className="celebrate-item text-xl" style={{ left: '50%', animationDuration: '8s', animationDelay: '4.5s' }}>✨</span>
                <span className="celebrate-item text-2xl" style={{ left: '80%', animationDuration: '9s', animationDelay: '3s' }}>✨</span>
              </div>

              <div className="mt-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-base md:text-lg font-bold uppercase tracking-widest animate-[bounce_2s_infinite] text-center font-mono">
                🎉 MUBARAK OYE MUBARAK! 🎉
              </div>

              {/* Main Wedding Card Modal */}
              <div className="bg-slate-900/90 backdrop-blur-md border-4 border-amber-400/80 outline outline-2 outline-amber-600/50 p-6 retro-border shadow-[0_0_30px_rgba(251,191,36,0.25)] max-w-[500px] flex-1 my-4 flex flex-col justify-between items-center relative text-center rounded-2xl overflow-hidden">
                
                {/* Decorative pixel-art corner filigrees/stars */}
                <div className="absolute top-2 left-2 text-[10px] text-amber-400/80 select-none pointer-events-none">✦</div>
                <div className="absolute top-2 right-2 text-[10px] text-amber-400/80 select-none pointer-events-none">✦</div>
                <div className="absolute bottom-2 left-2 text-[10px] text-amber-400/80 select-none pointer-events-none">✦</div>
                <div className="absolute bottom-2 right-2 text-[10px] text-amber-400/80 select-none pointer-events-none">✦</div>

                {/* Starry moonlit arch & couple silhouette backdrop layer */}
                <svg className="w-full h-36 opacity-40 absolute top-12 z-0 pointer-events-none" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#eab308" stopOpacity="0"/>
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="45" r="32" fill="url(#moonGlow)"/>
                  <path d="M 60,90 A 40,40 0 0,1 140,90" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" />
                  <path d="M 55,90 A 45,45 0 0,1 145,90" stroke="#d97706" strokeWidth="1" strokeDasharray="1,2" />
                  
                  {/* Arch stars */}
                  <circle cx="100" cy="5" r="2" fill="#fbbf24" />
                  <circle cx="80" cy="12" r="1.5" fill="#fbbf24" />
                  <circle cx="120" cy="12" r="1.5" fill="#fbbf24" />
                  <circle cx="68" cy="30" r="1.5" fill="#fbbf24" />
                  <circle cx="132" cy="30" r="1.5" fill="#fbbf24" />
                  
                  {/* Groom silhouette */}
                  <rect x="91" y="55" width="7" height="25" fill="#1e293b"/>
                  <rect x="92" y="47" width="5" height="7" fill="#1e293b"/>
                  <rect x="88" y="58" width="3" height="15" fill="#1e293b"/>
                  
                  {/* Bride silhouette */}
                  <path d="M 102,58 L 98,80 L 110,80 Z" fill="#1e293b"/>
                  <circle cx="103" cy="51" r="3" fill="#1e293b"/>
                  <path d="M 104,54 L 109,70" stroke="#1e293b" strokeWidth="2" strokeLinecap="round"/>
                  
                  {/* Floor */}
                  <rect x="50" y="80" width="100" height="2" fill="#eab308" opacity="0.5"/>
                </svg>

                {/* Upper focal centerpiece: Golden Pokéball with glowing ambient shadow and sparkles */}
                <div className="relative w-16 h-16 rounded-full border-4 border-yellow-400 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 shadow-[0_0_50px_rgba(251,191,36,0.5)] flex items-center justify-center animate-bounce mt-2 z-10">
                  {/* Floating sparkles particles */}
                  <span className="absolute text-yellow-300 -top-2 -left-2 text-[8px] animate-pulse">✨</span>
                  <span className="absolute text-yellow-300 -bottom-2 -right-2 text-[8px] animate-pulse">✨</span>
                  
                  {/* Top Half Highlight */}
                  <div className="absolute w-full h-[26px] top-0 rounded-t-full bg-gradient-to-b from-yellow-200 to-yellow-400 opacity-80" />
                  {/* Center dividing line */}
                  <div className="absolute w-full h-1 bg-yellow-800 top-[26px]" />
                  {/* Center button */}
                  <div className="absolute w-4.5 h-4.5 rounded-full bg-yellow-50 border-2 border-yellow-800 flex items-center justify-center top-[18px] z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-white border border-yellow-600" />
                  </div>
                </div>

                {/* Typography & Message Card Content */}
                <div className="flex flex-col z-10 mt-2 px-1">
                  <h3 className="text-amber-400 text-xs uppercase tracking-widest font-semibold font-mono mb-2">Dear Rayan & Bride,</h3>
                  
                  <div className="flex flex-col gap-2">
                    <p className="text-slate-200 text-[10px] leading-relaxed font-sans text-left">
                      Congratulations on your wedding! Even though I couldn't be there in person, 
                      I'm celebrating your big milestone all the way from across the ocean.
                    </p>
                    <p className="text-slate-200 text-[10px] leading-relaxed font-sans text-left">
                      Thank you for being such an incredible friend and brother through School, Aakash, UVCE, and SAP. 
                      May your new adventure together be filled with high health bars, legendary synergy, and endless joy!
                    </p>
                  </div>

                  {/* Sign-off */}
                  <div className="mt-4 text-cyan-400 font-bold tracking-widest font-mono text-[11px] self-end flex items-center gap-1">
                    — With love, Sanketh <span className="text-red-500">❤️</span>
                  </div>
                </div>
              </div>

              {/* Retro Tactile Emerald Button */}
              <div className="flex gap-4 z-10">
                <button 
                  onClick={handleCloseWeddingCard}
                  className="group relative flex items-center justify-center retro-border bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-[9px] px-8 py-3.5 cursor-pointer font-bold uppercase tracking-wider border-2 border-amber-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(251,191,36,0.65)] hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <span className="animate-pulse mr-2 text-yellow-300">►</span>
                  CONTINUE TO FAREWELL ➔
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default App;


