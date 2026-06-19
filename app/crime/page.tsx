import type { Metadata } from "next";
import CrimeExplorer from "./CrimeExplorer";

export const metadata: Metadata = {
  title: "Raleigh Crime Explorer — Live Police Incident Data",
  description:
    "Search and filter live daily police incidents from the Raleigh Police Department. Browse by crime type, district, date range, or location — updated daily from the City of Raleigh's open data portal.",
  openGraph: {
    title: "Raleigh Crime Explorer — Live Police Incident Data",
    description:
      "Search and filter live daily police incidents from the Raleigh Police Department. Browse by crime type, district, date range, or location.",
    url: "https://carolina-atlas.com/crime",
  },
};

export default function CrimePage() {
  return <CrimeExplorer />;
}
