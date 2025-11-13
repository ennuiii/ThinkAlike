import React, { useState, useEffect } from 'react';
import { soundEffects } from '../utils/soundEffects';
import { backgroundMusic } from '../utils/backgroundMusic';

interface SettingsModalProps {
  onClose: () => void;
}

/**
 * Settings Modal - Audio controls (volume, mute)
 * Displays as centered modal overlay
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('thinkalike-volume');
    const savedMuted = localStorage.getItem('thinkalike-muted');

    if (savedVolume) {
      const vol = parseInt(savedVolume, 10);
      setVolume(vol);
      soundEffects.setVolume(vol / 100);
    }

    if (savedMuted) {
      const muted = JSON.parse(savedMuted);
      setIsMuted(muted);
      soundEffects.setEnabled(!muted);
    }
  }, []);

  // Handle volume change (sync both sound effect and background music)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    const normalizedVolume = newVolume / 100;
    soundEffects.setVolume(normalizedVolume);
    backgroundMusic.setVolume(normalizedVolume);
    localStorage.setItem('thinkalike-volume', String(newVolume));
  };

  // Handle mute toggle (sync both sound effect and background music)
  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundEffects.setEnabled(!newMuted);
    backgroundMusic.setEnabled(!newMuted);
    localStorage.setItem('thinkalike-muted', JSON.stringify(newMuted));
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="settings-modal-backdrop" onClick={handleBackdropClick} />

      {/* Modal Panel */}
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Volume Control */}
          <div className="settings-section">
            <label className="settings-label">
              <span className="volume-icon">🔊</span>
              <span>Volume</span>
            </label>
            <div className="volume-control">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                aria-label="Volume"
              />
              <span className="volume-value">{volume}%</span>
            </div>
          </div>

          {/* Mute Toggle */}
          <div className="settings-section">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={isMuted}
                onChange={handleMuteToggle}
                className="mute-checkbox"
                aria-label="Mute all sounds"
              />
              <span className="toggle-label">Mute All Sounds</span>
            </label>
          </div>
        </div>

        <div className="settings-modal-footer">
          <p className="settings-hint">Sound settings saved automatically</p>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;
