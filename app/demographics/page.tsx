import type { Metadata } from "next";
import DemographicsExplorer from "./DemographicsExplorer";

export const metadata: Metadata = {
  title: "NC Demographics — Census & Community Data",
  description:
    "Population, income, housing, education, and race data for all 100 North Carolina counties. Sourced from the US Census Bureau American Community Survey 2023 5-Year Estimates.",
  alternates: {
    canonical: "/demographics",
  },
};

export default function DemographicsPage() {
  return <DemographicsExplorer />;
}
