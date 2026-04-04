import BookForm from './components/BookForm'
import MascotSvg from './components/MascotSvg'

export const metadata = {
  title: 'Little Explorer — Personalized Activity Books for Kids',
  description:
    "Create a personalized, printable junior ranger activity booklet for your kids. Enter your destination and we'll generate a custom adventure book with coloring pages, scavenger hunts, and more.",
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(232,249,239,0.95),_rgba(247,243,234,0.96)_45%,_rgba(255,255,255,1)_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-[rgba(102,178,123,0.22)] blur-3xl" />
        <div className="absolute right-[-6rem] top-20 h-64 w-64 rounded-full bg-[rgba(255,196,92,0.22)] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(93,145,206,0.12)] blur-3xl" />
      </div>

      <div className="relative border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#e9f7ef,#f7f1df)] shadow-[0_12px_30px_rgba(38,84,63,0.12)] ring-1 ring-white/80">
              <MascotSvg size={54} />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] text-[var(--ink-strong)]">Little Explorer</h1>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">Personalized adventure books</p>
            </div>
          </div>
          <div className="hidden rounded-full border border-[rgba(53,88,67,0.12)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] shadow-sm sm:block">
            Destination-led, print-ready, kid-personalized
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:py-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-[0_28px_80px_rgba(36,67,52,0.14)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[rgba(83,162,107,0.14)] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              Junior Ranger style
            </span>
            <span className="rounded-full bg-[rgba(243,182,85,0.18)] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--sunset-deep)]">
              Built around your actual stops
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-end">
            <div>
              <h2 className="font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] text-[var(--ink-strong)] sm:text-5xl">
                Adventure books that feel like they were made for your child.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ink-soft)] sm:text-lg">
                Turn any trip into a print-ready keepsake with personalized explorer covers, destination maps,
                age-matched puzzles, and activity pages built for the places your family is actually visiting.
              </p>
            </div>

            <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-[2rem] bg-[linear-gradient(160deg,#eef9ef,#fff7de)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_40px_rgba(54,92,72,0.12)]">
              <MascotSvg size={132} />
              <span className="absolute -right-5 top-4 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-[var(--brand-deep)] shadow-lg">
                Hi, I&apos;m Moss!
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { emoji: '🎨', label: 'Coloring pages' },
              { emoji: '🗺️', label: 'Mapped to your route' },
              { emoji: '🎯', label: 'Adventure bingo' },
              { emoji: '🧒', label: 'Child-specific covers' },
              { emoji: '🏅', label: 'Explorer badges' },
              { emoji: '📄', label: 'Ready-to-print PDF' },
            ].map(({ emoji, label }) => (
              <span
                key={label}
                className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] shadow-sm"
              >
                {emoji} {label}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Personalized cover', desc: 'Destination backdrop plus a cover that feels made for your explorer.' },
              { title: 'Trip-aware content', desc: 'Use your real stops to shape maps, sections, and activity prompts.' },
              { title: 'Print with confidence', desc: 'Polished PDF pages that are meant to be downloaded, kept, and scribbled in.' },
            ].map(({ title, desc }, i) => (
              <div
                key={title}
                className={`rounded-[1.5rem] border p-4 shadow-sm ${
                  i === 0
                    ? 'border-[rgba(83,162,107,0.24)] bg-[rgba(233,247,239,0.72)]'
                    : i === 1
                    ? 'border-[rgba(93,145,206,0.18)] bg-[rgba(238,244,255,0.78)]'
                    : 'border-[rgba(243,182,85,0.22)] bg-[rgba(255,247,222,0.86)]'
                }`}
              >
                <p className="font-display text-lg font-bold text-[var(--ink-strong)]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_28px_70px_rgba(33,60,48,0.12)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--brand-deep)]">Create your book</p>
              <h3 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-[var(--ink-strong)]">
                Start your explorer pack
              </h3>
            </div>
            <div className="rounded-2xl bg-[linear-gradient(150deg,#eef8ef,#fff7de)] p-3 shadow-sm">
              <MascotSvg size={62} />
            </div>
          </div>

          <div className="mb-6 rounded-[1.5rem] border border-[rgba(53,88,67,0.12)] bg-[linear-gradient(135deg,rgba(232,249,239,0.85),rgba(255,248,230,0.8))] p-4">
            <div className="grid gap-3 text-sm text-[var(--ink-soft)] sm:grid-cols-3">
              <div>
                <p className="font-bold text-[var(--ink-strong)]">1. Tell us where</p>
                <p>Destination, dates, and the exact stops you care about.</p>
              </div>
              <div>
                <p className="font-bold text-[var(--ink-strong)]">2. Tell us who</p>
                <p>Names, ages, interests, and whether each child gets their own book.</p>
              </div>
              <div>
                <p className="font-bold text-[var(--ink-strong)]">3. Print and explore</p>
                <p>We turn it into a keepsake PDF ready for crayons, pencils, and car rides.</p>
              </div>
            </div>
          </div>

          <BookForm />
        </section>
      </div>
    </main>
  )
}
