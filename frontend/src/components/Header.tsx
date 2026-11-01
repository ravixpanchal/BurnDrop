'use client';
import { usePathname } from 'next/navigation';
import { config } from '@/lib/config';
export function Header() {
 const path = usePathname();
 return <header className="border-b border-slate-200 bg-white">
  <a href="#main" className="skip-link">Skip to content</a>
  <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
   <a href="/" className="flex items-center gap-2.5" aria-label={`${config.appName} home`}>
    <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl bg-slate-950 p-1" />
    <span className="text-lg font-bold tracking-tight">Burn<span className="text-brand-600">Drop</span></span>
   </a>
   <nav aria-label="File sharing" className="flex gap-1 rounded-xl bg-slate-100 p-1">
    {[['/', 'Send'], ['/retrieve', 'Receive']].map(([href,label]) => <a key={href} href={href} aria-current={path===href?'page':undefined} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${path===href?'bg-white text-brand-700 shadow-sm':'text-slate-600 hover:text-slate-900'}`}>{label}</a>)}
   </nav>
  </div>
 </header>;
}
