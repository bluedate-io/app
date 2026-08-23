import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";
import AdminShell from "../AdminShell";
import { ADMIN_ELEVATED_PANEL, ADMIN_TABLE_FRAME } from "@/lib/adminChrome";
import { adminTheme } from "@/lib/adminTheme";

export const dynamic = "force-dynamic";

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

export default async function AdminPaymentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  const [orders, totals] = await Promise.all([
    db.paymentOrder.findMany({
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
      where: { status: "paid" },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const totalCollectedPaise = totals._sum.amount ?? 0;

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
              {totals._count._all} completed · ₹{(totalCollectedPaise / 100).toLocaleString("en-IN")}{" "}
              collected
            </p>
          </div>

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
                    <td colSpan={6} className="px-4 py-16 text-center" style={{ color: adminTheme.mutedLabel }}>
                      No payment orders yet.
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
                      <td className="max-w-[16rem] truncate px-4 py-3 font-mono text-xs" title={o.razorpayOrderId} style={{ color: adminTheme.mutedLabel }}>
                        {o.razorpayOrderId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: adminTheme.textSecondary }}>
                        {fmtDateTime(o.paidAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: adminTheme.textSecondary }}>
                        {fmt(o.accessEndsAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

const HEADER_TEXT = adminTheme.ink;
