/**
 * MapPlaceholder — placeholder for future interactive map integration.
 * Will eventually integrate Leaflet, Mapbox, or ArcGIS JS SDK.
 */

export default function MapPlaceholder() {
  return (
    <div className="h-72 w-full rounded-xl border-2 border-dashed border-gray-200 bg-[#F5F7FA] flex flex-col items-center justify-center gap-2 text-gray-400">
      <svg
        className="w-12 h-12 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
      <p className="text-sm font-medium">Interactive Map</p>
      <p className="text-xs">Geographic visualization — coming soon</p>
    </div>
  );
}
