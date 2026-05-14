# Carolina Atlas 🗺️

> Transparent civic data for North Carolina communities — crime, education, demographics, and public insight.

Carolina Atlas is a modern civic-tech platform that brings public government data to life. Built for residents, journalists, researchers, and public officials who want to explore and understand the data that shapes their North Carolina communities.

---

## ✨ Features

- **Crime Explorer** — Browse live Raleigh Police Department incident data with search, filters, card & table views
- **Schools Dashboard** *(coming soon)* — NC school ratings and performance metrics
- **Demographics** *(coming soon)* — Census and ACS data for every NC county
- **Community Reports** *(coming soon)* — Automated transparency reports combining multiple datasets

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Fonts | Poppins (headings) + Inter (body) via Google Fonts |
| Data | City of Raleigh ArcGIS FeatureServer (public API) |
| Deployment | AWS Amplify Hosting |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/liljoker919/carolina-atlas.git
cd carolina-atlas

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## 📁 Project Structure

```
carolina-atlas/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (Navbar + Footer)
│   ├── page.tsx                # Homepage
│   ├── crime/
│   │   ├── page.tsx            # Crime Explorer page
│   │   └── CrimeExplorer.tsx   # Client-side explorer component
│   ├── schools/page.tsx
│   ├── demographics/page.tsx
│   ├── community-reports/page.tsx
│   └── about/page.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Responsive sticky navigation
│   │   └── Footer.tsx          # Footer with transparency messaging
│   ├── dashboard/
│   │   ├── StatCard.tsx        # KPI metric card
│   │   ├── IncidentCard.tsx    # Single incident card
│   │   └── IncidentTable.tsx   # Incidents data table
│   ├── charts/
│   │   └── ChartPlaceholder.tsx  # Placeholder for future charts
│   ├── maps/
│   │   └── MapPlaceholder.tsx  # Placeholder for interactive map
│   └── ui/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── PageHeader.tsx
│       └── ComingSoon.tsx
├── lib/
│   ├── api/
│   │   └── incidents.ts        # Raleigh Police Incidents API service
│   └── utils/
│       └── index.ts            # Shared utility functions
├── types/
│   └── index.ts                # TypeScript interfaces
├── amplify.yml                 # AWS Amplify build configuration
└── .env.example                # Environment variable template
```

---

## 🌐 Data Sources

| Dataset | Source | Status |
|---|---|---|
| Raleigh Daily Police Incidents | City of Raleigh — ArcGIS FeatureServer | ✅ Live |
| NC School Performance | NCDPI | 🚧 Coming Soon |
| Demographics / Census | US Census Bureau / ACS | 🚧 Coming Soon |
| Statewide Crime | NC SBI | 🚧 Coming Soon |

**API Endpoint (Raleigh Incidents):**
```
https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Daily_Police_Incidents/FeatureServer/0/query
```

---

## 🔒 Privacy & Data Ethics

- **Block-level addresses only** — no full street addresses or precise coordinates
- **No personal information** — no names, ages, or other PII displayed
- **Public data only** — all data sourced from openly available government databases
- **Transparent methodology** — data collection and filtering is documented

---

## ☁️ AWS Amplify Deployment

The project includes an `amplify.yml` configuration file. To deploy:

1. Connect the GitHub repository to AWS Amplify Console
2. Amplify will automatically detect the `amplify.yml` build spec
3. Set environment variables in the Amplify Console if needed
4. Deploy — Amplify handles build, deploy, and CDN distribution

**Recommended Amplify settings:**
- Framework: Next.js - SSR
- Build command: `npm run build`
- Build output directory: `.next`
- Node.js version: 18 or 20

---

## 🗺️ Roadmap

- [ ] Statewide NC crime data integration
- [ ] Interactive map (Leaflet / Mapbox) for incident geolocation
- [ ] Analytics charts (crime type distribution, district trends)
- [ ] School ratings and education metrics
- [ ] Census and demographic datasets
- [ ] Community trend reporting
- [ ] Public transparency PDF reports
- [ ] Geographic visualizations by county

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

*Built for North Carolina communities. Public data, public good.*
