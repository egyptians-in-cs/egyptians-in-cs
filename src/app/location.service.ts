import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IResearcher, ILocation } from './researchers';

interface LocationMap {
  [key: string]: ILocation;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private locationMap: LocationMap = {};
  private loaded = false;

  constructor(private http: HttpClient) {}

  async loadLocations(): Promise<void> {
    if (this.loaded) return;

    try {
      this.locationMap = await this.http.get<LocationMap>('assets/locations.json').toPromise() || {};
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load locations:', error);
      this.locationMap = {};
    }
  }

  enrichWithLocation(researcher: IResearcher): IResearcher {
    const location = this.findLocation(researcher.affiliation);
    if (location) {
      return { ...researcher, location };
    }
    return researcher;
  }

  enrichAllWithLocations(researchers: IResearcher[]): IResearcher[] {
    return researchers.map(r => this.enrichWithLocation(r));
  }

  private findLocation(affiliation: string): ILocation | undefined {
    if (!affiliation || affiliation === 'nan' || affiliation === '') {
      return undefined;
    }

    // Exact match
    if (this.locationMap[affiliation]) {
      return this.locationMap[affiliation];
    }

    // Normalize and try again
    const normalized = affiliation.trim();
    if (this.locationMap[normalized]) {
      return this.locationMap[normalized];
    }

    // Handle compound affiliations (e.g., "Brown University| Meta", "University of Waterloo, Apple")
    const separators = /[|,&\/;]/;
    if (separators.test(affiliation)) {
      const parts = affiliation.split(separators).map(p => p.trim());
      for (const part of parts) {
        if (this.locationMap[part]) {
          return this.locationMap[part];
        }
      }
      // Try partial match on each part
      for (const part of parts) {
        const result = this.findLocationForPart(part);
        if (result) return result;
      }
    }

    return this.findLocationForPart(affiliation);
  }

  private findLocationForPart(affiliation: string): ILocation | undefined {
    // Partial match - check if any key is contained in the affiliation
    const keys = Object.keys(this.locationMap);

    // Sort by length descending to match longer, more specific keys first
    keys.sort((a, b) => b.length - a.length);

    for (const key of keys) {
      if (affiliation.toLowerCase().includes(key.toLowerCase())) {
        return this.locationMap[key];
      }
    }

    // Try the other direction - affiliation contained in key
    for (const key of keys) {
      if (key.toLowerCase().includes(affiliation.toLowerCase())) {
        return this.locationMap[key];
      }
    }

    return undefined;
  }

  getLocationStats(researchers: IResearcher[]): { total: number; mapped: number; countries: string[] } {
    const enriched = this.enrichAllWithLocations(researchers);
    const mapped = enriched.filter(r => r.location);
    const countries = [...new Set(mapped.map(r => r.location!.country))].sort();

    return {
      total: researchers.length,
      mapped: mapped.length,
      countries
    };
  }
}
