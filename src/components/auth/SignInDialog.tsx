'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Wallet, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Google SVG icon
// ---------------------------------------------------------------------------
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// X / Twitter SVG icon
// ---------------------------------------------------------------------------
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Minimal EIP-1193 provider shape — what MetaMask / Rabby / Coinbase inject. */
interface InjectedProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function getInjectedProvider(): InjectedProvider | undefined {
  return (window as unknown as { ethereum?: InjectedProvider }).ethereum;
}

type View = 'menu' | 'wallet' | 'admin';

// ---------------------------------------------------------------------------
// SignInDialog Component
// ---------------------------------------------------------------------------
export default function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const { t, locale } = useI18n();
  const zh = locale === 'zh';

  const [view, setView] = useState<View>('menu');
  const [walletAddress, setWalletAddress] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setView('menu');
    setWalletAddress('');
    setAdminUser('');
    setAdminPass('');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      toast.error('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleXSignIn = async () => {
    setLoading(true);
    try {
      await signIn('twitter', { callbackUrl: '/' });
    } catch {
      toast.error('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Administrator sign-in: username + password.
   *
   * The credentials are compared server-side against ADMIN_USERNAME /
   * ADMIN_PASSWORD (src/lib/auth.ts). That check deliberately does not touch
   * the database, so the administrator can still get in while the report store
   * is unreachable.
   */
  const handleAdminSignIn = async () => {
    if (!adminUser.trim() || !adminPass) return;

    setLoading(true);
    try {
      const result = await signIn('admin', {
        username: adminUser.trim(),
        password: adminPass,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error(
          zh ? '用户名或密码不正确' : 'Invalid username or password',
        );
      }

      toast.success(zh ? '已以管理员身份登录' : 'Signed in as administrator');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Wallet sign-in = prove key ownership, not just knowledge of an address.
   *
   * 1. take the address from the browser wallet (or the manual input)
   * 2. ask the server for a single-use nonce challenge
   * 3. sign that challenge with `personal_sign`
   * 4. hand address + message + signature to NextAuth, which verifies the
   *    signature server-side (src/lib/wallet-auth.ts) before issuing a session
   */
  const handleWalletSignIn = async () => {
    let address = walletAddress.trim();

    setLoading(true);
    try {
      const wallet = getInjectedProvider();

      if (wallet) {
        // Prompt the wallet to connect and use the account it returns.
        const accounts = (await wallet.request({
          method: 'eth_requestAccounts',
        })) as string[];
        if (accounts?.[0]) {
          address = accounts[0];
          setWalletAddress(address);
        }
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error(
          'Invalid wallet address format. Must be 0x... (42 characters)',
        );
      }

      if (!wallet) {
        throw new Error(
          'No browser wallet detected. An address alone cannot prove ownership — please install MetaMask or another EIP-1193 wallet.',
        );
      }

      // ── 1. Single-use challenge from the server ────────────────────
      const challengeRes = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!challengeRes.ok) {
        const data = await challengeRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create sign-in challenge');
      }

      const { message } = (await challengeRes.json()) as { message: string };

      // ── 2. Sign it with the wallet (EIP-191 personal_sign) ─────────
      const signature = (await wallet.request({
        method: 'personal_sign',
        params: [message, address],
      })) as string;

      // ── 3. Exchange the signature for a session ────────────────────
      const result = await signIn('wallet', {
        address,
        signature,
        message,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error('Signature verification failed');
      }

      toast.success(t('auth.walletConnected'));
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Wallet sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md bg-[#12121a]/95 backdrop-blur-xl border-white/10 text-foreground"
        showCloseButton
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-2xl font-bold">
            <span className="gradient-text">{t('auth.signInTitle')}</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('auth.signInSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <AnimatePresence mode="wait">
            {/* ── Menu ─────────────────────────────────────────────── */}
            {view === 'menu' && (
              <motion.div
                key="auth-buttons"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
              >
                {/* Google Sign In */}
                <Button
                  variant="outline"
                  className="w-full h-11 bg-white hover:bg-gray-100 text-gray-900 border-gray-300 font-medium gap-3"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <GoogleIcon className="size-5 shrink-0" />
                  {t('auth.continueWithGoogle')}
                </Button>

                {/* X / Twitter Sign In */}
                <Button
                  variant="outline"
                  className="w-full h-11 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white border-white/20 font-medium gap-3"
                  onClick={handleXSignIn}
                  disabled={loading}
                >
                  <XIcon className="size-5 shrink-0" />
                  {t('auth.continueWithX')}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <Separator className="flex-1 bg-white/10" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t('auth.or')}
                  </span>
                  <Separator className="flex-1 bg-white/10" />
                </div>

                {/* Connect Wallet */}
                <Button
                  variant="outline"
                  className="w-full h-11 bg-transparent hover:bg-gold/10 text-gold border-gold/30 hover:border-gold/50 font-medium gap-3 transition-colors"
                  onClick={() => setView('wallet')}
                  disabled={loading}
                >
                  <Wallet className="size-5 shrink-0" />
                  {t('auth.connectWallet')}
                </Button>

                {/* Administrator */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground gap-2"
                  onClick={() => setView('admin')}
                  disabled={loading}
                >
                  <ShieldCheck className="size-3.5 shrink-0" />
                  {zh ? '管理员登录' : 'Administrator sign-in'}
                </Button>
              </motion.div>
            )}

            {/* ── Wallet ───────────────────────────────────────────── */}
            {view === 'wallet' && (
              <motion.div
                key="wallet-input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
                  <Wallet className="size-6 text-gold shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('auth.connectWallet')}</p>
                    <p className="text-xs text-muted-foreground">{t('auth.enterWalletAddress')}</p>
                  </div>
                </div>

                <Input
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="h-11 bg-white/5 border-white/10 text-sm font-mono placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/30"
                  disabled={loading}
                />

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setView('menu');
                      setWalletAddress('');
                    }}
                    disabled={loading}
                  >
                    {zh ? '返回' : 'Back'}
                  </Button>
                  <Button
                    className="flex-1 bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20"
                    onClick={handleWalletSignIn}
                    disabled={loading}
                  >
                    {loading ? t('auth.signingIn') : t('auth.verifyAndSignIn')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Administrator ────────────────────────────────────── */}
            {view === 'admin' && (
              <motion.div
                key="admin-input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
                  <ShieldCheck className="size-6 text-gold shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {zh ? '管理员登录' : 'Administrator sign-in'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {zh ? '使用站点配置的管理员账号' : 'Use the account configured for this site'}
                    </p>
                  </div>
                </div>

                <Input
                  placeholder={zh ? '用户名' : 'Username'}
                  autoComplete="username"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="h-11 bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/30"
                  disabled={loading}
                />

                <Input
                  type="password"
                  placeholder={zh ? '密码' : 'Password'}
                  autoComplete="current-password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleAdminSignIn();
                  }}
                  className="h-11 bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/30"
                  disabled={loading}
                />

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setView('menu');
                      setAdminUser('');
                      setAdminPass('');
                    }}
                    disabled={loading}
                  >
                    {zh ? '返回' : 'Back'}
                  </Button>
                  <Button
                    className="flex-1 bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20"
                    onClick={handleAdminSignIn}
                    disabled={loading || !adminUser.trim() || !adminPass}
                  >
                    {loading ? t('auth.signingIn') : zh ? '登录' : 'Sign in'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
