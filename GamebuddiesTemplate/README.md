# GameBuddies Template - Production-Ready Multiplayer Game Framework

A comprehensive, battle-tested template for building multiplayer games on the GameBuddies platform with **all essential features** pre-integrated from production games.

## 🚀 Complete Feature Set

### ✅ Core Infrastructure
- **Full GameBuddies Integration**
  - Session management with streamer mode support
  - Real-time status updates to GameBuddies API
  - Return to lobby (individual/group modes)
  - Session token resolution for streamers
  - URL parameter parsing and validation

- **Robust Reconnection System**
  - Session-based reconnection with unique tokens
  - 30-second disconnect grace period
  - Automatic state synchronization on reconnect
  - Persistent session storage
  - Connection state recovery

- **Advanced Room Management**
  - Create/join rooms with unique codes
  - Host privileges and controls
  - Player kick functionality
  - Automatic host transfer on disconnect
  - Room settings management
  - Player capacity limits

### ✅ Communication & Real-time Features
- **WebRTC Video Chat**
  - Multi-peer video/audio support
  - TURN server integration for mobile
  - Virtual backgrounds (AI-powered)
  - Face avatars with 3D rendering
  - Device selection and controls
  - Mobile-optimized codecs

- **Chat System**
  - Real-time messaging with Socket.IO
  - Message history (100 messages)
  - System notifications
  - Emoji support
  - Auto-scroll and timestamps

- **State Management**
  - Server-authoritative state
  - Real-time synchronization
  - Optimistic updates
  - Conflict resolution
  - Event sourcing patterns

### ✅ Mobile & Responsive Design
- **Mobile-First Architecture**
  - Responsive breakpoints (320px - 1920px+)
  - Touch-optimized controls (44px minimum)
  - Landscape/portrait orientation support
  - iOS and Android specific fixes
  - Safe area insets for notched devices

- **Performance Optimizations**
  - Reduced animations on mobile
  - Optimized blur effects
  - Touch gesture support
  - Hardware acceleration
  - Lazy loading components

### ✅ Developer Experience
- **TypeScript Throughout**
  - Fully typed client and server
  - Shared type definitions
  - Type-safe Socket.IO events
  - Comprehensive interfaces

- **Modern Tech Stack**
  - React 19 with hooks
  - Vite for fast builds
  - Express.js server
  - Socket.IO v4
  - Tailwind CSS

## 📦 Quick Start

### Prerequisites
- Node.js 16+ and npm
- GameBuddies API key
- TURN server credentials (free from Metered.ca)

### Installation

```bash
# Clone the template
git clone [repository-url]
cd GamebuddiesTemplate

# Install all dependencies
npm install
cd client && npm install && cd ..

# Configure environment variables (see below)

# Start development
npm run dev
```

### Environment Configuration

**Client (.env):**
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_BASE_PATH=/
VITE_METERED_USERNAME=your_turn_username
VITE_METERED_PASSWORD=your_turn_password
VITE_GAMEBUDDIES_API_KEY=your_api_key
```

**Server (.env):**
```env
PORT=3001
GAMEBUDDIES_CENTRAL_URL=https://gamebuddies.io
GAMEBUDDIES_API_KEY=your_api_key
GAME_ID=your-game-id
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 🎮 Building Your Game

### Step 1: Define Game Types

Edit `server/types.ts` and `client/src/types.ts`:

```typescript
export interface GameData {
  currentRound: number;
  timeRemaining: number;
  gameState: 'waiting' | 'playing' | 'ended';
  // Add your game-specific data
}

export interface Player {
  socketId: string;
  sessionToken?: string;
  name: string;
  score: number;
  connected: boolean;
  isHost: boolean;
  // Add custom player properties
}
```

### Step 2: Implement Server Logic

Add event handlers in `server/server.ts`:

```typescript
socket.on('game:your-action', (data: { roomCode: string; payload: any }) => {
  const lobby = lobbies.get(data.roomCode);
  if (!lobby) return;

  // Validate action
  const player = lobby.players.find(p => p.socketId === socket.id);
  if (!player) return;

  // Update game state
  lobby.gameData = processAction(lobby.gameData, data.payload);

  // Broadcast update
  io.to(lobby.code).emit('game:state-updated', {
    gameData: lobby.gameData,
    lastAction: { player: player.name, action: data.payload }
  });

  // Check win conditions
  if (checkWinCondition(lobby.gameData)) {
    io.to(lobby.code).emit('game:ended', {
      winner: determineWinner(lobby),
      finalScores: lobby.players.map(p => ({ name: p.name, score: p.score }))
    });
  }
});
```

### Step 3: Build Client Components

Create your game UI in `client/src/components/GameComponent.tsx`:

```typescript
const GameComponent: React.FC<GameProps> = ({ lobby, socket }) => {
  const [gameState, setGameState] = useState(lobby.gameData);

  useEffect(() => {
    socket.on('game:state-updated', (data) => {
      setGameState(data.gameData);
    });

    return () => {
      socket.off('game:state-updated');
    };
  }, [socket]);

  const handleAction = (action: any) => {
    socket.emit('game:your-action', {
      roomCode: lobby.code,
      payload: action
    });
  };

  return (
    <div className="game-container">
      {/* Your game UI */}
    </div>
  );
};
```

## 📡 Socket Events Reference

### Client → Server Events

| Event | Description | Payload |
|-------|------------|---------|
| `lobby:create` | Create new room | `{ playerName, playerId?, roomCode?, sessionToken? }` |
| `lobby:join` | Join room | `{ roomCode, playerName, playerId? }` |
| `session:reconnect` | Reconnect with token | `{ sessionToken }` |
| `game:sync-state` | Request state sync | `{ roomCode }` |
| `game:start` | Start game | `{ roomCode }` |
| `game:end` | End game | `{ roomCode }` |
| `player:kick` | Kick player | `{ roomCode, playerId }` |
| `player:transfer-host` | Transfer host | `{ roomCode, newHostId }` |
| `chat:send-message` | Send message | `{ roomCode, message }` |
| `gamebuddies:return` | Return to lobby | `{ roomCode, returnAll }` |

### Server → Client Events

| Event | Description | Payload |
|-------|------------|---------|
| `lobby:created` | Room created | `{ roomCode, sessionToken, lobby }` |
| `lobby:joined` | Joined room | `{ sessionToken, lobby }` |
| `lobby:player-joined` | Player joined | `{ players }` |
| `lobby:player-disconnected` | Player disconnected | `{ playerId, playerName, players }` |
| `lobby:player-reconnected` | Player reconnected | `{ playerId, playerName, players }` |
| `lobby:host-transferred` | Host changed | `{ oldHostId, newHostId, players }` |
| `game:started` | Game started | `{ lobby }` |
| `game:ended` | Game ended | `{ lobby }` |
| `chat:message` | Chat message | `{ id, playerId, playerName, message, timestamp }` |
| `player:kicked` | Kicked from room | `{ message }` |
| `error` | Error occurred | `{ message }` |

## 🔌 API Integration

### GameBuddies Session Management

```typescript
import { getCurrentSession, parseGameBuddiesSession } from './services/gameBuddiesSession';

// Check if launched from GameBuddies
const session = getCurrentSession();
if (session?.source === 'gamebuddies') {
  console.log('Launched from GameBuddies');
  console.log('Room:', session.roomCode);
  console.log('Player:', session.playerName);
  console.log('Host:', session.isHost);
}

// Handle streamer mode
if (session?.isStreamerMode) {
  // Hide room code from UI
  // Resolve session token asynchronously
}
```

### Return to GameBuddies

```typescript
import { gameBuddiesReturn } from './services/gameBuddiesReturn';

// Return all players (host only)
const result = await gameBuddiesReturn.returnToLobby(
  'group',
  roomCode,
  currentPlayer,
  allPlayers
);

// Return individual player
const result = await gameBuddiesReturn.returnToLobby(
  'individual',
  roomCode,
  currentPlayer
);

// Redirect after return
if (result.success) {
  gameBuddiesReturn.redirectToLobby(result.returnUrl);
}
```

### Status Updates (Server)

```typescript
import gameBuddiesService from './services/gameBuddiesService';

// Update player status
await gameBuddiesService.updatePlayerStatus(
  roomCode,
  playerId,
  'connected',  // or 'in_game', 'disconnected'
  'joined_game',
  { additionalData: 'any' }
);

// Request return to lobby
const result = await gameBuddiesService.requestReturnToLobby(
  roomCode,
  {
    returnAll: true,
    initiatedBy: 'host',
    reason: 'game_ended'
  }
);
```

## 📱 Mobile Support

### Responsive Breakpoints

| Breakpoint | Screen Size | Description |
|------------|-------------|-------------|
| Mobile Portrait | < 480px | Single column, stacked layout |
| Mobile Landscape | 480px - 768px | Side panels, compact UI |
| Tablet Portrait | 768px - 1024px | Two column layout |
| Tablet Landscape | 1024px - 1366px | Full layout with sidebars |
| Desktop | 1366px - 1920px | Standard desktop layout |
| Large Desktop | > 1920px | Scaled UI, max widths |

### Mobile Utilities

```css
/* CSS Classes */
.mobile-only    /* Show only on mobile */
.desktop-only   /* Show only on desktop */
.mobile-nav     /* Bottom navigation bar */
.mobile-drawer  /* Slide-out panels */
.mobile-toast   /* Notification system */
```

### Touch Optimization

- Minimum touch target: 44px × 44px
- Swipe gesture support
- Haptic feedback hooks
- Orientation lock options
- Safe area insets for notched devices

## 🧪 Testing Guide

### Local Testing

```bash
# Start server and client
npm run dev

# Open multiple browser tabs
# Create room in first tab
# Join with code in other tabs
```

### GameBuddies Integration Testing

Normal launch:
```
http://localhost:5173/?room=TEST123&name=Player1&role=gm
```

Streamer mode:
```
http://localhost:5173/?session=token123&players=4&role=gm
```

### Reconnection Testing

1. Join a room normally
2. Note the session token in console
3. Refresh the page
4. Should auto-reconnect with same session
5. Close tab, wait < 30 seconds, reopen
6. Should reconnect successfully

### Mobile Testing

1. Get TURN credentials from Metered.ca
2. Configure in client .env
3. Test on real devices (not just responsive mode)
4. Test on both WiFi and cellular networks

## 🚢 Deployment

### Build for Production

```bash
# Build client
cd client
npm run build

# Build server
cd ../server
npm run build
```

### Deploy to Render.com

1. Push to GitHub repository
2. Create new Web Service on Render
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy!

### Deploy to Other Platforms

Compatible with:
- Heroku
- Railway
- Vercel (client only)
- Netlify (client only)
- Any Node.js hosting

## 🎯 Production Checklist

- [ ] Set production API URLs
- [ ] Configure TURN servers
- [ ] Enable HTTPS
- [ ] Set secure WebSocket transport
- [ ] Configure CORS origins
- [ ] Add rate limiting
- [ ] Enable error tracking (Sentry)
- [ ] Set up monitoring
- [ ] Test on mobile devices
- [ ] Load test with expected player count

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Additional Resources

- [GameBuddies Documentation](https://gamebuddies.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [WebRTC Guide](https://webrtc.org/getting-started)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🆘 Troubleshooting

### Common Issues

**WebRTC not working on mobile:**
- Ensure TURN servers are configured
- Check firewall settings
- Verify HTTPS in production

**Reconnection failing:**
- Check session token storage
- Verify server-side token mapping
- Check disconnect timer (30s default)

**GameBuddies integration issues:**
- Verify API key is correct
- Check CORS configuration
- Monitor API response in console

## 📝 License

This template is provided for use with the GameBuddies platform. See LICENSE for details.

---

Built with ❤️ for the GameBuddies Platform - Create amazing multiplayer games!