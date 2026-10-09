export type MapLayerMode = 'dark' | 'satellite' | 'terrain';

export interface MapViewportState {
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface MapBounds {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}
