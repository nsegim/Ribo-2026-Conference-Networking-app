export type DirectoryStats = {
  totalAttendees: number
  totalCompanies: number
  totalCountries: number
}

export default function DirectoryHero({ stats }: { stats: DirectoryStats }) {
  const tiles = [
    { value: stats.totalAttendees, label: 'Attendees' },
    { value: stats.totalCompanies, label: 'Companies' },
    { value: stats.totalCountries, label: 'Countries' },
  ]

  return (
    <div className="directory-hero mb-4">
      <div className="directory-hero-inner">
        <h1 className="directory-hero-title">Find your next connection</h1>
        <p className="directory-hero-subtitle">
          Browse everyone checked in to RIBO2026 and reach out directly — no introductions
          needed. Every conversation you start here can outlast the conference.
        </p>
        <div className="directory-hero-stats">
          {tiles.map((tile) => (
            <div key={tile.label} className="directory-hero-stat">
              <div className="directory-hero-stat-value">{tile.value}</div>
              <div className="directory-hero-stat-label">{tile.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
