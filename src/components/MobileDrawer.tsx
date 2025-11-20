import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import '../styles/MobileDrawer.css';

type DrawerPosition = 'bottom' | 'left' | 'right';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: DrawerPosition;
  title?: string;
  children: React.ReactNode;
  showHandle?: boolean;
  fullHeight?: boolean;
  className?: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  position = 'bottom',
  title,
  children,
  showHandle = position === 'bottom',
  fullHeight = false,
  className = '',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        className={`mobile-drawer mobile-drawer-${position} ${isOpen ? 'open' : ''} ${className}`}
      >
        {/* Handle (for bottom drawer) */}
        {showHandle && (
          <div className="drawer-handle" aria-hidden="true" />
        )}

        {/* Header */}
        {title && (
          <div className="drawer-header">
            <h2 className="drawer-title">{title}</h2>
            <button
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className={`drawer-content ${fullHeight ? 'full-height' : ''}`}
        >
          {children}
        </div>
      </div>
    </>
  );
};
