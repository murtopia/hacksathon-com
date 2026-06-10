"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/murtopolis/format";

/**
 * Monochrome trend chart for Murtopolis. A thin wrapper over Recharts'
 * ComposedChart so a single component can render line and/or bar series
 * on one grid. Everything is grayscale by design - the strongest series
 * gets near-black, supporting series get progressively lighter grays -
 * to stay inside the Vignelli palette (no color accents anywhere).
 *
 * Formatting is configured with serializable string hints rather than
 * function props, because this is a Client Component and functions can't
 * cross the Server -> Client boundary. The actual formatter functions are
 * built here, inside the client, and handed to Recharts.
 */

// Grayscale ramp drawn from the design tokens (globals.css). Recharts
// needs concrete color strings, so we inline the hex values here.
const RAMP = ["#1A1A1A", "#737373", "#A3A3A3", "#D1D1D1"];

export type ValueFormat = "number" | "currencyUsd";
export type XTickFormat = "dateShort";

export interface TrendSeries {
  key: string;
  label: string;
  type?: "line" | "bar";
}

interface TrendChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: TrendSeries[];
  height?: number;
  /** Format the y-axis + tooltip values. Defaults to a plain number. */
  valueFormat?: ValueFormat;
  /** Format the x-axis tick label (e.g. shorten an ISO date). */
  xTickFormat?: XTickFormat;
}

const AXIS_COLOR = "#A3A3A3";
const GRID_COLOR = "#E8E8E8";

function formatValue(value: number, mode?: ValueFormat): string {
  if (mode === "currencyUsd") return `$${formatNumber(value)}`;
  if (mode === "number") return formatNumber(value);
  return String(value);
}

function formatXTick(value: string, mode?: XTickFormat): string {
  if (mode === "dateShort") {
    // value is YYYY-MM-DD
    const [, m, d] = value.split("-");
    return `${Number(m)}/${Number(d)}`;
  }
  return value;
}

export function TrendChart({
  data,
  xKey,
  series,
  height = 240,
  valueFormat,
  xTickFormat,
}: TrendChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            stroke={GRID_COLOR}
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tickFormatter={(value) => formatXTick(String(value), xTickFormat)}
            tick={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              fill: AXIS_COLOR,
            }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            minTickGap={24}
          />
          <YAxis
            width={48}
            tickFormatter={(value) => formatValue(Number(value), valueFormat)}
            tick={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              fill: AXIS_COLOR,
            }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(26,26,26,0.04)" }}
            contentStyle={{
              borderRadius: 4,
              border: "1px solid #E8E8E8",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#1A1A1A", fontWeight: 600 }}
            formatter={(value, name) => [
              formatValue(Number(value), valueFormat),
              name,
            ]}
          />
          {series.map((s, i) => {
            const color = RAMP[i % RAMP.length];
            if (s.type === "bar") {
              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={color}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={28}
                />
              );
            }
            return (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
