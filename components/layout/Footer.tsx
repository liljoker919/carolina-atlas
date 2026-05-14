/**
 * Footer — site-wide footer with transparency messaging and navigation links.
 */

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#123047] text-blue-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand / Mission */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-8 h-8 rounded-full bg-[#4B9CD3] flex items-center justify-center text-white font-bold text-sm">
                CA
              </span>
              <span className="font-bold text-white text-lg">Carolina Atlas</span>
            </div>
            <p className="text-sm leading-relaxed text-blue-200">
              Transparent civic data for North Carolina communities — bringing
              public information about crime, education, demographics, and
              community trends to every resident.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3 uppercase text-xs tracking-wider">
              Explore
            </h3>
            <ul className="space-y-1.5 text-sm">
              {[
                { label: "Crime Explorer", href: "/crime" },
                { label: "Schools", href: "/schools" },
                { label: "Demographics", href: "/demographics" },
                { label: "Community Reports", href: "/community-reports" },
                { label: "About", href: "/about" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-[#E0A93B] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Transparency Note */}
          <div>
            <h3 className="text-white font-semibold mb-3 uppercase text-xs tracking-wider">
              Data Transparency
            </h3>
            <p className="text-sm text-blue-200 leading-relaxed">
              All data on Carolina Atlas is sourced from publicly available
              government databases. We use block-level addresses only and do not
              display personally identifiable information.
            </p>
            <p className="text-xs text-blue-300 mt-3">
              Crime data: Raleigh Police Department via ArcGIS
            </p>
          </div>
        </div>

        <div className="border-t border-[#1e4d6b] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-300">
          <p>© {currentYear} Carolina Atlas. Public data, public good.</p>
          <p>Built for North Carolina communities.</p>
        </div>
      </div>
    </footer>
  );
}
