import React, { useMemo } from 'react';
import { Volume2, Eye, Video } from 'lucide-react';
import '../styles/MobileVideoGrid.css';

interface VideoFeed {
  id: string;
  playerName: string;
  stream: MediaStream | null;
  isActive: boolean;
  isSelf: boolean;
  isWebcamOn?: boolean;
  connectionType?: string;
}

interface MobileVideoGridProps {
  players: any[];
  onlineCount?: number;
  isPopout?: boolean;
  isVideoEnabled?: boolean;
  onJoinVideoChat?: () => void;
}

export const MobileVideoGrid: React.FC<MobileVideoGridProps> = ({
  players = [],
  isVideoEnabled = false,
  onJoinVideoChat = () => {}
}) => {
  // Create video feeds from players
  const videoFeeds = useMemo<VideoFeed[]>(() => {
    return players
      .map((player) => ({
        id: player.id || player.socketId,
        playerName: player.name || player.playerName || 'Unknown',
        stream: player.stream || null,
        isActive: player.isActive || false,
        isSelf: player.isSelf || false,
        isWebcamOn: player.isWebcamOn !== false,
      }))
      .filter((feed) => feed.stream !== null || feed.isSelf);
  }, [players]);

  if (videoFeeds.length === 0) {
    return (
      <div className="mobile-video-grid-empty">
        <div className="empty-state">
          <p>No camera feeds available</p>
          {!isVideoEnabled ? (
            <>
              <small>Connect to see other players</small>
              <button className="join-video-btn" onClick={onJoinVideoChat}>
                <Video className="w-5 h-5" />
                <span>Join Video Chat</span>
              </button>
            </>
          ) : (
            <small>Players will appear here when they enable their cameras</small>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-video-grid-container">
      {/* Grid of video feeds */}
      <div className="mobile-video-grid">
        {videoFeeds.map((feed) => (
          <div key={feed.id} className="video-tile">
            {/* Video Container */}
            <div className="video-inner">
              {feed.stream ? (
                <video
                  autoPlay
                  playsInline
                  muted={feed.isSelf}
                  className="video-element"
                  ref={(video) => {
                    if (video && feed.stream) {
                      video.srcObject = feed.stream;
                    }
                  }}
                />
              ) : (
                <div className="video-placeholder">
                  <span>📹</span>
                </div>
              )}

              {/* Active Indicator Dot */}
              <div className={`status-dot ${feed.isActive ? 'active' : 'inactive'}`} />

              {/* Player Name Overlay */}
              <div className="player-name-overlay">
                <span className="player-name">{feed.playerName}</span>
                {feed.isSelf && <span className="self-badge">You</span>}
              </div>

              {/* Control Buttons */}
              <div className="video-controls">
                {/* Mute/Unmute Audio (for other players) */}
                {!feed.isSelf && (
                  <button
                    className="control-btn mute-btn"
                    title="Mute/Unmute"
                    aria-label={`Mute ${feed.playerName}'s audio`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}

                {/* Mute/Unmute Mic (self only) */}
                {feed.isSelf && (
                  <button
                    className="control-btn mic-btn"
                    title="Mute Microphone"
                    aria-label="Toggle microphone"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.76 2.56v2.17h2v2H9v-2h2v-2.17C7.74 19.27 6 17.15 6 14.77h2c0 2.04 1.53 3.76 3.56 3.97v-10.5c-2.5 0-4.5 2-4.5 4.5H4c0-3.31 2.67-6 6-6s6 2.69 6 6c0 1.52-.55 2.9-1.43 3.96l1.41 1.41c1.26-1.44 2.02-3.35 2.02-5.37h2c0 2.25-.9 4.28-2.36 5.76z" />
                    </svg>
                  </button>
                )}

                {/* Hide Video Toggle */}
                <button
                  className="control-btn hide-btn"
                  title="Hide/Show"
                  aria-label={`Hide ${feed.playerName}'s video`}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions Bar */}
      <div className="mobile-video-actions">
        <button className="action-btn settings-btn">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14,12.94c.04,-0.3 .06,-0.61 .06,-0.94c0,-0.32 -0.02,-0.64 -0.07,-0.94l2.03,-1.58c.18,-0.14 .23,-0.41 .12,-0.64l-1.92,-3.32c-.12,-0.22 -0.37,-0.29 -0.59,-0.22l-2.39,.96c-.5,-0.38 -1.03,-0.7 -1.62,-0.94L14.4,2.81c-.04,-0.24 -0.24,-0.41 -0.48,-0.41h-3.84c-.24,0 -0.43,.17 -0.47,.41L9.25,5.35C8.66,5.59 8.12,5.92 7.63,6.29L5.24,5.33c-.22,-0.08 -0.47,0 -0.59,.22L2.74,8.87C2.62,9.08 2.66,9.34 2.86,9.48l2.03,1.58c-.05,.3 -0.09,.63 -0.09,.96s.04,.64 .09,.94l-2.03,1.58c-.18,.14 -0.23,.41 -0.12,.64l1.92,3.32c.12,.22 .37,.29 .59,.22l2.39,-0.96c.5,.38 1.03,.7 1.62,.94l.36,2.54c.05,.24 .24,.41 .48,.41h3.84c.24,0 .44,-0.17 .47,-0.41l.36,-2.54c.59,-0.24 1.13,-0.56 1.62,-0.94l2.39,.96c.22,.08 .47,0 .59,-0.22l1.92,-3.32c.12,-0.22 .07,-0.5 -0.12,-0.64L19.14,12.94zM12,15.6c-1.98,0 -3.6,-1.62 -3.6,-3.6s1.62,-3.6 3.6,-3.6s3.6,1.62 3.6,3.6S13.98,15.6 12,15.6z" />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default MobileVideoGrid;
