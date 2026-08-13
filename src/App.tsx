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

function App() {
  const [activeScene, setActiveScene] = useState<GameScene>('LANDING');
  const [party, setParty] = useState<string[]>(['Ryan']);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showWeddingCard, setShowWeddingCard] = useState(false);

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
    setActiveScene('SCHOOL');
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
              RYAN'S <br />
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
              <img src="/images/Rayan.png" alt="Ryan" className="w-full h-full object-cover pixel-avatar" style={{ imageRendering: 'pixelated' }} />
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
              updateParty={updateParty}
              onGameComplete={() => {
                setShowWeddingCard(true);
              }}
            />

            {/* Party Overlay HUD (Top left overlay) */}
            <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 pointer-events-none">
              <div className="text-[7px] text-gray-400 tracking-widest bg-neutral-900/80 px-2 py-1 border border-neutral-700">PARTY MEMBERS:</div>
              <div className="flex gap-2">
                {party.map((member) => (
                  <div key={member} className="flex items-center gap-1 bg-neutral-900/90 border border-white p-1 text-[9px] text-white">
                    <img 
                      src={`/images/${member === 'Ryan' ? 'Rayan' : member}.png`} 
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
                    <span className="text-blue-400 font-bold">RYAN:</span> LV 18
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

          {/* The Golden Pokéball Wedding Reveal Card (Full overlay covering console) */}
          {showWeddingCard && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-t from-orange-600/95 via-rose-900/98 to-neutral-950/98 animate-[fadeIn_0.5s_ease-out]">
              <div className="mt-2 text-yellow-400 text-lg uppercase tracking-widest animate-[bounce_2s_infinite] text-center">
                MUBARAK OYE MUBARAK! 🥳
              </div>

              <div className="bg-neutral-900/95 border-4 border-yellow-400 p-6 retro-border max-w-[500px] flex-1 my-4 flex flex-col justify-center items-center relative text-center">
                {/* Floating Pixel Confetti */}
                <div className="absolute top-2 left-2 text-[10px]">✨</div>
                <div className="absolute top-2 right-2 text-[10px]">✨</div>
                <div className="absolute bottom-2 left-2 text-[10px]">✨</div>
                <div className="absolute bottom-2 right-2 text-[10px]">✨</div>
                
                {/* Golden Pokéball Icon */}
                <div className="text-3xl mb-4 animate-spin" style={{ animationDuration: '4s' }}>🏆</div>

                <h3 className="text-white text-xs mb-2">Dear Ryan & Bride,</h3>
                
                <p className="text-neutral-300 text-[9px] leading-relaxed font-sans mt-2">
                  Congratulations on your wedding! Even though I couldn't be there in person, 
                  I'm celebrating your big milestone all the way from across the ocean. 
                </p>
                
                <p className="text-neutral-300 text-[9px] leading-relaxed font-sans mt-2 font-semibold">
                  Thank you for being such an incredible friend through School, Aakash, UVCE, and SAP. 
                  May your new adventure together be filled with high health bars, epic moves, and endless joy!
                </p>

                <div className="mt-4 text-emerald-400 text-[10px] font-bold">
                  — Sanketh
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    soundManager.playSFX('click');
                    setShowWeddingCard(false);
                    setActiveScene('LANDING');
                    setParty(['Ryan']);
                  }}
                  className="retro-border bg-neutral-800 text-white text-[9px] px-4 py-2 cursor-pointer hover:bg-neutral-700"
                >
                  PLAY AGAIN ↩
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


