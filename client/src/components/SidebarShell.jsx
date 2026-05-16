import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Button } from './ui';

const SB_PX = { 'w-64': 256, 'w-72': 288, 'w-80': 320, 'w-96': 384 };

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
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('sidebar-collapsed', String(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    function onResize() { if (window.innerWidth >= 1024) setSidebarOpen(false); }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const sbPx = SB_PX[sidebarWidth] || 288;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F8FA', padding: '1.25rem' }}>
      {/* Card — fills remaining height */}
      <div style={{
        flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
        borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden',
      }}>
        {/* Page header */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid #e5e7eb', padding: '1.25rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <img src="/logo-color.png" alt="Inspira Innovation" style={{ height: 24, width: 'auto', objectFit: 'contain', marginBottom: 6 }} />
              <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#0A0E1A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {title}
              </h1>
              {description && <p style={{ marginTop: 4, fontSize: '0.85rem', color: '#64748b' }}>{description}</p>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{actions}</div>
          </div>
        </div>

        {/* Body: sidebar + toggle + content */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

          {/* Desktop sidebar — scrollable */}
          <aside
            style={{
              width: collapsed ? 0 : sbPx,
              flexShrink: 0,
              overflow: 'hidden',
              borderRight: collapsed ? 'none' : '1px solid #e5e7eb',
              background: '#f9fafb',
              transition: 'width 0.25s ease',
            }}
            className="hidden lg:flex lg:flex-col"
          >
            {/* Inner wrapper — fixed width so content doesn't squeeze during transition */}
            <div style={{ width: sbPx, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {sidebarTitle && (
                <div style={{
                  flexShrink: 0, padding: '0.85rem 1.25rem 0.65rem',
                  fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.14em', color: '#9ca3af',
                  borderBottom: '1px solid #e5e7eb', background: '#f9fafb',
                }}>
                  {sidebarTitle}
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {renderSidebar ? renderSidebar(() => {}) : sidebar}
                </div>
              </div>
            </div>
          </aside>

          {/* Collapse toggle strip — always visible at sidebar/content boundary */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            className="hidden lg:flex"
            style={{
              flexShrink: 0, width: 20, border: 'none',
              borderRight: '1px solid #e5e7eb',
              background: '#f3f4f6',
              cursor: 'pointer', padding: 0,
              alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; }}
          >
            <div style={{
              height: 44, width: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '0 8px 8px 0',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderLeft: 'none',
              boxShadow: '2px 0 4px rgba(0,0,0,0.06)',
            }}>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {collapsed
                  ? <path d="M1 1l6 6-6 6" />
                  : <path d="M7 1L1 7l6 6" />}
              </svg>
            </div>
          </button>

          {/* Main content — scrollable */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Mobile menu bar */}
            <div className="lg:hidden" style={{ flexShrink: 0, borderBottom: '1px solid #e5e7eb', padding: '0.65rem 1.25rem' }}>
              <Button variant="outline" className="w-full justify-center rounded-2xl" onClick={() => setSidebarOpen(true)}>
                ☰ Buka Menu
              </Button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className={clsx('p-5 sm:p-6 lg:p-8', contentClassName)}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: '88vw', maxWidth: 384,
            borderRight: '1px solid #e5e7eb', background: '#fff',
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.25rem' }}>
              {sidebarTitle && (
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9ca3af' }}>
                  {sidebarTitle}
                </div>
              )}
              <Button variant="ghost" className="rounded-xl px-3" onClick={() => setSidebarOpen(false)}>
                Tutup
              </Button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem 1.5rem' }}>
              {renderSidebar ? renderSidebar(() => setSidebarOpen(false)) : sidebar}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
