import { SavedResource } from '../types';
import { SAMPLE_RESOURCES } from '../data/sampleResources';

const STORAGE_KEY = 'proudly_afrikan_build_resources_v1';

export function getSavedResources(): SavedResource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with sample resources on first load
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_RESOURCES));
      return SAMPLE_RESOURCES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SAMPLE_RESOURCES;
  } catch (e) {
    console.error('Failed to load saved resources:', e);
    return SAMPLE_RESOURCES;
  }
}

export function saveResourceToStorage(resource: SavedResource): void {
  try {
    const current = getSavedResources();
    const existingIndex = current.findIndex((r) => r.id === resource.id);
    let updated: SavedResource[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...resource, updatedAt: new Date().toISOString() };
    } else {
      updated = [resource, ...current];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save resource to storage:', e);
  }
}

export function deleteResourceFromStorage(id: string): SavedResource[] {
  try {
    const current = getSavedResources();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete resource:', e);
    return [];
  }
}

export function toggleFavoriteResource(id: string): SavedResource[] {
  try {
    const current = getSavedResources();
    const updated = current.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to toggle favorite:', e);
    return [];
  }
}
