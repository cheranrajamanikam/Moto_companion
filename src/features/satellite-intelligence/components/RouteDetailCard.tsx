import React, { useState } from 'react';
import { RouteIntelligence } from '../types/route-intelligence.types';

interface Props {
  route: RouteIntelligence;
  onStartNavigation: () => void;
  onPreviewRoute: () => void;
  onAddStop?: () => void;
}

export const RouteDetailCard: React.FC<Props> = ({
  route,
  onStartNavigation,
  onPreviewRoute,
  onAddStop,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const formatDuration = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  };

  const handleShare = async () => {
    const shareData = {
      title: `MotoCompanion Route: ${route.routeName}`,
      text: `Ride Plan from ${route.origin} to ${route.destination}: ${route.totalDistanceKm} km, ~${formatDuration(route.totalDurationMinutes)} (Safety Score: ${route.safetyScore.overallScore}/100)`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const text = `MotoCompanion Route: ${route.routeName}\nFrom: ${route.origin}\nTo: ${route.destination}\nDistance: ${route.totalDistanceKm} km\nEstimated: ${formatDuration(route.totalDurationMinutes)}\nSafety Score: ${route.safetyScore.overallScore}/100`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="route-detail-card" data-testid="route-detail-card">
      {/* Route Header Metrics */}
      <div className="route-detail-header">
        <div className="route-duration-group">
          <span className="route-big-duration" data-testid="route-big-duration">
            {formatDuration(route.totalDurationMinutes)}
          </span>
          <span className="route-big-distance" data-testid="route-big-distance">
            ({route.totalDistanceKm} km)
          </span>
        </div>
        <div className="route-safety-badge" data-testid="route-safety-badge">
          <span>Safety {route.safetyScore.overallScore}/100</span>
        </div>
      </div>

      {/* Corridor Name & Trajectory */}
      <div className="route-name-row">
        <span className="route-name-text">{route.routeName}</span>
      </div>

      {/* Honest Traffic & Routing Disclosures */}
      <div className="route-honest-disclosures">
        <span className="disclosure-pill" data-testid="traffic-unavailable-pill">
          ⚠️ Live traffic unavailable · Geometric road routing
        </span>
        <span className="disclosure-pill elevation">
          ⛰️ +{route.totalElevationGainM}m elevation
        </span>
      </div>

      {/* Primary Action Buttons Row */}
      <div className="route-detail-actions-row">
        <button
          type="button"
          className="route-action-btn start"
          onClick={onStartNavigation}
          data-testid="start-navigation-btn"
        >
          <span className="btn-icon">▶</span>
          <span>Start Navigation</span>
        </button>

        <button
          type="button"
          className="route-action-btn preview"
          onClick={onPreviewRoute}
          data-testid="preview-route-btn"
        >
          <span className="btn-icon">👁️</span>
          <span>Preview</span>
        </button>

        {onAddStop && (
          <button
            type="button"
            className="route-action-btn stop"
            onClick={onAddStop}
            data-testid="add-stop-btn"
          >
            <span className="btn-icon">➕</span>
            <span>Add Stop</span>
          </button>
        )}

        <button
          type="button"
          className="route-action-btn share"
          onClick={handleShare}
          data-testid="share-route-btn"
        >
          <span className="btn-icon">🔗</span>
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>

        <button
          type="button"
          className={`route-action-btn save ${saved ? 'saved' : ''}`}
          onClick={() => setSaved(!saved)}
          data-testid="save-route-btn"
        >
          <span className="btn-icon">🔖</span>
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};
