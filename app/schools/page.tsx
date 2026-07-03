import type { Metadata } from "next";
import SchoolExplorer from "./SchoolExplorer";

export const metadata: Metadata = {
  title: "NC Schools Dashboard — Education Data & Performance",
  description:
    "School performance grades, chronic absenteeism, and educator data for all 2,700+ North Carolina public schools. Sourced from the NCDPI School Report Card.",
  alternates: {
    canonical: "/schools",
  },
};

export default function SchoolsPage() {
  return <SchoolExplorer />;
}
