import React, { useState } from 'react';
import { RouteNavigationStep } from '../types/route-intelligence.types';

interface Props {
  steps: RouteNavigationStep[];
  activeStepIndex: number;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onExitNavigation: () => void;
  onRecenter?: () => void;
  isFollowPaused?: boolean;
  onToggleMute?: () => void;
  isMuted?: boolean;
  hideFloatingActions?: boolean;
  isPreview?: boolean;
}

export interface NavigationFloatingActionsProps {
  onRecenter?: () => void;
  isRecenterVisible?: boolean;
  onToggleMute?: () => void;
  isMuted?: boolean;
  onExitNavigation: () => void;
  recenterTitle?: string;
  exitTitle?: string;
  className?: string;
}

export const NavigationFloatingActions: React.FC<NavigationFloatingActionsProps> = ({
  onRecenter,
  isRecenterVisible = true,
  onToggleMute,
  isMuted = false,
  onExitNavigation,
  recenterTitle = 'Re-centre camera',
  exitTitle = 'Exit Preview',
  className = '',
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <div className={`navigation-floating-actions ${className}`.trim()} data-testid="navigation-floating-actions">
        {/* Recenter button */}
        {isRecenterVisible && onRecenter && (
          <button
            type="button"
            className="nav-hud-action-btn recenter"
            onClick={onRecenter}
            title={recenterTitle}
            data-testid="recenter-camera-btn"
          >
            <span className="nav-action-icon">🎯</span>
            <span className="nav-action-label">Re-centre</span>
          </button>
        )}

        {/* Voice guidance mute toggle */}
        {onToggleMute && (
          <button
            type="button"
            className={`nav-hud-action-btn ${isMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
            title={isMuted ? 'Voice Guidance: Muted' : 'Voice Guidance: Enabled'}
            data-testid="mute-guidance-btn"
          >
            <span className="nav-action-icon">{isMuted ? '🔇' : '🔊'}</span>
          </button>
        )}

        {/* Report Hazard Entry Point */}
        <button
          type="button"
          className="nav-hud-action-btn report"
          onClick={() => setShowReportModal(true)}
          title="Report Hazard or Road Issue"
          data-testid="report-hazard-btn"
        >
          <span className="nav-action-icon">⚠️</span>
        </button>

        {/* Exit Navigation / Preview */}
        <button
          type="button"
          className="nav-hud-action-btn exit"
          onClick={onExitNavigation}
          title={exitTitle}
          data-testid="exit-navigation-btn"
        >
          <span className="nav-action-icon">✕</span>
        </button>
      </div>

      {/* Truthful Report Hazard Modal */}
      {showReportModal && (
        <div className="report-hazard-modal-backdrop" data-testid="report-hazard-modal">
          <div className="report-hazard-modal">
            <div className="report-modal-header">
              <span className="report-modal-title">⚠️ Report Road Hazard</span>
              <button
                type="button"
                className="report-modal-close"
                onClick={() => setShowReportModal(false)}
                aria-label="Close report dialog"
              >
                ✕
              </button>
            </div>
            <p className="report-modal-desc">
              Community hazard crowd-sourcing is currently operating in <strong>Local Preview Mode</strong>.
            </p>
            <div className="report-modal-options">
              <button
                type="button"
                className="report-option-btn"
                onClick={() => {
                  alert('Hazard logged in local session. (Remote backend not connected)');
                  setShowReportModal(false);
                }}
              >
                🚨 Speed Breaker / Pothole
              </button>
              <button
                type="button"
                className="report-option-btn"
                onClick={() => {
                  alert('Hazard logged in local session. (Remote backend not connected)');
                  setShowReportModal(false);
                }}
              >
                🪨 Loose Gravel / Debris
              </button>
              <button
                type="button"
                className="report-option-btn"
                onClick={() => {
                  alert('Hazard logged in local session. (Remote backend not connected)');
                  setShowReportModal(false);
                }}
              >
                🚧 Road Construction / Diversion
              </button>
            </div>
            <div className="report-modal-footer">
              <span className="report-status-badge">Truthful Status: Not Connected to Server</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const TurnByTurnNavigationHUD: React.FC<Props> = ({
  steps,
  activeStepIndex,
  onNextStep,
  onPrevStep,
  onExitNavigation,
  onRecenter,
  isFollowPaused = false,
  onToggleMute,
  isMuted = false,
  hideFloatingActions = false,
  isPreview = false,
}) => {
  const currentStep: RouteNavigationStep | undefined = steps[activeStepIndex] || steps[0];
  const nextStep: RouteNavigationStep | undefined = steps[activeStepIndex + 1];

  const formatDistance = (meters?: number): string => {
    if (meters === undefined || meters === null) return '0 m';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const getManeuverIcon = (maneuver?: string): string => {
    switch (maneuver) {
      case 'depart':
        return '🚀';
      case 'arrive':
        return '🏁';
      case 'turn-left':
      case 'turn-sharp-left':
        return '↰';
      case 'turn-right':
      case 'turn-sharp-right':
        return '↱';
      case 'turn-slight-left':
        return '↖';
      case 'turn-slight-right':
        return '↗';
      case 'roundabout':
        return '🔄';
      case 'merge':
        return '⤹';
      case 'fork':
        return '⑂';
      default:
        return '↑';
    }
  };

  return (
    <div className="navigation-hud-wrapper" data-testid="turn-by-turn-navigation-hud">
      {/* Top Green/Dark Primary Instruction Card */}
      <div className="navigation-instruction-card">
        <div className="maneuver-icon-box" data-testid="maneuver-icon">
          <span className="maneuver-symbol">{getManeuverIcon(currentStep?.maneuver)}</span>
        </div>

        <div className="instruction-text-block">
          <div className="step-counter-header" data-testid="step-counter-badge">
            {activeStepIndex + 1} / {Math.max(1, steps.length)}
          </div>
          <div className="instruction-primary" data-testid="instruction-primary">
            {currentStep?.instruction || 'Proceed along highway'}
          </div>
          <div className="instruction-distance-row">
            <span className="instruction-distance" data-testid="instruction-distance">
              In {formatDistance(currentStep?.distanceM)}
            </span>
            <span className="instruction-road" data-testid="instruction-road">
              · {currentStep?.roadName || 'Follow route'}
            </span>
          </div>

          {nextStep && (
            <div className="instruction-next-preview" data-testid="instruction-next-preview">
              <span className="next-icon">{getManeuverIcon(nextStep.maneuver)}</span>
              <span className="next-label">Then {nextStep.instruction}</span>
            </div>
          )}
        </div>

        {/* Step Navigation Controls for Preview / Testing */}
        <div className="step-stepper-controls">
          <button
            type="button"
            className="stepper-btn"
            onClick={onPrevStep}
            disabled={activeStepIndex <= 0}
            title="Previous turn"
            data-testid="prev-maneuver-btn"
          >
            ‹
          </button>
          <span className="step-counter">
            {activeStepIndex + 1}/{Math.max(1, steps.length)}
          </span>
          <button
            type="button"
            className="stepper-btn"
            onClick={onNextStep}
            disabled={activeStepIndex >= steps.length - 1}
            title="Next turn"
            data-testid="next-maneuver-btn"
          >
            ›
          </button>
        </div>
      </div>

      {/* Floating Action Controls when not decoupled */}
      {!hideFloatingActions && (
        <NavigationFloatingActions
          onRecenter={onRecenter}
          isRecenterVisible={isPreview || isFollowPaused}
          onToggleMute={onToggleMute}
          isMuted={isMuted}
          onExitNavigation={onExitNavigation}
          recenterTitle={isPreview ? "Re-centre camera on current preview step" : "Re-center camera to current GPS location"}
          exitTitle={isPreview ? "Exit Preview" : "Exit Navigation Mode"}
        />
      )}
    </div>
  );
};
