'use client';

import { AlertTriangle, Github, Twitter, FileText, Server, ShieldAlert } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-border/40 bg-[#08080d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Investment Disclaimer — prominent section */}
        <div className="mb-5 p-4 rounded-xl bg-bearish/[0.04] border border-bearish/10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="size-4 text-bearish/80 shrink-0" />
            <h3 className="text-xs font-bold text-bearish/90 uppercase tracking-wider">
              {t('footer.disclaimerTitle')}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('footer.disclaimer')}
          </p>
        </div>

        {/* Links + Copyright */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <nav aria-label="Footer links" className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold transition-colors"
              aria-label="GitHub"
            >
              <Github className="size-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="size-4" />
            </a>
            <a
              href="/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
              aria-label={t('footer.apiDocs')}
            >
              <FileText className="size-4" />
              <span className="text-xs hidden sm:inline">{t('footer.apiDocs')}</span>
            </a>
            <a
              href="/api/mcp/manifest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
              aria-label="MCP Manifest"
            >
              <Server className="size-4" />
              <span className="text-xs hidden sm:inline">MCP</span>
            </a>
          </nav>

          <p className="text-[11px] text-muted-foreground/60">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
