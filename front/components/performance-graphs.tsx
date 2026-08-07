"use client"

import * as React from "react"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Sparkles,
  Award,
  Layers,
  Fuel,
  Users,
  Wrench,
  Package,
  Info,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import type { MonthlyPerformanceData } from "@/types"

interface PerformanceGraphsProps {
  warehouseId?: string
  monthlyPerformance?: MonthlyPerformanceData[]
}

export function PerformanceGraphs({ warehouseId, monthlyPerformance: initialMonthlyPerformance }: PerformanceGraphsProps) {
  const [fetchedData, setFetchedData] = React.useState<MonthlyPerformanceData[]>(initialMonthlyPerformance || [])
  const [activeRange, setActiveRange] = React.useState<"12M" | "6M_H1" | "6M_H2">("12M")
  const [selectedMonthIndex, setSelectedMonthIndex] = React.useState<number | null>(11)
  const [showPoiOnly, setShowPoiOnly] = React.useState(false)

  React.useEffect(() => {
    if (initialMonthlyPerformance && initialMonthlyPerformance.length > 0) {
      setFetchedData(initialMonthlyPerformance)
    } else {
      api.reports.getMonthlyPerformance().then((res) => {
        if (res && res.length > 0) setFetchedData(res)
      })
    }
  }, [initialMonthlyPerformance])

  // Filter data based on selected range & warehouse multiplier if applicable
  const data = React.useMemo(() => {
    let source = fetchedData.length > 0 ? [...fetchedData] : []
    if (source.length === 0) return []

    if (activeRange === "6M_H1") {
      source = source.slice(0, 6)
    } else if (activeRange === "6M_H2") {
      source = source.slice(6, 12)
    }

    // If warehouse is selected, scale metrics to represent warehouse share
    if (warehouseId) {
      const scaleMap: Record<string, number> = {
        "WH-001": 0.5,
        "WH-002": 0.25,
        "WH-003": 0.25,
      }
      const factor = scaleMap[warehouseId] ?? 0.33
      return source.map((item) => ({
        ...item,
        revenue: Math.round(item.revenue * factor),
        costs: Math.round(item.costs * factor),
        profit: Math.round(item.profit * factor),
        fuelCost: Math.round(item.fuelCost * factor),
        laborCost: Math.round(item.laborCost * factor),
        maintenanceCost: Math.round(item.maintenanceCost * factor),
        ordersCount: Math.round(item.ordersCount * factor),
      }))
    }

    return source
  }, [activeRange, warehouseId])

  // Summary Metrics
  const totalPeriodRevenue = data.reduce((acc, d) => acc + d.revenue, 0)
  const totalPeriodCosts = data.reduce((acc, d) => acc + d.costs, 0)
  const totalPeriodProfit = data.reduce((acc, d) => acc + d.profit, 0)
  const avgMarginPercent = totalPeriodRevenue > 0 ? (totalPeriodProfit / totalPeriodRevenue) * 100 : 0

  const selectedData = selectedMonthIndex !== null && data[selectedMonthIndex] ? data[selectedMonthIndex] : data[data.length - 1]

  // Dimensions & Coordinates for SVG Profit vs Costs Chart
  const svgWidth = 800
  const svgHeight = 320
  const padding = { top: 40, right: 30, bottom: 50, left: 60 }
  const graphWidth = svgWidth - padding.left - padding.right
  const graphHeight = svgHeight - padding.top - padding.bottom

  // Calculate Y Min / Max for scaling
  const maxVal = Math.max(...data.map((d) => Math.max(d.profit, d.costs, d.revenue))) * 1.1
  const minVal = 0

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * graphWidth
  const getY = (val: number) => padding.top + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight

  // Generate SVG Path for Profit line (Green) & Costs line (Red)
  const profitPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.profit) }))
  const costsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.costs) }))

  const profitLinePath = profitPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), "")
  const costsLinePath = costsPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), "")

  // Generate SVG Polygon / Path for the Area DIFFERENCE between Profit Line and Costs Line
  // We trace profit points from left to right, then costs points backwards from right to left
  const areaDifferencePath =
    profitPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), "") +
    costsPoints.slice().reverse().reduce((acc, p) => `${acc} L ${p.x},${p.y}`, "") +
    " Z"

  // Grid lines
  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = minVal + ratio * (maxVal - minVal)
    const y = getY(val)
    return { val, y }
  })

  return (
    <div className="space-y-6">
      {/* Header Banner & Range Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-500" />
            Logistics Financial & Operational Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comparative analysis of Profit (Green) vs. Costs (Red) with monthly highlighted margin area
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-background p-1 border border-border text-xs">
            <button
              onClick={() => {
                setActiveRange("12M")
                setSelectedMonthIndex(null)
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeRange === "12M" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              12 Months (Full Year)
            </button>
            <button
              onClick={() => {
                setActiveRange("6M_H1")
                setSelectedMonthIndex(null)
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeRange === "6M_H1" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              H1 (Jan-Jun)
            </button>
            <button
              onClick={() => {
                setActiveRange("6M_H2")
                setSelectedMonthIndex(null)
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeRange === "6M_H2" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              H2 (Jul-Dec)
            </button>
          </div>

          <button
            onClick={() => setShowPoiOnly(!showPoiOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showPoiOnly
                ? "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="size-3.5" />
            {showPoiOnly ? "Show All Months" : "Highlight Milestones"}
          </button>
        </div>
      </div>

      {/* Mini KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-3 rounded-lg border border-border">
          <span className="text-xs text-muted-foreground uppercase font-medium">Period Net Profit</span>
          <p className="text-lg font-bold font-display text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            R$ {totalPeriodProfit.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="bg-card p-3 rounded-lg border border-border">
          <span className="text-xs text-muted-foreground uppercase font-medium">Period Total Costs</span>
          <p className="text-lg font-bold font-display text-red-500 dark:text-red-400 mt-0.5 tabular-nums">
            R$ {totalPeriodCosts.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="bg-card p-3 rounded-lg border border-border">
          <span className="text-xs text-muted-foreground uppercase font-medium">Profit Margin Efficiency</span>
          <p className="text-lg font-bold font-display text-primary mt-0.5 tabular-nums">{avgMarginPercent.toFixed(1)}%</p>
        </div>
        <div className="bg-card p-3 rounded-lg border border-border">
          <span className="text-xs text-muted-foreground uppercase font-medium">Total Orders Handled</span>
          <p className="text-lg font-bold font-display text-foreground mt-0.5 tabular-nums">
            {data.reduce((acc, d) => acc + d.ordersCount, 0)} orders
          </p>
        </div>
      </div>

      {/* GRAPH 1: Profit (Green Line) vs Costs (Red Line) with Highlighted Area Difference & Monthly POI */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-500" />
                Graph 1: Monthly Profit vs. Costs (Highlighted Net Area Spread)
              </CardTitle>
              <CardDescription className="text-xs">
                Green line indicates net profit; Red line indicates costs. The filled translucent emerald region highlights net profit margin spread across months.
              </CardDescription>
            </div>

            {/* Custom Interactive Legend */}
            <div className="flex items-center gap-4 text-xs font-medium bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-emerald-500 shadow-xs inline-block" />
                <span className="text-foreground font-semibold">Net Profit (Green)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-red-500 shadow-xs inline-block" />
                <span className="text-foreground font-semibold">Logistics Costs (Red)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-2.5 rounded-xs bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                <span className="text-muted-foreground">Area Spread</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px]">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                <defs>
                  {/* Highlight Area Gradient between Green and Red lines */}
                  <linearGradient id="profitDifferenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
                  </linearGradient>

                  {/* Line Glow Filters */}
                  <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.4" />
                  </filter>
                  <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {gridTicks.map(({ val, y }, idx) => (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.1}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      className="text-[10px] fill-muted-foreground font-mono"
                      textAnchor="end"
                    >
                      R$ {Math.round(val / 1000)}k
                    </text>
                  </g>
                ))}

                {/* HIGHLIGHTED AREA DIFFERENCE BETWEEN PROFIT (GREEN) AND COSTS (RED) */}
                <path
                  d={areaDifferencePath}
                  fill="url(#profitDifferenceGradient)"
                  stroke="#22c55e"
                  strokeWidth="1"
                  strokeOpacity="0.25"
                  className="transition-all duration-300"
                />

                {/* RED LINE: Costs */}
                <path
                  d={costsLinePath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#redGlow)"
                />

                {/* GREEN LINE: Profit */}
                <path
                  d={profitLinePath}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#greenGlow)"
                />

                {/* MONTHLY DATA POINTS & POINTS OF INTEREST (POI) MARKERS */}
                {data.map((item, index) => {
                  const x = getX(index)
                  const yProfit = getY(item.profit)
                  const yCosts = getY(item.costs)
                  const isSelected = selectedMonthIndex === index
                  const isPoi = item.isPoi

                  if (showPoiOnly && !isPoi) return null

                  return (
                    <g key={item.month} className="cursor-pointer group" onClick={() => setSelectedMonthIndex(index)}>
                      {/* Vertical Hover/Active Guideline */}
                      {isSelected && (
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={svgHeight - padding.bottom}
                          stroke="#22c55e"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity="0.6"
                        />
                      )}

                      {/* Costs Point (Red Dot) */}
                      <circle
                        cx={x}
                        cy={yCosts}
                        r={isSelected ? 6 : 4}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-200 group-hover:r-6"
                      />

                      {/* Profit Point (Green Dot) */}
                      <circle
                        cx={x}
                        cy={yProfit}
                        r={isSelected ? 7 : 5}
                        fill="#22c55e"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-200 group-hover:r-7"
                      />

                      {/* POINT OF INTEREST (POI) STAR BADGE ABOVE MONTH POINT */}
                      {isPoi && (
                        <g transform={`translate(${x}, ${yProfit - 22})`}>
                          <circle r="10" fill="#f59e0b" className="animate-pulse opacity-80" />
                          <circle r="8" fill="#d97706" />
                          <text
                            y="3"
                            textAnchor="middle"
                            className="text-[9px] font-bold fill-white"
                          >
                            ★
                          </text>
                        </g>
                      )}

                      {/* X-Axis Month Tick Labels */}
                      <text
                        x={x}
                        y={svgHeight - padding.bottom + 20}
                        textAnchor="middle"
                        className={`text-[11px] font-medium transition-colors ${
                          isSelected
                            ? "fill-primary font-bold text-xs"
                            : isPoi
                            ? "fill-amber-600 dark:fill-amber-400 font-semibold"
                            : "fill-muted-foreground"
                        }`}
                      >
                        {item.month}
                      </text>

                      {/* POI Tag under month if applicable */}
                      {isPoi && (
                        <text
                          x={x}
                          y={svgHeight - padding.bottom + 34}
                          textAnchor="middle"
                          className="text-[8px] fill-amber-600 dark:fill-amber-400 font-bold uppercase tracking-wider"
                        >
                          POI
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Interactive Month Details & POI Summary Card */}
          {selectedData && (
            <div className="mt-4 p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-semibold text-xs border-primary/40 text-primary">
                    <Calendar className="size-3 mr-1" />
                    {selectedData.fullMonth}
                  </Badge>
                  {selectedData.isPoi && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1">
                      <Award className="size-3" /> Point of Interest Milestone
                    </Badge>
                  )}
                </div>
                {selectedData.poi && (
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-1">
                    <Sparkles className="size-4 text-amber-500 shrink-0" />
                    <span>{selectedData.poi}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-xs bg-muted/40 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Net Profit (Green)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm tabular-nums">
                    R$ {selectedData.profit.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Logistics Costs (Red)</span>
                  <span className="text-red-500 dark:text-red-400 font-bold text-sm tabular-nums">
                    R$ {selectedData.costs.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Margin Area Difference</span>
                  <span className="text-primary font-bold text-sm tabular-nums">
                    +R$ {(selectedData.profit - selectedData.costs > 0 ? selectedData.profit - selectedData.costs : selectedData.profit).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Orders Completed</span>
                  <span className="text-foreground font-bold text-sm tabular-nums">{selectedData.ordersCount} units</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRAPH 2: Operational Cost Breakdown & Delivery Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Structure Breakdown (Fuel vs Labor vs Maintenance) */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Graph 2: Monthly Operational Cost Structure Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Monthly breakdown of logistics expenses across Fuel, Labor, and Vehicle Maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {data.map((item) => {
                const totalCost = item.costs || 1
                const fuelPct = (item.fuelCost / totalCost) * 100
                const laborPct = (item.laborCost / totalCost) * 100
                const maintPct = (item.maintenanceCost / totalCost) * 100

                return (
                  <div key={item.month} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-foreground w-12">{item.month}</span>
                      <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
                        <span className="flex items-center gap-1">
                          <Fuel className="size-3 text-amber-500" /> R$ {item.fuelCost.toLocaleString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3 text-blue-500" /> R$ {item.laborCost.toLocaleString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wrench className="size-3 text-rose-500" /> R$ {item.maintenanceCost.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    {/* Stacked Bar Representation */}
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                      <div style={{ width: `${fuelPct}%` }} className="bg-amber-500 transition-all duration-300" title={`Fuel: ${fuelPct.toFixed(1)}%`} />
                      <div style={{ width: `${laborPct}%` }} className="bg-blue-500 transition-all duration-300" title={`Labor: ${laborPct.toFixed(1)}%`} />
                      <div style={{ width: `${maintPct}%` }} className="bg-rose-500 transition-all duration-300" title={`Maintenance: ${maintPct.toFixed(1)}%`} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Custom Stacked Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Fuel Expenses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Driver Labor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Fleet Maintenance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestone Highlights Carousel / Cards */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Award className="size-4 text-amber-500" />
              Points of Interest & Milestone Calendar
            </CardTitle>
            <CardDescription className="text-xs">
              Key operational triggers, expansions, and historical milestones recorded during performance periods
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {fetchedData.filter((m) => m.isPoi).map((poiItem) => (
              <div
                key={poiItem.month}
                onClick={() => {
                  const idx = data.findIndex((d) => d.month === poiItem.month)
                  if (idx !== -1) setSelectedMonthIndex(idx)
                }}
                className="p-3 rounded-lg border border-border hover:border-amber-500/50 bg-card hover:bg-amber-500/5 transition-all cursor-pointer flex items-start gap-3 group"
              >
                <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold font-display text-xs">
                  {poiItem.month}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {poiItem.fullMonth}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      Profit: R$ {poiItem.profit.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{poiItem.poi}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
