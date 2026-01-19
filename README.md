# Egyptians in Computer Science

A web application showcasing prominent Egyptian researchers in Computer Science. Features an interactive world map, hierarchical research area filtering, and researcher profiles with academic metrics.

**Live Website**: [https://egyptians-in-cs.github.io/egyptians-in-cs/](https://egyptians-in-cs.github.io/egyptians-in-cs/)

![Preview](src/assets/thumbnail.png)

## Features

- **Interactive World Map**: Visualize where Egyptian researchers are located globally using Leaflet.js with marker clustering
- **Hierarchical Research Areas**: Browse 16 main tracks, 87 subtracks, and 594 research areas
- **Researcher Profiles**: Display researcher information including h-index, citations, affiliations, and social links
- **Bilingual Support**: Full English and Arabic (RTL) interfaces
- **Advanced Filtering**: Filter by name, research area, or sort by h-index/citations
- **Responsive Design**: Mobile-first design using Tailwind CSS

## Tech Stack

- **Frontend**: Angular 14
- **Styling**: Tailwind CSS 3.4
- **Maps**: Leaflet.js with MarkerCluster
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
git clone https://github.com/YOUR_USERNAME/egyptians-in-ai.git
cd egyptians-in-ai

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
ng build --configuration production --output-path docs --base-href https://egyptians-in-cs.github.io/
```

---

## Project Structure

```
egyptians-in-ai/
├── src/
│   ├── app/
│   │   ├── arabic/              # Arabic (RTL) component
│   │   ├── english/             # English component
│   │   ├── map/                 # Interactive world map component
│   │   ├── app.component.*      # Root component (navbar, footer)
│   │   ├── filter.service.ts    # Filtering and sorting logic
│   │   ├── location.service.ts  # Location enrichment for map
│   │   └── researchers.ts       # TypeScript interfaces
│   ├── assets/
│   │   ├── researchers_en.json  # Researcher data (English)
│   │   ├── researchers_ar.json  # Researcher data (Arabic)
│   │   ├── categories.json      # Research areas taxonomy
│   │   ├── locations.json       # Affiliation to coordinates mapping
│   │   └── images/              # Researcher photos
│   └── styles.css               # Global Tailwind styles
├── tailwind.config.js           # Tailwind configuration
├── angular.json                 # Angular configuration
└── package.json
```

---

## How to Add New Researchers

### Step 1: Add Researcher Data

Edit `src/assets/researchers_en.json` and add a new entry:

```json
{
  "name": "Ahmed Mohamed",
  "affiliation": "Cairo University",
  "position": "Associate Professor",
  "hindex": 25,
  "citedby": 3500,
  "photo": "./assets/images/ahmed_mohamed.jpg",
  "scholar": "https://scholar.google.com/citations?user=XXXX",
  "linkedin": "https://linkedin.com/in/ahmedmohamed",
  "website": "https://ahmedmohamed.com",
  "twitter": "https://twitter.com/ahmedmohamed",
  "interests": ["Machine Learning", "Computer Vision", "Deep Learning"],
  "standardized_interests": ["Machine Learning", "Computer Vision", "Deep Learning"],
  "lastupdate": "2024-01-15"
}
```

### Step 2: Add Photo

Place the researcher's photo in `src/assets/images/` with the filename matching the `photo` field.

### Step 3: Update Location Mapping (Optional)

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

## How to Customize Research Areas

The research taxonomy is defined in `src/assets/categories.json` with three levels:

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

### Adding a New Research Area

1. Add to the `taxonomy` under the appropriate track and subtrack
2. Add to the `categories` flat list for that track
3. Update researcher `standardized_interests` to use the new area

### Adding a New Main Track

1. Add the track to `taxonomy` with its subtracks and areas
2. Add to `categories` with flattened list of all areas
3. Add to `categoryOrder` array for display order

---

## Customizing for Your Own Use Case

### Fork for Your Community

This project can be adapted for any community (e.g., "Moroccans in AI", "Pakistanis in CS"):

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
    // ... other shades
  },
  'gold': {
    400: '#E7C29C',  // Accent color
  },
  'teal': {
    500: '#1C8394',  // Secondary accent
  }
}
```

### Change Fonts

Update `src/styles.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=YOUR_FONT&display=swap');
```

And `tailwind.config.js`:

```javascript
fontFamily: {
  'sans': ['Your Font', 'system-ui', 'sans-serif'],
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

// Change tile provider
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(this.map);
```

---

## Deployment to GitHub Pages

### Option 1: Manual Deployment

1. Build the project:
```bash
ng build --configuration production --output-path docs --base-href /your-repo-name/
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

### Option 2: Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build -- --configuration production --base-href /egyptians-in-ai/
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/egyptians-in-ai
```

---

## Updating Researcher Data

### Manual Update

1. Edit `src/assets/researchers_en.json` directly
2. Rebuild and deploy

### Bulk Update (Using Scripts)

1. Download new entries spreadsheet as `researchers.csv`
2. Run `python scripts/populate.py` to generate `researchers_new.json`
3. Append valid entries to `researchers_en.json`
4. Run `python scripts/google_scholar.py` to update h-index values
5. Rebuild and deploy

---

## Data Files Reference

### researchers_en.json / researchers_ar.json

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

### categories.json

Hierarchical research taxonomy:
- `taxonomy`: 3-level hierarchy (Track → Subtrack → Area)
- `categories`: Flat lists per track for filtering
- `categoryOrder`: Display order of main tracks

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

Have questions or suggestions? Feel free to reach out or [open an issue](https://github.com/egyptians-in-cs/egyptians-in-cs/issues).

---

## Acknowledgments

- Research data sourced from Google Scholar
- Map tiles by [CartoDB](https://carto.com/) and [OpenStreetMap](https://www.openstreetmap.org/)
