import { Component, OnInit, AfterViewInit } from '@angular/core';
import { IResearcher } from '../researchers';
import people from '../../assets/researchers_en.json';
import { FilterService } from '../filter.service';
import { LocationService } from '../location.service';

@Component({
  selector: 'app-arabic',
  templateUrl: './arabic.component.html',
  styleUrls: ['./arabic.component.css']
})
export class ArabicComponent implements OnInit, AfterViewInit {

  private scrollObserver!: IntersectionObserver;

  title = 'المصريين  في الذكاء الاصطناعي';
  researchers: IResearcher[] = people;
  rinterests: {[key: string]: boolean} = {};
  rinterestsFreq: {[key: string]: number} = {};
  profiles = this.researchers;
  searchQuery = "";
  en_active: boolean = true;

  // Interest filter
  interestSearchQuery: string = '';

  // Map-related
  researchersWithLocation: IResearcher[] = [];
  locationCount: number = 0;

  constructor(private filterService: FilterService, private locationService: LocationService) {
    [this.rinterests, this.rinterestsFreq] = this.filterService.getResearchIntersts(people);
    this.sortShuffle();
   }

  async ngOnInit(): Promise<void> {
    await this.loadLocations();
    // Initialize scroll animations after content loads
    setTimeout(() => this.initScrollAnimations(), 100);
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

  async loadLocations(): Promise<void> {
    await this.locationService.loadLocations();
    this.researchersWithLocation = this.locationService.enrichAllWithLocations(this.profiles);
    this.locationCount = this.researchersWithLocation.filter(r => r.location).length;
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
    this.interestSearchQuery = '';
    this.researchers = this.profiles;
  }

  // Get filtered interests based on search query
  getFilteredInterests(): string[] {
    const interests = Object.keys(this.rinterests);
    if (!this.interestSearchQuery.trim()) {
      // Sort by frequency (most common first)
      return interests.sort((a, b) => this.rinterestsFreq[b] - this.rinterestsFreq[a]);
    }
    const query = this.interestSearchQuery.toLowerCase().trim();
    return interests
      .filter(interest => interest.toLowerCase().includes(query))
      .sort((a, b) => this.rinterestsFreq[b] - this.rinterestsFreq[a]);
  }

  // Get count of selected interests
  getSelectedInterestsCount(): number {
    return Object.values(this.rinterests).filter(v => v).length;
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
