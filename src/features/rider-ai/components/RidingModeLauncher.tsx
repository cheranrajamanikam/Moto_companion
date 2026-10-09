import React from 'react';
import { MotoLogoIcon, ChevronRightIcon } from './icons';

interface RidingModeLauncherProps {
  onStartRidingMode: () => void;
}

export const RidingModeLauncher: React.FC<RidingModeLauncherProps> = ({ onStartRidingMode }) => {
  return (
    <div className="riding-mode-launcher-card">
      <div className="riding-mode-launcher-text">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--moto-orange)',
            }}
          >
            Cockpit Display
          </span>
        </div>
        <h3>START RIDING MODE</h3>
        <p>
          High-contrast, glanceable telemetry mode optimized for handlebar phone mounts.
        </p>
      </div>

      <button
        type="button"
        className="btn-riding-mode"
        onClick={onStartRidingMode}
        title="Launch high-contrast handlebar riding mode"
      >
        <MotoLogoIcon size={18} />
        <span>Engage Cockpit</span>
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
};
