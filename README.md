# Egyptians in CS Research

A web application showcasing prominent Egyptian researchers in Computer Science. Features an interactive world map, hierarchical research area filtering, and researcher profiles with academic metrics.

**Live Website**: [https://egyptians-in-cs.github.io/](https://egyptians-in-cs.github.io/)

![Preview](src/assets/thumbnail.png)

## Current Statistics

| Metric | Count |
|--------|-------|
| **Total Researchers** | 291 |
| **Main Research Tracks** | 16 |
| **Subtracks** | 87 |
| **Research Areas** | 594 |
| **Affiliations Mapped** | 215 across 115 cities in 21 countries |

*Last updated: September 2026*

## Features

- **Interactive World Map**: Visualize where Egyptian researchers are located globally using Leaflet.js with marker clustering
- **Statistics Dashboard**: Interactive charts showing geographic distribution, research areas, h-index/citations histograms, academia vs industry breakdown, and top researchers rankings
- **Hierarchical Research Areas**: Browse 16 main tracks, 87 subtracks, and 594 research areas
- **Researcher Profiles**: Display researcher information including h-index, citations, affiliations, and social links, each card showing when its Scholar metrics were last read
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
```

Deployment is automatic — see [Deployment](#deployment-to-github-pages) below.

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
│   │   ├── researchers_en.json  # Researcher data (291 entries)
│   │   ├── researchers_ar.json  # Researcher data (Arabic)
│   │   ├── categories.json      # Research areas taxonomy
│   │   ├── locations.json       # Affiliation to city coordinates
│   │   └── images/              # Researcher photos
│   ├── scripts/                 # Data pipeline (see scripts/README.md)
│   │   ├── pipeline.py          # fetch / review / apply / refresh / status
│   │   ├── lib.py               # Shared helpers
│   │   ├── scholar.py           # Google Scholar lookups
│   │   ├── city_coords.py       # Snap affiliations to city centres
│   │   └── deploy.sh            # Check, build and publish
│   └── styles.css               # Global Tailwind styles
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
  "name": "Firstname Lastname",
  "affiliation": "Cairo University",
  "position": "Associate Professor",
  "hindex": 25,
  "citedby": 3500,
  "photo": "./assets/images/firstname-lastname.jpg",
  "scholar": "https://scholar.google.com/citations?user=XXXX",
  "linkedin": "https://linkedin.com/in/username",
  "website": "https://example.com",
  "twitter": "https://twitter.com/username",
  "interests": ["Machine Learning", "Computer Vision", "Deep Learning"],
  "standardized_interests": ["Machine Learning", "Computer Vision", "Deep Learning"],
  "lastupdate": "2026-09-04"
}
```

#### Step 2: Add Photo

Place the researcher's photo in `src/assets/images/` with the filename matching the `photo` field. Recommended size: 200x200px.

#### Step 3: Update Location Mapping (Optional)

If the affiliation isn't already in `src/assets/locations.json`, add it. **Use the
coordinates of the city, not of the campus** — the map deliberately shows which city
someone is in rather than which building, so every affiliation in a city shares one
point:

```json
{
  "Cairo University": { "lat": 30.0444, "lng": 31.2357, "country": "Egypt", "city": "Cairo" }
}
```

Rather than looking coordinates up by hand, add the entry with any coordinates and run:

```bash
cd src && python3 scripts/city_coords.py
```

It resolves every city through OpenStreetMap and rewrites all affiliations to their
city centre, skipping any match that lands implausibly far from the existing point.

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

Every push to `main` is built and published by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Deploying is therefore
just committing and pushing — but use the deploy script, which validates the data and
runs a production build **before** the commit becomes public:

```bash
src/scripts/deploy.sh                 # check, build, commit, push
src/scripts/deploy.sh --check         # check and build only, change nothing
src/scripts/deploy.sh -m "message"    # with a specific commit message
```

The checks cover JSON validity, required fields, missing photo files, duplicate
entries, and that no file holding raw form responses has become tracked by git.

---

## Updating Researcher Data

### Using Python Scripts

```bash
cd src
python3 scripts/pipeline.py status    # What state is the directory in
python3 scripts/pipeline.py fetch     # Pull new submissions into review.json
python3 scripts/pipeline.py review    # Read the proposals, edit them if needed
python3 scripts/pipeline.py apply     # Merge the approved ones
python3 scripts/pipeline.py refresh   # Update h-index/citations from Scholar
```

There is no date filter to keep up to date: `pipeline.py` records which submissions
it has already handled, and `fetch` never writes to the directory — it proposes
changes in `assets/review.json` for you to approve. See
[src/scripts/README.md](src/scripts/README.md) for the full description.

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
| `hindex` | number | Yes | Google Scholar h-index (set by `pipeline.py refresh`) |
| `citedby` | number | Yes | Total citations (set by `pipeline.py refresh`) |
| `photo` | string | Yes | Path to photo |
| `scholar` | string | No | Google Scholar URL; a `user=` id is required for `refresh` to update the metrics |
| `linkedin` | string | No | LinkedIn URL |
| `website` | string | No | Personal website URL |
| `twitter` | string | No | Twitter/X URL |
| `interests` | string[] | Yes | Original research interests |
| `standardized_interests` | string[] | Yes | Mapped to taxonomy |
| `lastupdate` | string | Yes | When the metrics were last read from Scholar (YYYY-MM-DD); shown on each card |

### locations.json

Maps institution names to **city centre** coordinates for the world map. Institutions
in the same city share one point, so the map shows cities rather than exact locations:

```json
{
  "Institution Name": { "lat": 30.0444, "lng": 31.2357, "country": "Egypt", "city": "Cairo" }
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
