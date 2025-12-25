import { Component, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { IResearcher, ICategoryHierarchy, ITaxonomy } from '../researchers';
import people from '../../assets/researchers_en.json';
import categoriesData from '../../assets/categories.json';
import { FilterService } from '../filter.service';
import { LocationService } from '../location.service';

@Component({
  selector: 'app-english',
  templateUrl: './english.component.html',
  styleUrls: ['./english.component.css'],
})

export class EnglishComponent implements OnInit, AfterViewInit {

  private scrollObserver!: IntersectionObserver;

  title = 'Egyptians in CS';
  researchers: IResearcher[] = people;
  rinterests: {[key: string]: boolean} = {};
  rinterestsFreq: {[key: string]: number} = {};
  profiles = this.researchers;
  searchQuery = "";
  en_active: boolean = true;

  // UI State
  isLoading: boolean = true;
  compactView: boolean = false;
  showAutocomplete: boolean = false;
  autocompleteResults: IResearcher[] = [];
  hoveredResearcher: IResearcher | null = null;
  activeFilters: {type: string, value: string, label: string}[] = [];

  // Standardized interests and categories
  stdInterests: {[key: string]: boolean} = {};
  stdInterestsFreq: {[key: string]: number} = {};
  categories: ICategoryHierarchy = categoriesData.categories;
  categoryOrder: string[] = categoriesData.categoryOrder;
  categoryCounts: {[key: string]: number} = {};
  selectedCategory: string = 'all';

  // Hierarchical taxonomy
  taxonomy: ITaxonomy = categoriesData.taxonomy;
  taxonomyCounts: {[key: string]: number} = {};

  // Tree state
  expandedTracks: {[key: string]: boolean} = {};
  expandedSubtracks: {[key: string]: boolean} = {};
  selectedMainTrack: string = 'all';
  selectedSubtrack: string = '';
  selectedArea: string = '';

  // Multi-select areas
  selectedAreas: Set<string> = new Set();
  areaSearchQuery: string = '';
  allAreasFlat: {area: string, track: string, subtrack: string, count: number}[] = [];

  // Map-related
  researchersWithLocation: IResearcher[] = [];
  locationCount: number = 0;

  constructor(
    private filterService: FilterService,
    private locationService: LocationService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('EnglishComponent constructor: people.length =', people.length);
    [this.rinterests, this.rinterestsFreq] = this.filterService.getResearchIntersts(people);
    [this.stdInterests, this.stdInterestsFreq] = this.filterService.getStandardizedInterests(people);
    this.categoryCounts = this.filterService.getCategoryCounts(people, this.categories);
    this.taxonomyCounts = this.filterService.getTaxonomyCounts(people, this.taxonomy);

    // Initialize all tracks as collapsed
    for (const track of this.categoryOrder) {
      this.expandedTracks[track] = false;
    }

    // Build flat list of all areas for search
    this.buildFlatAreasList();

    this.sortShuffle();
   }

  // Build flat list of all areas for easier searching
  private buildFlatAreasList(): void {
    this.allAreasFlat = [];
    for (const track of this.categoryOrder) {
      if (this.taxonomy[track]) {
        for (const subtrack of Object.keys(this.taxonomy[track])) {
          for (const area of this.taxonomy[track][subtrack]) {
            const count = this.taxonomyCounts[area] || 0;
            if (count > 0) {
              this.allAreasFlat.push({ area, track, subtrack, count });
            }
          }
        }
      }
    }
    // Sort by count (most researchers first)
    this.allAreasFlat.sort((a, b) => b.count - a.count);
  }

  async ngOnInit(): Promise<void> {
    await this.loadLocations();
    // Simulate loading for skeleton effect
    setTimeout(() => {
      this.isLoading = false;
      // Initialize scroll animations after content loads
      setTimeout(() => this.initScrollAnimations(), 100);
    }, 500);
  }

  ngAfterViewInit(): void {
    // Set up the Intersection Observer for scroll animations
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );
  }

  private initScrollAnimations(): void {
    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-right');
    animatedElements.forEach(el => {
      this.scrollObserver.observe(el);
    });
  }

  // Get initials for photo fallback
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Generate background color from name
  getInitialsColor(name: string): string {
    const colors = [
      'bg-navy-600', 'bg-teal-500', 'bg-gold-500',
      'bg-navy-700', 'bg-teal-600', 'bg-gold-600'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  // Search autocomplete
  onSearchInput(event: any): void {
    const query = event.target.value.toLowerCase();
    this.searchQuery = query;

    if (query.length >= 2) {
      this.autocompleteResults = this.profiles
        .filter(p => p.name.toLowerCase().includes(query))
        .slice(0, 5);
      this.showAutocomplete = this.autocompleteResults.length > 0;
    } else {
      this.showAutocomplete = false;
      this.autocompleteResults = [];
    }

    this.researchers = this.filterService.filterProfiles(query, people);
  }

  // Select from autocomplete
  selectAutocomplete(researcher: IResearcher): void {
    this.searchQuery = researcher.name;
    this.showAutocomplete = false;
    this.researchers = [researcher];
  }

  // Hide autocomplete on click outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.showAutocomplete = false;
    }
  }

  // Toggle compact/expanded view
  toggleViewMode(): void {
    this.compactView = !this.compactView;
    this.cdr.detectChanges();
    // Re-initialize scroll animations for new view
    setTimeout(() => this.initScrollAnimations(), 50);
  }

  // Hover for map sync
  onResearcherHover(researcher: IResearcher | null): void {
    this.hoveredResearcher = researcher;
  }

  // Update active filters display
  updateActiveFilters(): void {
    this.activeFilters = [];

    if (this.searchQuery) {
      this.activeFilters.push({
        type: 'search',
        value: this.searchQuery,
        label: `Search: "${this.searchQuery}"`
      });
    }

    if (this.selectedMainTrack && this.selectedMainTrack !== 'all') {
      this.activeFilters.push({
        type: 'track',
        value: this.selectedMainTrack,
        label: this.selectedMainTrack
      });
    }

    if (this.selectedSubtrack) {
      this.activeFilters.push({
        type: 'subtrack',
        value: this.selectedSubtrack,
        label: this.selectedSubtrack
      });
    }

    if (this.selectedArea) {
      this.activeFilters.push({
        type: 'area',
        value: this.selectedArea,
        label: this.selectedArea
      });
    }
  }

  // Remove a specific filter
  removeFilter(filter: {type: string, value: string, label: string}): void {
    switch (filter.type) {
      case 'search':
        this.searchQuery = '';
        this.researchers = this.filterService.sortShuffle([...this.profiles]);
        break;
      case 'track':
        this.filterByMainTrack('all');
        break;
      case 'subtrack':
        this.filterByMainTrack(this.selectedMainTrack);
        break;
      case 'area':
        this.filterBySubtrack(this.selectedMainTrack, this.selectedSubtrack);
        break;
    }
    this.updateActiveFilters();
  }

  // Clear all active filters
  clearAllFilters(): void {
    this.searchQuery = '';
    this.clearFilters();
    this.activeFilters = [];
  }

  async loadLocations(): Promise<void> {
    await this.locationService.loadLocations();
    this.researchersWithLocation = this.locationService.enrichAllWithLocations(this.profiles);
    this.locationCount = this.researchersWithLocation.filter(r => r.location).length;
  }

  // Get main tracks (Level 1)
  getMainTracks(): string[] {
    return this.categoryOrder;
  }

  // Get subtracks for a main track (Level 2)
  getSubtracks(mainTrack: string): string[] {
    if (!this.taxonomy[mainTrack]) return [];
    return Object.keys(this.taxonomy[mainTrack]);
  }

  // Get areas for a subtrack (Level 3)
  getAreas(mainTrack: string, subtrack: string): string[] {
    if (!this.taxonomy[mainTrack] || !this.taxonomy[mainTrack][subtrack]) return [];
    return this.taxonomy[mainTrack][subtrack];
  }

  // Toggle main track expansion
  toggleTrack(track: string): void {
    this.expandedTracks[track] = !this.expandedTracks[track];
  }

  // Toggle subtrack expansion
  toggleSubtrack(mainTrack: string, subtrack: string): void {
    const key = `${mainTrack}|${subtrack}`;
    this.expandedSubtracks[key] = !this.expandedSubtracks[key];
  }

  // Check if track is expanded
  isTrackExpanded(track: string): boolean {
    return this.expandedTracks[track] || false;
  }

  // Check if subtrack is expanded
  isSubtrackExpanded(mainTrack: string, subtrack: string): boolean {
    const key = `${mainTrack}|${subtrack}`;
    return this.expandedSubtracks[key] || false;
  }

  // Get count for any term
  getCount(term: string): number {
    return this.taxonomyCounts[term] || 0;
  }

  // Filter by main track
  filterByMainTrack(track: string): void {
    this.selectedMainTrack = track;
    this.selectedSubtrack = '';
    this.selectedArea = '';

    if (track === 'all') {
      this.researchers = this.filterService.sortShuffle([...this.profiles]);
    } else {
      this.researchers = this.filterService.filterByMainTrack(this.profiles, track, this.taxonomy);
    }
  }

  // Filter by subtrack
  filterBySubtrack(mainTrack: string, subtrack: string): void {
    this.selectedMainTrack = mainTrack;
    this.selectedSubtrack = subtrack;
    this.selectedArea = '';
    this.researchers = this.filterService.filterBySubtrack(this.profiles, mainTrack, subtrack, this.taxonomy);
  }

  // Filter by specific area
  filterByArea(area: string): void {
    this.selectedArea = area;
    this.researchers = this.filterService.filterByArea(this.profiles, area);
  }

  // Clear all filters
  clearFilters(): void {
    console.log('=== clearFilters called ===');
    this.selectedMainTrack = 'all';
    this.selectedSubtrack = '';
    this.selectedArea = '';
    this.selectedAreas = new Set();
    this.areaSearchQuery = '';
    this.researchers = people.slice();
    console.log('clearFilters - researchers count:', this.researchers.length);
    this.cdr.detectChanges();
    // Re-initialize scroll animations for new cards
    setTimeout(() => this.initScrollAnimations(), 50);
  }

  // Check if a track is selected or contains the selection
  isTrackActive(track: string): boolean {
    return this.selectedMainTrack === track;
  }

  // Check if a subtrack is selected
  isSubtrackActive(mainTrack: string, subtrack: string): boolean {
    return this.selectedMainTrack === mainTrack && this.selectedSubtrack === subtrack;
  }

  // Check if an area is selected
  isAreaActive(area: string): boolean {
    return this.selectedArea === area;
  }

  // Expand all tracks
  expandAllTracks(): void {
    for (const track of this.categoryOrder) {
      this.expandedTracks[track] = true;
    }
  }

  // Collapse all tracks
  collapseAllTracks(): void {
    for (const track of this.categoryOrder) {
      this.expandedTracks[track] = false;
    }
    this.expandedSubtracks = {};
  }

  sortAZ() {
    this.researchers = this.filterService.sortAZ(people);
  }

  sortHIndex() {
    this.researchers = this.filterService.sortHIndex(people);
  }
  
  sortCitations() {
    this.researchers = this.filterService.sortCitations(people);
  }

  sortShuffle() {
    this.researchers = this.filterService.sortShuffle(people);
  }

  filterProfiles(event:any) {
    let query: string = event.target.value.toLowerCase();
    this.researchers = this.filterService.filterProfiles(query, people);
  }


  filterInterests() {
    this.researchers = this.filterService.filterInterests(people, this.rinterests);
  }

  checkAllInterests() {
    for (let key in this.rinterests) {
      this.rinterests[key] = true;
    }
    this.researchers = this.profiles;
  }  

  clearAllInterests() {
    for (let key in this.rinterests) {
      this.rinterests[key] = false;
    }
    this.researchers = this.profiles;
  }

  // New: Filter by category
  filterByCategory() {
    if (this.selectedCategory === 'all') {
      this.researchers = this.filterService.sortShuffle([...this.profiles]);
    } else {
      this.researchers = this.filterService.filterByCategory(this.profiles, this.selectedCategory, this.categories);
    }
  }

  // New: Filter by standardized interests
  filterStdInterests() {
    this.researchers = this.filterService.filterByStandardizedInterests(this.profiles, this.stdInterests);
  }

  // New: Check all standardized interests
  checkAllStdInterests() {
    for (let key in this.stdInterests) {
      this.stdInterests[key] = true;
    }
    this.researchers = this.profiles;
  }

  // New: Clear all standardized interests
  clearAllStdInterests() {
    for (let key in this.stdInterests) {
      this.stdInterests[key] = false;
    }
    this.researchers = this.profiles;
  }

  // New: Get interests for a category
  getInterestsForCategory(category: string): string[] {
    return this.categories[category] || [];
  }

  // New: Get sorted standardized interests (by frequency)
  getSortedStdInterests(): string[] {
    return Object.keys(this.stdInterestsFreq).sort((a, b) => {
      return this.stdInterestsFreq[b] - this.stdInterestsFreq[a];
    });
  }

  // Multi-select area methods
  getFilteredAreas(): {area: string, track: string, subtrack: string, count: number}[] {
    if (!this.areaSearchQuery.trim()) {
      return this.allAreasFlat;
    }
    const query = this.areaSearchQuery.toLowerCase().trim();
    return this.allAreasFlat.filter(item =>
      item.area.toLowerCase().includes(query) ||
      item.track.toLowerCase().includes(query) ||
      item.subtrack.toLowerCase().includes(query)
    );
  }

  toggleAreaSelection(area: string): void {
    console.log('=== toggleAreaSelection called ===');
    console.log('Area:', area);
    console.log('Current selectedAreas:', Array.from(this.selectedAreas));

    const newSet = new Set(this.selectedAreas);
    if (newSet.has(area)) {
      newSet.delete(area);
      console.log('Removed area');
    } else {
      newSet.add(area);
      console.log('Added area');
    }
    this.selectedAreas = newSet;
    console.log('New selectedAreas:', Array.from(this.selectedAreas));

    // Clear old single-select filters
    this.selectedMainTrack = 'all';
    this.selectedSubtrack = '';
    this.selectedArea = '';
    this.searchQuery = '';

    this.applyMultiAreaFilter();
    this.updateActiveFilters();
  }

  isAreaSelected(area: string): boolean {
    return this.selectedAreas.has(area);
  }

  applyMultiAreaFilter(): void {
    console.log('=== applyMultiAreaFilter called ===');
    console.log('selectedAreas.size:', this.selectedAreas.size);
    console.log('people.length:', people.length);

    if (this.selectedAreas.size === 0) {
      // Return all researchers when nothing selected
      this.researchers = people.slice();
      console.log('No selection - showing all:', this.researchers.length);
      this.cdr.detectChanges();
      // Re-initialize scroll animations for new cards
      setTimeout(() => this.initScrollAnimations(), 50);
      return;
    }

    // Filter researchers who have ANY of the selected areas
    const selectedAreasArray = Array.from(this.selectedAreas);
    console.log('Filtering by:', selectedAreasArray);

    const filtered = people.filter(researcher => {
      const interests = researcher.standardized_interests || [];
      return interests.some(interest => selectedAreasArray.includes(interest));
    });

    this.researchers = filtered.slice();
    console.log('Filtered count:', this.researchers.length);
    this.cdr.detectChanges();
    // Re-initialize scroll animations for new cards
    setTimeout(() => this.initScrollAnimations(), 50);
  }

  clearAreaSelection(): void {
    console.log('=== clearAreaSelection called ===');
    console.log('people.length:', people.length);

    this.selectedAreas = new Set();
    this.areaSearchQuery = '';
    this.selectedMainTrack = 'all';
    this.selectedSubtrack = '';
    this.selectedArea = '';

    // Simply use the original people array directly
    this.researchers = people.slice();

    console.log('After assignment - this.researchers.length:', this.researchers.length);
    console.log('First researcher:', this.researchers[0]?.name);
    console.log('isLoading:', this.isLoading);
    console.log('compactView:', this.compactView);

    this.updateActiveFilters();
    this.cdr.detectChanges();

    // Re-initialize scroll animations for new cards
    setTimeout(() => this.initScrollAnimations(), 50);
  }

  getSelectedAreasArray(): string[] {
    return Array.from(this.selectedAreas);
  }

  removeSelectedArea(area: string): void {
    // Create a new Set to ensure Angular change detection
    const newSet = new Set(this.selectedAreas);
    newSet.delete(area);
    this.selectedAreas = newSet;
    this.applyMultiAreaFilter();
    this.updateActiveFilters();
  }

  editProfile(researcher:IResearcher) {
    let link_template = "https://docs.google.com/forms/d/e/1FAIpQLSdLaYBQyOzI5gnlGzwOki3b1TJtFjLUeHUKxkGtXQDhHdSreg/viewform?usp=pp_url&entry.186050192=Update&entry.1945362270={name}&entry.843703109={affiliation}&entry.1728443742={position}&entry.113990162={gscholar}&entry.1193057171={linkedin}&entry.2083985192={twitter}&entry.1542622457={website}&entry.2030031116={research_interests}"
    link_template = link_template.replace("{name}", researcher.name)
    link_template = link_template.replace("{affiliation}", researcher.affiliation)
    link_template = link_template.replace("{position}", researcher.position)
    link_template = link_template.replace("{gscholar}", researcher.scholar)
    link_template = link_template.replace("{linkedin}", researcher.linkedin)
    link_template = link_template.replace("{twitter}", researcher.twitter)
    link_template = link_template.replace("{website}", researcher.website)
    link_template = link_template.replace("{research_interests}", researcher.interests.join(','))
    window.open(link_template, "_blank")
  }
}
