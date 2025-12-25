export interface ILocation {
    lat: number;
    lng: number;
    country: string;
    city: string;
}

export interface IResearcher{
    name: string;
    affiliation: string;
    position: string;
    hindex: number;
    citedby: number;
    photo: string;
    scholar: string;
    linkedin: string;
    website: string;
    twitter: string;
    interests: string[];
    standardized_interests: string[];
    lastupdate: string;
    location?: ILocation;
}

// Hierarchical taxonomy structure
// Level 1: Main Track (e.g., "Artificial Intelligence")
// Level 2: Subtrack (e.g., "Machine Learning")
// Level 3: Specific Area (e.g., "Deep Learning")
export interface ITaxonomy {
    [mainTrack: string]: {
        [subtrack: string]: string[];
    };
}

export interface ICategoryData {
    taxonomy: ITaxonomy;
    categories: { [mainTrack: string]: string[] };
    categoryOrder: string[];
}

export interface ICategoryHierarchy {
    [category: string]: string[];
}