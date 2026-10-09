import React, { useState, useEffect } from 'react';
import { RouteIntelligence } from '../types/route-intelligence.types';
import { Hazard } from '../types/hazard.types';
import { RoutePOI, POICategory } from '../types/poi.types';
import { MapLayerMode } from '../types/map.types';
import { PRESET_CORRIDORS } from '../data/preset-corridors';
import { demoIntelligenceAdapter } from '../adapters/demo-intelligence.adapter';
import { demoPOIAdapter } from '../adapters/demo-poi.adapter';
import { RouteSummaryHeader } from './RouteSummaryHeader';
import { SatelliteMapSurface } from './SatelliteMapSurface';
import { NearRoutePOIPanel } from './NearRoutePOIPanel';
import { LocationInspector } from './LocationInspector';
import { RouteWeatherCard } from './RouteWeatherCard';
import { RouteAlternativesCard } from './RouteAlternativesCard';
import { MapExplorationSearch } from './MapExplorationSearch';
import { RoutePlannerHeader } from './RoutePlannerHeader';
import { TravelModeSelector, TravelMode } from './TravelModeSelector';
import { RecentDestinationsCard } from './RecentDestinationsCard';
import { RouteDetailCard } from './RouteDetailCard';
import { TurnByTurnNavigationHUD } from './TurnByTurnNavigationHUD';
import { SpeedIndicatorHUD } from './SpeedIndicatorHUD';
import { NavigationBottomSheet } from './NavigationBottomSheet';
import { navigationStorageService, RecentDestinationItem } from '../services/navigation-storage.service';
import {
  PlaceApiResult,
  RouteApiResult,
  RouteWeatherSummary,
  mapApiService,
} from '../services/map-api.service';
import {
  computeMinDistanceToPolylineKm,
  computeRouteBounds,
  isValidRoadGeometry,
  sampleRouteCheckpoints,
} from '../services/route-geometry.service';
import { calculateRouteSafetyScore } from '../services/safety-scoring.service';
import { routeContextBridgeService } from '../services/route-context-bridge.service';
import '../styles/satellite-intelligence.css';

interface Props {
  corridorKey?: string;
  onNavigateToCockpit?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigate?: (route: string) => void;
}

const DEFAULT_WEATHER_FIXTURE: RouteWeatherSummary = {
  checkpoints: [
    {
      locationName: 'Nelamangala Plains',
      coordinates: [77.4987, 13.0982],
      temperatureC: 28,
      rainProbabilityPercent: 15,
      weatherCode: 1,
      weatherDescription: 'Partly Cloudy',
      windSpeedKmh: 12,
      visibilityKm: 10,
      roadGripRisk: 'low',
    },
    {
      locationName: 'Kunigal Midpoint',
      coordinates: [77.2401, 13.0245],
      temperatureC: 27,
      rainProbabilityPercent: 25,
      weatherCode: 2,
      weatherDescription: 'Scattered Clouds',
      windSpeedKmh: 14,
      visibilityKm: 10,
      roadGripRisk: 'low',
    },
    {
      locationName: 'Hassan Plateau',
      coordinates: [76.1023, 13.0068],
      temperatureC: 24,
      rainProbabilityPercent: 40,
      weatherCode: 3,
      weatherDescription: 'Overcast & Humid',
      windSpeedKmh: 18,
      visibilityKm: 8,
      roadGripRisk: 'moderate',
    },
    {
      locationName: 'Mudigere Ghat Summit',
      coordinates: [75.7765, 13.2189],
      temperatureC: 21,
      rainProbabilityPercent: 65,
      weatherCode: 61,
      weatherDescription: 'Passing Monsoon Showers',
      windSpeedKmh: 22,
      visibilityKm: 5,
      roadGripRisk: 'high',
    },
  ],
  maxRainProbability: 65,
  overallCondition: 'Passing showers in ghat sectors; dry on highway plains',
  advisory: 'Reduce lean angles on Mudigere Ghat curves due to wet asphalt.',
  provenance: {
    source: 'Open-Meteo Historical Fallback',
    sourceUrl: 'https://open-meteo.com',
    timestamp: new Date().toISOString(),
    freshness: 'demo',
    isDemoData: true,
  },
};

export const SatelliteIntelligencePage: React.FC<Props> = ({
  corridorKey: initialCorridorKey = 'blr-ckm',
  onNavigateToCockpit,
  onNavigateToCommunity,
  onNavigate,
}) => {
  const [corridorKey, setCorridorKey] = useState<string>(initialCorridorKey);
  const [routeIntelligence, setRouteIntelligence] = useState<RouteIntelligence | null>(() => {
    try {
      return demoIntelligenceAdapter.getRouteIntelligenceSync(initialCorridorKey);
    } catch {
      return null;
    }
  });
  const [pois, setPois] = useState<RoutePOI[]>(() => {
    try {
      return demoPOIAdapter.getRoutePOIsSync({ corridorKey: initialCorridorKey });
    } catch {
      return [];
    }
  });
  const [weatherSummary, setWeatherSummary] = useState<RouteWeatherSummary | null>(DEFAULT_WEATHER_FIXTURE);
  const [showOSINTLayer, setShowOSINTLayer] = useState<boolean>(true);
  const [showWeatherLayer, setShowWeatherLayer] = useState<boolean>(true);
  const [activeRouteId, setActiveRouteId] = useState<string>('primary');
  const [availableAlternates, setAvailableAlternates] = useState<RouteApiResult[]>(() => {
    const preset = PRESET_CORRIDORS[initialCorridorKey] || PRESET_CORRIDORS['blr-ckm'];
    return preset?.alternateRoute
      ? [
          {
            id: preset.alternateRoute.id,
            name: preset.alternateRoute.name,
            originName: preset.origin,
            destinationName: preset.destination,
            coordinates: preset.alternateRoute.coordinates,
            distanceKm: preset.alternateRoute.distanceKm,
            durationMinutes: preset.alternateRoute.durationMinutes,
            elevationGainM: 950,
            advantage: preset.alternateRoute.advantage,
            distanceDeltaKm: preset.alternateRoute.distanceDeltaKm,
            safetyScoreDelta: preset.alternateRoute.safetyScoreDelta,
            steps: [],
            provenance: {
              source: 'MotoCompanion Curated Bypass Fixture',
              timestamp: new Date().toISOString(),
              freshness: 'demo',
              isDemoData: true,
            },
          },
        ]
      : [];
  });
  const [activeMapMode, setActiveMapMode] = useState<MapLayerMode>('dark');
  const [selectedPOICategory, setSelectedPOICategory] = useState<POICategory | 'all'>('all');
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<RoutePOI | null>(null);
  const [inspectedLocation, setInspectedLocation] = useState<PlaceApiResult | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Map Navigation Platform State
  const [navigationMode, setNavigationMode] = useState<'browse' | 'planning' | 'navigating' | 'preview'>('planning');
  const [travelMode, setTravelMode] = useState<TravelMode>('two-wheeler');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFollowPaused, setIsFollowPaused] = useState<boolean>(false);
  const [liveSpeedMps, setLiveSpeedMps] = useState<number | null>(null);
  const [liveHeading, setLiveHeading] = useState<number | null>(null);
  const [recentDestinations, setRecentDestinations] = useState<RecentDestinationItem[]>(() => {
    return navigationStorageService.getRecentDestinations();
  });
  const [stops, setStops] = useState<string[]>([]);

  const availableCorridors = demoIntelligenceAdapter.getAvailableCorridors();

  // Live GPS tracking when navigation mode is active
  useEffect(() => {
    if (navigationMode !== 'navigating') {
      setLiveSpeedMps(null);
      return;
    }

    if (!navigator.geolocation) {
      console.warn('[SatelliteIntelligencePage] Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coords);
        setLiveSpeedMps(pos.coords.speed !== null && pos.coords.speed !== undefined ? pos.coords.speed : null);
        setLiveHeading(pos.coords.heading !== null && pos.coords.heading !== undefined ? pos.coords.heading : null);
      },
      (err) => {
        console.warn('[SatelliteIntelligencePage] GPS tracking notice:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [navigationMode]);

  // Load Corridor Intelligence, POIs, Real Road Geometry, Open-Meteo Weather, and OSINT Feeds
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      demoIntelligenceAdapter.getRouteIntelligence(corridorKey),
      demoPOIAdapter.getRoutePOIs({ corridorKey }),
      mapApiService.getRoute({ corridorKey, alternatives: true }),
      mapApiService.getRouteWeather({ corridorKey }),
      mapApiService.getOSINTHazards(),
    ]).then(([intel, poiList, roadRoute, weather, osint]) => {
      if (isMounted) {
        // Merge corridor hazards and OSINT hazards (avoid duplicate IDs)
        const hazardMap = new Map<string, Hazard>();
        intel.hazards.forEach((h) => hazardMap.set(h.id, h));
        osint.forEach((h) => hazardMap.set(h.id, h));
        const mergedHazards = Array.from(hazardMap.values());

        // Recalculate dynamic safety score with single source of truth scoring engine
        const dynamicSafetyScore = calculateRouteSafetyScore({
          segments: intel.segments,
          hazards: mergedHazards,
          totalElevationGainM: intel.totalElevationGainM,
          sharpTurnsCount: intel.segments.some((s) => s.surfaceType === 'ghat-pass') ? 14 : 4,
          weather: {
            rainProbabilityPercent: weather.maxRainProbability,
            windSpeedKmh: weather.checkpoints[0]?.windSpeedKmh || 15,
            visibilityKm: weather.checkpoints[0]?.visibilityKm || 10,
            weatherDescription: weather.overallCondition,
          },
          riderSkillLevel: 'intermediate',
        });

        // Enhance route with real road-following coordinates & OSRM maneuver steps
        const enhancedIntel: RouteIntelligence = {
          ...intel,
          routePolyline:
            roadRoute.coordinates && roadRoute.coordinates.length > 0
              ? roadRoute.coordinates
              : intel.routePolyline,
          totalDistanceKm: roadRoute.distanceKm || intel.totalDistanceKm,
          totalDurationMinutes: roadRoute.durationMinutes || intel.totalDurationMinutes,
          hazards: mergedHazards,
          safetyScore: dynamicSafetyScore,
          steps: roadRoute.steps && roadRoute.steps.length > 0 ? roadRoute.steps : [],
        };

        setRouteIntelligence(enhancedIntel);
        setPois(poiList);
        setWeatherSummary(weather);
        setAvailableAlternates(roadRoute.alternates || []);
        setActiveRouteId('primary');
        setSelectedHazard(null);
        setSelectedPOI(null);
        setInspectedLocation(null);
        setIsLoading(false);

        // Publish authoritative route intelligence to Rider AI Bridge
        routeContextBridgeService.updateActiveRoute(enhancedIntel, weather, mergedHazards);

        // Record initial destination in recents
        navigationStorageService.saveDestination({
          name: intel.destination,
          displayName: `${intel.destination} Corridor Endpoint`,
          coordinates: intel.routePolyline[intel.routePolyline.length - 1],
        });
        setRecentDestinations(navigationStorageService.getRecentDestinations());
      }
    });

    return () => {
      isMounted = false;
    };
  }, [corridorKey]);

  /**
   * Recomputes weather, OSINT hazards, and dynamic safety score along active route,
   * then publishes to the Rider AI Bridge Service.
   */
  const syncRouteIntelligenceAndBridge = async (
    roadRoute: RouteApiResult,
    originName: string,
    destinationName: string,
    baseIntel: RouteIntelligence
  ) => {
    // 1. Dynamic Checkpoint Sampling along the active route polyline (3-5 points)
    const sampled = sampleRouteCheckpoints(roadRoute.coordinates, originName, destinationName, 4);

    // 2. Fetch multi-checkpoint Open-Meteo weather for the active polyline
    const freshWeather = await mapApiService.getRouteWeather({
      corridorKey,
      checkpoints: sampled.map((s) => ({ name: s.name, coordinates: s.coordinates })),
    });

    // 3. Fetch OSINT hazards
    const freshOSINT = await mapApiService.getOSINTHazards();

    // 4. Merge corridor hazards and OSINT hazards
    const hazardMap = new Map<string, Hazard>();
    baseIntel.hazards.forEach((h) => hazardMap.set(h.id, h));
    freshOSINT.forEach((h) => hazardMap.set(h.id, h));
    const mergedHazards = Array.from(hazardMap.values());

    // 5. Dynamic Safety Scoring derived from actual route inputs
    const dynamicSafetyScore = calculateRouteSafetyScore({
      segments: baseIntel.segments,
      hazards: mergedHazards,
      totalElevationGainM: baseIntel.totalElevationGainM,
      sharpTurnsCount: baseIntel.segments.some((s) => s.surfaceType === 'ghat-pass') ? 14 : 4,
      weather: {
        rainProbabilityPercent: freshWeather.maxRainProbability,
        windSpeedKmh: freshWeather.checkpoints[0]?.windSpeedKmh || 15,
        visibilityKm: freshWeather.checkpoints[0]?.visibilityKm || 10,
        weatherDescription: freshWeather.overallCondition,
      },
      riderSkillLevel: 'intermediate',
    });

    const updatedIntel: RouteIntelligence = {
      ...baseIntel,
      origin: originName,
      destination: destinationName,
      routeName: `${originName} to ${destinationName}`,
      routePolyline:
        roadRoute.coordinates && roadRoute.coordinates.length > 0
          ? roadRoute.coordinates
          : baseIntel.routePolyline,
      totalDistanceKm: roadRoute.distanceKm || baseIntel.totalDistanceKm,
      totalDurationMinutes: roadRoute.durationMinutes || baseIntel.totalDurationMinutes,
      hazards: mergedHazards,
      safetyScore: dynamicSafetyScore,
      steps: roadRoute.steps && roadRoute.steps.length > 0 ? roadRoute.steps : baseIntel.steps || [],
    };

    setRouteIntelligence(updatedIntel);
    setWeatherSummary(freshWeather);

    // 6. Update Route Context Bridge Service
    routeContextBridgeService.updateActiveRoute(updatedIntel, freshWeather, mergedHazards);

    return { updatedIntel, freshWeather, mergedHazards };
  };

  // Handle switching between Primary and Alternate routes
  const handleSelectRoute = (routeId: string) => {
    setActiveRouteId(routeId);
    if (!routeIntelligence) return;

    if (routeId === 'primary') {
      mapApiService.getRoute({ corridorKey, alternatives: true }).then((roadRoute) => {
        syncRouteIntelligenceAndBridge(
          roadRoute,
          routeIntelligence.origin,
          routeIntelligence.destination,
          routeIntelligence
        );
      });
    } else {
      const selectedAlt = availableAlternates.find((a) => a.id === routeId);
      if (selectedAlt && selectedAlt.coordinates.length > 0) {
        if (!isValidRoadGeometry(selectedAlt.coordinates)) {
          // If the alternate was from a demo fixture with sparse waypoints, fetch real road geometry between origin and destination
          const origin = selectedAlt.coordinates[0];
          const dest = selectedAlt.coordinates[selectedAlt.coordinates.length - 1];
          mapApiService
            .getRoute({
              origin,
              destination: dest,
              originName: selectedAlt.originName,
              destinationName: selectedAlt.destinationName,
            })
            .then((roadRoute) => {
              syncRouteIntelligenceAndBridge(
                roadRoute,
                selectedAlt.originName || routeIntelligence.origin,
                selectedAlt.destinationName || routeIntelligence.destination,
                routeIntelligence
              );
            });
        } else {
          syncRouteIntelligenceAndBridge(
            selectedAlt,
            selectedAlt.originName || routeIntelligence.origin,
            selectedAlt.destinationName || routeIntelligence.destination,
            routeIntelligence
          );
        }
      }
    }
  };

  // Handle setting a new destination from search or map inspection
  const handleSetDestination = async (coords: [number, number], name: string) => {
    if (!routeIntelligence) return;
    const origin = routeIntelligence.routePolyline[0];

    try {
      const updatedRoute = await mapApiService.getRoute({
        origin,
        destination: coords,
        originName: routeIntelligence.origin,
        destinationName: name,
        alternatives: true,
      });

      await syncRouteIntelligenceAndBridge(
        updatedRoute,
        routeIntelligence.origin,
        name,
        routeIntelligence
      );
      setAvailableAlternates(updatedRoute.alternates || []);
      setActiveRouteId('primary');
      setInspectedLocation(null);

      // Save to recent destinations
      navigationStorageService.saveDestination({
        name,
        displayName: name,
        coordinates: coords,
      });
      setRecentDestinations(navigationStorageService.getRecentDestinations());
    } catch (err) {
      console.warn('[SatelliteIntelligencePage] Re-routing failed:', err);
    }
  };

  // Handle updating origin
  const handleUpdateOrigin = async (name: string, coords?: [number, number]) => {
    if (!routeIntelligence) return;
    const dest = routeIntelligence.routePolyline[routeIntelligence.routePolyline.length - 1];
    const newOriginCoords = coords || (userLocation || routeIntelligence.routePolyline[0]);

    try {
      const updatedRoute = await mapApiService.getRoute({
        origin: newOriginCoords,
        destination: dest,
        originName: name,
        destinationName: routeIntelligence.destination,
        alternatives: true,
      });

      await syncRouteIntelligenceAndBridge(
        updatedRoute,
        name,
        routeIntelligence.destination,
        routeIntelligence
      );
      setAvailableAlternates(updatedRoute.alternates || []);
    } catch (err) {
      console.warn('[SatelliteIntelligencePage] Origin update failed:', err);
    }
  };

  // Handle swapping endpoints
  const handleSwapEndpoints = async () => {
    if (!routeIntelligence) return;
    const prevOriginName = routeIntelligence.origin;
    const prevDestName = routeIntelligence.destination;
    const prevOriginCoords = routeIntelligence.routePolyline[0];
    const prevDestCoords = routeIntelligence.routePolyline[routeIntelligence.routePolyline.length - 1];

    try {
      const updatedRoute = await mapApiService.getRoute({
        origin: prevDestCoords,
        destination: prevOriginCoords,
        originName: prevDestName,
        destinationName: prevOriginName,
        alternatives: true,
      });

      await syncRouteIntelligenceAndBridge(
        updatedRoute,
        prevDestName,
        prevOriginName,
        routeIntelligence
      );
      setAvailableAlternates(updatedRoute.alternates || []);
    } catch (err) {
      console.warn('[SatelliteIntelligencePage] Swap endpoints failed:', err);
    }
  };

  // Handle using current GPS location as Origin
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser environment.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coords);
        handleUpdateOrigin('Your Location', coords);
      },
      (err) => {
        console.warn('[SatelliteIntelligencePage] Current location unavailable:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleStartNavigation = () => {
    if (!navigator.geolocation) {
      alert('Current location unavailable — Geolocation is not supported by your browser environment.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLoading(false);
        const userCoords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(userCoords);
        setIsFollowPaused(false);
        setActiveStepIndex(0);

        // Recalculate route CURRENT LOCATION → DESTINATION
        if (routeIntelligence) {
          const dest = routeIntelligence.routePolyline[routeIntelligence.routePolyline.length - 1];
          try {
            const freshRoute = await mapApiService.getRoute({
              origin: userCoords,
              destination: dest,
              originName: 'Your Location',
              destinationName: routeIntelligence.destination,
              alternatives: true,
            });

            await syncRouteIntelligenceAndBridge(
              freshRoute,
              'Your Location',
              routeIntelligence.destination,
              routeIntelligence
            );
            setAvailableAlternates(freshRoute.alternates || []);
          } catch (err) {
            console.warn('[SatelliteIntelligencePage] GPS reroute notice:', err);
          }
        }

        setNavigationMode('navigating');
      },
      (err) => {
        setIsLoading(false);
        console.warn('[SatelliteIntelligencePage] Geolocation unavailable for Start Navigation:', err.message);
        alert('Current location unavailable — GPS permission required to start navigation.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Turn-by-Turn GPS Step Progression: Advances maneuver when rider reaches step coordinates
  useEffect(() => {
    if (navigationMode !== 'navigating' || !userLocation || !routeIntelligence?.steps) return;
    const currentStep = routeIntelligence.steps[activeStepIndex];
    if (!currentStep || !currentStep.location) return;

    const R = 6371000;
    const dLat = ((currentStep.location[1] - userLocation[1]) * Math.PI) / 180;
    const dLon = ((currentStep.location[0] - userLocation[0]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation[1] * Math.PI) / 180) *
        Math.cos((currentStep.location[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (distM < 45 && activeStepIndex < routeIntelligence.steps.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    }
  }, [userLocation, navigationMode, activeStepIndex, routeIntelligence?.steps]);

  const handleExitNavigation = () => {
    setNavigationMode('planning');
    setIsFollowPaused(false);
  };

  const handlePreviewRoute = () => {
    setNavigationMode('preview');
    setActiveStepIndex(0);
  };

  const handleExitPreview = () => {
    setNavigationMode('planning');
  };

  // Requirement 1: Preview Re-centre returns map camera to current maneuver step position
  const handlePreviewRecenter = () => {
    const map = (window as any).__mc_map;
    if (!map) return;

    const currentStep = routeIntelligence?.steps?.[activeStepIndex];
    if (currentStep?.location && Array.isArray(currentStep.location) && currentStep.location.length === 2) {
      map.easeTo({
        center: currentStep.location,
        zoom: 14,
        duration: 400,
      });
    } else if (routeIntelligence?.routePolyline && routeIntelligence.routePolyline.length > 0) {
      const bounds = computeRouteBounds(routeIntelligence.routePolyline);
      map.fitBounds(
        [
          [bounds.minLon, bounds.minLat],
          [bounds.maxLon, bounds.maxLat],
        ],
        { padding: 60, duration: 400 }
      );
    }
  };

  // Handle finding nearby POIs relative to an inspected location
  const handleFindNearbyPOIs = async (coords: [number, number]) => {
    try {
      const nearby = await mapApiService.getPOIs({
        lat: coords[1],
        lng: coords[0],
        radiusKm: 25,
      });
      if (nearby && nearby.length > 0) {
        setPois(nearby);
      }
    } catch (err) {
      console.warn('[SatelliteIntelligencePage] Nearby POI search failed:', err);
    }
  };

  return (
    <div className="satellite-intelligence-scope">
      
      {/* Touring Corridor Switcher Sub-Bar (Visible in Planning / Browse Modes) */}
      {navigationMode !== 'navigating' && (
        <div className="corridor-selector-bar">
          <span className="selector-label">Curated Touring Corridor:</span>
          <div className="corridor-pills-row">
            {availableCorridors.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`corridor-pill-btn ${corridorKey === c.key ? 'active' : ''}`}
                onClick={() => setCorridorKey(c.key)}
              >
                <span>{c.name.split(' via ')[0]}</span>
                <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({Math.round(c.distanceKm)}km)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Placeholder */}
      {!routeIntelligence ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--moto-text-secondary)' }}>
          Loading corridor intelligence & satellite layers...
        </div>
      ) : (
        <>
          {isLoading && (
            <div
              style={{
                position: 'fixed',
                top: '70px',
                right: '20px',
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--moto-primary-cyan)',
                color: 'var(--moto-primary-cyan)',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-chakra)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              Updating Intelligence & Weather...
            </div>
          )}

          {/* Route Summary Telemetry Header (Visible in Planning / Browse) */}
          {navigationMode !== 'navigating' && (
            <RouteSummaryHeader route={routeIntelligence} />
          )}

          {/* Main 2-Column Responsive Cockpit Layout */}
          <main className="cockpit-main-layout">
            {/* Map Dominant Column (~68% on desktop) */}
            <div className="map-dominant-column" style={{ position: 'relative' }}>
              {/* Route Preview Top Banner */}
              {navigationMode === 'preview' && (
                <div className="route-preview-banner" data-testid="route-preview-banner">
                  <span className="route-preview-text">
                    Route Preview Mode · Step-by-Step Trajectory Inspection
                  </span>
                  <div className="route-preview-actions">
                    <button
                      type="button"
                      className="preview-start-btn"
                      onClick={handleStartNavigation}
                      data-testid="preview-start-nav-btn"
                    >
                      Start Navigation
                    </button>
                    <button
                      type="button"
                      className="preview-exit-btn"
                      onClick={handleExitPreview}
                      data-testid="preview-exit-btn"
                    >
                      Exit Preview
                    </button>
                  </div>
                </div>
              )}

              {/* Route Planner Header with Origin/Destination Inputs (Planning / Browse Mode) */}
              {navigationMode !== 'navigating' && (
                <>
                  {/* Independent Map / Place Exploration Search Bar */}
                  <MapExplorationSearch
                    onSelectPlace={(place) => {
                      setInspectedLocation(place);
                      setSelectedHazard(null);
                      setSelectedPOI(null);
                    }}
                  />

                  <div className="map-search-divider" />

                  <RoutePlannerHeader
                    originName={routeIntelligence.origin}
                    destinationName={routeIntelligence.destination}
                    onUpdateOrigin={handleUpdateOrigin}
                    onUpdateDestination={(name, coords) => coords && handleSetDestination(coords, name)}
                    onSwapEndpoints={handleSwapEndpoints}
                    onUseCurrentLocation={handleUseCurrentLocation}
                    onSelectSearchResult={(place) => {
                      setInspectedLocation(place);
                      setSelectedHazard(null);
                      setSelectedPOI(null);
                    }}
                    stops={stops}
                    onAddStop={(stop) => setStops((prev) => [...prev, stop])}
                    onRemoveStop={(idx) => setStops((prev) => prev.filter((_, i) => i !== idx))}
                  />

                  <TravelModeSelector
                    activeMode={travelMode}
                    onSelectMode={setTravelMode}
                    twoWheelerDurationMinutes={routeIntelligence.totalDurationMinutes}
                    carDurationMinutes={Math.round(routeIntelligence.totalDurationMinutes * 1.15)}
                    transitDurationMinutes={Math.round(routeIntelligence.totalDurationMinutes * 1.35)}
                    walkingDurationMinutes={Math.round((routeIntelligence.totalDistanceKm / 4.5) * 60)}
                    routeDistanceKm={routeIntelligence.totalDistanceKm}
                  />
                </>
              )}

              {/* Turn-by-Turn Navigation HUD (Active during Navigation or Preview) */}
              {(navigationMode === 'navigating' || navigationMode === 'preview') && (
                <TurnByTurnNavigationHUD
                  steps={routeIntelligence.steps || []}
                  activeStepIndex={activeStepIndex}
                  onNextStep={() =>
                    setActiveStepIndex((i) =>
                      Math.min(i + 1, Math.max(0, (routeIntelligence.steps?.length || 1) - 1))
                    )
                  }
                  onPrevStep={() => setActiveStepIndex((i) => Math.max(i - 1, 0))}
                  onExitNavigation={navigationMode === 'preview' ? handleExitPreview : handleExitNavigation}
                  onRecenter={navigationMode === 'preview' ? handlePreviewRecenter : () => setIsFollowPaused(false)}
                  isFollowPaused={isFollowPaused}
                  onToggleMute={() => setIsMuted((m) => !m)}
                  isMuted={isMuted}
                  isPreview={navigationMode === 'preview'}
                />
              )}

              {/* Map Surface */}
              <SatelliteMapSurface
                route={routeIntelligence}
                pois={pois}
                hazards={routeIntelligence.hazards}
                weatherSummary={weatherSummary}
                showOSINTLayer={showOSINTLayer}
                onToggleOSINTLayer={() => setShowOSINTLayer((prev) => !prev)}
                showWeatherLayer={showWeatherLayer}
                onToggleWeatherLayer={() => setShowWeatherLayer((prev) => !prev)}
                onSelectWeatherCheckpoint={(pt) => {
                  setInspectedLocation({
                    id: `weather-${pt.locationName}`,
                    name: `${pt.locationName} Weather Checkpoint`,
                    displayName: `${pt.locationName} · ${pt.temperatureC}°C, ${pt.weatherDescription}`,
                    category: 'weather-checkpoint',
                    type: 'micro-climate',
                    coordinates: pt.coordinates,
                    provenance: {
                      source: 'Open-Meteo Weather Service',
                      timestamp: new Date().toISOString(),
                      freshness: 'recent',
                      isDemoData: false,
                    },
                  });
                }}
                activeMode={activeMapMode}
                onChangeMode={setActiveMapMode}
                selectedHazard={selectedHazard}
                onSelectHazard={setSelectedHazard}
                selectedPOI={selectedPOI}
                onSelectPOI={setSelectedPOI}
                inspectedLocation={inspectedLocation}
                onInspectLocation={setInspectedLocation}
                userLocation={userLocation}
                onUpdateUserLocation={setUserLocation}
                alternates={availableAlternates}
                onSelectAlternate={handleSelectRoute}
                isNavigating={navigationMode === 'navigating'}
                userHeading={liveHeading}
                isFollowPaused={isFollowPaused}
                onPauseFollow={() => setIsFollowPaused(true)}
                onResumeFollow={() => setIsFollowPaused(false)}
              />

              {/* Speedometer Pill (Active during Navigation) */}
              {navigationMode === 'navigating' && (
                <SpeedIndicatorHUD speedMps={liveSpeedMps} />
              )}

              {/* Navigation Bottom Sheet (Active during Navigation) */}
              {navigationMode === 'navigating' && (
                <NavigationBottomSheet
                  remainingDistanceKm={routeIntelligence.totalDistanceKm}
                  remainingDurationMinutes={routeIntelligence.totalDurationMinutes}
                  routeName={routeIntelligence.routeName}
                  steps={routeIntelligence.steps || []}
                  onExitNavigation={handleExitNavigation}
                  onRecenter={() => setIsFollowPaused(false)}
                />
              )}



              {/* On-Map Location Inspector Drawer */}
              {inspectedLocation && navigationMode !== 'navigating' && (
                <LocationInspector
                  location={inspectedLocation}
                  distanceFromRouteKm={
                    routeIntelligence
                      ? computeMinDistanceToPolylineKm(
                          inspectedLocation.coordinates,
                          routeIntelligence.routePolyline
                        )
                      : undefined
                  }
                  onSetDestination={handleSetDestination}
                  onFindNearbyPOIs={handleFindNearbyPOIs}
                  onClose={() => setInspectedLocation(null)}
                />
              )}
            </div>

            {/* Intelligence & POI Sidebar Column (~32% on desktop) */}
            <aside className="intelligence-sidebar-column">
              {/* Route Detail Card with Start Navigation & Share (Planning Mode) */}
              {navigationMode !== 'navigating' && (
                <>
                  <RouteDetailCard
                    route={routeIntelligence}
                    onStartNavigation={handleStartNavigation}
                    onPreviewRoute={handlePreviewRoute}
                    onAddStop={() => setStops((prev) => [...prev, 'New Stop'])}
                  />

                  {/* Recent Destinations Card */}
                  <RecentDestinationsCard
                    recentItems={recentDestinations}
                    onSelectDestination={(item) => handleSetDestination(item.coordinates, item.name)}
                    onClearHistory={() => {
                      navigationStorageService.clearRecentDestinations();
                      setRecentDestinations([]);
                    }}
                  />
                </>
              )}

              {/* Compact Route Safety Score Card (Single Source of Truth) */}
              <div
                className="route-safety-radar-card"
                style={{
                  background: 'var(--moto-bg-surface-elevated, #181820)',
                  border: '1px solid var(--moto-border-subtle)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    ROUTE SAFETY RADAR
                  </span>
                  <span
                    className="radar-score-tier"
                    style={{
                      fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background:
                        routeIntelligence.safetyScore.safetyTier === 'optimal'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        routeIntelligence.safetyScore.safetyTier === 'optimal' ? '#34d399' : '#fbbf24',
                    }}
                  >
                    {routeIntelligence.safetyScore.safetyTier.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span
                    className="radar-score-value"
                    style={{
                      fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                      fontSize: '2rem',
                      fontWeight: 700,
                      color:
                        routeIntelligence.safetyScore.overallScore >= 80
                          ? 'var(--moto-orange)'
                          : routeIntelligence.safetyScore.overallScore >= 60
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  >
                    {routeIntelligence.safetyScore.overallScore}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--moto-text-muted)' }}>/ 100 Safety Index</span>
                </div>

                <p style={{ fontSize: '0.76rem', color: '#9ca3af', margin: 0, lineHeight: 1.45 }}>
                  {routeIntelligence.safetyScore.summaryAdvisory}
                </p>

                {/* 5-Category Factor Mini Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af' }}>
                    <span>Road Quality:</span>
                    <strong style={{ color: '#fff' }}>{routeIntelligence.safetyScore.breakdown.roadConditionScore}/100</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af' }}>
                    <span>Hazard Density (incl. OSINT):</span>
                    <strong style={{ color: '#fff' }}>{routeIntelligence.hazards.length} flagged</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af' }}>
                    <span>Weather Grip Impact:</span>
                    <strong style={{ color: '#fff' }}>{routeIntelligence.safetyScore.breakdown.weatherScore}/100</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9ca3af' }}>
                    <span>Terrain Elevation:</span>
                    <strong style={{ color: '#fff' }}>+{routeIntelligence.totalElevationGainM}m</strong>
                  </div>
                </div>

                {/* Itemized Deductions list */}
                {routeIntelligence.safetyScore.breakdown.deductions &&
                  routeIntelligence.safetyScore.breakdown.deductions.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 8, marginTop: 4 }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--moto-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Active Deductions ({routeIntelligence.safetyScore.breakdown.deductions.length})
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                        {routeIntelligence.safetyScore.breakdown.deductions.slice(0, 4).map((d, idx) => (
                          <div key={idx} className="radar-deduction-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                            <span style={{ color: '#d1d5db' }}>{d.factor}</span>
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>-{d.pointsDeducted}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Route Alternatives Selection Card */}
              {availableAlternates.length > 0 && (
                <RouteAlternativesCard
                  primaryRouteName={routeIntelligence.routeName}
                  primaryDistanceKm={routeIntelligence.totalDistanceKm}
                  primaryDurationMinutes={routeIntelligence.totalDurationMinutes}
                  alternates={availableAlternates}
                  activeRouteId={activeRouteId}
                  onSelectRoute={handleSelectRoute}
                />
              )}

              {/* Open-Meteo Route Weather Card */}
              <RouteWeatherCard
                weather={weatherSummary}
                onSelectCheckpoint={(pt) => {
                  setInspectedLocation({
                    id: `weather-${pt.locationName}`,
                    name: `${pt.locationName} Weather Station`,
                    displayName: `${pt.locationName} · ${pt.temperatureC}°C, ${pt.weatherDescription}`,
                    category: 'weather-checkpoint',
                    type: 'micro-climate',
                    coordinates: pt.coordinates,
                    provenance: {
                      source: 'Open-Meteo Weather Service',
                      timestamp: new Date().toISOString(),
                      freshness: 'recent',
                      isDemoData: false,
                    },
                  });
                }}
              />

              {/* Near My Route POI Panel (7 Categories) */}
              <NearRoutePOIPanel
                pois={pois}
                selectedCategory={selectedPOICategory}
                onSelectCategory={setSelectedPOICategory}
                selectedPOIId={selectedPOI?.id}
                onSelectPOI={(poi) => {
                  setSelectedPOI(poi);
                  setSelectedHazard(null);
                }}
              />
            </aside>
          </main>
        </>
      )}
    </div>
  );
};
