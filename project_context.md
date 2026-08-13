# Project: Ryan's Pokémon Journey (Wedding Gift Web App)

## 📌 Project Overview
An interactive, 16-bit GBA-era Pokémon-style web application built as a personalized wedding gift for **Ryan Sailani** from his close friend **Sanketh**. 

Because Sanketh is currently based in the US and missed Ryan's wedding, this web app serves as an emotional, interactive journey through their friendship history across four major life phases, complete with retro chiptune background music, custom pixel art sprites, mini-games, and a heartfelt Ash & Brock style farewell ending.

---

## 🛠️ Technical Stack & Hosting Setup
- **IDE / Agent:** Gemini Antigravity
- **Framework:** Next.js (React) or Vite + HTML5 Canvas
- **Game Engine:** Phaser.js (for 2D tilemaps, sprite movement, line-of-sight mechanics, and turn-based battle scenes)
- **Styling:** Tailwind CSS (for game container, dialogue popups, and UI overlays)
- **Version Control:** GitHub
- **Deployment:** Vercel (Automated CI/CD deployment)

---

## 🧑‍🤝‍🧑 Characters & Sprites
1. **Ryan Sailani (Protagonist):** 
   - Signature Vibe: Steady, dependable, grounded.
   - Attire: Navy blue and gold technical trainer jacket, dark cargo pants, red/white trainer boots.
2. **Sanketh (Best Friend / Rival):**
   - Signature Vibe: Analytical, cosmic, big-picture thinker.
   - Attire: Patterned off-white technical sherwani layer with cosmic-blue and purple trainer vest, wire-rimmed glasses, curly hair.
3. **Anam (Crucial Party Member):**
   - Signature Vibe: Sharp, clever, clutch assist player.
   - Attire: Dusty rose and gold detailed tunic with trainer trim, light beige hijab.

---

## 🎮 Level Architecture & Narrative Arc

### Level 1: School (The Stranger Era)
- **Vibe:** Nostalgic school hallway/playground.
- **Mechanic:** "Line of Sight" stealth puzzle. Ryan navigates through moving NPC students. He must avoid line-of-sight with generic NPCs, but locking eyes with Sanketh triggers an iconic `!` exclamation box with dialogue: *"A wild Sanketh appeared... but passed by for now!"*

### Level 2: Aakash Coaching (The Battle Era)
- **Vibe:** Retro 90s classroom arena.
- **Mechanic:** Turn-based Pokémon battle (Ryan vs. Sanketh). Ryan must defeat Sanketh in a friendly duel. Upon defeat, Sanketh officially joins Ryan's party line-up.

### Level 3: UVCE (The Core-Gargoyle Synergy Duel)
- **Vibe:** Engineering college campus map (UVCE College Quad at twilight).
- **Boss:** Core-Gargoyle (intimidating deadlines and brutal viva exams). Shaped like a gargoyle with glowing blue LED eyes, copper-coil wings, and an exposed circuit board chest plate that flashes yellow during attacks.
- **Mechanic:** "Synergy Meter" Dual Battle.
  - The team has a Synergy Meter starting at 0%.
  - The battle alternates between a Boss Attack Phase and a Canteen Break / Rooftop Dialogue Phase.
  - Correct conversational choices build the Synergy Meter.
  - At 100%, the ultimate joint move "All-Nighter Overclock" triggers to defeat Core-Gargoyle.

### Level 4: SAP Labs & Kalyan Nagar (The Corporate & Refill Loop)
- **Step A (SAP Boss Attempt 1):** Ryan and Sanketh battle the **Corporate Outage / Overtime Boss**. The party suffers an immediate, scripted wipeout. Text hint: *"Stamina too low! Go refresh at Kalyan Nagar!"*
- **Step B (Side Quest - Kalyan Nagar):** Map transitions to Kalyan Nagar. Ryan enters the local **Café Pokémon Center** and drinks a *"Special Espresso Brew"* to fully restore stamina and health.
- **Step C (SAP Boss Attempt 2):** Ryan returns to SAP Labs. The boss activates *Unresolved Bug Shield*. Hint: *"You need a backend wizard who knows the logic!"*
- **Step D (Recruiting Anam & Victory):** Ryan recruits **Anam** on the map. She joins as the 3rd party member, using her signature move *Clutch Assist* to break the shield and secure the final win!

---

## 🏆 The Wedding Reveal & Ash/Brock Farewell Ending

1. **The Golden Pokéball Drop:** Post-boss victory, a glowing **Golden Pokéball** falls in the center of the screen.
2. **Wedding Stage:** Clicking the ball plays an 8-bit Wedding March, displaying pixel confetti and a custom congratulatory wedding message/card for Ryan and his bride.
3. **The Crossroads Cutscene (Ash & Brock Style):**
   - Scene shifts to a sunset-lit pixel route split (representing the US / India separation).
   - **Dialogue (Sanketh):** *"We conquered School, Aakash, UVCE, and SAP together... but my next journey takes me across the ocean."*
   - **Dialogue (Ryan):** *"No matter how far the map stretches, our party line-up never changes."*
   - The two sprites do a high-five, turn, and walk down separate paths towards their new chapters as nostalgic 8-bit farewell music plays, transitioning into a personal audio message.

---

## 🎵 Audio Architecture
- **Overworld Theme:** Upbeat, nostalgic 8-bit town music (GBA era).
- **Battle Theme:** Energetic 90s chiptune battle music.
- **Kalyan Nagar Theme:** Relaxing Lofi / 8-bit Café Pokémon Center theme.
- **Ending Theme:** Emotional 8-bit farewell melody transitioning to an embedded audio player.

---

## 🎯 Development Priorities for Antigravity
1. Setup Next.js + Phaser.js project boilerplate with Tailwind CSS.
2. Implement state management for player progression across levels (School -> Aakash -> UVCE -> SAP/Kalyan Nagar -> Ending).
3. Build the core Phaser canvas component supporting sprite rendering, map collisions, and dialog box UI overlays.