'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { encodeFunctionData, parseUnits } from 'viem';

// ---------------------------------------------------------------------------
// USDC payment dialog
// ---------------------------------------------------------------------------
// Flow: quote from the server → wallet sends an ERC-20 transfer → the server
// verifies the transaction on-chain and grants the tier. The client never
// decides whether a payment succeeded; it only reports the hash.
// ---------------------------------------------------------------------------

interface UsdcPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: string; // "plus" | "pro"
  months: number; // 1 | 3 | 12
  onPaid?: () => void;
}

interface Quote {
  id: string;
  tier: string;
  months: number;
  amountUsdc: number;
  chain: { id: number; label: string; usdcContracts: string[] };
  payTo: string;
  expiresAt: string;
}

/** The chains the server accepts, with the hex id MetaMask expects. */
const CHAINS: Record<number, { label: string; hex: string }> = {
  137: { label: 'Polygon', hex: '0x89' },
  8453: { label: 'Base', hex: '0x2105' },
  42161: { label: 'Arbitrum', hex: '0xa4b1' },
  1: { label: 'Ethereum', hex: '0x1' },
};

const ERC20_TRANSFER_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface InjectedProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function getInjectedProvider(): InjectedProvider | undefined {
  return (window as unknown as { ethereum?: InjectedProvider }).ethereum;
}

type Phase = 'quoting' | 'ready' | 'sending' | 'confirming' | 'done' | 'failed';

/** How long we keep polling for confirmations before giving up on the UX. */
const CONFIRM_POLL_MS = 5_000;
const CONFIRM_MAX_ATTEMPTS = 24; // ~2 minutes

export default function UsdcPaymentDialog({
  open,
  onOpenChange,
  tier,
  months,
  onPaid,
}: UsdcPaymentDialogProps) {
  const { locale } = useI18n();
  const zh = locale === 'zh';

  const [chainId, setChainId] = useState<number>(137);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [phase, setPhase] = useState<Phase>('quoting');
  const [message, setMessage] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  // ── Quote on open (and whenever the chain or plan changes) ──────────────
  const requestQuote = useCallback(async () => {
    setPhase('quoting');
    setMessage('');
    setTxHash('');
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, months, chainId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Quote failed');
      setQuote(data as Quote);
      setPhase('ready');
    } catch (err) {
      setPhase('failed');
      setMessage(err instanceof Error ? err.message : 'Quote failed');
    }
  }, [tier, months, chainId]);

  useEffect(() => {
    if (open) void requestQuote();
  }, [open, requestQuote]);

  // ── Pay ────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    const wallet = getInjectedProvider();
    if (!wallet) {
      toast.error(
        zh ? '未检测到浏览器钱包，请安装 MetaMask' : 'No browser wallet detected — install MetaMask',
      );
      return;
    }
    if (!quote) return;

    setPhase('sending');
    setMessage('');

    try {
      const accounts = (await wallet.request({ method: 'eth_requestAccounts' })) as string[];
      const from = accounts?.[0];
      if (!from) throw new Error(zh ? '无法获取钱包地址' : 'Could not read a wallet address');

      // Make sure the wallet is on the chain the quote was priced for,
      // otherwise the transfer would go to an unrelated network.
      const meta = CHAINS[quote.chain.id];
      if (meta) {
        try {
          await wallet.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: meta.hex }],
          });
        } catch {
          throw new Error(
            zh
              ? `请在钱包中切换到 ${meta.label} 网络后重试`
              : `Please switch your wallet to ${meta.label} and try again`,
          );
        }
      }

      const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [quote.payTo as `0x${string}`, parseUnits(String(quote.amountUsdc), 6)],
      });

      const hash = (await wallet.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from,
            to: quote.chain.usdcContracts[0] as `0x${string}`,
            data,
          },
        ],
      })) as string;

      setTxHash(hash);
      setPhase('confirming');
      await waitForConfirmation(hash);
    } catch (err) {
      setPhase('failed');
      setMessage(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  /**
   * Poll the server until the transaction has enough confirmations. A single
   * failed poll is normal — the transfer simply is not mined yet — so only the
   * final state is reported as an error.
   */
  const waitForConfirmation = async (hash: string) => {
    for (let attempt = 0; attempt < CONFIRM_MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: quote?.id, txHash: hash }),
        });
        const data = await res.json();

        if (res.ok && data.ok) {
          setPhase('done');
          toast.success(zh ? '支付成功，会员已开通' : 'Payment confirmed — membership activated');
          onPaid?.();
          return;
        }

        // A 4xx that is not "not verified yet" is fatal.
        if (!res.ok && res.status !== 422 && res.status !== 409) {
          setPhase('failed');
          setMessage(data.message || data.error || 'Verification failed');
          return;
        }

        setMessage(
          data.reason ??
            (zh ? '等待链上确认…' : 'Waiting for confirmations…'),
        );
      } catch {
        // network hiccup — keep polling
      }

      await new Promise((resolve) => setTimeout(resolve, CONFIRM_POLL_MS));
    }

    setPhase('failed');
    setMessage(
      zh
        ? '交易已发出，但确认时间较长。稍后可用交易哈希重新验证。'
        : 'The transaction was sent but is taking a while to confirm. You can re-verify later with the hash.',
    );
  };

  const meta = quote ? CHAINS[quote.chain.id] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#12121a]/95 backdrop-blur-xl border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            <span className="gradient-text">
              {zh ? '用 USDC 支付' : 'Pay with USDC'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {tier.toUpperCase()} · {months} {zh ? '个月' : 'month(s)'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Chain picker */}
          {phase !== 'done' && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(CHAINS).map(([id, info]) => (
                <button
                  key={id}
                  onClick={() => setChainId(Number(id))}
                  disabled={phase === 'sending' || phase === 'confirming'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    chainId === Number(id)
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'bg-white/5 text-muted-foreground border border-transparent hover:bg-white/10'
                  }`}
                >
                  {info.label}
                </button>
              ))}
            </div>
          )}

          {/* Quote summary */}
          {quote && (
            <div className="rounded-lg bg-white/[0.03] border border-white/10 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{zh ? '金额' : 'Amount'}</span>
                <span className="font-semibold text-foreground">{quote.amountUsdc} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{zh ? '网络' : 'Network'}</span>
                <span className="text-foreground">{quote.chain.label}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">{zh ? '收款地址' : 'To'}</span>
                <span className="font-mono text-xs text-foreground truncate">{quote.payTo}</span>
              </div>
            </div>
          )}

          {/* Status */}
          {phase === 'quoting' && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {zh ? '正在获取报价…' : 'Fetching a quote…'}
            </p>
          )}
          {(phase === 'confirming' || (phase === 'sending' && message)) && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {message || (zh ? '等待钱包确认…' : 'Waiting for your wallet…')}
            </p>
          )}
          {phase === 'failed' && (
            <p className="text-sm text-bearish flex items-start gap-2">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </p>
          )}
          {phase === 'done' && (
            <p className="text-sm text-bullish flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              {zh ? '支付已确认，会员已开通。' : 'Payment confirmed. Membership activated.'}
            </p>
          )}

          {txHash && (
            <a
              href={`${meta ? (quote?.chain.id === 137 ? 'https://polygonscan.com' : quote?.chain.id === 8453 ? 'https://basescan.org' : quote?.chain.id === 42161 ? 'https://arbiscan.io' : 'https://etherscan.io') : ''}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold hover:underline flex items-center gap-1"
            >
              <ExternalLink className="size-3" />
              {zh ? '在区块浏览器查看' : 'View on explorer'}
            </a>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
              disabled={phase === 'sending' || phase === 'confirming'}
            >
              {phase === 'done' ? (zh ? '关闭' : 'Close') : zh ? '取消' : 'Cancel'}
            </Button>
            {phase !== 'done' && (
              <Button
                className="flex-1 bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold"
                onClick={handlePay}
                disabled={!quote || phase === 'quoting' || phase === 'sending' || phase === 'confirming'}
              >
                <Wallet className="size-4 mr-1.5" />
                {phase === 'confirming'
                  ? zh
                    ? '确认中…'
                    : 'Confirming…'
                  : zh
                    ? '用钱包支付'
                    : 'Pay with wallet'}
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground/70">
            {zh
              ? '支付由链上交易验证，我们不托管你的资产。请确保钱包中有足够的 USDC 及少量原生代币作为 gas。'
              : 'Payments are verified on-chain; we never custody your assets. Make sure your wallet holds enough USDC plus a little native token for gas.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
