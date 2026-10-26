import type { Metadata } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-schibsted',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SafeReport — Anonymous Crime Reporting',
  description:
    'File an incident report anonymously with photo evidence, watch its status in your own browser, and analyse it with the built-in engine or your own AI key. No account needed.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={schibsted.variable} suppressHydrationWarning>
      <body>
        {/* apply the stored (or system) theme before first paint — no flash */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('sr-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();",
          }}
        />
        <Providers>
          <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="curtain-main flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
