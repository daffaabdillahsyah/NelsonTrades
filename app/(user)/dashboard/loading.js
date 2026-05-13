export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="skeleton h-8 w-72 mb-2 rounded" />
      <div className="skeleton h-4 w-56 mb-8 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-36 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-5 w-32 mb-4 rounded" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton h-24 rounded-xl mb-3" />
      ))}
    </div>
  )
}
