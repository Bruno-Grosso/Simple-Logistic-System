import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { TruckFleetDialog } from "@/components/truck-fleet-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DEPOSITS,
  getDashboardStats,
  getDepositById,
  getDepositLabel,
  ORDERS,
  TRUCKS,
} from "@/lib/mock-data";
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

function destinationLabel(raw: string | undefined): string {
  if (!raw) return "—";
  try {
    const parsed = JSON.parse(raw) as { label?: string };
    return parsed.label ?? raw;
  } catch {
    return raw;
  }
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case "Pending":
      return <Badge variant="secondary">{status}</Badge>;
    case "Shipped":
      return <Badge variant="default">{status}</Badge>;
    case "Delivered":
      return (
        <Badge variant="outline" className="border-chart-2 text-chart-2">
          {status}
        </Badge>
      );
    case "Cancelled":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recentOrders = ORDERS.slice(0, 5);
  const activeTrucks = TRUCKS.filter((t) => t.is_traveling);
  const maintenanceTrucks = TRUCKS.filter((t) => t.wear_percentage > 80);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        crumbs={[{ label: "Dashboard" }]}
        titleClassName="text-xl sm:text-2xl"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="In Transit"
          value={stats.ordersInProgress}
          icon={Truck}
          description="Active shipments"
          accent
        />
        <StatCard
          label="Pending"
          value={stats.pendingOrders}
          icon={Clock}
          description="Awaiting dispatch"
        />
        <StatCard
          label="Delivered"
          value={stats.deliveredThisMonth}
          icon={CheckCircle2}
          description="This month"
        />
        <StatCard
          label="Revenue"
          value={`R$ ${stats.totalRevenue.toLocaleString("pt-BR")}`}
          icon={TrendingUp}
          description="From delivered orders"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Recent orders */}
        <Card className="xl:col-span-7 h-max">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="font-display text-lg">Recent Orders</CardTitle>
            <ButtonLink href="/orders" label="View all orders" />
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 sm:px-4">
            <table className="w-full min-w-[520px] caption-bottom text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th scope="col" className="h-10 px-3 font-medium">
                    Order
                  </th>
                  <th scope="col" className="h-10 px-3 font-medium">
                    Destination
                  </th>
                  <th scope="col" className="h-10 px-3 font-medium">
                    Deadline
                  </th>
                  <th scope="col" className="h-10 px-3 text-right font-medium">
                    Price
                  </th>
                  <th scope="col" className="h-10 px-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="h-10 px-2 text-right font-medium">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="p-3 align-middle">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-2 font-mono text-sm text-primary hover:underline"
                      >
                        <Package className="size-3.5 text-muted-foreground" aria-hidden />
                        {order.id.toUpperCase()}
                      </Link>
                    </td>
                    <td className="max-w-[160px] truncate p-3 align-middle text-foreground">
                      {destinationLabel(order.final_destination)}
                    </td>
                    <td className="p-3 align-middle tabular-nums text-muted-foreground">
                      {order.time_limit
                        ? new Date(order.time_limit + "T12:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="p-3 text-right align-middle tabular-nums text-foreground">
                      R$ {order.price.toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 align-middle">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="p-2 text-right align-middle">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Open order ${order.id}`}
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Fleet column */}
        <div className="flex flex-col gap-4 xl:col-span-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="font-display text-lg">On the Road</CardTitle>
              <ButtonLink href="/fleet" label="Fleet" />
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTrucks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trucks on route right now.</p>
              ) : (
                activeTrucks.map((t) => {
                  const origin = t.origin_deposit_id ? getDepositById(t.origin_deposit_id) : undefined;
                  const dest   = t.destination_deposit_id ? getDepositById(t.destination_deposit_id) : undefined;
                  return (
                    <TruckFleetDialog
                      key={t.id}
                      truck={t}
                      originLabel={origin ? getDepositLabel(origin) : undefined}
                      destinationLabel={dest ? getDepositLabel(dest) : undefined}
                    />
                  );
                })
              )}
            </CardContent>
          </Card>

          {maintenanceTrucks.length > 0 ? (
            <Card className="border-destructive/25 bg-destructive/5">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Wrench className="size-4 text-destructive" aria-hidden />
                <CardTitle className="font-display text-base text-destructive">
                  Maintenance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {maintenanceTrucks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/fleet/${t.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-9 items-center justify-center rounded-md bg-destructive/15 text-destructive">
                      <Truck className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{t.model}</p>
                      <p className="text-xs text-destructive tabular-nums">
                        Wear at {t.wear_percentage}%
                      </p>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Deposits */}
      <section aria-labelledby="deposit-capacity-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="deposit-capacity-heading" className="font-display text-lg text-foreground">
            Deposit Capacity
          </h2>
          <Link
            href="/deposits"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            All deposits
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {DEPOSITS.map((d) => {
            const max = d.volume_max ?? 1;
            const pct = Math.min(100, Math.round((d.volume_actual / max) * 100));
            return (
              <Card key={d.id} className="border-border/80">
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start gap-2">
                    <Warehouse className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight text-foreground">
                        {getDepositLabel(d)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                        {pct}% · {d.volume_actual.toLocaleString("pt-BR")} /{" "}
                        {max.toLocaleString("pt-BR")} m³
                      </p>
                    </div>
                  </div>
                  <Progress value={pct} />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        d.has_refrigeration ? "bg-chart-2" : "bg-muted-foreground/35",
                      )}
                      aria-hidden
                    />
                    <span>{d.has_refrigeration ? "Refrigeration" : "Ambient"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      {label}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  );
}
