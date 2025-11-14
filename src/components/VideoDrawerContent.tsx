import React from 'react';
import { useWebRTC } from '../contexts/WebRTCContext';
import { MobileVideoGrid } from './MobileVideoGrid';

interface VideoDrawerContentProps {
  players: any[];
}

/**
 * Wrapper component for video drawer content
 * Must be rendered inside WebRTCProvider
 * Provides camera enable controls to MobileVideoGrid
 */
export const VideoDrawerContent: React.FC<VideoDrawerContentProps> = ({ players }) => {
  // This hook call is now inside WebRTCProvider boundary
  const { isVideoEnabled, prepareVideoChat } = useWebRTC();

  return (
    <div className="flex-1 overflow-hidden">
      <MobileVideoGrid
        players={players}
        onlineCount={players.length}
        isVideoEnabled={isVideoEnabled}
        onJoinVideoChat={prepareVideoChat}
      />
    </div>
  );
};

export default VideoDrawerContent;
