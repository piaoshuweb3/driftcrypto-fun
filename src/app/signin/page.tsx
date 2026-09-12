'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignInDialog from '@/components/auth/SignInDialog';

// ---------------------------------------------------------------------------
// /signin
// ---------------------------------------------------------------------------
// NextAuth's `pages.signIn` points here (`/api/auth/signin` before, which
// dropped visitors onto the unstyled default page whenever a session expired
// or a sign-in failed). The dialog is the same component the header opens, so
// there is exactly one sign-in UI to maintain.
// ---------------------------------------------------------------------------

export default function SignInPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <SignInDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Dismissing the dialog means "not signing in" — go back to the app
          // rather than stranding the visitor on an empty route.
          if (!next) router.push('/');
        }}
      />
    </main>
  );
}
