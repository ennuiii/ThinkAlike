# ThinkAlike 🧠

A 1v1 word synchronization game where two players share 5 lives and try to think of the same word simultaneously. First match wins!

![Game Status](https://img.shields.io/badge/status-complete-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Players](https://img.shields.io/badge/players-2-orange)

## 🎮 Game Concept

ThinkAlike is a telepathy-based word game where two players must synchronize their minds to think of the same word at the same time. Players share a pool of 5 lives, and each failed attempt costs one life. **The first successful word match wins the game!**

### Victory Condition
- ✅ **First Match Wins!** - As soon as both players type the same word, you win!

### Game Over Condition
- ❌ **All Lives Lost** - If you lose all 5 lives without matching, game over!

## ✨ Features

### Core Gameplay
- **Text Mode** - Type words simultaneously (Voice mode planned for v2.0)
- **Shared Lives System** - Both players share 5 lives
- **Round Timer** - Configurable 30-180 seconds per round (default: 60s)
- **Real-time Synchronization** - Server-authoritative game state
- **First Match Wins** - Instant victory on first successful match!

### Template Features (Fully Integrated)
- ✅ **WebRTC Video Chat** - See your opponent via webcam
  - Virtual backgrounds (AI-powered)
  - Face avatars with 3D rendering
  - Mobile-optimized codecs
- ✅ **Real-time Chat** - Message your opponent
- ✅ **Reconnection System** - 30-second grace period for disconnects
- ✅ **GameBuddies Integration** - Streamer mode support
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Session Persistence** - Reconnect to active games

## 🎯 How to Play

### 1. Create or Join a Room
- Player 1 creates a room and shares the room code
- Player 2 joins using the room code
- **Exactly 2 players required** - no more, no less!

### 2. Ready Up
- Both players click "Ready Up" button
- Host can adjust settings (timer, lives)
- Host clicks "Start Game" when both ready

### 3. Think of a Word
- A 3-second countdown appears
- Type a word (up to 50 characters)
- Submit before timer runs out!

### 4. Reveal
- Both words are revealed simultaneously
- **MATCH** → Instant victory! 🎉
- **NO MATCH** → Lose 1 life, try again

### 5. Victory or Game Over
- **Victory** - First match wins! See stats and play again
- **Game Over** - All lives lost. Review attempts and retry

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Socket.IO Client** - Real-time communication
- **Three.js** - 3D face avatars
- **MediaPipe** - Face tracking for avatars

### Backend (Unified Game Server)
- **Node.js + Express** - Server framework
- **Socket.IO** - WebSocket communication
- **TypeScript** - Type safety
- **Plugin Architecture** - Isolated game namespaces

### WebRTC Stack
- **Simple Peer** - WebRTC connections
- **TURN Servers** - Mobile network support
- **Virtual Backgrounds** - AI-powered background replacement

## 📂 Project Structure

```
ThinkAlike/
├── client/                          # React client
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/               # Game phase components
│   │   │   │   ├── TextModeInput.tsx      # Word input interface
│   │   │   │   ├── RevealScreen.tsx       # Word reveal + animations
│   │   │   │   ├── VictoryScreen.tsx      # Win screen
│   │   │   │   └── GameOverScreen.tsx     # Loss screen
│   │   │   ├── ui/                 # UI components
│   │   │   │   ├── LivesDisplay.tsx       # Animated hearts
│   │   │   │   ├── TimerDisplay.tsx       # Circular countdown
│   │   │   │   └── WordHistory.tsx        # Round history sidebar
│   │   │   ├── animations/         # Animation components
│   │   │   │   ├── Confetti.tsx           # Victory confetti
│   │   │   │   └── HeartBreak.tsx         # Life loss animation
│   │   │   ├── Home.tsx            # Entry screen
│   │   │   ├── Lobby.tsx           # Pre-game lobby (2-player)
│   │   │   ├── GameComponent.tsx   # Main game controller
│   │   │   ├── WebcamDisplay.tsx   # WebRTC video
│   │   │   ├── ChatWindow.tsx      # Chat interface
│   │   │   └── PlayerList.tsx      # Player sidebar
│   │   ├── services/
│   │   │   └── socketService.ts    # Socket.IO connection (/thinkalike namespace)
│   │   ├── utils/
│   │   │   └── soundEffects.ts     # Audio playback manager
│   │   ├── styles/
│   │   │   └── game.css            # Complete game styles
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── App.tsx                 # Root component
│   └── package.json
│
└── README.md (this file)

# Server is in unified-game-server:
E:\GamebuddiesPlatform\GameBuddieGamesServer\games\thinkalike\
├── plugin.ts                        # Game plugin (server logic)
├── types.ts                         # Server type definitions
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (for ES modules)
- npm or yarn
- GameBuddieGamesServer running on port 3001

### Installation

1. **Install client dependencies:**
```bash
cd ThinkAlike/client
npm install
```

2. **Configure environment:**
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env (for local development)
VITE_BACKEND_URL=http://localhost:3001
```

3. **Start the unified game server:**
```bash
cd E:\GamebuddiesPlatform\GameBuddieGamesServer
npm run dev
```

4. **Start the client:**
```bash
cd E:\GamebuddiesPlatform\ThinkAlike\client
npm run dev
```

5. **Open in browser:**
```
http://localhost:5173
```

## 🎨 Game Design

### Color Palette
- **Primary**: `#8b5cf6` (Purple) - Intuition, mystery
- **Secondary**: `#06b6d4` (Cyan) - Synchronization, connection
- **Success**: `#10b981` (Green) - Match success
- **Error**: `#ef4444` (Red) - Life lost, no match
- **Warning**: `#f59e0b` (Orange) - Low time warning
- **Background**: `#0f172a → #1e293b` (Dark gradient)

### Animations
- **Confetti** - 50 particles on victory
- **Heart Break** - Split animation on life loss
- **Word Merge** - Match animation when words match
- **Heartbeat** - Pulsing hearts for lives display
- **Timer Warning** - Red pulse when <10 seconds

### Responsive Breakpoints
- Mobile: `< 768px` - Stacked layout, larger touch targets
- Tablet: `768px - 1024px` - Two-column layout
- Desktop: `1024px+` - Full three-panel layout

## 🔧 Configuration

### Game Settings (Host Only)
| Setting | Min | Max | Default | Description |
|---------|-----|-----|---------|-------------|
| Timer Duration | 30s | 180s | 60s | Time per round |
| Shared Lives | 1 | 10 | 5 | Total lives pool |

## 🎵 Sound Effects

Sound files should be placed in `client/src/assets/sounds/`:
- `match.mp3` - Victory sound
- `lose-life.mp3` - Life lost sound
- `timer-tick.mp3` - Last 10 seconds warning
- `victory.mp3` - Win fanfare

**Note:** Sound files not included - you can add your own or use HTML5 Audio API with generated tones.

## 📡 Socket Events

### Client → Server
| Event | Data | Description |
|-------|------|-------------|
| `player:ready` | `{ ready: boolean }` | Toggle ready status |
| `game:start` | - | Start game (host only) |
| `game:submit-word` | `{ word: string }` | Submit word |
| `game:next-round` | - | Continue to next round |
| `game:restart` | - | Restart game (host only) |
| `settings:update` | `{ settings }` | Update game settings |

### Server → Client
| Event | Data | Description |
|-------|------|-------------|
| `roomStateUpdated` | `Lobby` | Full game state update |
| `game:victory` | `{ matchedWord, round, timeTaken }` | Victory achieved |
| `game:no-match` | `{ player1Word, player2Word, livesRemaining }` | Words didn't match |
| `game:ended` | `{ reason, rounds, totalRounds }` | Game over |
| `timer:update` | `{ timeRemaining }` | Timer countdown |

## 🧪 Testing

### Manual Testing Checklist
- [ ] Two players can create and join room
- [ ] Ready system works (both must be ready)
- [ ] Start game (requires exactly 2 players + both ready)
- [ ] Round prep countdown (3 seconds)
- [ ] Word input (submit before timer)
- [ ] Word reveal (match vs no match)
- [ ] Lives decrease on no match
- [ ] Victory on first match
- [ ] Game over when all lives lost
- [ ] Restart game functionality
- [ ] Settings changes (timer, lives)
- [ ] Disconnect/reconnect (30s grace period)
- [ ] WebRTC video chat works
- [ ] Chat messages work
- [ ] Mobile responsive layout

### Browser Testing
- [ ] Chrome/Edge (desktop + mobile)
- [ ] Firefox (desktop + mobile)
- [ ] Safari (iOS)

## 🚢 Deployment

### Production Build
```bash
cd client
npm run build
```

### Environment Variables
```bash
# Production .env
# Leave VITE_BACKEND_URL empty - uses same origin
# VITE_BACKEND_URL=

# GameBuddies integration
VITE_BASE_PATH=/thinkalike/
```

### Deploy to Render.com
1. Build: `npm run build`
2. Serve static files from `client/dist`
3. Configure reverse proxy: `/thinkalike` → client
4. Server already registered in unified-game-server

## 🎯 Future Enhancements (v2.0)

### Planned Features
- [ ] **Voice Mode** - Say words instead of typing (Web Speech API)
- [ ] **Category Hints** - Optional category suggestions
- [ ] **Word Similarity** - Accept close matches (edit distance)
- [ ] **Confirmation Votes** - Vote if words mean the same thing
- [ ] **Leaderboard** - Track best streaks
- [ ] **Advanced Victory** - Options: 3/5 matches, survive 5 rounds
- [ ] **AI Opponent** - Single-player mode
- [ ] **Team Mode** - 2v2 relay-style
- [ ] **Custom Word Lists** - User-uploaded categories

## 📝 License

ISC

## 🤝 Contributing

This is a GameBuddies platform game. Contact the platform maintainer for contribution guidelines.

## 🐛 Known Issues

- Sound files not included (placeholders only)
- Voice mode not implemented (v2.0)
- No AI opponent (v2.0)

## 📞 Support

For issues or questions:
1. Check the GameBuddies platform documentation
2. Review server logs in GameBuddieGamesServer
3. Check browser console for client errors

## 🎉 Credits

Built with ❤️ using the GameBuddies Template

**Author:** GameBuddies Platform
**Version:** 1.0.0
**Date:** 2025-11-11
