import { verifyMessage } from 'viem';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Wallet (EIP-191 / personal_sign) authentication helpers
// ---------------------------------------------------------------------------
// Flow:
//   1. Client POSTs its address to /api/auth/wallet  →  we mint a one-time
//      nonce, bind it to the address, and return the exact message to sign.
//   2. Client signs that message with `personal_sign`.
//   3. Client calls NextAuth `signIn('wallet', ...)`; the CredentialsProvider
//      calls verifyWalletSignature() below before a session is issued.
//
// A signature is only accepted when *all* of these hold:
//   - the address is a well-formed 0x address
//   - the message starts with our domain-separation prefix
//   - the nonce in the message exists and is bound to this address
//   - the nonce has not expired (5 minutes)
//   - viem.verifyMessage() proves the signer owns the address
//   - the nonce is then deleted, so the signature cannot be replayed
// ---------------------------------------------------------------------------

export const WALLET_MESSAGE_PREFIX =
  'Sign this message to verify your identity on driftcrypto.fun';

/** How long a minted nonce stays valid. */
const NONCE_TTL_MS = 5 * 60 * 1000;

/** VerificationToken.identifier namespace for wallet login nonces. */
const walletIdentifier = (address: string) => `wallet:${address}`;

/** Ethereum address: 0x + 40 hex chars. */
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
/** ECDSA signature: 0x + 65 bytes (r || s || v). */
const SIGNATURE_RE = /^0x[a-fA-F0-9]{130}$/;

/**
 * Validate and canonicalise a wallet address.
 * Throws on malformed input so callers never reach the DB with junk.
 */
export function normalizeAddress(raw: unknown): `0x${string}` {
  if (typeof raw !== 'string' || !ADDRESS_RE.test(raw.trim())) {
    throw new Error('Invalid wallet address format');
  }
  // Lower-case: Ethereum addresses are case-insensitive, and storing one
  // canonical form keeps the unique index from splitting on casing.
  return raw.trim().toLowerCase() as `0x${string}`;
}

/** Build the exact human-readable message the wallet is asked to sign. */
export function buildWalletMessage(
  address: string,
  nonce: string,
  issuedAt: Date = new Date(),
): string {
  return [
    WALLET_MESSAGE_PREFIX,
    '',
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
  ].join('\n');
}

/**
 * Mint a fresh single-use nonce for `rawAddress`.
 * Any previously issued nonce for the same address is discarded, so only the
 * most recent challenge can be answered.
 */
export async function issueWalletNonce(rawAddress: unknown): Promise<{
  address: `0x${string}`;
  nonce: string;
  message: string;
  expiresAt: string;
}> {
  const address = normalizeAddress(rawAddress);
  const nonce = crypto.randomUUID();
  const issuedAt = new Date();
  const expires = new Date(issuedAt.getTime() + NONCE_TTL_MS);

  await db.verificationToken.deleteMany({
    where: { identifier: walletIdentifier(address) },
  });

  await db.verificationToken.create({
    data: {
      identifier: walletIdentifier(address),
      token: nonce,
      expires,
    },
  });

  return {
    address,
    nonce,
    message: buildWalletMessage(address, nonce, issuedAt),
    expiresAt: expires.toISOString(),
  };
}

/**
 * Verify a wallet signature against a previously issued nonce.
 * Consumes the nonce on success, so the same signature can never be replayed.
 * Throws with a descriptive message on any failure.
 */
export async function verifyWalletSignature(input: {
  address: unknown;
  signature: unknown;
  message: unknown;
}): Promise<{ address: `0x${string}` }> {
  const address = normalizeAddress(input.address);

  const { signature, message } = input;
  if (typeof message !== 'string' || !message.startsWith(WALLET_MESSAGE_PREFIX)) {
    throw new Error('Invalid message format');
  }

  const nonceMatch = message.match(/Nonce: ([^\n]+)/);
  if (!nonceMatch) {
    throw new Error('Invalid nonce in message');
  }
  const nonce = nonceMatch[1].trim();

  if (typeof signature !== 'string' || !SIGNATURE_RE.test(signature)) {
    throw new Error('Invalid signature format');
  }

  // ── Nonce must exist, belong to this address, and still be fresh ────────
  const record = await db.verificationToken.findUnique({
    where: { token: nonce },
  });

  if (!record || record.identifier !== walletIdentifier(address)) {
    throw new Error('Sign-in challenge not found — please request a new one');
  }

  if (record.expires.getTime() < Date.now()) {
    await db.verificationToken
      .delete({ where: { token: nonce } })
      .catch(() => undefined);
    throw new Error('Sign-in challenge expired — please try again');
  }

  // ── Cryptographic proof that the signer controls the address ────────────
  let valid = false;
  try {
    valid = await verifyMessage({
      address,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    // Malformed r/s/v or wrong curve input — treat as a failed signature.
    valid = false;
  }

  if (!valid) {
    throw new Error('Signature verification failed');
  }

  // ── Burn the nonce (replay protection) ────────────────────────────────
  await db.verificationToken
    .delete({ where: { token: nonce } })
    .catch(() => undefined);

  return { address };
}
