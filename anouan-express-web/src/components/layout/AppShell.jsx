import React from 'react';

export default function AppShell({
  sidebar,
  header,
  children,
  bottomNav = null,
  sidebarOpen = false,
  setSidebarOpen,
}) {
  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {sidebarOpen && setSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {sidebar}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {header}
        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-950">
          {children}
        </div>
      </main>

      {bottomNav}
    </div>
  );
}
