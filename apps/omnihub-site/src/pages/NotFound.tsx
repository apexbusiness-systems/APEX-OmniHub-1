import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SEOMeta } from '@/components/SEOMeta';
import { Section } from '@/components/Section';

export function NotFoundPage() {
  return (
    <Layout title="404 — Page Not Found | APEX OmniHub">
      <SEOMeta
        title="404 — Page Not Found | APEX OmniHub"
        description="The requested page could not be found."
        canonical="https://apexomnihub.icu/404"
      />
      <Section className="py-24 text-center">
        <div className="max-w-xl mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-mono font-bold text-orange-400">404</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            The page you are looking for does not exist, has been moved, or is temporarily unavailable.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors"
            >
              Return Home
            </Link>
            <Link
              to="/omnidash"
              className="px-5 py-2.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-200 font-medium text-sm transition-colors"
            >
              Go to OmniDash
            </Link>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
