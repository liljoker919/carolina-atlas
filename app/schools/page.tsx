import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "NC Schools Dashboard — Education Data & Performance",
  description: "School performance metrics, test scores, and education data across all 100 North Carolina counties.",
};

export default function SchoolsPage() {
  return (
    <div>
      <PageHeader
        badge="Coming Soon"
        title="NC Schools Dashboard"
        subtitle="School performance ratings, test scores, enrollment data, and education trends across all 100 North Carolina counties."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComingSoon
          title="School Data Coming Soon"
          description="We are integrating North Carolina Department of Public Instruction (NCDPI) data to provide school ratings, academic performance metrics, and educational trend analysis. Check back soon."
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
