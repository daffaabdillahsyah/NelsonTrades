export default function LearnLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="skeleton h-4 w-24 mb-3 rounded" />
      <div className="skeleton h-4 w-32 mb-2 rounded" />
      <div className="skeleton h-8 w-64 mb-6 rounded" />
      {[1, 2].map((i) => (
        <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden mb-8">
          <div className="p-6 pb-4">
            <div className="skeleton h-6 w-48 mb-4 rounded" />
            <div className="skeleton w-full rounded-lg" style={{ paddingBottom: '56.25%' }} />
          </div>
          <div className="px-6 pb-6 flex justify-between">
            <div className="skeleton h-4 w-48 rounded" />
            <div className="skeleton h-9 w-36 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
