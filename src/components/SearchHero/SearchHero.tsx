type SearchHeroProps = {
  query: string;
  onQueryChange: (query: string) => void;
};

function SearchHero({ query, onQueryChange }: SearchHeroProps) {
  return (
    <section className="pt-16">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        File memory
      </p>

      <h1 className="max-w-2xl text-4xl font-medium tracking-[-0.03em] text-zinc-100">
        Find anything you've touched.
      </h1>

      <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">
        Search your files by what you remember — where they came from, what
        happened to them, or when you last used them.
      </p>

      <div className="mt-8 max-w-2xl">
        <div className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition-colors duration-200 hover:border-white/[0.14] focus-within:border-white/[0.18]">
          <span className="text-lg text-zinc-500">⌕</span>

          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Try “PDFs I downloaded yesterday”"
            className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />

          <kbd className="hidden rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-600 sm:block">
            Ctrl K
          </kbd>
        </div>
      </div>

      <div className="mt-4 flex max-w-2xl flex-wrap gap-2">
        <Suggestion text="PDFs from yesterday" />
        <Suggestion text="Recently renamed" />
        <Suggestion text="Files from LinkedIn" />
      </div>
    </section>
  );
}

function Suggestion({ text }: { text: string }) {
  return (
    <button className="rounded-full border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-white/[0.12] hover:text-zinc-300">
      {text}
    </button>
  );
}

export default SearchHero;
