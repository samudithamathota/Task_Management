interface StatCardProps {
  label: string;
  value: number;
}

/** A single labeled number. Renders 0 as "0", not as blank/hidden. */
export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-card-value">{value}</p>
      <p className="stat-card-label">{label}</p>
    </div>
  );
}
