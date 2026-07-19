import LocationsClient from "./LocationsClient";

export default function LocationsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}>
          Locations
        </h1>
        <p className="text-sm mt-1 text-gray-500">
          Manage city and sub-area options for non-student users.
        </p>
      </div>
      <LocationsClient />
    </div>
  );
}
