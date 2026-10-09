import React, { useState } from 'react';
import { RouteNavigationStep } from '../types/route-intelligence.types';

interface Props {
  remainingDistanceKm: number;
  remainingDurationMinutes: number;
  routeName: string;
  steps: RouteNavigationStep[];
  onExitNavigation: () => void;
  onRecenter?: () => void;
  onToggleOverview?: () => void;
}

export const NavigationBottomSheet: React.FC<Props> = ({
  remainingDistanceKm,
  remainingDurationMinutes,
  routeName,
  steps,
  onExitNavigation,
  onRecenter,
  onToggleOverview,
}) => {
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);

  // Calculate dynamic ETA arrival time from current local clock + remaining minutes
  const calculateETA = (minutes: number): string => {
    const now = new Date();
    const arrival = new Date(now.getTime() + minutes * 60 * 1000);
    let hours = arrival.getHours();
    const mins = arrival.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    const minsFormatted = mins < 10 ? `0${mins}` : mins;
    return `${hours}:${minsFormatted} ${ampm}`;
  };

  const formatDuration = (totalMins: number): string => {
    if (totalMins <= 0) return '0 min';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} min`;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  };

  return (
    <div className="navigation-bottom-sheet" data-testid="navigation-bottom-sheet">
      <div className="bottom-sheet-drag-handle" />

      {/* Primary Metrics Row */}
      <div className="bottom-sheet-metrics-row">
        <div className="metric-cell eta">
          <span className="metric-main-value highlight" data-testid="nav-eta-value">
            {calculateETA(remainingDurationMinutes)}
          </span>
          <span className="metric-sub-label">ETA</span>
        </div>

        <div className="metric-divider" />

        <div className="metric-cell duration">
          <span className="metric-main-value" data-testid="nav-duration-value">
            {formatDuration(remainingDurationMinutes)}
          </span>
          <span className="metric-sub-label">Remaining</span>
        </div>

        <div className="metric-divider" />

        <div className="metric-cell distance">
          <span className="metric-main-value" data-testid="nav-distance-value">
            {remainingDistanceKm.toFixed(1)} km
          </span>
          <span className="metric-sub-label">Distance</span>
        </div>
      </div>

      {/* Route Context Bar */}
      <div className="bottom-sheet-context-bar">
        <span className="route-context-text" data-testid="nav-route-context">
          {routeName}
        </span>
        <span className="route-traffic-status">Traffic: Unavailable · Geometric</span>
      </div>

      {/* Navigation Quick Actions Row */}
      <div className="bottom-sheet-actions-row">
        <button
          type="button"
          className="bottom-sheet-action-btn steps"
          onClick={() => setShowStepsDrawer((prev) => !prev)}
          data-testid="toggle-steps-drawer-btn"
        >
          <span>📋</span> {showStepsDrawer ? 'Hide Steps' : 'Route Steps'}
        </button>

        {onToggleOverview && (
          <button
            type="button"
            className="bottom-sheet-action-btn overview"
            onClick={onToggleOverview}
            data-testid="nav-overview-btn"
          >
            <span>🗺️</span> Overview
          </button>
        )}

        {onRecenter && (
          <button
            type="button"
            className="bottom-sheet-action-btn recenter"
            onClick={onRecenter}
            data-testid="bottom-sheet-recenter-btn"
          >
            <span>🎯</span> Re-centre
          </button>
        )}

        <button
          type="button"
          className="bottom-sheet-action-btn exit"
          onClick={onExitNavigation}
          data-testid="bottom-sheet-exit-btn"
        >
          <span>✕</span> Exit
        </button>
      </div>

      {/* Expandable Route Turn-by-Turn Steps Drawer */}
      {showStepsDrawer && (
        <div className="bottom-sheet-steps-drawer" data-testid="nav-steps-drawer">
          <div className="steps-drawer-header">
            <span className="steps-drawer-title">All Turn-by-Turn Steps ({steps.length})</span>
            <button
              type="button"
              className="steps-drawer-close"
              onClick={() => setShowStepsDrawer(false)}
            >
              ✕
            </button>
          </div>
          <div className="steps-list-scroll">
            {steps.map((step, idx) => (
              <div key={idx} className="step-row-item">
                <span className="step-row-index">{idx + 1}</span>
                <div className="step-row-body">
                  <span className="step-row-instruction">{step.instruction}</span>
                  <span className="step-row-meta">
                    {(step.distanceM ?? 0) >= 1000
                      ? `${((step.distanceM ?? 0) / 1000).toFixed(1)} km`
                      : `${step.distanceM ?? 0} m`}{' '}
                    • {step.roadName || 'Unnamed Road'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
