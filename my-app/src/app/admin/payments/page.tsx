import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import jwt from "jsonwebtoken";
import type { Prisma } from "@/generated/prisma/client";
import { config } from "@/config";
import db from "@/lib/db";
import AdminShell from "../AdminShell";
import {
  ADMIN_ELEVATED_PANEL,
  ADMIN_TABLE_FRAME,
  ADMIN_TOOLBAR,
  ADMIN_SEARCH_SHELL,
  ADMIN_SELECT,
  ADMIN_BTN_PRIMARY_SM,
  ADMIN_BTN_SECONDARY,
} from "@/lib/adminChrome";
import { Search, RotateCcw } from "lucide-react";
import { adminTheme } from "@/lib/adminTheme";

export const dynamic = "force-dynamic";

const HEADER_TEXT = adminTheme.ink;

type StatusFilter = "all" | "paid" | "created" | "failed";

function fmt(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  const sp = await searchParams;
  const status: StatusFilter =
    sp.status === "paid" || sp.status === "created" || sp.status === "failed"
      ? sp.status
      : "all";
  const q = sp.q?.trim() ?? "";

  const where: Prisma.PaymentOrderWhereInput = {};
  if (status !== "all") where.status = status;
  if (q) {
    where.OR = [
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q } } },
      { user: { profile: { is: { fullName: { contains: q, mode: "insensitive" } } } } },
    ];
  }
  const paidWhere: Prisma.PaymentOrderWhereInput = { ...where, status: "paid" };

  const [orders, paidTotals] = await Promise.all([
    db.paymentOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
        amount: true,
        status: true,
        paidAt: true,
        accessEndsAt: true,
        createdAt: true,
        user: { select: { email: true, phone: true, profile: { select: { fullName: true } } } },
      },
    }),
    db.paymentOrder.aggregate({
      where: paidWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const collectedPaise = paidTotals._sum.amount ?? 0;
  const hasFilters = status !== "all" || q.length > 0;

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className={`${ADMIN_ELEVATED_PANEL} mb-8`}>
          <div
            className="mb-5 border-b-2 border-dashed pb-5"
            style={{ borderColor: adminTheme.borderSoft }}
          >
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-bd-display), Georgia, serif", color: adminTheme.ink }}
            >
              Payments
            </h1>
            <p className="mt-1 text-sm" style={{ color: adminTheme.mutedLabel }}>
              {hasFilters ? `${orders.length} matching` : `${orders.length} orders`} ·{" "}
              {paidTotals._count._all} paid · ₹
              {(collectedPaise / 100).toLocaleString("en-IN")} collected
            </p>
          </div>

          {/* Filters */}
          <form method="GET" action="/admin/payments" className={`${ADMIN_TOOLBAR} mb-5 flex flex-wrap items-center gap-2`}>
            <label className={ADMIN_SEARCH_SHELL}>
              <Search size={15} strokeWidth={2} className="ml-3 shrink-0 opacity-60" aria-hidden />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search name, email or phone…"
                aria-label="Search by name, email or phone"
                className="w-full bg-transparent px-3 py-2 text-sm font-medium outline-none placeholder:text-bd-muted-label"
              />
            </label>
            <select name="status" defaultValue={status} aria-label="Filter by status" className={ADMIN_SELECT}>
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="created">Created</option>
              <option value="failed">Failed</option>
            </select>
            <button type="submit" className={ADMIN_BTN_PRIMARY_SM}>
              Apply
            </button>
            {hasFilters && (
              <Link href="/admin/payments" className={ADMIN_BTN_SECONDARY} title="Clear all filters">
                <RotateCcw size={12} strokeWidth={2.25} aria-hidden />
                Reset
              </Link>
            )}
          </form>

          <div className={ADMIN_TABLE_FRAME}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ backgroundColor: adminTheme.tableHeader }}>
                  {["User", "Amount", "Status", "Order ID", "Paid at", "Valid till"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: HEADER_TEXT }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr style={{ backgroundColor: adminTheme.tableSurface }}>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm" style={{ color: adminTheme.mutedLabel }}>
                      {hasFilters ? "No orders match these filters." : "No payment orders yet."}
                    </td>
                  </tr>
                ) : (
                  orders.map((o, i) => (
                    <tr
                      key={o.id}
                      className="transition-colors duration-150"
                      style={{
                        backgroundColor: i % 2 === 0 ? adminTheme.tableRow : adminTheme.tableRowAlt,
                        borderBottom:
                          i < orders.length - 1 ? `1px solid ${adminTheme.borderSoft}` : "none",
                      }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: adminTheme.ink }}>
                          {o.user.profile?.fullName ?? "—"}
                        </p>
                        <p className="font-mono text-xs" style={{ color: adminTheme.mutedLabel }}>
                          {o.user.email ?? o.user.phone ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: adminTheme.ink }}>
                        ₹{o.amount / 100}
                      </td>
                      <td className="px-4 py-3">
                        {o.status === "paid" ? (
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ color: "#166534", backgroundColor: "#16653418" }}
                          >
                            Paid
                          </span>
                        ) : o.status === "failed" ? (
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ color: "#B91C1C", backgroundColor: "#B91C1C18" }}
                          >
                            Failed
                          </span>
                        ) : (
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ color: "#6b7280", backgroundColor: "#6b728018" }}
                          >
                            Created
                          </span>
                        )}
                      </td>
                      <td
                        className="max-w-[16rem] truncate px-4 py-3 font-mono text-xs"
                        title={o.razorpayOrderId}
                        style={{ color: adminTheme.mutedLabel }}
                      >
                        {o.razorpayOrderId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3" style={{ color: adminTheme.textSecondary }}>
                        {fmtDateTime(o.paidAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3" style={{ color: adminTheme.textSecondary }}>
                        {fmt(o.accessEndsAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {orders.length >= 200 && (
            <p className="mt-3 text-xs" style={{ color: adminTheme.mutedLabel }}>
              Showing first 200 orders — narrow with filters to see more.
            </p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
