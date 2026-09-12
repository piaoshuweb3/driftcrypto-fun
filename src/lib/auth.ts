import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyWalletSignature } from "@/lib/wallet-auth";

// ---------------------------------------------------------------------------
// NextAuth Configuration for driftcrypto.fun
// ---------------------------------------------------------------------------
// No PrismaAdapter (@auth/prisma-adapter not installed).
// We manually create / find users in the signIn callback and store extra
// fields (role, membership, walletAddress) inside the JWT + session.
// ---------------------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      membership?: string;
      walletAddress?: string;
    };
  }
  interface User {
    role?: string;
    membership?: string;
    walletAddress?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    membership?: string;
    walletAddress?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Google OAuth ────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),

    // ── Twitter OAuth ───────────────────────────────────────────────────
    TwitterProvider({
      clientId: process.env.TWITTER_ID ?? "",
      clientSecret: process.env.TWITTER_SECRET ?? "",
    }),

    // ── Credentials (Wallet) ────────────────────────────────────────────
    CredentialsProvider({
      id: "wallet",
      name: "Crypto Wallet",
      credentials: {
        address: {
          label: "Wallet Address",
          type: "text",
          placeholder: "0x...",
        },
        signature: {
          label: "Signature",
          type: "text",
        },
        message: {
          label: "Message",
          type: "text",
        },
      },
      async authorize(credentials) {
        if (!credentials?.address || !credentials?.signature || !credentials?.message) {
          throw new Error("Wallet address, signature, and message are required");
        }

        const { signature, message } = credentials;

        // ── Cryptographic signature verification ──────────────────────
        // verifyWalletSignature() proves the caller controls the private key
        // of `address` before any user record or session is created. It checks
        // the address format, the domain-separation prefix, that the nonce was
        // issued for this address and has not expired, and then verifies the
        // EIP-191 signature with viem. The nonce is consumed on success, so a
        // captured signature cannot be replayed.
        const { address: verifiedAddress } = await verifyWalletSignature({
          address: credentials.address,
          signature,
          message,
        });

        // ── Find or create user ───────────────────────────────────────
        let user = await db.user.findUnique({
          where: { walletAddress: verifiedAddress },
        });

        if (!user) {
          // Create new user with the *verified* wallet address
          user = await db.user.create({
            data: {
              walletAddress: verifiedAddress,
              name: `${verifiedAddress.slice(0, 6)}...${verifiedAddress.slice(-4)}`,
              role: "user",
              membership: "free",
            },
          });

          // Create account record for wallet provider
          await db.account.create({
            data: {
              userId: user.id,
              type: "wallet",
              provider: "wallet",
              providerAccountId: verifiedAddress,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          membership: user.membership,
          walletAddress: user.walletAddress ?? undefined,
        };
      },
    }),
  ],

  // ── Session ──────────────────────────────────────────────────────────
  session: {
    strategy: "jwt",
    // Session max age: 30 days
    maxAge: 30 * 24 * 60 * 60,
  },

  // ── Pages ────────────────────────────────────────────────────────────
  pages: {
    signIn: "/api/auth/signin",
    error: "/api/auth/error",
  },

  // ── Secret ───────────────────────────────────────────────────────────
  secret: process.env.NEXTAUTH_SECRET,

  // ── Debug ────────────────────────────────────────────────────────────
  debug: process.env.NODE_ENV === "development",

  // ── Callbacks ────────────────────────────────────────────────────────
  callbacks: {
    async signIn({ user, account }) {
      // ── OAuth providers (Google, Twitter) ──────────────────────────
      if (account?.provider === "google" || account?.provider === "twitter") {
        const providerId = account.provider;
        const providerAccountId = account.providerAccountId;

        // Check if an account already exists for this provider
        const existingAccount = await db.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: providerId,
              providerAccountId,
            },
          },
          include: { user: true },
        });

        if (existingAccount) {
          // Account exists — update the user info on the NextAuth user object
          user.id = existingAccount.user.id;
          user.role = existingAccount.user.role;
          user.membership = existingAccount.user.membership;
          user.walletAddress = existingAccount.user.walletAddress ?? undefined;

          // Update user profile info if available
          if (user.name || user.email || user.image) {
            await db.user.update({
              where: { id: existingAccount.user.id },
              data: {
                ...(user.name && { name: user.name }),
                ...(user.email && { email: user.email }),
                ...(user.image && { image: user.image }),
              },
            });
          }

          return true;
        }

        // No existing account — check if user exists by email
        let dbUser = user.email
          ? await db.user.findUnique({ where: { email: user.email } })
          : null;

        if (!dbUser) {
          // Create new user
          dbUser = await db.user.create({
            data: {
              name: user.name ?? "",
              email: user.email ?? undefined,
              image: user.image ?? undefined,
              role: "user",
              membership: "free",
            },
          });
        }

        // Create account link
        await db.account.create({
          data: {
            userId: dbUser.id,
            type: "oauth",
            provider: providerId,
            providerAccountId,
            access_token: account.access_token ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
            session_state: account.session_state ?? null,
          },
        });

        // Set custom fields on user object for JWT callback
        user.id = dbUser.id;
        user.role = dbUser.role;
        user.membership = dbUser.membership;
        user.walletAddress = dbUser.walletAddress ?? undefined;

        return true;
      }

      // ── Credentials (wallet) provider ──────────────────────────────
      // The authorize function already handles user creation / lookup
      // and sets the custom fields. Just return true.
      return true;
    },

    async jwt({ token, user, trigger }) {
      // Initial sign in — user object is available
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
        token.membership = user.membership ?? "free";
        token.walletAddress = user.walletAddress ?? undefined;
      }

      // On session update trigger, refresh from DB
      if (trigger === "update" && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.membership = dbUser.membership;
          token.walletAddress = dbUser.walletAddress ?? undefined;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Pass data from JWT token to session
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.membership = token.membership as string;
        session.user.walletAddress = (token.walletAddress as string) ?? undefined;
      }
      return session;
    },
  },

  // ── Events ───────────────────────────────────────────────────────────
  events: {
    async signOut({ token }) {
      // Clean up any wallet sessions if needed
      // For JWT strategy, this is mostly a no-op
    },
  },
};
