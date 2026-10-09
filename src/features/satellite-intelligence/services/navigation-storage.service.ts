import { PlaceApiResult } from './map-api.service';

const STORAGE_KEY = 'motocompanion_recent_destinations';
const MAX_RECENT_ITEMS = 6;

export interface RecentDestinationItem {
  id: string;
  name: string;
  displayName: string;
  category: string;
  coordinates: [number, number];
  timestamp: string;
}

class NavigationStorageService {
  private memoryStore: Map<string, string> = new Map();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  getRecentDestinations(): RecentDestinationItem[] {
    try {
      const raw = this.isBrowser()
        ? window.localStorage.getItem(STORAGE_KEY)
        : this.memoryStore.get(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[NavigationStorage] Failed to read recent destinations:', e);
      return [];
    }
  }

  addRecentDestination(place: PlaceApiResult): void {
    if (!place || !place.coordinates) return;
    try {
      const current = this.getRecentDestinations();
      const filtered = current.filter(
        (item) => item.id !== place.id && item.name.toLowerCase() !== place.name.toLowerCase()
      );

      const newItem: RecentDestinationItem = {
        id: place.id,
        name: place.name,
        displayName: place.displayName,
        category: place.category,
        coordinates: place.coordinates,
        timestamp: new Date().toISOString(),
      };

      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
      const jsonStr = JSON.stringify(updated);
      if (this.isBrowser()) {
        window.localStorage.setItem(STORAGE_KEY, jsonStr);
      } else {
        this.memoryStore.set(STORAGE_KEY, jsonStr);
      }
    } catch (e) {
      console.warn('[NavigationStorage] Failed to save recent destination:', e);
    }
  }

  saveDestination(dest: {
    id?: string;
    name: string;
    displayName?: string;
    category?: string;
    coordinates: [number, number];
  }): void {
    this.addRecentDestination({
      id: dest.id || `recent-${dest.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: dest.name,
      displayName: dest.displayName || dest.name,
      category: dest.category || 'destination',
      type: 'saved-destination',
      coordinates: dest.coordinates,
      provenance: {
        source: 'User Navigation History',
        timestamp: new Date().toISOString(),
        freshness: 'recent',
        isDemoData: false,
      },
    });
  }

  clearRecentDestinations(): void {
    try {
      if (this.isBrowser()) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        this.memoryStore.delete(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[NavigationStorage] Failed to clear recent destinations:', e);
    }
  }
}

export const navigationStorageService = new NavigationStorageService();
