import { Component, AfterViewInit, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { IResearcher } from '../researchers';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() researchers: IResearcher[] = [];
  @Input() mapId: string = 'map';
  @Input() hoveredResearcher: IResearcher | null = null;

  private map!: L.Map;
  private markers!: L.MarkerClusterGroup;
  private initialized = false;
  private highlightMarker: L.CircleMarker | null = null;
  private researcherMarkerMap: Map<string, L.Marker> = new Map();

  // Region zoom presets
  regions = {
    world: { center: [25, 20] as [number, number], zoom: 2 },
    usa: { center: [39, -98] as [number, number], zoom: 4 },
    europe: { center: [50, 10] as [number, number], zoom: 4 },
    middleEast: { center: [26, 42] as [number, number], zoom: 5 },
    egypt: { center: [27, 30] as [number, number], zoom: 6 }
  };

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.addMarkers();
      this.initialized = true;
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && changes['researchers']) {
      this.updateMarkers();
    }
    if (this.initialized && changes['hoveredResearcher']) {
      this.highlightResearcher(this.hoveredResearcher);
    }
  }

  // Zoom to a specific region
  zoomToRegion(region: keyof typeof this.regions): void {
    if (this.map) {
      const { center, zoom } = this.regions[region];
      this.map.flyTo(center, zoom, { duration: 0.5 });
    }
  }

  // Highlight a researcher on the map
  private highlightResearcher(researcher: IResearcher | null): void {
    // Remove previous highlight
    if (this.highlightMarker) {
      this.map.removeLayer(this.highlightMarker);
      this.highlightMarker = null;
    }

    if (researcher && researcher.location) {
      // Add a pulsing highlight circle
      this.highlightMarker = L.circleMarker(
        [researcher.location.lat, researcher.location.lng],
        {
          radius: 20,
          color: '#E7C29C',
          fillColor: '#E7C29C',
          fillOpacity: 0.3,
          weight: 3,
          className: 'highlight-pulse'
        }
      );
      this.highlightMarker.addTo(this.map);

      // Pan to the researcher location smoothly
      this.map.panTo([researcher.location.lat, researcher.location.lng], {
        animate: true,
        duration: 0.3
      });
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private customIcon!: L.DivIcon;

  private initMap(): void {
    // Create custom icon after Leaflet is loaded
    this.customIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-pin"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });

    this.map = L.map(this.mapId, {
      center: [25, 20],
      zoom: 2,
      minZoom: 2,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0
    });

    // CartoDB Voyager tiles - clean, academic look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);
  }

  private addMarkers(): void {
    this.markers = (L as any).markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 10) size = 'medium';
        if (count > 25) size = 'large';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40)
        });
      }
    });

    this.researchers.forEach(researcher => {
      if (researcher.location) {
        const marker = L.circleMarker([researcher.location.lat, researcher.location.lng], {
          radius: 8,
          fillColor: '#1C8394',
          color: '#091B2B',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        });
        marker.bindPopup(this.createPopup(researcher), {
          maxWidth: 250,
          className: 'researcher-popup-container'
        });
        this.markers.addLayer(marker);
      }
    });

    this.map.addLayer(this.markers);
  }

  private updateMarkers(): void {
    if (this.markers) {
      this.markers.clearLayers();
      this.researchers.forEach(researcher => {
        if (researcher.location) {
          const marker = L.circleMarker([researcher.location.lat, researcher.location.lng], {
            radius: 8,
            fillColor: '#1C8394',
            color: '#091B2B',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          });
          marker.bindPopup(this.createPopup(researcher), {
            maxWidth: 250,
            className: 'researcher-popup-container'
          });
          this.markers.addLayer(marker);
        }
      });
    }
  }

  private createPopup(researcher: IResearcher): string {
    return `
      <div class="researcher-popup">
        <img src="${researcher.photo}" alt="${researcher.name}" onerror="this.src='assets/default-avatar.png'" />
        <h4>${researcher.name}</h4>
        <p class="affiliation">${researcher.affiliation}</p>
        ${researcher.location ? `<p class="location"><i class="fas fa-map-marker-alt"></i> ${researcher.location.city}, ${researcher.location.country}</p>` : ''}
        <a href="#${researcher.name}" class="view-profile">View Profile</a>
      </div>
    `;
  }

  getLocationCount(): number {
    return this.researchers.filter(r => r.location).length;
  }
}
