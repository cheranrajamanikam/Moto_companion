import React from 'react';
import { RadioIcon } from './icons';

interface RiderAIHeaderProps {
  isDemoData?: boolean;
}

export const RiderAIHeader: React.FC<RiderAIHeaderProps> = ({ isDemoData = true }) => {
  return (
    <header className="rider-ai-header">
      <div className="rider-ai-header-left">
        <div className="rider-ai-title-row">
          <h1 className="rider-ai-title">AI RIDING COMPANION</h1>
          {isDemoData && (
            <span className="rider-ai-badge-demo" title="This environment is currently using simulated telemetry">
              <RadioIcon size={12} />
              DEMO DATA
            </span>
          )}
        </div>
        <p className="rider-ai-subtitle">Rider AI · Your intelligent ride companion</p>
      </div>
    </header>
  );
};
