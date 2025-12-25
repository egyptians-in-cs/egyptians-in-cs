import { Injectable } from '@angular/core';
import { IResearcher, ICategoryHierarchy, ITaxonomy } from './researchers';

@Injectable({
  providedIn: 'root'
})

export class FilterService {

  constructor() { }

  // Get counts for each term in the taxonomy
  getTaxonomyCounts(people: IResearcher[], taxonomy: ITaxonomy): {[key: string]: number} {
    const counts: {[key: string]: number} = {};

    // Count all standardized interests
    for (const person of people) {
      const stdInterests = person.standardized_interests || [];
      for (const interest of stdInterests) {
        counts[interest] = (counts[interest] || 0) + 1;
      }
    }

    // Also count main tracks and subtracks
    for (const mainTrack in taxonomy) {
      let mainTrackCount = 0;
      const subtracks = taxonomy[mainTrack];

      for (const subtrack in subtracks) {
        let subtrackCount = 0;
        const areas = subtracks[subtrack];

        // Count researchers who have any area in this subtrack
        for (const person of people) {
          const stdInterests = person.standardized_interests || [];
          if (stdInterests.some(i => areas.includes(i) || i === subtrack)) {
            subtrackCount++;
          }
        }
        counts[subtrack] = subtrackCount;
        mainTrackCount = Math.max(mainTrackCount, subtrackCount);
      }

      // Count researchers who have any interest in this main track
      let trackCount = 0;
      for (const person of people) {
        const stdInterests = person.standardized_interests || [];
        let found = false;
        for (const subtrack in subtracks) {
          const areas = subtracks[subtrack];
          if (stdInterests.some(i => areas.includes(i) || i === subtrack)) {
            found = true;
            break;
          }
        }
        if (found) trackCount++;
      }
      counts[mainTrack] = trackCount;
    }

    return counts;
  }

  // Filter by main track
  filterByMainTrack(profiles: IResearcher[], mainTrack: string, taxonomy: ITaxonomy): IResearcher[] {
    if (!mainTrack || mainTrack === 'all') {
      return profiles;
    }

    const subtracks = taxonomy[mainTrack];
    if (!subtracks) return profiles;

    // Collect all terms under this main track
    const allTerms = new Set<string>();
    for (const subtrack in subtracks) {
      allTerms.add(subtrack);
      subtracks[subtrack].forEach(area => allTerms.add(area));
    }

    return profiles.filter(person => {
      const stdInterests = person.standardized_interests || [];
      return stdInterests.some(interest => allTerms.has(interest));
    });
  }

  // Filter by subtrack
  filterBySubtrack(profiles: IResearcher[], mainTrack: string, subtrack: string, taxonomy: ITaxonomy): IResearcher[] {
    if (!taxonomy[mainTrack] || !taxonomy[mainTrack][subtrack]) {
      return profiles;
    }

    const areas = taxonomy[mainTrack][subtrack];
    const allTerms = new Set([subtrack, ...areas]);

    return profiles.filter(person => {
      const stdInterests = person.standardized_interests || [];
      return stdInterests.some(interest => allTerms.has(interest));
    });
  }

  // Filter by specific area
  filterByArea(profiles: IResearcher[], area: string): IResearcher[] {
    return profiles.filter(person => {
      const stdInterests = person.standardized_interests || [];
      return stdInterests.includes(area);
    });
  }

  // Filter by multiple selected terms (from tree checkboxes)
  filterBySelectedTerms(profiles: IResearcher[], selectedTerms: Set<string>): IResearcher[] {
    if (selectedTerms.size === 0) {
      return profiles;
    }

    return profiles.filter(person => {
      const stdInterests = person.standardized_interests || [];
      return stdInterests.some(interest => selectedTerms.has(interest));
    });
  }

  getResearchIntersts(people: IResearcher[]): [{[key: string]: boolean}, {[key: string]: number}] {
    let interests = new Set<string>();
    let interestsFreq: {[key: string]: number} = {}
    for(let i = 0; i<people.length; i++){
      for(let j = 0; j<people[i].interests.length; j++){
        let curr = people[i].interests[j];
        interestsFreq[curr] = (interestsFreq[curr] || 0) + 1;
        interests.add(curr)
      }
    }

    let interestsArr = Array.from(interests).sort();
    let interestsMap: {[key: string]: boolean} = {}
    for(let i = 0; i<interests.size; i++){
      interestsMap[interestsArr[i]] = true;
    }

    return [interestsMap, interestsFreq];
  }

  // Get standardized interests with frequency counts
  getStandardizedInterests(people: IResearcher[]): [{[key: string]: boolean}, {[key: string]: number}] {
    let interests = new Set<string>();
    let interestsFreq: {[key: string]: number} = {}
    for(let i = 0; i < people.length; i++){
      const stdInterests = people[i].standardized_interests || [];
      for(let j = 0; j < stdInterests.length; j++){
        let curr = stdInterests[j];
        if (curr && curr.trim() !== '') {
          interestsFreq[curr] = (interestsFreq[curr] || 0) + 1;
          interests.add(curr);
        }
      }
    }

    // Sort by frequency (descending) then alphabetically
    let interestsArr = Array.from(interests).sort((a, b) => {
      const freqDiff = interestsFreq[b] - interestsFreq[a];
      return freqDiff !== 0 ? freqDiff : a.localeCompare(b);
    });

    let interestsMap: {[key: string]: boolean} = {}
    for(let i = 0; i < interestsArr.length; i++){
      interestsMap[interestsArr[i]] = true;
    }

    return [interestsMap, interestsFreq];
  }

  // Get category counts based on researchers' standardized interests
  getCategoryCounts(people: IResearcher[], categories: ICategoryHierarchy): {[key: string]: number} {
    let categoryCounts: {[key: string]: number} = {};

    for (let category in categories) {
      categoryCounts[category] = 0;
      const categoryInterests = new Set(categories[category]);

      for (let person of people) {
        const stdInterests = person.standardized_interests || [];
        if (stdInterests.some(interest => categoryInterests.has(interest))) {
          categoryCounts[category]++;
        }
      }
    }

    return categoryCounts;
  }

  // Filter by standardized interests
  filterByStandardizedInterests(profiles: IResearcher[], selectedInterests: {[key: string]: boolean}): IResearcher[] {
    const activeInterests = Object.keys(selectedInterests).filter(key => selectedInterests[key]);

    if (activeInterests.length === 0) {
      return [];
    }

    let filtered: IResearcher[] = [];
    for (let i = 0; i < profiles.length; i++) {
      const stdInterests = profiles[i].standardized_interests || [];
      for (let interest of activeInterests) {
        if (stdInterests.includes(interest)) {
          filtered.push(profiles[i]);
          break;
        }
      }
    }
    return filtered;
  }

  // Filter by category
  filterByCategory(profiles: IResearcher[], category: string, categories: ICategoryHierarchy): IResearcher[] {
    if (!category || category === 'all') {
      return profiles;
    }

    const categoryInterests = new Set(categories[category] || []);

    return profiles.filter(person => {
      const stdInterests = person.standardized_interests || [];
      return stdInterests.some(interest => categoryInterests.has(interest));
    });
  }

  filterProfiles(query:string, profiles: IResearcher[]): IResearcher[] {
    let researchers = profiles;

    if(query.trim() == ""){
      return profiles;
    }

    let filtered:IResearcher[] = []
    for(let i = 0; i<researchers.length; i++){
      if(researchers[i].name.toLowerCase().includes(query)){
        filtered.push(researchers[i]);
      }
    }

    return filtered;
  }

  filterInterests(profiles: IResearcher[], rinterests: {[key: string]: boolean}): IResearcher[] {
    let filtered:IResearcher[] = []
    for(let i = 0; i<profiles.length; i++){
      for(let key in rinterests){
        if(rinterests[key] && profiles[i].interests.includes(key)){
          filtered.push(profiles[i]);
          break;
        }
      }
    }
    return filtered;
  }

  shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // shuffle(array: any[]): any[] {
  //   return array.sort(() => Math.random() - 0.5);
  // }

  sortAZ(people: IResearcher[]) {
    return people.sort((a, b) => a.name.localeCompare(b.name));
  }

  sortHIndex(people: IResearcher[]) {
    return people.sort((a, b) => b.hindex - a.hindex);
  }
  
  sortCitations(people: IResearcher[]) {
    return people.sort((a, b) => b.citedby - a.citedby);
  }

  sortShuffle(people: IResearcher[]) {
    return this.shuffle(people);
  }
}
