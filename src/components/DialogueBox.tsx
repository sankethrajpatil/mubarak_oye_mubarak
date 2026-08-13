import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/sound';

interface DialogueBoxProps {
  speaker: string;
  avatarUrl: string;
  text: string;
  onComplete: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speaker,
  avatarUrl,
  text,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let active = true;
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    let currentText = '';
    let timer: any = null;

    const typeNextChar = () => {
      if (!active) return;
      if (index < text.length) {
        currentText += text.charAt(index);
        setDisplayedText(currentText);
        soundManager.playSFX('text');
        index++;
        timer = setTimeout(typeNextChar, 35); // speed of typing
      } else {
        setIsTyping(false);
      }
    };

    // Add a tiny delay to allow React state clearance to flush, preventing first letter drop
    timer = setTimeout(typeNextChar, 50);

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [text]);

  const handleNext = () => {
    if (isTyping) {
      // Skip typing, show full text
      setDisplayedText(text);
      setIsTyping(false);
    } else {
      soundManager.playSFX('click');
      onComplete();
    }
  };

  // Map speaker names to retro color classes
  const getSpeakerColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'ryan':
        return 'text-blue-400';
      case 'sanketh':
        return 'text-purple-400';
      case 'anam':
        return 'text-rose-400';
      case 'mary geraldine':
        return 'text-amber-400';
      case 'ieee boss':
      case 'sap boss':
        return 'text-red-500 font-bold';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div 
      className="w-full h-full cursor-pointer select-none flex items-center"
      onClick={handleNext}
    >
      <div className="w-full h-full bg-neutral-950 p-2 flex gap-4 items-start text-left">
        {/* Retro Portrait Frame */}
        {avatarUrl && (
          <div className="w-16 h-16 shrink-0 border-2 border-white bg-neutral-900 overflow-hidden flex items-center justify-center">
            <img 
              src={avatarUrl} 
              alt={speaker}
              className="w-full h-full object-cover pixel-avatar"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        )}
        
        {/* Speech Area */}
        <div className="flex-1 flex flex-col justify-between h-full min-h-[90px]">
          <div>
            <div className={`text-[9px] uppercase mb-1 tracking-wider ${getSpeakerColor(speaker)}`}>
              {speaker}
            </div>
            <p className="text-[11px] leading-relaxed text-white font-sans tracking-wide">
              {displayedText}
            </p>
          </div>
          
          {/* Press SPACE to continue indicator */}
          {!isTyping && (
            <div className="text-[7px] text-gray-500 animate-pulse self-end mt-1">
              Press [SPACE] or Click to continue ▼
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
