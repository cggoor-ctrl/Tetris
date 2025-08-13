# PRD — Browser Game "Tetris Neo"

## 1. Project Goal
Create a modern version of the classic "Tetris" game with enhanced graphics, animations, and effects while preserving the original rules and mechanics. The game should run directly in any modern browser without additional plugins.

---

## 2. Target Audience
- Retro game enthusiasts and nostalgic players  
- Casual gamers seeking simple but engaging entertainment  
- Broad audience aged 10–60 years  

---

## 3. Platform and Technology
- **Platform:** Web browser (Chrome, Firefox, Edge, Safari)  
- **Technologies:** HTML5, CSS3, JavaScript (ES6+), Canvas API or WebGL for rendering  
- **Responsiveness:** Playable on both PC and tablets (keyboard and touch control)  

---

## 4. Core Features

### 4.1 Game Field
- Size: 10 × 20 cells  
- Visible borders and grid  
- Background animation (soft gradient or dynamic effects)  

### 4.2 Tetrominoes
- 7 standard shapes (I, O, T, S, Z, J, L)  
- Random generation of the next shape  
- Display of the next shape in a "Next" preview window  
- Unique color scheme with soft glow for each piece  

### 4.3 Game Logic
- Classic Tetris rules  
- Clearing one or multiple full lines  
- Increasing falling speed as levels progress  
- Scoring system:  
  - 1 line = 100 points  
  - 2 lines = 300 points  
  - 3 lines = 500 points  
  - 4 lines (Tetris) = 800 points  

### 4.4 Levels
- Start level: 1  
- Level up every 10 cleared lines  
- Each level increases falling speed  

### 4.5 Effects & Animation
- Smooth piece spawning  
- "Flash" effect when a line is cleared  
- Particle/spark effects on line removal  
- Soft shadows and depth effects  

### 4.6 UI
- Panel showing current level, score, and cleared lines count  
- On-screen control buttons (for mobile)  
- Pause/Restart button  
- Sound on/off toggle  

### 4.7 Sound
- Background 8-bit remix music  
- Rotation, drop, and line clear sound effects  
- Ability to disable sounds  

### 4.8 Controls
- **PC:** Arrow keys ← → (move), ↑ (rotate), ↓ (soft drop), Space (hard drop)  
- **Mobile:** Touch buttons on screen  

---

## 5. Non-Functional Requirements
- Load time < 3 seconds  
- FPS ≥ 60 on modern devices  
- Offline play support (PWA mode)  
- At least 2 visual themes (classic and neon-futuristic)  

---

## 6. Monetization (Optional)
- Free to play with non-intrusive ads between games  
- In-app purchases (e.g., new themes, effects)  

---

## 7. Development Plan
1. Game field & mechanics prototype  
2. Tetrominoes & core logic  
3. UI & visual effects  
4. Optimization & testing  
5. Release & launch  

---

## 8. Visual Style Example
- Smooth, bright colors  
- Light glowing outlines for pieces  
- Particle animations for line clearing  
- Neon accents for futuristic mode  
