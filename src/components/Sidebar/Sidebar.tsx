function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-white/[0.06] bg-[#0b0b0d] px-4 py-5 text-zinc-400">
      {/* Brand */}
      <div className="mb-10 px-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />

          <span className="text-sm font-medium tracking-tight text-zinc-100">
            FileTrail
          </span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="space-y-7">
        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
            Overview
          </p>

          <nav className="space-y-0.5">
            <NavItem active label="Home" icon="⌂" />
            <NavItem label="Activity" icon="◷" />
            <NavItem label="Search" icon="⌕" />
          </nav>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
            Library
          </p>

          <NavItem label="Starred" icon="☆" />
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-auto">
        <NavItem label="Settings" icon="⚙" />
      </div>
    </aside>
  );
}

type NavItemProps = {
  label: string;
  icon: string;
  active?: boolean;
};

function NavItem({ label, icon, active = false }: NavItemProps) {
  return (
    <button
      className={`
        flex w-full items-center gap-3 rounded-md px-3 py-2
        text-sm transition-colors duration-150
        ${
          active
            ? "bg-white/[0.06] text-zinc-100"
            : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300"
        }
      `}
    >
      <span className="w-4 text-center text-sm">{icon}</span>

      <span>{label}</span>
    </button>
  );
}

export default Sidebar;
