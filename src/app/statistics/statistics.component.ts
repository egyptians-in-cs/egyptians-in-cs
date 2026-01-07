import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { IResearcher } from '../researchers';
import { StatisticsService, SummaryStats, CountryStats, ResearchAreaStats, DistributionBucket, SectorStats, PositionStats, TopResearcher } from './services/statistics.service';
import { CHART_TRANSLATIONS } from './translations';
import people from '../../assets/researchers_en.json';
import categoriesData from '../../assets/categories.json';
import { ThemeService } from '../theme.service';
import { LocationService } from '../location.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('countryChart') countryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('researchAreaChart') researchAreaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hindexChart') hindexChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('citationsChart') citationsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sectorChart') sectorChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('positionChart') positionChartRef!: ElementRef<HTMLCanvasElement>;

  // Language
  lang: 'en' | 'ar' = 'en';
  t: any;

  // Theme
  isDarkMode: boolean = false;

  // Data
  researchers: IResearcher[] = people;
  summaryStats!: SummaryStats;
  countryStats: CountryStats[] = [];
  researchAreaStats: ResearchAreaStats[] = [];
  hindexDistribution: DistributionBucket[] = [];
  citationsDistribution: DistributionBucket[] = [];
  sectorStats!: SectorStats;
  positionStats: PositionStats[] = [];
  topByHIndex: TopResearcher[] = [];
  topByCitations: TopResearcher[] = [];

  // Tab state
  topResearchersTab: 'hindex' | 'citations' = 'hindex';

  // Charts
  private charts: Chart[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private statsService: StatisticsService,
    private themeService: ThemeService,
    private locationService: LocationService
  ) {
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      this.updateChartsTheme();
    });
  }

  async ngOnInit(): Promise<void> {
    // Get language from route
    this.route.params.subscribe(params => {
      this.lang = params['lang'] === 'ar' ? 'ar' : 'en';
      this.t = CHART_TRANSLATIONS[this.lang];
      this.updateChartsLanguage();
    });

    // Load locations and compute stats
    await this.locationService.loadLocations();
    this.researchers = this.locationService.enrichAllWithLocations(people);
    this.computeStatistics();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createAllCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.charts.forEach(chart => chart.destroy());
  }

  private computeStatistics(): void {
    this.summaryStats = this.statsService.getSummaryStats(this.researchers);
    this.countryStats = this.statsService.getCountryDistribution(this.researchers);
    this.researchAreaStats = this.statsService.getResearchAreaDistribution(this.researchers, categoriesData);
    this.hindexDistribution = this.statsService.getHIndexDistribution(this.researchers);
    this.citationsDistribution = this.statsService.getCitationsDistribution(this.researchers);
    this.sectorStats = this.statsService.getSectorBreakdown(this.researchers);
    this.positionStats = this.statsService.getPositionDistribution(this.researchers);
    this.topByHIndex = this.statsService.getTopByHIndex(this.researchers, 10);
    this.topByCitations = this.statsService.getTopByCitations(this.researchers, 10);
  }

  private createAllCharts(): void {
    this.createCountryChart();
    this.createResearchAreaChart();
    this.createHIndexChart();
    this.createCitationsChart();
    this.createSectorChart();
    this.createPositionChart();
  }

  private getColors() {
    return {
      navy: '#091B2B',
      gold: '#E7C29C',
      teal: '#1C8394',
      lightNavy: '#243b53',
      lightTeal: '#2ca3b5',
      text: this.isDarkMode ? '#bcccdc' : '#091B2B',
      gridColor: this.isDarkMode ? 'rgba(188, 204, 220, 0.1)' : 'rgba(9, 27, 43, 0.1)'
    };
  }

  private createCountryChart(): void {
    if (!this.countryChartRef?.nativeElement) return;
    const colors = this.getColors();
    const topCountries = this.countryStats.slice(0, 10);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: topCountries.map(c => this.t.countries[c.country] || c.country),
        datasets: [{
          label: this.t.numberOfResearchers,
          data: topCountries.map(c => c.count),
          backgroundColor: colors.teal,
          borderColor: colors.navy,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.text }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.text }
          }
        }
      }
    };

    const chart = new Chart(this.countryChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private createResearchAreaChart(): void {
    if (!this.researchAreaChartRef?.nativeElement) return;
    const colors = this.getColors();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.researchAreaStats.map(a => a.area),
        datasets: [{
          label: this.t.numberOfResearchers,
          data: this.researchAreaStats.map(a => a.count),
          backgroundColor: colors.navy,
          borderColor: colors.gold,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.text }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: colors.text,
              font: { size: 11 }
            }
          }
        }
      }
    };

    const chart = new Chart(this.researchAreaChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private createHIndexChart(): void {
    if (!this.hindexChartRef?.nativeElement) return;
    const colors = this.getColors();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.hindexDistribution.map(b => b.label),
        datasets: [{
          label: this.t.researchers,
          data: this.hindexDistribution.map(b => b.count),
          backgroundColor: colors.teal,
          borderColor: colors.navy,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.text }
          }
        }
      }
    };

    const chart = new Chart(this.hindexChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private createCitationsChart(): void {
    if (!this.citationsChartRef?.nativeElement) return;
    const colors = this.getColors();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.citationsDistribution.map(b => b.label),
        datasets: [{
          label: this.t.researchers,
          data: this.citationsDistribution.map(b => b.count),
          backgroundColor: colors.gold,
          borderColor: colors.navy,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.text }
          }
        }
      }
    };

    const chart = new Chart(this.citationsChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private createSectorChart(): void {
    if (!this.sectorChartRef?.nativeElement) return;
    const colors = this.getColors();

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: [this.t.academia, this.t.industry, this.t.other],
        datasets: [{
          data: [this.sectorStats.academia, this.sectorStats.industry, this.sectorStats.other],
          backgroundColor: [colors.navy, colors.teal, colors.gold],
          borderColor: this.isDarkMode ? colors.lightNavy : '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.text }
          }
        }
      }
    };

    const chart = new Chart(this.sectorChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private createPositionChart(): void {
    if (!this.positionChartRef?.nativeElement) return;
    const colors = this.getColors();
    const topPositions = this.positionStats.slice(0, 8);

    // Gradient colors
    const gradientColors = [
      colors.navy, colors.teal, colors.gold,
      colors.lightNavy, colors.lightTeal, '#d4a574',
      '#627d98', '#1a535c'
    ];

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: topPositions.map(p => p.position),
        datasets: [{
          label: this.t.researchers,
          data: topPositions.map(p => p.count),
          backgroundColor: gradientColors.slice(0, topPositions.length),
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.text }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.text }
          }
        }
      }
    };

    const chart = new Chart(this.positionChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private updateChartsTheme(): void {
    // Recreate charts with new theme
    if (this.charts.length > 0) {
      this.charts.forEach(chart => chart.destroy());
      this.charts = [];
      this.createAllCharts();
    }
  }

  private updateChartsLanguage(): void {
    // Recreate charts with new language
    if (this.charts.length > 0) {
      this.charts.forEach(chart => chart.destroy());
      this.charts = [];
      this.createAllCharts();
    }
  }

  switchTab(tab: 'hindex' | 'citations'): void {
    this.topResearchersTab = tab;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  goBack(): void {
    this.router.navigate(['/' + this.lang]);
  }

  toggleLanguage(): void {
    const newLang = this.lang === 'en' ? 'ar' : 'en';
    this.router.navigate(['/' + newLang + '/stats']);
  }
}
