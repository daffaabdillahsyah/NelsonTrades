export default function JournalLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-8 w-40 rounded" />
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>
      <div className="skeleton h-32 rounded-xl mb-6" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton h-24 rounded-xl mb-3" />
      ))}
    </div>
  )
}
