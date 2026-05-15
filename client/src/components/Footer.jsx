import { Link } from 'react-router-dom';

const NAV_COLS = [
  {
    title: 'Produk',
    links: [
      { to: '/courses', label: 'Kursus Online' },
      { to: '/', label: 'Sertifikasi' },
      { to: '/', label: 'Program Korporat' },
    ],
  },
  {
    title: 'Perusahaan',
    links: [
      { to: '/tentang-kami', label: 'Tentang Kami' },
      { to: '/', label: 'Blog' },
      { to: '/', label: 'Karir' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { to: '/faq', label: 'FAQ' },
      { href: 'mailto:support@inspiratekno.com', label: 'Hubungi Kami' },
      { to: '/kebijakan-privasi', label: 'Kebijakan Privasi' },
      { to: '/', label: 'Syarat & Ketentuan' },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: '#0A0E1A', padding: '4rem 0 0' }}>
      <div className="w-full max-w-[1200px] mx-auto px-6">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2.5fr_1fr_1fr_1fr] gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img
                src="/logo-putih.png"
                alt="Inspira Innovation"
                className="h-[32px] w-auto object-contain"
              />
            </div>
            <p className="text-[0.85rem] leading-[1.65] max-w-[260px] mb-6" style={{ color: 'rgba(255,255,255,.35)' }}>
              Platform belajar online untuk profesional Indonesia yang ingin naik level karir dengan skill nyata dari industri.
            </p>
            <div className="flex gap-2">
              {['IG', 'YT', 'in', 'X'].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[0.8rem] font-bold transition-all"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.4)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = 'rgba(255,255,255,.8)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = 'rgba(255,255,255,.4)'; }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map((col) => (
            <div key={col.title}>
              <div className="text-[0.75rem] font-bold uppercase tracking-[.07em] mb-[1.1rem]" style={{ color: 'rgba(255,255,255,.35)' }}>
                {col.title}
              </div>
              <ul className="flex flex-col gap-[0.55rem]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        className="text-[0.87rem] transition-colors"
                        style={{ color: 'rgba(255,255,255,.45)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.8)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.45)'; }}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-[0.87rem] transition-colors"
                        style={{ color: 'rgba(255,255,255,.45)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.8)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.45)'; }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6"
          style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}
        >
          <p className="text-[0.78rem]" style={{ color: 'rgba(255,255,255,.25)' }}>
            © {year} InspiraLearn by Inspiratekno. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privasi', 'Syarat', 'Cookie'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[0.78rem] transition-colors"
                style={{ color: 'rgba(255,255,255,.3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.3)'; }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
