import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Button, Card, Container } from './ui';

export function SidebarShell({
  title,
  description,
  actions,
  sidebarTitle,
  sidebar,
  renderSidebar,
  children,
  sidebarWidth = 'w-72',
  contentClassName = '',
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', String(collapsed));
    } catch {
      // Silently ignore localStorage errors
    }
  }, [collapsed]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="min-h-screen py-6 sm:py-8" style={{ background: '#F7F8FA' }}>
      <Container className="space-y-6">
        <Card className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-white px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="mb-2">
                  <img src="/logo-color.png" alt="Inspira Innovation" className="h-[24px] w-auto object-contain" />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900">{title}</h1>
                  {description ? <p className="mt-2 max-w-2xl text-sm text-gray-500">{description}</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">{actions}</div>
            </div>
          </div>

          <div className="relative flex min-h-[calc(100vh-14rem)] bg-white">
            <aside
              className={clsx(
                'hidden border-r border-gray-200 bg-gray-50/80 lg:block relative transition-all duration-300',
                collapsed ? 'w-0 overflow-hidden' : sidebarWidth
              )}
            >
              <div className="sticky top-0 space-y-4 p-5">
                {sidebarTitle ? <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{sidebarTitle}</div> : null}
                <div className="space-y-3">{renderSidebar ? renderSidebar(() => {}) : sidebar}</div>
              </div>
            </aside>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex absolute top-4 left-0 z-10 h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-all"
              style={{ left: collapsed ? '8px' : `calc(${sidebarWidth === 'w-72' ? '288px' : sidebarWidth === 'w-80' ? '320px' : sidebarWidth} - 16px)` }}
              title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>

            <div className="flex-1">
              <div className="border-b border-gray-200 px-5 py-3 lg:hidden">
                <Button variant="outline" className="w-full justify-center rounded-2xl" onClick={() => setSidebarOpen(true)}>
                  Buka menu
                </Button>
              </div>
              <div className={clsx('p-5 sm:p-6 lg:p-8', contentClassName)}>{children}</div>
            </div>
          </div>
        </Card>
      </Container>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-950/35" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[88vw] max-w-sm border-r border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                {sidebarTitle ? <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{sidebarTitle}</div> : null}
                <div className="font-display text-lg font-bold text-gray-900">Menu</div>
              </div>
              <Button variant="ghost" className="rounded-xl px-3" onClick={() => setSidebarOpen(false)}>
                Tutup
              </Button>
            </div>
            <div className="h-[calc(100%-72px)] overflow-y-auto p-5">{renderSidebar ? renderSidebar(() => setSidebarOpen(false)) : sidebar}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
