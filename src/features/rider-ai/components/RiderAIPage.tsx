import React from 'react';
import {
  RiderContext,
  BikeContext,
  RouteContext,
  RideContext,
  HazardContext,
  WeatherContext,
  RiderAIContext,
} from '../types';
import { getMockRiderAIContext } from '../adapters/mock-context.adapter';
import { useRiderAI } from '../hooks/useRiderAI';
import { RiderAIHeader } from './RiderAIHeader';
import { CurrentRideCard } from './CurrentRideCard';
import { RiderContextCard } from './RiderContextCard';
import { RouteIntelligenceCard } from './RouteIntelligenceCard';
import { MapSurface } from './MapSurface';
import { AIChatPanel } from './AIChatPanel';
import { RidingModeLauncher } from './RidingModeLauncher';
import { MotoLogoIcon } from './icons';
import '../styles/rider-ai.css';

export interface RiderAIPageProps {
  rider?: RiderContext;
  bike?: BikeContext;
  route?: RouteContext;
  ride?: RideContext;
  hazards?: HazardContext[];
  weather?: WeatherContext;
  onNavigateToRidingMode?: () => void;
}

export const RiderAIPage: React.FC<RiderAIPageProps> = ({
  rider: propRider,
  bike: propBike,
  route: propRoute,
  ride: propRide,
  hazards: propHazards,
  weather: propWeather,
  onNavigateToRidingMode,
}) => {
  // Fall back to the Phase 1 mock adapter if props are not supplied (Section 22)
  const defaultContext = getMockRiderAIContext();
  const rider = propRider || defaultContext.rider;
  const bike = propBike || defaultContext.bike;
  const route = propRoute || defaultContext.route;
  const ride = propRide || defaultContext.ride;
  const hazards = propHazards || defaultContext.hazards || [];
  const weather = propWeather || defaultContext.weather;

  const unifiedContext: RiderAIContext = {
    rider,
    bike,
    route,
    ride,
    hazards,
    weather,
    location: defaultContext.location,
    dataFreshness: defaultContext.dataFreshness,
    isDemoData: defaultContext.isDemoData,
    generatedTimestamp: Date.now(),
  };

  // Connect decoupled useRiderAI state management (Phase 3 & 5)
  const {
    messages,
    isThinking,
    statusInfo,
    isRateLimited,
    rateLimitSecondsRemaining,
    sendMessage,
    resetConversation,
  } = useRiderAI({
    context: unifiedContext,
  });

  return (
    <div className="rider-ai-scope">
      {/* Top Navbar matching MotoCompanion Reference */}
      <nav className="moto-navbar">
        <div className="moto-nav-left">
          <div className="moto-logo-box">
            <MotoLogoIcon size={22} />
          </div>
          <a href="#" className="moto-logo-text">
            Moto<span>Companion</span>
          </a>
        </div>

        <ul className="moto-nav-links">
          <li>
            <a href="#intelligence" className="moto-nav-link active">
              Intelligence
            </a>
          </li>
          <li>
            <a href="#features" className="moto-nav-link">
              Features
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="moto-nav-link">
              How it works
            </a>
          </li>
          <li>
            <a href="#safety" className="moto-nav-link">
              Safety
            </a>
          </li>
          <li>
            <a href="#community" className="moto-nav-link">
              Community
            </a>
          </li>
          <li>
            <a href="#riders" className="moto-nav-link">
              Riders
            </a>
          </li>
        </ul>

        <div className="moto-nav-right">
          <div className="moto-theme-toggle" title="Dark theme active">
            <div className="moto-theme-knob">
              <span style={{ fontSize: '0.75rem' }}>🌙</span>
            </div>
          </div>
          <button type="button" className="moto-btn-get-started">
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Page Layout */}
      <main className="rider-ai-container">
        {/* Header */}
        <RiderAIHeader isDemoData={true} />

        {/* 2-Column Responsive Command Center Grid */}
        <div className="rider-ai-grid">
          {/* Left Column: Route, Ride & Map Intelligence */}
          <div className="rider-ai-left-column">
            <CurrentRideCard ride={ride} route={route} />
            <RouteIntelligenceCard route={route} hazards={hazards} weather={weather} />
            <MapSurface
              route={route}
              hazards={hazards}
              onViewMap={() => alert('Map integration point: linked to Member 1 Map component')}
              onViewHazard={(id) => alert(`Inspecting hazard #${id} on route corridor`)}
              onFindAlternative={() => sendMessage('Find a safer route')}
            />
            <RidingModeLauncher
              onStartRidingMode={() => {
                if (onNavigateToRidingMode) {
                  onNavigateToRidingMode();
                } else {
                  window.location.hash = '#/riding-mode';
                }
              }}
            />
          </div>

          {/* Right Column: Rider/Bike Profile & AI Co-Pilot Chat */}
          <div className="rider-ai-right-column">
            <RiderContextCard rider={rider} bike={bike} />
            <AIChatPanel
              messages={messages}
              isThinking={isThinking}
              statusInfo={statusInfo}
              isRateLimited={isRateLimited}
              rateLimitSecondsRemaining={rateLimitSecondsRemaining}
              onSendMessage={sendMessage}
              onResetConversation={resetConversation}
              onViewMap={() => alert('Viewing hazard coordinate on corridor radar')}
              onFindSaferRoute={() => sendMessage('Find a safer route')}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
