import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { RouteIntelligence } from '../types/route-intelligence.types';
import { Hazard } from '../types/hazard.types';
import { RoutePOI } from '../types/poi.types';
import { MapLayerMode } from '../types/map.types';
import {
  PlaceApiResult,
  RouteApiResult,
  RouteWeatherPoint,
  RouteWeatherSummary,
  mapApiService,
} from '../services/map-api.service';
import {
  computeRouteBounds,
  computeRouteProgress,
  projectOntoRoute,
  interpolatePointAlongRoute,
  offsetCoordinateLaterally,
  isValidRoadGeometry,
} from '../services/route-geometry.service';
import { MapLayerControls } from './MapLayerControls';
import { SatelliteStatusBadge } from './SatelliteStatusBadge';
import { AlertTriangleIcon, CompassIcon, CrosshairIcon } from './icons';

interface Props {
  route: RouteIntelligence;
  pois?: RoutePOI[];
  hazards?: Hazard[];
  weatherSummary?: RouteWeatherSummary | null;
  activeMode: MapLayerMode;
  onChangeMode: (mode: MapLayerMode) => void;
  selectedHazard: Hazard | null;
  onSelectHazard: (hazard: Hazard | null) => void;
  selectedPOI: RoutePOI | null;
  onSelectPOI: (poi: RoutePOI | null) => void;
  inspectedLocation?: PlaceApiResult | null;
  onInspectLocation?: (location: PlaceApiResult | null) => void;
  userLocation?: [number, number] | null;
  onUpdateUserLocation?: (coords: [number, number] | null) => void;
  showOSINTLayer?: boolean;
  onToggleOSINTLayer?: () => void;
  showWeatherLayer?: boolean;
  onToggleWeatherLayer?: () => void;
  onSelectWeatherCheckpoint?: (point: RouteWeatherPoint) => void;
  alternates?: RouteApiResult[];
  onSelectAlternate?: (id: string) => void;
  isNavigating?: boolean;
  userHeading?: number | null;
  isFollowPaused?: boolean;
  onPauseFollow?: () => void;
  onResumeFollow?: () => void;
  children?: React.ReactNode;
}

const TILE_SOURCES = {
  dark: {
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
    referenceTiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'],
    attribution: 'Tiles © Esri, HERE, Garmin, © OpenStreetMap contributors',
  },
  satellite: {
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    referenceTransportationTiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
    referenceLabelsTiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
    attribution: 'Tiles © Esri, Maxar, Earthstar Geographics, © OpenStreetMap contributors',
  },
  terrain: {
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
    referenceTransportationTiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
    referenceLabelsTiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
    attribution: 'Tiles © Esri, HERE, Garmin, USGS, © OpenStreetMap contributors',
  },
};

function registerRouteChevron(map: maplibregl.Map): void {
  if (!map) return;

  try {
    const s = (map as any).style;
    if (!s || !s._loaded) return;

    let exists = false;
    try {
      exists = map.hasImage('route-chevron');
    } catch {
      exists = false;
    }

    if (exists) {
      try {
        map.removeImage('route-chevron');
      } catch {}
    }

    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-contrast outer stroke (dark boundary)
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(12, 10);
    ctx.lineTo(34, 24);
    ctx.lineTo(12, 38);
    ctx.stroke();

    // Core bright white chevron (points right: 0° along road line)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(12, 10);
    ctx.lineTo(34, 24);
    ctx.lineTo(12, 38);
    ctx.stroke();

    const imgData = ctx.getImageData(0, 0, size, size);
    map.addImage('route-chevron', imgData, { pixelRatio: 2 });
  } catch (err) {
    console.warn('[SatelliteMapSurface] Chevron canvas registration skipped:', err);
  }
}

export const SatelliteMapSurface: React.FC<Props> = ({
  route,
  pois = [],
  hazards,
  weatherSummary,
  activeMode,
  onChangeMode,
  selectedHazard,
  onSelectHazard,
  selectedPOI,
  onSelectPOI,
  inspectedLocation,
  onInspectLocation,
  userLocation,
  onUpdateUserLocation,
  showOSINTLayer = true,
  onToggleOSINTLayer,
  showWeatherLayer = true,
  onToggleWeatherLayer,
  onSelectWeatherCheckpoint,
  alternates = [],
  onSelectAlternate,
  isNavigating = false,
  userHeading = null,
  isFollowPaused = false,
  onPauseFollow,
  onResumeFollow,
  children,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const inspectMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const lastFittedPolylineRef = useRef<[number, number][] | null>(null);
  const userLocationFocusedRef = useRef<boolean>(false);
  const userInteractedRef = useRef<boolean>(false);
  const initialFitDoneRef = useRef<boolean>(false);
  const onPauseFollowRef = useRef(onPauseFollow);
  onPauseFollowRef.current = onPauseFollow;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [pitch, setPitch] = useState(35);
  const [isLocating, setIsLocating] = useState(false);

  // 1. Map Initialization (Created ONCE on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialBounds = computeRouteBounds(route.routePolyline);
    const centerLon = (initialBounds.minLon + initialBounds.maxLon) / 2;
    const centerLat = (initialBounds.minLat + initialBounds.maxLat) / 2;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'base-dark': {
            type: 'raster',
            tiles: TILE_SOURCES.dark.tiles,
            tileSize: 256,
            maxzoom: 16,
          },
          'base-dark-ref': {
            type: 'raster',
            tiles: TILE_SOURCES.dark.referenceTiles,
            tileSize: 256,
            maxzoom: 16,
          },
          'base-satellite': {
            type: 'raster',
            tiles: TILE_SOURCES.satellite.tiles,
            tileSize: 256,
            maxzoom: 19,
          },
          'base-terrain': {
            type: 'raster',
            tiles: TILE_SOURCES.terrain.tiles,
            tileSize: 256,
            maxzoom: 17,
          },
          'ref-transportation': {
            type: 'raster',
            tiles: TILE_SOURCES.satellite.referenceTransportationTiles,
            tileSize: 256,
            maxzoom: 18,
          },
          'ref-labels': {
            type: 'raster',
            tiles: TILE_SOURCES.satellite.referenceLabelsTiles,
            tileSize: 256,
            maxzoom: 17,
          },
          'route-polyline-source': {
            type: 'geojson',
            data: route.routePolyline && route.routePolyline.length >= 2 ? {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route.routePolyline,
              },
            } : {
              type: 'FeatureCollection',
              features: [],
            },
          },
          'route-completed-source': {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          },
          'route-alts-source': {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: (alternates || [])
                .filter((alt) => isValidRoadGeometry(alt.coordinates))
                .map((alt) => ({
                  type: 'Feature',
                  properties: {
                    id: alt.id,
                    name: alt.name,
                    distanceKm: alt.distanceKm,
                    durationMinutes: alt.durationMinutes,
                  },
                  geometry: {
                    type: 'LineString',
                    coordinates: alt.coordinates,
                  },
                })),
            },
          },
          'search-boundary-source': {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          },
        },
        layers: [
          // Base raster layers (one active based on mode)
          {
            id: 'layer-dark',
            type: 'raster',
            source: 'base-dark',
            layout: { visibility: activeMode === 'dark' ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'layer-satellite',
            type: 'raster',
            source: 'base-satellite',
            layout: { visibility: activeMode === 'satellite' ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'layer-terrain',
            type: 'raster',
            source: 'base-terrain',
            layout: { visibility: activeMode === 'terrain' ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 17,
          },
          // Reference road & place name layers (above base rasters, below route)
          {
            id: 'layer-dark-ref',
            type: 'raster',
            source: 'base-dark-ref',
            layout: { visibility: activeMode === 'dark' ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'layer-overlay-transportation',
            type: 'raster',
            source: 'ref-transportation',
            layout: { visibility: (activeMode === 'satellite' || activeMode === 'terrain') ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'layer-overlay-labels',
            type: 'raster',
            source: 'ref-labels',
            layout: { visibility: (activeMode === 'satellite' || activeMode === 'terrain') ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 20,
          },
          // Searched Place Area Coverage (Red dashed boundary + subtle transparent fill)
          {
            id: 'search-boundary-fill',
            type: 'fill',
            source: 'search-boundary-source',
            paint: {
              'fill-color': '#ef4444',
              'fill-opacity': 0.12,
            },
          },
          {
            id: 'search-boundary-outline',
            type: 'line',
            source: 'search-boundary-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#ef4444',
              'line-width': 2.5,
              'line-dasharray': [3, 2],
              'line-opacity': 0.95,
            },
          },
          // Route Alternates Layers (Rendered above base/reference, below primary route)
          {
            id: 'route-alts-casing',
            type: 'line',
            source: 'route-alts-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#000000', 'line-width': 7, 'line-opacity': 0.6 },
          },
          {
            id: 'route-alts-core',
            type: 'line',
            source: 'route-alts-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#64748b', 'line-width': 4.5, 'line-opacity': 0.85, 'line-dasharray': [2, 1] },
          },
          // Completed Route Segments (Muted grey during live navigation)
          {
            id: 'route-completed-casing',
            type: 'line',
            source: 'route-completed-source',
            layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
            paint: { 'line-color': '#000000', 'line-width': 7, 'line-opacity': 0.6 },
          },
          {
            id: 'route-completed-core',
            type: 'line',
            source: 'route-completed-source',
            layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
            paint: { 'line-color': '#64748b', 'line-width': 4.5, 'line-opacity': 0.8 },
          },
          // Primary Active Route: Glow backdrop, contrast casing, vibrant orange core, directional chevrons
          {
            id: 'route-glow-layer',
            type: 'line',
            source: 'route-polyline-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#f97316', 'line-width': 14, 'line-opacity': 0.4, 'line-blur': 4 },
          },
          {
            id: 'route-casing-layer',
            type: 'line',
            source: 'route-polyline-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#000000', 'line-width': 8, 'line-opacity': 0.85 },
          },
          {
            id: 'route-core-layer',
            type: 'line',
            source: 'route-polyline-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ff7300', 'line-width': 5, 'line-opacity': 1.0 },
          },
          {
            id: 'route-arrows-layer',
            type: 'symbol',
            source: 'route-polyline-source',
            layout: {
              'symbol-placement': 'line',
              'symbol-spacing': 70,
              'icon-image': 'route-chevron',
              'icon-size': 0.85,
              'icon-rotation-alignment': 'auto',
              'icon-pitch-alignment': 'viewport',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-keep-upright': false,
            },
          },
        ],
      },
      center: [centerLon, centerLat],
      zoom: 7.8,
      pitch: 35,
      bearing: 0,
      attributionControl: false, // We render a compact styled attribution badge
    });

    // Add navigation controls (zoom, pitch, rotation)
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

    map.on('error', (e) => {
      console.error('[MapLibre error]', e?.error?.message || e);
    });

    const onMapReady = () => {
      const s = (map as any).style;
      if (!s || !s._loaded) return;
      console.log('[MapLibre onMapReady triggered]');
      try {
        registerRouteChevron(map);
      } catch (err) {
        console.warn('[SatelliteMapSurface] registerRouteChevron error:', err);
      }
      setMapLoaded(true);
    };

    map.on('style.load', onMapReady);
    map.on('load', onMapReady);
    if ((map as any).style?._loaded) {
      onMapReady();
    }

    map.on('rotate', () => {
      setBearing(Math.round(map.getBearing()));
    });

    map.on('pitch', () => {
      setPitch(Math.round(map.getPitch()));
    });

    const handleManualMovement = () => {
      userLocationFocusedRef.current = false;
      userInteractedRef.current = true;
      onPauseFollowRef.current?.();
    };

    map.on('dragstart', handleManualMovement);
    map.on('zoomstart', handleManualMovement);
    map.on('rotatestart', handleManualMovement);
    map.on('pitchstart', handleManualMovement);

    // Map Click Inspection (Drops pin & reverse geocodes clicked point)
    map.on('click', async (e) => {
      const target = e.originalEvent.target as HTMLElement;
      if (
        target.closest(
          '.map-hazard-marker, .map-poi-marker, .map-endpoint-pin, .map-view-switcher-pill, .map-search-control-container, .map-exploration-search-container, .location-inspector-drawer, .map-hud-controls'
        )
      ) {
        return;
      }

      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;

      if (onInspectLocation) {
        // Immediate preview state while fetching factual reverse geocoding
        onInspectLocation({
          id: `inspect-${Date.now()}`,
          name: `Location at ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
          displayName: 'Querying location facts...',
          category: 'coordinate',
          type: 'inspected-coordinate',
          coordinates: [lng, lat],
          provenance: {
            source: 'OpenStreetMap Nominatim',
            timestamp: new Date().toISOString(),
            freshness: 'recent',
            isDemoData: false,
          },
        });

        const resolved = await mapApiService.reverseGeocode(lat, lng);
        if (resolved) {
          onInspectLocation(resolved);
        }
      }
    });

    mapRef.current = map;
    if (typeof window !== 'undefined') {
      (window as any).__mc_map = map;
    }

    // ResizeObserver ensures canvas re-computes dimensions during responsive flex changes
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (inspectMarkerRef.current) inspectMarkerRef.current.remove();
      if (userMarkerRef.current) userMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
      if (typeof window !== 'undefined' && (window as any).__mc_map === map) {
        delete (window as any).__mc_map;
      }
    };
  }, []); // Run once on mount

  // 2. In-Place Base Layer Switching (Persists route, markers, labels, and state)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !(map as any).style?._loaded) return;

    try {
      // Toggle base and reference layer visibility dynamically in-place
      if (map.getLayer('layer-dark')) {
        map.setLayoutProperty('layer-dark', 'visibility', activeMode === 'dark' ? 'visible' : 'none');
      }
      if (map.getLayer('layer-dark-ref')) {
        map.setLayoutProperty('layer-dark-ref', 'visibility', activeMode === 'dark' ? 'visible' : 'none');
      }
      if (map.getLayer('layer-satellite')) {
        map.setLayoutProperty('layer-satellite', 'visibility', activeMode === 'satellite' ? 'visible' : 'none');
      }
      if (map.getLayer('layer-terrain')) {
        map.setLayoutProperty('layer-terrain', 'visibility', activeMode === 'terrain' ? 'visible' : 'none');
      }
      if (map.getLayer('layer-overlay-transportation')) {
        map.setLayoutProperty('layer-overlay-transportation', 'visibility', activeMode !== 'dark' ? 'visible' : 'none');
      }
      if (map.getLayer('layer-overlay-labels')) {
        map.setLayoutProperty('layer-overlay-labels', 'visibility', activeMode !== 'dark' ? 'visible' : 'none');
      }

      // Ensure search boundary and route layers stay on top after any base switch
      if (map.getLayer('search-boundary-fill')) map.moveLayer('search-boundary-fill');
      if (map.getLayer('search-boundary-outline')) map.moveLayer('search-boundary-outline');
      if (map.getLayer('route-alts-casing')) map.moveLayer('route-alts-casing');
      if (map.getLayer('route-alts-core')) map.moveLayer('route-alts-core');
      if (map.getLayer('route-completed-casing')) map.moveLayer('route-completed-casing');
      if (map.getLayer('route-completed-core')) map.moveLayer('route-completed-core');
      if (map.getLayer('route-glow-layer')) map.moveLayer('route-glow-layer');
      if (map.getLayer('route-casing-layer')) map.moveLayer('route-casing-layer');
      if (map.getLayer('route-core-layer')) map.moveLayer('route-core-layer');
      if (map.getLayer('route-arrows-layer')) map.moveLayer('route-arrows-layer');
    } catch (err) {
      console.warn('[SatelliteMapSurface] Base layer toggle error:', err);
    }
  }, [activeMode, mapLoaded]);

  // 3A. Route Alternates Layer (Scenic Bypasses / Secondary Routes)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !(map as any).style?._loaded) return;

    try {
      const sourceId = 'route-alts-source';
      // Only render valid road-following route alternates. Sparse straight-line demo alternates are never rendered.
      const validAlternates = (alternates || []).filter((alt) => isValidRoadGeometry(alt.coordinates));
      const features: GeoJSON.Feature<GeoJSON.LineString>[] = validAlternates.map((alt) => ({
        type: 'Feature',
        properties: {
          id: alt.id,
          name: alt.name,
          distanceKm: alt.distanceKm,
          durationMinutes: alt.durationMinutes,
        },
        geometry: {
          type: 'LineString',
          coordinates: alt.coordinates,
        },
      }));

      const geojsonData: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: 'FeatureCollection',
        features,
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojsonData,
        });

        map.addLayer({
          id: 'route-alts-casing',
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#000000',
            'line-width': 7,
            'line-opacity': 0.6,
          },
        });

        map.addLayer({
          id: 'route-alts-core',
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#64748b',
            'line-width': 4.5,
            'line-opacity': 0.85,
            'line-dasharray': [2, 1],
          },
        });

        map.on('click', 'route-alts-core', (e) => {
          const feat = e.features?.[0];
          if (feat?.properties?.id && onSelectAlternate) {
            onSelectAlternate(feat.properties.id);
          }
        });

        map.on('mouseenter', 'route-alts-core', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'route-alts-core', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    } catch (err) {
      console.warn('[SatelliteMapSurface] Alternates update error:', err);
    }
  }, [alternates, mapLoaded, onSelectAlternate]);

  // 3B. Route Polyline Update, Directional Chevrons, Progress & Camera Fit
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !(map as any).style?._loaded) return;
    if (!route.routePolyline || route.routePolyline.length < 2) return;

    try {
      registerRouteChevron(map);

      // Compute progress if navigating with live GPS user location
      let remainingCoords = route.routePolyline;
      let completedCoords: [number, number][] = [];

      if (isNavigating && userLocation) {
        const progress = computeRouteProgress(userLocation, route.routePolyline);
        if (progress && progress.completedCoordinates.length >= 2) {
          completedCoords = progress.completedCoordinates;
          if (progress.remainingCoordinates.length >= 2) {
            remainingCoords = progress.remainingCoordinates;
          }
        }
      }

      // A. Completed Route Segment (Muted Grey Polyline)
      const completedSourceId = 'route-completed-source';
      const completedGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: completedCoords,
        },
      };

      if (map.getSource(completedSourceId)) {
        (map.getSource(completedSourceId) as maplibregl.GeoJSONSource).setData(completedGeoJSON);
      } else {
        map.addSource(completedSourceId, {
          type: 'geojson',
          data: completedGeoJSON,
        });

        map.addLayer({
          id: 'route-completed-casing',
          type: 'line',
          source: completedSourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: completedCoords.length >= 2 ? 'visible' : 'none',
          },
          paint: {
            'line-color': '#000000',
            'line-width': 7,
            'line-opacity': 0.6,
          },
        });

        map.addLayer({
          id: 'route-completed-core',
          type: 'line',
          source: completedSourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: completedCoords.length >= 2 ? 'visible' : 'none',
          },
          paint: {
            'line-color': '#64748b',
            'line-width': 4.5,
            'line-opacity': 0.8,
          },
        });
      }

      // Synchronize visibility dynamically
      const completedVis = completedCoords.length >= 2 ? 'visible' : 'none';
      if (map.getLayer('route-completed-casing')) {
        map.setLayoutProperty('route-completed-casing', 'visibility', completedVis);
      }
      if (map.getLayer('route-completed-core')) {
        map.setLayoutProperty('route-completed-core', 'visibility', completedVis);
      }

      // B. Remaining / Full Active Route Polyline (Vibrant Orange with Directional Chevrons)
      const sourceId = 'route-polyline-source';
      const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: remainingCoords,
        },
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojsonData,
        });

        // Layer 1: Glowing orange route backdrop
        map.addLayer({
          id: 'route-glow-layer',
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#f97316',
            'line-width': 14,
            'line-opacity': 0.4,
            'line-blur': 4,
          },
        });

        // Layer 2: High-contrast casing (ensures visibility over bright or dark surfaces)
        map.addLayer({
          id: 'route-casing-layer',
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#000000',
            'line-width': 8,
            'line-opacity': 0.85,
          },
        });

        // Layer 3: Core solid vibrant orange route polyline
        map.addLayer({
          id: 'route-core-layer',
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ff7300',
            'line-width': 5,
            'line-opacity': 1.0,
          },
        });

        // Layer 4: Directional Chevrons following START → FINISH curvature
        map.addLayer({
          id: 'route-arrows-layer',
          type: 'symbol',
          source: sourceId,
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 70,
            'icon-image': 'route-chevron',
            'icon-size': 0.85,
            'icon-rotation-alignment': 'auto',
            'icon-pitch-alignment': 'viewport',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-keep-upright': false,
          },
        });
      }

      // Always ensure route layers are moved to the top of the layer stack
      if (map.getLayer('route-alts-casing')) map.moveLayer('route-alts-casing');
      if (map.getLayer('route-alts-core')) map.moveLayer('route-alts-core');
      if (map.getLayer('route-completed-casing')) map.moveLayer('route-completed-casing');
      if (map.getLayer('route-completed-core')) map.moveLayer('route-completed-core');
      if (map.getLayer('route-glow-layer')) map.moveLayer('route-glow-layer');
      if (map.getLayer('route-casing-layer')) map.moveLayer('route-casing-layer');
      if (map.getLayer('route-core-layer')) map.moveLayer('route-core-layer');
      if (map.getLayer('route-arrows-layer')) map.moveLayer('route-arrows-layer');

      // Fit camera to route bounds with smooth ease animation ONLY on initial mount or when route geometry explicitly changes, AND user has not manually interacted with camera or focused on GPS/Inspector
      const hasPolylineChanged = lastFittedPolylineRef.current !== route.routePolyline;
      if (!isNavigating && !inspectedLocation && !userLocationFocusedRef.current && hasPolylineChanged) {
        if (!initialFitDoneRef.current || !userInteractedRef.current) {
          lastFittedPolylineRef.current = route.routePolyline;
          initialFitDoneRef.current = true;
          const bounds = computeRouteBounds(route.routePolyline);
          map.fitBounds(
            [
              [bounds.minLon, bounds.minLat],
              [bounds.maxLon, bounds.maxLat],
            ],
            {
              padding: { top: 70, bottom: 70, left: 70, right: 70 },
              maxZoom: 13.5,
              duration: 900,
            }
          );
        } else {
          lastFittedPolylineRef.current = route.routePolyline;
        }
      }
    } catch (err) {
      console.warn('[SatelliteMapSurface] Route polyline update error:', err);
    }
  }, [route.routePolyline, mapLoaded, isNavigating, userLocation, inspectedLocation]);

  // 3C. Camera Follow Mode during Navigation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !isNavigating || !userLocation || isFollowPaused) return;

    map.easeTo({
      center: userLocation,
      bearing: userHeading !== null && userHeading !== undefined ? userHeading : map.getBearing(),
      pitch: 45,
      zoom: Math.max(map.getZoom(), 15.5),
      duration: 600,
    });
  }, [isNavigating, userLocation, userHeading, isFollowPaused, mapLoaded]);

  // 4. Markers: Start, Finish, Hazards, POIs
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // A. Start & Finish Pins
    if (route.routePolyline.length >= 2) {
      const startCoord = route.routePolyline[0];
      const finishCoord = route.routePolyline[route.routePolyline.length - 1];

      const startEl = document.createElement('div');
      startEl.className = 'map-endpoint-pin start';
      startEl.setAttribute('data-testid', 'map-start-pin');
      startEl.innerHTML = `<span class="endpoint-badge">START</span><span class="endpoint-sub">${route.origin.split(' ')[0]}</span>`;
      const startMarker = new maplibregl.Marker({ element: startEl })
        .setLngLat(startCoord)
        .addTo(map);
      markersRef.current.push(startMarker);

      const finishEl = document.createElement('div');
      finishEl.className = 'map-endpoint-pin finish';
      finishEl.setAttribute('data-testid', 'map-finish-pin');
      finishEl.innerHTML = `<span class="endpoint-badge">FINISH</span><span class="endpoint-sub">${route.destination.split(' ')[0]}</span>`;
      const finishMarker = new maplibregl.Marker({ element: finishEl })
        .setLngLat(finishCoord)
        .addTo(map);
      markersRef.current.push(finishMarker);
    }

    // B. Hazard Markers (Route Hazards + Active OSINT Hazards)
    const activeHazards = hazards && hazards.length > 0 ? hazards : route.hazards;
    const filteredHazards =
      showOSINTLayer !== false
        ? activeHazards
        : activeHazards.filter((h) => !h.id.startsWith('usgs-') && !h.id.startsWith('firms-'));

    filteredHazards.forEach((hazard) => {
      const isSeismic =
        hazard.id.startsWith('usgs-') ||
        (hazard.category === 'accident-incident' && hazard.title.toLowerCase().includes('earthquake'));
      const isThermal =
        hazard.id.startsWith('firms-') ||
        hazard.title.toLowerCase().includes('thermal') ||
        hazard.title.toLowerCase().includes('fire');
      const isOSINT = isSeismic || isThermal;

      // Anchor route hazards to the active road route geometry
      let displayCoord: [number, number] = hazard.coordinates;
      let routeDistanceKm = hazard.corridorDistanceKm;

      if (!isOSINT && route.routePolyline.length >= 2) {
        if (hazard.corridorDistanceKm && hazard.corridorDistanceKm > 0) {
          displayCoord = interpolatePointAlongRoute(hazard.corridorDistanceKm, route.routePolyline);
        } else {
          const station = projectOntoRoute(hazard.coordinates, route.routePolyline);
          displayCoord = station.projectedPoint;
          routeDistanceKm = station.routeDistanceKm;
        }
      }

      const el = document.createElement('div');
      el.className = `map-hazard-marker ${hazard.severity} ${isSeismic ? 'seismic' : isThermal ? 'thermal' : ''}`;
      el.setAttribute('data-testid', `map-hazard-${hazard.id}`);
      el.title = `${hazard.title} (${hazard.severity.toUpperCase()}) · ${hazard.sourceLabel}`;

      let iconHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      if (isSeismic) {
        iconHtml = `<span style="font-size:11px">⚡</span>`;
      } else if (isThermal) {
        iconHtml = `<span style="font-size:11px">🔥</span>`;
      }
      el.innerHTML = iconHtml;

      const anchoredHazard: Hazard = {
        ...hazard,
        coordinates: displayCoord,
        corridorDistanceKm: routeDistanceKm,
      };

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectHazard(anchoredHazard);
        onSelectPOI(null);
        if (onInspectLocation) onInspectLocation(null);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(displayCoord)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // C. Weather Checkpoint Markers (when Weather layer is enabled)
    if (showWeatherLayer && weatherSummary && weatherSummary.checkpoints) {
      weatherSummary.checkpoints.forEach((pt) => {
        // Project weather checkpoint to actual point along active road corridor
        let displayCoord: [number, number] = pt.coordinates;
        if (route.routePolyline.length >= 2) {
          const station = projectOntoRoute(pt.coordinates, route.routePolyline);
          displayCoord = station.projectedPoint;
        }

        const el = document.createElement('div');
        el.className = 'map-weather-marker';
        el.setAttribute('data-testid', `map-weather-${pt.locationName.replace(/\s+/g, '-').toLowerCase()}`);
        el.title = `${pt.locationName}: ${pt.temperatureC}°C, ${pt.weatherDescription} (${pt.rainProbabilityPercent}% rain)`;
        el.innerHTML = `<span class="weather-temp-badge">${pt.temperatureC}°</span>`;

        const anchoredCheckpoint: RouteWeatherPoint = {
          ...pt,
          coordinates: displayCoord,
        };

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectWeatherCheckpoint) onSelectWeatherCheckpoint(anchoredCheckpoint);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(displayCoord)
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    // D. POI Markers (Strict 7 Categories)
    pois.forEach((poi) => {
      const isDemoPOI = poi.isDemoData || poi.id.startsWith('poi-blr-') || poi.source?.includes('Demo');
      let displayCoord = poi.coordinates;
      let distanceFromRouteKm = poi.distanceFromRouteKm;
      let distanceFromOriginKm = poi.distanceFromOriginKm;

      if (route.routePolyline.length >= 2) {
        if (isDemoPOI) {
          // Demo POIs: anchor to active road route with small lateral roadside curb offset (35m)
          const roadPoint =
            poi.distanceFromOriginKm && poi.distanceFromOriginKm > 0
              ? interpolatePointAlongRoute(poi.distanceFromOriginKm, route.routePolyline)
              : poi.coordinates;
          displayCoord = offsetCoordinateLaterally(roadPoint, route.routePolyline, 35);
          const station = projectOntoRoute(displayCoord, route.routePolyline);
          distanceFromRouteKm = station.distanceFromRouteKm;
          distanceFromOriginKm = station.routeDistanceKm;
        } else {
          // Real provider POIs: retain real provider coordinates and filter to sensible route corridor (<= 5 km)
          const station = projectOntoRoute(poi.coordinates, route.routePolyline);
          distanceFromRouteKm = station.distanceFromRouteKm;
          distanceFromOriginKm = station.routeDistanceKm;
          if (station.distanceFromRouteKm > 5.0) {
            return; // Outside corridor threshold
          }
        }
      }

      const el = document.createElement('div');
      el.className = 'map-poi-marker';
      el.setAttribute('data-testid', `map-poi-${poi.id}`);
      el.title = `${poi.name} (${poi.category.toUpperCase()}) · ${distanceFromRouteKm}km from route`;

      let iconEmoji = '📍';
      if (poi.category === 'fuel') iconEmoji = '⛽';
      else if (poi.category === 'repair') iconEmoji = '🔧';
      else if (poi.category === 'food') iconEmoji = '🍴';
      else if (poi.category === 'stay') iconEmoji = '🏨';
      else if (poi.category === 'medical') iconEmoji = '🏥';
      else if (poi.category === 'atm') iconEmoji = '🏧';
      else if (poi.category === 'police') iconEmoji = '👮';

      el.innerText = iconEmoji;

      const anchoredPOI: RoutePOI = {
        ...poi,
        coordinates: displayCoord,
        distanceFromRouteKm,
        distanceFromOriginKm,
      };

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPOI(anchoredPOI);
        onSelectHazard(null);
        if (onInspectLocation) onInspectLocation(null);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(displayCoord)
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [
    route.hazards,
    route.routePolyline,
    pois,
    hazards,
    weatherSummary,
    showOSINTLayer,
    showWeatherLayer,
    mapLoaded,
  ]);

  // 5. Inspected Location Pin, Area Coverage Boundary & Callout
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (inspectMarkerRef.current) {
      inspectMarkerRef.current.remove();
      inspectMarkerRef.current = null;
    }

    let boundarySource = map.getSource('search-boundary-source') as maplibregl.GeoJSONSource | undefined;
    if (!boundarySource && mapLoaded) {
      try {
        map.addSource('search-boundary-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        if (!map.getLayer('search-boundary-fill')) {
          map.addLayer({
            id: 'search-boundary-fill',
            type: 'fill',
            source: 'search-boundary-source',
            paint: {
              'fill-color': '#ef4444',
              'fill-opacity': 0.12,
            },
          });
        }
        if (!map.getLayer('search-boundary-outline')) {
          map.addLayer({
            id: 'search-boundary-outline',
            type: 'line',
            source: 'search-boundary-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#ef4444',
              'line-width': 2.5,
              'line-dasharray': [3, 2],
              'line-opacity': 0.95,
            },
          });
        }
        boundarySource = map.getSource('search-boundary-source') as maplibregl.GeoJSONSource | undefined;
      } catch (e) {
        console.warn('[SatelliteMapSurface] search-boundary-source add error:', e);
      }
    }

    if (inspectedLocation) {
      const isBoundary = inspectedLocation.isAdministrativeBoundary || !!inspectedLocation.boundaryGeojson;

      // Update Area Coverage Boundary Layer
      if (boundarySource) {
        let boundaryFeature: GeoJSON.Feature | null = null;
        if (inspectedLocation.boundaryGeojson) {
          boundaryFeature = {
            type: 'Feature',
            properties: {
              name: inspectedLocation.name,
              isAdministrativeBoundary: true,
            },
            geometry: inspectedLocation.boundaryGeojson,
          };
        } else if (inspectedLocation.boundingBox && inspectedLocation.boundingBox.length === 4) {
          const [minLat, maxLat, minLon, maxLon] = inspectedLocation.boundingBox;
          if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLon) && !isNaN(maxLon) && (maxLat > minLat || maxLon > minLon)) {
            boundaryFeature = {
              type: 'Feature',
              properties: {
                name: inspectedLocation.name,
                isAdministrativeBoundary: false,
                isFallbackExtent: true,
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [minLon, minLat],
                  [maxLon, minLat],
                  [maxLon, maxLat],
                  [minLon, maxLat],
                  [minLon, minLat],
                ]],
              },
            };
          }
        }

        const featureCollection: GeoJSON.FeatureCollection = boundaryFeature ? {
          type: 'FeatureCollection',
          features: [boundaryFeature as any],
        } : {
          type: 'FeatureCollection',
          features: [],
        };
        (boundarySource as any)._features = featureCollection.features;
        boundarySource.setData(featureCollection);
      }

      // Create Prominent Searched Place Callout Badge
      const el = document.createElement('div');
      el.className = 'map-searched-place-callout';
      el.setAttribute('data-testid', 'map-inspection-pin');
      el.innerHTML = `
        <div class="searched-place-badge">
          <span class="searched-place-icon">📍</span>
          <div class="searched-place-text">
            <span class="searched-place-name" data-testid="map-searched-place-label">${inspectedLocation.name}</span>
            <span class="searched-place-extent-tag">${isBoundary ? 'Administrative Area' : 'Searched Area Extent'}</span>
          </div>
        </div>
        <div class="searched-place-stem"></div>
        <div class="searched-place-pulse"></div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onInspectLocation) {
          onInspectLocation(inspectedLocation);
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(inspectedLocation.coordinates)
        .addTo(map);
      inspectMarkerRef.current = marker;

      // Smooth camera pan to inspected point with contextual zoom showing surrounding geographic area
      // If provider bounding box is available, fit to bounds; otherwise flyTo at contextual zoom ~13.2
      if (inspectedLocation.boundingBox && inspectedLocation.boundingBox.length === 4) {
        const [minLat, maxLat, minLon, maxLon] = inspectedLocation.boundingBox;
        if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLon) && !isNaN(maxLon) && (maxLat > minLat || maxLon > minLon)) {
          map.fitBounds(
            [
              [minLon, minLat],
              [maxLon, maxLat],
            ],
            {
              padding: { top: 90, bottom: 90, left: 90, right: 90 },
              maxZoom: 13.5,
              duration: 950,
            }
          );
        } else {
          map.flyTo({
            center: inspectedLocation.coordinates,
            zoom: 13.2,
            speed: 1.2,
          });
        }
      } else {
        map.flyTo({
          center: inspectedLocation.coordinates,
          zoom: 13.2,
          speed: 1.2,
        });
      }
    } else {
      // Clear boundary when no place is inspected
      if (boundarySource) {
        boundarySource.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    }
  }, [inspectedLocation, mapLoaded]);

  // 6. User Location Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'user-location-marker map-user-location-marker';
      el.setAttribute('data-testid', 'user-location-marker');
      el.innerHTML = '<div class="user-pulse-ring"></div><div class="user-core-dot"></div>';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(userLocation)
        .addTo(map);
      userMarkerRef.current = marker;
    }
  }, [userLocation, mapLoaded]);

  // Handle Compass / Bearing Reset
  const handleResetCompass = () => {
    userLocationFocusedRef.current = false;
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 350,
    });
  };

  // Requirement 1: Fresh GPS Recenter Handler
  const handleRecenterNavigation = () => {
    const map = mapRef.current;
    if (!map) return;

    userInteractedRef.current = false;

    if (userLocation) {
      map.flyTo({
        center: userLocation,
        pitch: 45,
        zoom: Math.max(map.getZoom(), 15.5),
        bearing: userHeading !== null && userHeading !== undefined && !isNaN(userHeading) ? userHeading : map.getBearing(),
        essential: true,
      });
      onResumeFollow?.();
      return;
    }

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          if (onUpdateUserLocation) onUpdateUserLocation(coords);
          const heading =
            pos.coords.heading !== null && pos.coords.heading !== undefined && !isNaN(pos.coords.heading)
              ? pos.coords.heading
              : map.getBearing();
          map.flyTo({
            center: coords,
            pitch: 45,
            zoom: Math.max(map.getZoom(), 15.5),
            bearing: heading,
            essential: true,
          });
          onResumeFollow?.();
        },
        (err) => {
          setIsLocating(false);
          console.warn('[SatelliteMapSurface] Fresh GPS unavailable on recenter:', err.message);
          alert('Location unavailable. Please grant GPS permission to recenter.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Location unavailable: Geolocation is not supported by your browser environment.');
    }
  };

  // Handle My Location Geolocation
  const handleMyLocation = () => {
    console.log('[SatelliteMapSurface] handleMyLocation INVOKED! Has navigator.geolocation:', !!navigator?.geolocation);
    if (!navigator.geolocation) {
      console.warn('[SatelliteMapSurface] navigator.geolocation is falsy');
      alert('Geolocation is not supported by your browser environment.');
      return;
    }

    setIsLocating(true);
    userLocationFocusedRef.current = true;
    userInteractedRef.current = false;
    console.log('[SatelliteMapSurface] Invoking navigator.geolocation.getCurrentPosition...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        console.log('[SatelliteMapSurface] handleMyLocation got GPS coords:', coords);
        if (onUpdateUserLocation) onUpdateUserLocation(coords);
        if (mapRef.current) {
          mapRef.current.easeTo({
            center: coords,
            zoom: 14,
            duration: 400,
          });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('[SatelliteMapSurface] Geolocation unavailable callback triggered:', err?.message || err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Current compact attribution text
  const currentAttribution =
    activeMode === 'satellite'
      ? TILE_SOURCES.satellite.attribution
      : activeMode === 'terrain'
      ? TILE_SOURCES.terrain.attribution
      : TILE_SOURCES.dark.attribution;

  return (
    <div className="satellite-map-container" style={{ position: 'relative' }} data-testid="satellite-map-surface">
      {/* WebGL Canvas Container */}
      <div ref={mapContainerRef} className="maplibregl-map" data-testid="maplibre-canvas-container" />

      {/* On-Map View Switcher: [ DEFAULT ] [ SATELLITE ] [ TERRAIN ] */}
      <MapLayerControls activeMode={activeMode} onChangeMode={onChangeMode} />

      {/* Satellite Imagery Status Badge */}
      <SatelliteStatusBadge status={route.satelliteStatus} />

      {/* On-Map Floating HUD Controls (Compass Reset & My Location) */}
      <div className="map-hud-controls" data-testid="map-hud-controls">
        <button
          type="button"
          className="compass-hud-btn"
          onClick={handleResetCompass}
          title={`Reset orientation to North (Current bearing: ${bearing}°, pitch: ${pitch}°)`}
          data-testid="compass-reset-btn"
        >
          <span
            className="compass-needle"
            style={{ transform: `rotate(${-bearing}deg)` }}
          >
            <CompassIcon size={20} />
          </span>
          <span className="compass-bearing-label">{bearing === 0 ? 'N' : `${bearing}°`}</span>
        </button>

        <button
          type="button"
          className={`my-location-hud-btn ${isLocating ? 'locating' : ''} ${userLocation ? 'active' : ''}`}
          onClick={handleMyLocation}
          title="Find my location (High-accuracy GPS)"
          data-testid="my-location-btn"
        >
          <CrosshairIcon size={18} />
        </button>

        {onToggleOSINTLayer && (
          <button
            type="button"
            className={`map-hud-toggle-btn ${showOSINTLayer ? 'active' : ''}`}
            onClick={onToggleOSINTLayer}
            title={showOSINTLayer ? 'OSINT Intelligence: Visible' : 'OSINT Intelligence: Hidden'}
            data-testid="toggle-osint-btn"
          >
            OSINT
          </button>
        )}

        {onToggleWeatherLayer && (
          <button
            type="button"
            className={`map-hud-toggle-btn ${showWeatherLayer ? 'active' : ''}`}
            onClick={onToggleWeatherLayer}
            title={showWeatherLayer ? 'Weather Checkpoints: Visible' : 'Weather Checkpoints: Hidden'}
            data-testid="toggle-weather-btn"
          >
            WX
          </button>
        )}
      </div>

      {/* Recenter button when camera follow is paused during navigation */}
      {isNavigating && isFollowPaused && onResumeFollow && (
        <button
          type="button"
          className="recenter-navigation-hud-btn"
          onClick={handleRecenterNavigation}
          data-testid="recenter-navigation-btn"
          title="Recenter camera on rider"
        >
          <span className="recenter-icon">🎯</span>
          <span>Recenter</span>
        </button>
      )}

      {/* Compact Tile & Routing Attribution */}
      <div className="compact-tile-attribution" data-testid="map-attribution">
        {currentAttribution} · Route data © OSRM, OSM
        {weatherSummary ? ' · Weather © Open-Meteo' : ''}
        {' · Seismic © USGS'}
      </div>

      {/* Injected Floating Controls (e.g. Preview Floating Actions) */}
      {children}

      {/* Hazard Inspector Modal / Drawer */}
      {selectedHazard && (
        <div className="marker-inspector-modal" data-testid="hazard-inspector-modal">
          <button
            type="button"
            className="inspector-close-btn"
            onClick={() => onSelectHazard(null)}
            aria-label="Close Inspector"
          >
            ✕
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                color:
                  selectedHazard.severity === 'critical'
                    ? '#ef4444'
                    : selectedHazard.severity === 'high'
                    ? '#ea580c'
                    : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <AlertTriangleIcon size={18} />
            </span>
            <span
              style={{
                fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                fontWeight: 700,
                fontSize: '0.92rem',
                color: '#fff',
              }}
            >
              {selectedHazard.title}
            </span>
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)', display: 'flex', gap: 8 }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--moto-orange)' }}>
              {selectedHazard.severity}
            </span>
            <span>•</span>
            <span>Km {selectedHazard.corridorDistanceKm} on corridor</span>
          </div>

          <p style={{ fontSize: '0.8rem', lineHeight: 1.45, color: '#d1d5db', margin: 0 }}>
            {selectedHazard.description}
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '0.74rem',
              color: '#93c5fd',
            }}
          >
            <strong>Advisory:</strong> {selectedHazard.recommendedAction}
          </div>

          <div style={{ fontSize: '0.68rem', color: 'var(--moto-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Source: {selectedHazard.sourceLabel}</span>
            <span>Confidence: {Math.round(selectedHazard.confidence * 100)}%</span>
          </div>
        </div>
      )}

      {/* POI Inspector Modal / Drawer */}
      {selectedPOI && (
        <div className="marker-inspector-modal" data-testid="poi-inspector-modal">
          <button
            type="button"
            className="inspector-close-btn"
            onClick={() => onSelectPOI(null)}
            aria-label="Close Inspector"
          >
            ✕
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>
              {selectedPOI.category === 'fuel'
                ? '⛽'
                : selectedPOI.category === 'repair'
                ? '🔧'
                : selectedPOI.category === 'food'
                ? '🍴'
                : selectedPOI.category === 'stay'
                ? '🏨'
                : selectedPOI.category === 'medical'
                ? '🏥'
                : selectedPOI.category === 'atm'
                ? '🏧'
                : '👮'}
            </span>
            <span
              style={{
                fontFamily: 'var(--moto-font-display, "Chakra Petch", sans-serif)',
                fontWeight: 700,
                fontSize: '0.92rem',
                color: '#fff',
              }}
            >
              {selectedPOI.name}
            </span>
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--moto-text-secondary)', display: 'flex', gap: 8 }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--moto-orange)' }}>
              {selectedPOI.category}
            </span>
            <span>•</span>
            <span>{selectedPOI.distanceFromOriginKm} km from start</span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#d1d5db' }}>{selectedPOI.address}</div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '0.74rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div>
              <strong>Illustrative Route Dist:</strong> {selectedPOI.distanceFromRouteKm} km off corridor
            </div>
            <div>
              <strong>Demo Detour:</strong> +{selectedPOI.detourDistanceKm} km
            </div>
            {selectedPOI.fuelGradeStatus && (
              <div style={{ color: '#34d399', fontWeight: 600 }}>
                Status: {selectedPOI.fuelGradeStatus}
              </div>
            )}
            {selectedPOI.serviceType && (
              <div style={{ color: '#93c5fd' }}>
                Service: {selectedPOI.serviceType}
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.68rem', color: 'var(--moto-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Source: {selectedPOI.source}</span>
            <span style={{ color: '#fbbf24' }}>DEMO FIXTURE</span>
          </div>
        </div>
      )}
    </div>
  );
};
