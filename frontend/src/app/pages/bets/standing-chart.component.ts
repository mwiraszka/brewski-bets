import { BottleIconComponent } from '@eagami/ui';
import {
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type TooltipModel,
} from 'chart.js';

import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  LOCALE_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { ThemeService } from '@app/services/theme.service';
import { signedLabel } from '@app/util';

Chart.register(
  CategoryScale,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

export interface StandingChartPoint {
  settledAt: Date;
  title: string;
  delta: number;
  running: number;
}

interface ChartTip {
  title: string;
  delta: number | null;
  balance: number;
  settledDate: string | null;
  x: number;
  y: number;
}

const MIN_SEGMENT_WIDTH = 20;
const AXIS_GUTTER_WIDTH = 60;
// Half the tip's max-width, so a clamped tip never overflows the shell
const TIP_EDGE_MARGIN = 90;
// Keeps the tip, rendered above its anchor, inside the chart's own height
const TIP_MIN_ANCHOR_Y = 104;

// Running brewski balance against one opponent. Each dot is a settled bet drawn
// at the pre-bet balance, so the step to its right shows that bet's effect; the
// dot, its step, and its tooltip result all share the win/loss color. A final
// neutral dot marks today's balance.
@Component({
  selector: 'bb-standing-chart',
  templateUrl: './standing-chart.component.html',
  styleUrl: './standing-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BottleIconComponent],
})
export class StandingChartComponent {
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);

  readonly points = input.required<StandingChartPoint[]>();
  readonly ariaLabel = input('');

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  readonly tip = signal<ChartTip | null>(null);

  readonly minWidth = computed(
    () => AXIS_GUTTER_WIDTH + MIN_SEGMENT_WIDTH * (this.points().length + 1),
  );

  private chart: Chart<'line', number[], string> | null = null;
  private chartKey = '';

  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      const points = this.points();
      // Colors come from theme-scoped CSS custom properties, so a theme change
      // must rebuild the chart with freshly resolved values
      const theme = this.themeService.mode();
      if (!canvas) {
        return;
      }
      // Polling replaces the bets array every 30s with usually identical data;
      // skip the rebuild when nothing the chart renders has actually changed
      const key = `${theme}|${JSON.stringify(points)}`;
      if (key === this.chartKey && this.chart) {
        return;
      }
      this.chartKey = key;
      this.tip.set(null);
      this.chart?.destroy();
      this.chart = this.buildChart(canvas, points);
    });

    this.destroyRef.onDestroy(() => this.chart?.destroy());
  }

  private buildChart(
    canvas: HTMLCanvasElement,
    points: StandingChartPoint[],
  ): Chart<'line', number[], string> {
    // Tokens are defined on :root; resolving them off the root element also
    // works while the canvas itself is not attached yet, which returns empty
    // strings that chart.js would otherwise silently render as black
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string): string => styles.getPropertyValue(name).trim();
    const positive = token('--bb-color-positive');
    const positiveSubtle = token('--bb-color-positiveSubtle');
    const danger = token('--bb-color-danger');
    const dangerSubtle = token('--bb-color-dangerSubtle');
    const textSecondary = token('--bb-color-textSecondary');
    const borderFaint = token('--bb-color-borderFaint');
    const borderDivider = token('--bb-color-borderDivider');
    const surfaceRaised = token('--bb-color-surfaceRaised');

    const colorFor = (value: number): string =>
      value > 0 ? positive : value < 0 ? danger : textSecondary;

    // Dot i sits at the balance before bet i; the terminal dot is today's balance
    const values = [...points.map(p => p.running - p.delta), this.finalBalance(points)];
    const labels = [
      ...points.map(p => formatDate(p.settledAt, 'MMM d', this.locale)),
      'Today',
    ];

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            // 'after' draws the vertical at the segment's start point, so a
            // bet's rise or fall appears immediately to the right of its dot
            stepped: 'after',
            borderWidth: 2,
            borderColor: textSecondary,
            segment: {
              borderColor: ctx => colorFor(points[ctx.p0DataIndex]?.delta ?? 0),
            },
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBorderWidth: 2,
            pointBorderColor: surfaceRaised,
            pointBackgroundColor: ctx =>
              ctx.dataIndex < points.length
                ? colorFor(points[ctx.dataIndex].delta)
                : textSecondary,
            fill: {
              target: 'origin',
              above: positiveSubtle,
              below: dangerSubtle,
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            border: { color: borderDivider },
            ticks: {
              color: textSecondary,
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
            },
          },
          y: {
            suggestedMin: -1,
            suggestedMax: 1,
            grid: {
              color: ctx => (ctx.tick.value === 0 ? borderDivider : borderFaint),
              lineWidth: ctx => (ctx.tick.value === 0 ? 2 : 1),
            },
            border: { display: false },
            ticks: {
              precision: 0,
              color: textSecondary,
              font: { size: 11 },
              callback: value => signedLabel(Number(value)),
            },
          },
        },
        plugins: {
          tooltip: {
            enabled: false,
            external: context => this.updateTip(context.tooltip, points),
          },
        },
      },
    });
  }

  private finalBalance(points: StandingChartPoint[]): number {
    return points.length ? points[points.length - 1].running : 0;
  }

  signed(value: number): string {
    return signedLabel(value);
  }

  hideTip(): void {
    this.tip.set(null);
  }

  private updateTip(tooltip: TooltipModel<'line'>, points: StandingChartPoint[]): void {
    if (tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
      this.tip.set(null);
      return;
    }

    const scroller = this.scroller()?.nativeElement;
    const index = tooltip.dataPoints[0].dataIndex;
    const bet = index < points.length ? points[index] : null;

    const rawX = tooltip.caretX - (scroller?.scrollLeft ?? 0);
    const maxX = (scroller?.clientWidth ?? 0) - TIP_EDGE_MARGIN;
    const x = Math.min(Math.max(rawX, TIP_EDGE_MARGIN), Math.max(maxX, TIP_EDGE_MARGIN));
    const y = Math.max(tooltip.caretY, TIP_MIN_ANCHOR_Y);

    // The handler fires on every pointer move; skip the signal write while the
    // hovered point is unchanged
    const current = this.tip();
    if (
      current &&
      current.x === x &&
      current.y === y &&
      current.title === (bet ? bet.title : 'Today')
    ) {
      return;
    }

    this.tip.set({
      title: bet ? bet.title : 'Today',
      delta: bet ? bet.delta : null,
      balance: bet ? bet.running : this.finalBalance(points),
      settledDate: bet
        ? `Settled ${formatDate(bet.settledAt, 'mediumDate', this.locale)}`
        : null,
      x,
      y,
    });
  }
}
