import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — NC Civic Data Platform",
  description:
    "Learn about Carolina Atlas — our mission to make North Carolina public data accessible, our data sources, and our commitment to privacy and transparency.",
  openGraph: {
    title: "About Carolina Atlas — NC Civic Data Platform",
    description:
      "Learn about Carolina Atlas — our mission to make North Carolina public data accessible, our data sources, and our commitment to privacy and transparency.",
    url: "https://carolina-atlas.com/about",
  },
};

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="About Carolina Atlas"
        subtitle="Our mission, data sources, and commitment to public transparency."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Mission */}
        <section>
          <h2 className="text-2xl font-bold text-[#123047] mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed text-base">
            Carolina Atlas is a civic technology platform dedicated to making
            North Carolina&apos;s public data accessible, understandable, and useful
            for every resident. We believe that transparent access to government
            data strengthens communities, holds institutions accountable, and
            enables informed civic participation.
          </p>
          <p className="text-gray-600 leading-relaxed text-base mt-4">
            By aggregating public datasets on crime, education, demographics, and
            community trends, Carolina Atlas gives residents, journalists,
            researchers, and public officials a single place to explore the data
            that shapes their communities.
          </p>
        </section>

        {/* Data sources */}
        <section>
          <h2 className="text-2xl font-bold text-[#123047] mb-4">Data Sources</h2>
          <div className="space-y-4">
            {[
              {
                name: "Raleigh Police Department — Daily Incidents",
                description: "Real-time police incident data published by the City of Raleigh via their ArcGIS open data portal. Updated daily.",
                status: "Live",
                statusColor: "bg-green-100 text-green-700",
                url: "https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Daily_Police_Incidents/FeatureServer/0",
              },
              {
                name: "NC Department of Public Instruction",
                description: "School performance ratings, test scores, and enrollment data for all NC public schools.",
                status: "Coming Soon",
                statusColor: "bg-amber-100 text-amber-700",
              },
              {
                name: "US Census Bureau / American Community Survey",
                description: "Demographic, income, housing, and population data for every NC county and municipality.",
                status: "Coming Soon",
                statusColor: "bg-amber-100 text-amber-700",
              },
              {
                name: "NC SBI — Statewide Crime Statistics",
                description: "Statewide crime statistics from the NC State Bureau of Investigation annual reports.",
                status: "Coming Soon",
                statusColor: "bg-amber-100 text-amber-700",
              },
            ].map((source) => (
              <div
                key={source.name}
                className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-[#123047] text-sm">{source.name}</h3>
                  <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${source.statusColor}`}>
                    {source.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{source.description}</p>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4B9CD3] hover:underline truncate"
                  >
                    {source.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-2xl font-bold text-[#123047] mb-4">Privacy &amp; Data Ethics</h2>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 space-y-3 text-sm text-blue-800 leading-relaxed">
            <p>
              <strong>Block-level addresses only:</strong> We never display full
              street addresses or precise coordinates that could identify
              individuals.
            </p>
            <p>
              <strong>No personal information:</strong> Carolina Atlas does not
              display names, ages, or other personally identifiable information
              from any dataset.
            </p>
            <p>
              <strong>Public data only:</strong> Every dataset on Carolina Atlas
              comes from publicly available government sources that are already
              accessible to any citizen.
            </p>
            <p>
              <strong>Transparency in methodology:</strong> We document how data
              is collected, filtered, and displayed so users can understand any
              limitations or caveats.
            </p>
          </div>
        </section>

        {/* Tech */}
        <section>
          <h2 className="text-2xl font-bold text-[#123047] mb-4">Technology</h2>
          <p className="text-gray-600 leading-relaxed text-base mb-4">
            Carolina Atlas is built with modern open-source technologies
            including Next.js, TypeScript, Tailwind CSS, and is deployed on
            AWS Amplify. The source code reflects our commitment to open and
            transparent software.
          </p>
          <p className="text-gray-600 leading-relaxed text-base">
            The platform architecture is designed to scale across all 100 North
            Carolina counties and support multiple dataset types including crime,
            education, demographics, and community indicators.
          </p>
        </section>

        {/* CTA */}
        <div className="flex gap-4 flex-wrap">
          <Link
            href="/crime"
            className="px-5 py-2.5 bg-[#4B9CD3] hover:bg-[#3a8bc2] text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Explore Crime Data
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg text-sm transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
