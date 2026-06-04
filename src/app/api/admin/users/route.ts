import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/users — List all users (admin only)
// ---------------------------------------------------------------------------
// Authentication: Requires admin secret key via Authorization header
//   Authorization: Bearer driftcrypto_admin_2026
//   OR
//   x-admin-key: driftcrypto_admin_2026
// ---------------------------------------------------------------------------

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY ?? "driftcrypto_admin_2026";

function isAdmin(request: NextRequest): boolean {
  // Check Authorization header: "Bearer <key>"
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer" && parts[1] === ADMIN_SECRET_KEY) {
      return true;
    }
  }

  // Check custom header: x-admin-key
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey === ADMIN_SECRET_KEY) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    // ── Admin authentication check ──────────────────────────────────────
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // ── Parse query parameters ──────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const role = searchParams.get("role");
    const membership = searchParams.get("membership");
    const search = searchParams.get("search");

    // ── Build where clause ──────────────────────────────────────────────
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (membership) {
      where.membership = membership;
    }

    if (search) {
      // SQLite doesn't support OR with contains well, use simple approach
      where.name = { contains: search };
    }

    // ── Fetch users ─────────────────────────────────────────────────────
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          membership: true,
          walletAddress: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Admin Users API Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/users — Update a user (admin only)
// ---------------------------------------------------------------------------
// Body: { userId: string, role?: string, membership?: string }
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    // ── Admin authentication check ──────────────────────────────────────
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, role, membership } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Validate role values
    const validRoles = ["user", "admin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate membership values
    const validMemberships = ["free", "plus", "pro"];
    if (membership && !validMemberships.includes(membership)) {
      return NextResponse.json(
        { error: `Invalid membership. Must be one of: ${validMemberships.join(", ")}` },
        { status: 400 }
      );
    }

    // ── Update user ─────────────────────────────────────────────────────
    const updateData: any = {};
    if (role) updateData.role = role;
    if (membership) updateData.membership = membership;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        membership: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    // Handle Prisma "record not found" error
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.error("[Admin Users Update Error]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
