# Egyptians in CS Research

A web application showcasing prominent Egyptian researchers in Computer Science. Features an interactive world map, hierarchical research area filtering, and researcher profiles with academic metrics.

**Live Website**: [https://egyptians-in-cs.github.io/](https://egyptians-in-cs.github.io/)

![Preview](src/assets/thumbnail.png)

## Current Statistics

| Metric | Count |
|--------|-------|
| **Total Researchers** | 262 |
| **Main Research Tracks** | 16 |
| **Subtracks** | 87 |
| **Research Areas** | 594 |
| **Institutions Mapped** | 200+ |

*Last updated: January 2026*

## Features

- **Interactive World Map**: Visualize where Egyptian researchers are located globally using Leaflet.js with marker clustering
- **Statistics Dashboard**: Interactive charts showing geographic distribution, research areas, h-index/citations histograms, academia vs industry breakdown, and top researchers rankings
- **Hierarchical Research Areas**: Browse 16 main tracks, 87 subtracks, and 594 research areas
- **Researcher Profiles**: Display researcher information including h-index, citations, affiliations, and social links
- **Bilingual Support**: Full English and Arabic (RTL) interfaces
- **Advanced Filtering**: Filter by name, research area, or sort by h-index/citations
- **Dark Mode**: System preference detection with manual toggle
- **Responsive Design**: Mobile-first design using Tailwind CSS

## Tech Stack

- **Frontend**: Angular 14
- **Styling**: Tailwind CSS 3.4
- **Maps**: Leaflet.js with MarkerCluster
- **Charts**: Chart.js
- **Icons**: Font Awesome 6
- **Fonts**: Inter, Merriweather, Noto Sans Arabic

---

## Getting Started

### Prerequisites

- Node.js 16+
- npm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/egyptians-in-cs/egyptians-in-cs.github.io.git
cd egyptians-in-cs.github.io

# Install dependencies
npm install

# Start development server
npm start
```

Visit `http://localhost:4200` in your browser.

### Build for Production

```bash
# Build for production
npm run build

# Build for GitHub Pages (outputs to /docs folder)
ng build --configuration production --output-path docs --base-href /
```

---

## Project Structure

```
egyptians-in-cs.github.io/
├── src/
│   ├── app/
│   │   ├── arabic/              # Arabic (RTL) component
│   │   ├── english/             # English component
│   │   ├── map/                 # Interactive world map component
│   │   ├── statistics/          # Statistics dashboard with Chart.js
│   │   ├── app.component.*      # Root component (navbar, footer)
│   │   ├── filter.service.ts    # Filtering and sorting logic
│   │   ├── location.service.ts  # Location enrichment for map
│   │   ├── theme.service.ts     # Dark mode management
│   │   └── researchers.ts       # TypeScript interfaces
│   ├── assets/
│   │   ├── researchers_en.json  # Researcher data (262 entries)
│   │   ├── researchers_ar.json  # Researcher data (Arabic)
│   │   ├── categories.json      # Research areas taxonomy
│   │   ├── locations.json       # Affiliation to coordinates mapping
│   │   └── images/              # Researcher photos (200+)
│   ├── scripts/                 # Python utilities for data management
│   │   ├── populate.py          # Process new submissions
│   │   ├── google_scholar.py    # Update h-index/citations
│   │   └── merge_interests.py   # Standardize research interests
│   └── styles.css               # Global Tailwind styles
├── docs/                        # Production build for GitHub Pages
├── tailwind.config.js           # Tailwind configuration
├── angular.json                 # Angular configuration
└── package.json
```

---

## How to Add New Researchers

### Option 1: Submit via Form

Submit nominations via our [Google Form](https://docs.google.com/forms/d/e/1FAIpQLSdLaYBQyOzI5gnlGzwOki3b1TJtFjLUeHUKxkGtXQDhHdSreg/viewform).

### Option 2: Manual Addition

#### Step 1: Add Researcher Data

Edit `src/assets/researchers_en.json` and add a new entry:

```json
{
  "name": "Ahmed Mohamed",
  "affiliation": "Cairo University",
  "position": "Associate Professor",
  "hindex": 25,
  "citedby": 3500,
  "photo": "./assets/images/ahmed-mohamed.jpg",
  "scholar": "https://scholar.google.com/citations?user=XXXX",
  "linkedin": "https://linkedin.com/in/ahmedmohamed",
  "website": "https://ahmedmohamed.com",
  "twitter": "https://twitter.com/ahmedmohamed",
  "interests": ["Machine Learning", "Computer Vision", "Deep Learning"],
  "standardized_interests": ["Machine Learning", "Computer Vision", "Deep Learning"],
  "lastupdate": "2026-01-07"
}
```

#### Step 2: Add Photo

Place the researcher's photo in `src/assets/images/` with the filename matching the `photo` field. Recommended size: 200x200px.

#### Step 3: Update Location Mapping (Optional)

If the affiliation isn't already in `src/assets/locations.json`, add it:

```json
{
  "Cairo University": {
    "lat": 30.0131,
    "lng": 31.2089,
    "country": "Egypt",
    "city": "Cairo"
  }
}
```

### Inclusion Criteria

To be listed, a researcher must have an **h-index of 5 or higher** on Google Scholar.

---

## Research Areas Taxonomy

The research taxonomy is defined in `src/assets/categories.json` with three levels:

### Current Taxonomy (16 Main Tracks)

| Track | Subtracks | Areas |
|-------|-----------|-------|
| Artificial Intelligence | 6 | 65 |
| Natural Language Processing | 7 | 54 |
| Computer Vision | 7 | 58 |
| Multimodal AI | 3 | 17 |
| Robotics & Autonomous Systems | 5 | 32 |
| Data Science & Analytics | 5 | 32 |
| Data Management | 5 | 33 |
| Computer Systems & Architecture | 5 | 32 |
| Computer Networks & Communications | 5 | 33 |
| Software Engineering | 5 | 34 |
| Programming Languages | 5 | 29 |
| Theory of Computation | 6 | 35 |
| Security & Cryptography | 6 | 37 |
| Human-Computer Interaction | 5 | 29 |
| Graphics & Visualization | 5 | 31 |
| Applied Computing | 7 | 43 |

**Total: 16 tracks, 87 subtracks, 594 research areas**

### Structure

```json
{
  "taxonomy": {
    "Main Track": {
      "Subtrack": ["Area 1", "Area 2", "Area 3"]
    }
  },
  "categories": {
    "Main Track": ["All areas flattened for filtering"]
  },
  "categoryOrder": ["Main Track 1", "Main Track 2"]
}
```

---

## Customizing for Your Own Community

This project can be adapted for any community (e.g., "Moroccans in AI", "Pakistanis in CS"):

### Fork and Customize

1. Fork this repository
2. Replace data in `src/assets/researchers_en.json`
3. Update `src/assets/categories.json` for your research focus
4. Update `src/assets/locations.json` with relevant institutions
5. Modify branding in `src/app/app.component.html`
6. Update form links to your own Google Form

### Change the Theme

Edit `tailwind.config.js` to customize colors:

```javascript
colors: {
  'navy': {
    900: '#091B2B',  // Primary dark
  },
  'gold': {
    400: '#E7C29C',  // Accent color
  },
  'teal': {
    500: '#1C8394',  // Secondary accent
  }
}
```

### Modify Map Settings

Edit `src/app/map/map.component.ts`:

```typescript
// Change initial view
this.map = L.map(this.mapId, {
  center: [25, 20],  // Latitude, Longitude
  zoom: 2,           // Initial zoom level
});
```

---

## Deployment to GitHub Pages

### Manual Deployment

1. Build the project:
```bash
ng build --configuration production --output-path docs --base-href /
```

2. Commit and push:
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

3. Configure GitHub Pages:
   - Go to repository Settings → Pages
   - Set Source to "Deploy from a branch"
   - Select `main` branch and `/docs` folder
   - Save

---

## Updating Researcher Data

### Using Python Scripts

```bash
# 1. Set the date filter in scripts/populate.py
last_update = datetime.strptime("01/01/2026", "%m/%d/%Y")

# 2. Run the update pipeline
cd src
python3 scripts/populate.py           # Process new submissions
python3 scripts/check_new_submissions.py  # Validate entries
python3 scripts/merge_new_submissions.py  # Merge into main file
python3 scripts/google_scholar.py     # Update h-index/citations
```

### Manual Update

1. Edit `src/assets/researchers_en.json` directly
2. Add photos to `src/assets/images/`
3. Rebuild and deploy

---

## Data Files Reference

### researchers_en.json

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `affiliation` | string | Yes | Current institution |
| `position` | string | Yes | Academic title |
| `hindex` | number | Yes | Google Scholar h-index |
| `citedby` | number | Yes | Total citations |
| `photo` | string | Yes | Path to photo |
| `scholar` | string | No | Google Scholar URL |
| `linkedin` | string | No | LinkedIn URL |
| `website` | string | No | Personal website URL |
| `twitter` | string | No | Twitter/X URL |
| `interests` | string[] | Yes | Original research interests |
| `standardized_interests` | string[] | Yes | Mapped to taxonomy |
| `lastupdate` | string | Yes | Last update date (YYYY-MM-DD) |

### locations.json

Maps institution names to coordinates for the world map:

```json
{
  "Institution Name": {
    "lat": 30.0131,
    "lng": 31.2089,
    "country": "Egypt",
    "city": "Cairo"
  }
}
```

---

## Other "X in Y" Websites

- [Moroccans in AI Research](https://mair.ma)
- [Pakistanis in AI Research](https://ahmadmustafaanis.github.io/Pakistanis-in-ai/)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Nominating a Researcher

Submit nominations via [this form](https://docs.google.com/forms/d/e/1FAIpQLSdLaYBQyOzI5gnlGzwOki3b1TJtFjLUeHUKxkGtXQDhHdSreg/viewform).

---

## Troubleshooting

### Build Issues

If you encounter OpenSSL errors with older Node.js:
```bash
export NODE_OPTIONS=--openssl-legacy-provider
npm run build
```

### Map Not Loading

Ensure Leaflet CSS is included in `angular.json`:
```json
"styles": [
  "src/styles.css",
  "node_modules/leaflet/dist/leaflet.css",
  "node_modules/leaflet.markercluster/dist/MarkerCluster.css",
  "node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css"
]
```

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Created By

**Badr AlKhamissi** · [Website](https://bkhmsi.github.io/) · [Twitter](https://x.com/bkhmsi) · [LinkedIn](https://www.linkedin.com/in/bkhmsi/)

**Mohamed Moustafa Dawoud** · [Website](https://momodawoud.github.io) · [Twitter](https://x.com/mohamedmustfaaa) · [LinkedIn](https://www.linkedin.com/in/mohamedmostafadawod/)

Have questions or suggestions? Feel free to reach out or [open an issue](https://github.com/egyptians-in-cs/egyptians-in-cs.github.io/issues).

---

## Acknowledgments

- Research data sourced from Google Scholar
- Map tiles by [CartoDB](https://carto.com/) and [OpenStreetMap](https://www.openstreetmap.org/)
