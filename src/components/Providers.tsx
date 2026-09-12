'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { SessionProvider } from 'next-auth/react';
import type { Locale } from '@/lib/translations';

export default function Providers({
  children,
  initialLocale = 'en',
}: {
  children: React.ReactNode;
  /** Read from the request cookie by the server layout. */
  initialLocale?: Locale;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
