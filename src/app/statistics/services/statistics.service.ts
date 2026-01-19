import { Injectable } from '@angular/core';
import { IResearcher } from '../../researchers';

export interface CountryStats {
  country: string;
  count: number;
}

export interface ResearchAreaStats {
  area: string;
  count: number;
}

export interface DistributionBucket {
  label: string;
  count: number;
  min: number;
  max: number;
}

export interface SectorStats {
  academia: number;
  industry: number;
  other: number;
}

export interface PositionStats {
  position: string;
  count: number;
}

export interface TopResearcher {
  name: string;
  affiliation: string;
  hindex: number;
  citedby: number;
  photo: string;
}

export interface SummaryStats {
  totalResearchers: number;
  avgHIndex: number;
  totalCitations: number;
  highestHIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  // 16 main research tracks from categories.json
  private mainTracks = [
    'Artificial Intelligence',
    'Natural Language Processing',
    'Computer Vision',
    'Multimodal AI',
    'Robotics & Autonomous Systems',
    'Data Science & Analytics',
    'Data Management',
    'Computer Systems & Architecture',
    'Computer Networks & Communications',
    'Software Engineering',
    'Programming Languages',
    'Theory of Computation',
    'Security & Cryptography',
    'Human-Computer Interaction',
    'Graphics & Visualization',
    'Applied Computing'
  ];

  // Keywords for academia detection
  private academiaKeywords = [
    'university', 'univ', 'college', 'institute', 'school', 'faculty',
    'professor', 'lecturer', 'academic', 'research center', 'lab',
    'department', 'dept', 'academy', 'polytechnic', 'eth', 'mit',
    'stanford', 'berkeley', 'harvard', 'oxford', 'cambridge', 'caltech',
    'carnegie mellon', 'georgia tech', 'tu munich', 'epfl', 'inria',
    'max planck', 'dfki', 'rwth'
  ];

  // Keywords for industry detection
  private industryKeywords = [
    'google', 'meta', 'facebook', 'microsoft', 'apple', 'amazon', 'aws',
    'nvidia', 'intel', 'ibm', 'oracle', 'salesforce', 'adobe', 'openai',
    'deepmind', 'anthropic', 'netflix', 'uber', 'lyft', 'airbnb', 'twitter',
    'linkedin', 'snap', 'bytedance', 'tiktok', 'alibaba', 'tencent', 'baidu',
    'samsung', 'huawei', 'qualcomm', 'cisco', 'vmware', 'sap', 'siemens',
    'bosch', 'valeo', 'inc.', 'corp', 'ltd', 'llc', 'gmbh', 'co.'
  ];

  getSummaryStats(researchers: IResearcher[]): SummaryStats {
    const total = researchers.length;
    const totalCitations = researchers.reduce((sum, r) => sum + (r.citedby || 0), 0);
    const avgHIndex = total > 0
      ? researchers.reduce((sum, r) => sum + (r.hindex || 0), 0) / total
      : 0;
    const highestHIndex = researchers.reduce((max, r) => Math.max(max, r.hindex || 0), 0);

    return {
      totalResearchers: total,
      avgHIndex: Math.round(avgHIndex * 10) / 10,
      totalCitations,
      highestHIndex
    };
  }

  getCountryDistribution(researchers: IResearcher[]): CountryStats[] {
    const countryMap = new Map<string, number>();

    researchers.forEach(r => {
      if (r.location?.country) {
        const country = r.location.country;
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      }
    });

    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }

  getResearchAreaDistribution(researchers: IResearcher[], categoryData: any): ResearchAreaStats[] {
    const areaMap = new Map<string, number>();

    // Initialize all main tracks with 0
    this.mainTracks.forEach(track => areaMap.set(track, 0));

    // Count researchers in each main track
    researchers.forEach(r => {
      if (r.standardized_interests && r.standardized_interests.length > 0) {
        const countedTracks = new Set<string>();

        r.standardized_interests.forEach(interest => {
          // Find which main track this interest belongs to
          for (const [track, keywords] of Object.entries(categoryData.categories || {})) {
            if ((keywords as string[]).includes(interest) && !countedTracks.has(track)) {
              areaMap.set(track, (areaMap.get(track) || 0) + 1);
              countedTracks.add(track);
            }
          }
        });
      }
    });

    return this.mainTracks
      .map(area => ({ area, count: areaMap.get(area) || 0 }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  getHIndexDistribution(researchers: IResearcher[]): DistributionBucket[] {
    const buckets: DistributionBucket[] = [
      { label: '0-10', count: 0, min: 0, max: 10 },
      { label: '11-20', count: 0, min: 11, max: 20 },
      { label: '21-30', count: 0, min: 21, max: 30 },
      { label: '31-40', count: 0, min: 31, max: 40 },
      { label: '41-50', count: 0, min: 41, max: 50 },
      { label: '51-60', count: 0, min: 51, max: 60 },
      { label: '61-70', count: 0, min: 61, max: 70 },
      { label: '71-80', count: 0, min: 71, max: 80 },
      { label: '81-90', count: 0, min: 81, max: 90 },
      { label: '91+', count: 0, min: 91, max: Infinity }
    ];

    researchers.forEach(r => {
      const hindex = r.hindex || 0;
      const bucket = buckets.find(b => hindex >= b.min && hindex <= b.max);
      if (bucket) bucket.count++;
    });

    return buckets;
  }

  getCitationsDistribution(researchers: IResearcher[]): DistributionBucket[] {
    const buckets: DistributionBucket[] = [
      { label: '0-1K', count: 0, min: 0, max: 1000 },
      { label: '1K-5K', count: 0, min: 1001, max: 5000 },
      { label: '5K-10K', count: 0, min: 5001, max: 10000 },
      { label: '10K-20K', count: 0, min: 10001, max: 20000 },
      { label: '20K-50K', count: 0, min: 20001, max: 50000 },
      { label: '50K-100K', count: 0, min: 50001, max: 100000 },
      { label: '100K+', count: 0, min: 100001, max: Infinity }
    ];

    researchers.forEach(r => {
      const citations = r.citedby || 0;
      const bucket = buckets.find(b => citations >= b.min && citations <= b.max);
      if (bucket) bucket.count++;
    });

    return buckets;
  }

  getSectorBreakdown(researchers: IResearcher[]): SectorStats {
    let academia = 0;
    let industry = 0;
    let other = 0;

    researchers.forEach(r => {
      const affiliation = (r.affiliation || '').toLowerCase();
      const position = (r.position || '').toLowerCase();
      const combined = `${affiliation} ${position}`;

      const isAcademia = this.academiaKeywords.some(kw => combined.includes(kw));
      const isIndustry = this.industryKeywords.some(kw => combined.includes(kw));

      // If both match, prefer academia (common for professors with industry ties)
      if (isAcademia) {
        academia++;
      } else if (isIndustry) {
        industry++;
      } else {
        other++;
      }
    });

    return { academia, industry, other };
  }

  getPositionDistribution(researchers: IResearcher[]): PositionStats[] {
    const positionMap = new Map<string, number>();

    // Normalize positions into standard categories
    const normalizePosition = (pos: string): string => {
      const lower = pos.toLowerCase();

      if (lower.includes('professor') && lower.includes('full')) return 'Full Professor';
      if (lower.includes('professor') && lower.includes('associate')) return 'Associate Professor';
      if (lower.includes('professor') && lower.includes('assistant')) return 'Assistant Professor';
      if (lower.includes('professor')) return 'Professor';
      if (lower.includes('lecturer') || lower.includes('teaching')) return 'Lecturer';
      if (lower.includes('postdoc') || lower.includes('post-doc')) return 'Postdoctoral';
      if (lower.includes('phd') || lower.includes('doctoral') || lower.includes('graduate')) return 'PhD Student';
      if (lower.includes('research scientist') || lower.includes('researcher')) return 'Research Scientist';
      if (lower.includes('engineer') || lower.includes('developer')) return 'Engineer';
      if (lower.includes('director') || lower.includes('head') || lower.includes('lead')) return 'Director/Lead';
      if (lower.includes('manager')) return 'Manager';
      if (lower.includes('fellow')) return 'Fellow';
      if (lower.includes('scientist')) return 'Scientist';

      return 'Other';
    };

    researchers.forEach(r => {
      if (r.position) {
        const normalizedPos = normalizePosition(r.position);
        positionMap.set(normalizedPos, (positionMap.get(normalizedPos) || 0) + 1);
      }
    });

    return Array.from(positionMap.entries())
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count);
  }

  getTopByHIndex(researchers: IResearcher[], limit: number = 10): TopResearcher[] {
    return [...researchers]
      .sort((a, b) => (b.hindex || 0) - (a.hindex || 0))
      .slice(0, limit)
      .map(r => ({
        name: r.name,
        affiliation: r.affiliation,
        hindex: r.hindex || 0,
        citedby: r.citedby || 0,
        photo: r.photo
      }));
  }

  getTopByCitations(researchers: IResearcher[], limit: number = 10): TopResearcher[] {
    return [...researchers]
      .sort((a, b) => (b.citedby || 0) - (a.citedby || 0))
      .slice(0, limit)
      .map(r => ({
        name: r.name,
        affiliation: r.affiliation,
        hindex: r.hindex || 0,
        citedby: r.citedby || 0,
        photo: r.photo
      }));
  }
}
