import {
  createPublicClient,
  http,
  decodeEventLog,
  getAddress,
  type Chain,
} from 'viem';
import { mainnet, polygon, base, arbitrum } from 'viem/chains';

// ---------------------------------------------------------------------------
// USDC membership payments
// ---------------------------------------------------------------------------
// Payment is verified by reading the chain directly through a public RPC, so no
// paid indexer or API key is needed. A checkout is only honoured when a
// confirmed transaction contains a USDC Transfer to the configured address for
// at least the quoted amount.
// ---------------------------------------------------------------------------

export const TRANSFER_EVENT = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
} as const;

/** USDC has 6 decimals on every chain we support. */
const USDC_DECIMALS = 6;
const USDC_SCALE = 10 ** USDC_DECIMALS;

export interface ChainConfig {
  id: number;
  label: string;
  chain: Chain;
  rpcUrl: string;
  /**
   * USDC contract(s) on this chain. Polygon has two: the native USDC and the
   * older bridged USDC.e — both are what users actually hold, so accept both.
   */
  usdc: string[];
  explorer: string;
  /** Blocks to wait for before treating a transfer as settled. */
  minConfirmations: number;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  137: {
    id: 137,
    label: 'Polygon',
    chain: polygon,
    rpcUrl: process.env.POLYGON_RPC_URL ?? 'https://polygon-rpc.com',
    usdc: [
      '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', // native USDC
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC.e (bridged)
    ],
    explorer: 'https://polygonscan.com',
    minConfirmations: 12,
  },
  8453: {
    id: 8453,
    label: 'Base',
    chain: base,
    rpcUrl: process.env.BASE_RPC_URL ?? 'https://mainnet.base.org',
    usdc: ['0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'],
    explorer: 'https://basescan.org',
    minConfirmations: 12,
  },
  42161: {
    id: 42161,
    label: 'Arbitrum',
    chain: arbitrum,
    rpcUrl: process.env.ARBITRUM_RPC_URL ?? 'https://arb1.arbitrum.io/rpc',
    usdc: ['0xaf88d065e77c8cc2239327c5edb3a432268e5831'],
    explorer: 'https://arbiscan.io',
    minConfirmations: 12,
  },
  1: {
    id: 1,
    label: 'Ethereum',
    chain: mainnet,
    rpcUrl: process.env.ETHEREUM_RPC_URL ?? 'https://eth.llamarpc.com',
    usdc: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
    explorer: 'https://etherscan.io',
    // Mainnet reorgs are rare but expensive to get wrong.
    minConfirmations: 24,
  },
};

/** Default to a cheap chain — mainnet fees are punishing for a $19 purchase. */
export const DEFAULT_CHAIN_ID = 137;

export function getChainConfig(chainId: number): ChainConfig | null {
  return SUPPORTED_CHAINS[chainId] ?? null;
}

// ---------------------------------------------------------------------------
// Pricing (kept in step with the tiers shown in MembershipSection)
// ---------------------------------------------------------------------------

export const PRICING: Record<string, Record<number, number>> = {
  plus: { 1: 19, 3: 49, 12: 149 },
  pro: { 1: 49, 3: 129, 12: 399 },
};

export function priceFor(tier: string, months: number): number | null {
  return PRICING[tier]?.[months] ?? null;
}

export function receivingAddress(): string | null {
  const raw = process.env.PAYMENT_RECEIVE_ADDRESS;
  if (!raw) return null;
  try {
    return getAddress(raw); // checksums and validates
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface PaymentVerification {
  ok: boolean;
  reason?: string;
  /** USDC actually transferred, in whole units. */
  amount?: number;
  /** Sender address, when it could be recovered from the logs. */
  from?: string;
  confirmations?: number;
}

/**
 * Confirm that `txHash` really moved USDC to `to` for at least `minAmount`.
 *
 * Deliberately strict: a success status is not enough, because a transaction
 * can succeed while transferring something else entirely. We look for the USDC
 * contract's own Transfer event, addressed to us.
 */
export async function verifyUsdcTransfer(params: {
  chainId: number;
  txHash: string;
  to: string;
  minAmount: number;
}): Promise<PaymentVerification> {
  const config = getChainConfig(params.chainId);
  if (!config) {
    return { ok: false, reason: `Unsupported chain ${params.chainId}` };
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(params.txHash)) {
    return { ok: false, reason: 'Malformed transaction hash' };
  }

  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl, { timeout: 15_000 }),
  });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({
      hash: params.txHash as `0x${string}`,
    });
  } catch {
    return { ok: false, reason: 'Transaction not found on this chain yet' };
  }

  if (!receipt) {
    return { ok: false, reason: 'Transaction not found on this chain yet' };
  }
  if (receipt.status !== 'success') {
    return { ok: false, reason: 'Transaction reverted' };
  }

  const expectedTo = params.to.toLowerCase();
  const usdcContracts = new Set(config.usdc.map((a) => a.toLowerCase()));

  let transferred: { amount: number; from: string } | null = null;

  for (const log of receipt.logs) {
    if (!usdcContracts.has(log.address.toLowerCase())) continue;

    try {
      const decoded = decodeEventLog({
        abi: [TRANSFER_EVENT],
        data: log.data,
        topics: log.topics,
      });

      const to = String(decoded.args.to).toLowerCase();
      if (to !== expectedTo) continue;

      const amount = Number(decoded.args.value) / USDC_SCALE;
      // Tolerate float noise: 19.0000001 must not fail a 19 USDC quote.
      if (amount + 1e-9 < params.minAmount) continue;

      transferred = { amount, from: String(decoded.args.from) };
      // Keep scanning: a transaction could contain several transfers, and we
      // want the largest qualifying one rather than the first.
      if (transferred.amount >= params.minAmount) break;
    } catch {
      // Not a Transfer event we can decode — ignore it.
    }
  }

  if (!transferred) {
    return {
      ok: false,
      reason: `No USDC transfer of at least ${params.minAmount} to ${params.to} in this transaction`,
    };
  }

  // Settlement depth
  let confirmations = 0;
  try {
    const head = await client.getBlockNumber();
    confirmations = Number(head - receipt.blockNumber) + 1;
  } catch {
    // If we cannot read the head height, treat the transfer as unconfirmed
    // rather than guessing.
    return { ok: false, reason: 'Unable to determine confirmation depth' };
  }

  if (confirmations < config.minConfirmations) {
    return {
      ok: false,
      reason: `Only ${confirmations} confirmation(s); ${config.minConfirmations} required`,
      amount: transferred.amount,
      from: transferred.from,
      confirmations,
    };
  }

  return {
    ok: true,
    amount: transferred.amount,
    from: transferred.from,
    confirmations,
  };
}

export function explorerTxUrl(chainId: number, txHash: string): string | null {
  const config = getChainConfig(chainId);
  return config ? `${config.explorer}/tx/${txHash}` : null;
}
