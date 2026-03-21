import BookForm from './components/BookForm'

export const metadata = {
  title: 'Little Explorer — Personalized Activity Books for Kids',
  description:
    "Create a personalized, printable junior ranger activity booklet for your kids. Enter your destination and we'll generate a custom adventure book with coloring pages, scavenger hunts, and more.",
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🌲</span>
          <div>
            <h1 className="font-bold text-green-800 text-lg leading-tight">Little Explorer</h1>
            <p className="text-xs text-gray-400">builtthisweekend.com</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 leading-tight">
            Make your kids{' '}
            <span className="text-green-600">Junior Rangers</span>
            {' '}anywhere!
          </h2>
          <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
            Enter your destination and we&apos;ll create a personalized, printable activity booklet —
            just like the Junior Ranger books at US National Parks, but for anywhere in the world.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-5">
            {[
              { emoji: '🎨', label: 'Coloring pages' },
              { emoji: '🔍', label: 'Scavenger hunt' },
              { emoji: '🎯', label: 'Adventure bingo' },
              { emoji: '🏅', label: 'Explorer badges' },
              { emoji: '🏆', label: 'Certificates' },
            ].map(({ emoji, label }) => (
              <span
                key={label}
                className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold"
              >
                {emoji} {label}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <BookForm />
        </div>

        {/* How it works */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: '📝', title: 'Fill the form', desc: 'Enter destination & explorer details' },
            { emoji: '🤖', title: 'We generate it', desc: 'AI creates your custom book in ~1 min' },
            { emoji: '🖨️', title: 'Print & explore!', desc: 'Download, print, and start the adventure' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="p-3">
              <div className="text-2xl mb-1">{emoji}</div>
              <p className="font-bold text-gray-700 text-xs mb-0.5">{title}</p>
              <p className="text-gray-400 text-xs leading-tight">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
