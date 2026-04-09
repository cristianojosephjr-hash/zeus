export const SOURCES_2026 = [
  {
    id: "wmo-2025",
    label: "WMO State of the Global Climate 2025",
    url: "https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025",
    note: "Global climate pressure baseline used for scenario stress multipliers.",
  },
  {
    id: "worldbank-water-2025",
    label: "World Bank Global Water Monitoring 2025",
    url: "https://www.worldbank.org/en/news/press-release/2025/11/04/world-annual-fresh-water-losses-could-supply-280-million-people",
    note: "Water loss and scarcity context used for water-allocation calibration.",
  },
  {
    id: "tomtom-traffic-2025",
    label: "TomTom Traffic Index 2025",
    url: "https://download.tomtom.com/open/banners/Traffic-Index-E-book.pdf",
    note: "Congestion and time-loss benchmark values for mobility scenarios.",
  },
  {
    id: "who-bulletin-2025",
    label: "WHO Epidemiological Bulletin 2025",
    url: "https://www.who.int/publications/i/item/9789290220275",
    note: "Public-health outbreak pressure and response complexity context.",
  },
];

export const CURATED_2026 = {
  version: "2026.04",
  regions: {
    US: {
      displayName: "United States",
      water: {
        pressure: 0.58,
        scarcity_index: 54,
        infrastructure_loss: 42,
        backtest_target: 58,
      },
      mobility: {
        pressure: 0.56,
        congestion_hours: 84,
        avg_speed_mph: 14.3,
        backtest_target: 56,
      },
      health: {
        pressure: 0.52,
        seasonal_outbreak_intensity: 48,
        hospital_strain: 55,
        backtest_target: 52,
      },
    },
    India: {
      displayName: "India",
      water: {
        pressure: 0.72,
        scarcity_index: 71,
        infrastructure_loss: 57,
        backtest_target: 72,
      },
      mobility: {
        pressure: 0.67,
        congestion_hours: 102,
        avg_speed_mph: 11.6,
        backtest_target: 67,
      },
      health: {
        pressure: 0.63,
        seasonal_outbreak_intensity: 59,
        hospital_strain: 62,
        backtest_target: 63,
      },
    },
  },
};

export const SCENARIO_LIBRARY = {
  water: {
    label: "Water Allocation",
    description:
      "Allocate scarce water across agriculture, urban utilities, and industry under climate pressure.",
    stakeholders: ["Farmers", "City Utility", "Industry", "Regulator"],
  },
  mobility: {
    label: "Urban Mobility",
    description:
      "Balance congestion pricing, transit incentives, and business productivity in dense urban corridors.",
    stakeholders: ["Drivers", "Transit Agency", "Businesses", "Regulator"],
  },
  health: {
    label: "Public Health Surge",
    description:
      "Coordinate hospitals, agencies, and community behavior during infectious disease pressure windows.",
    stakeholders: ["Hospitals", "Public Agency", "Residents", "Regulator"],
  },
};
