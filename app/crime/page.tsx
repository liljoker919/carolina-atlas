import type { Metadata } from "next";
import CrimeExplorer from "./CrimeExplorer";

export const metadata: Metadata = {
  title: "Crime Explorer",
  description:
    "Browse and filter live police incident data from the Raleigh Police Department.",
};

export default function CrimePage() {
  return <CrimeExplorer />;
}
