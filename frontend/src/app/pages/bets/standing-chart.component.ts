import {
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  LOCALE_ID,
  effect,
  inject,
  input,
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

// Running brewski balance against one opponent: a stepped line that holds each
// balance until the next settlement. Polarity is carried by position against the
// emphasized zero line first, with the app's owe/owed colors as reinforcement.
@Component({
  selector: 'bb-standing-chart',
  templateUrl: './standing-chart.component.html',
  styleUrl: './standing-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class StandingChartComponent {
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);

  readonly points = input.required<StandingChartPoint[]>();
  readonly ariaLabel = input('');

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

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
      this.chart?.destroy();
      this.chart = this.buildChart(canvas, points);
    });

    this.destroyRef.onDestroy(() => this.chart?.destroy());
  }

  private buildChart(
    canvas: HTMLCanvasElement,
    points: StandingChartPoint[],
  ): Chart<'line', number[], string> {
    const styles = getComputedStyle(canvas);
    const token = (name: string): string => styles.getPropertyValue(name).trim();
    const positive = token('--bb-color-positive');
    const positiveSubtle = token('--bb-color-positiveSubtle');
    const danger = token('--bb-color-danger');
    const dangerSubtle = token('--bb-color-dangerSubtle');
    const textStrong = token('--bb-color-textStrong');
    const textSecondary = token('--bb-color-textSecondary');
    const borderDefault = token('--bb-color-borderDefault');
    const borderFaint = token('--bb-color-borderFaint');
    const borderDivider = token('--bb-color-borderDivider');
    const surfaceRaised = token('--bb-color-surfaceRaised');

    const colorFor = (value: number): string =>
      value > 0 ? positive : value < 0 ? danger : textSecondary;

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: [
          'Start',
          ...points.map(p => formatDate(p.settledAt, 'MMM d', this.locale)),
        ],
        datasets: [
          {
            data: [0, ...points.map(p => p.running)],
            stepped: 'after',
            borderWidth: 2,
            borderColor: textSecondary,
            // A step-after segment is drawn held at its start value, so its
            // polarity (and color) follows p0, not the destination point
            segment: {
              borderColor: ctx => colorFor(ctx.p0.parsed.y ?? 0),
            },
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBorderWidth: 2,
            pointBorderColor: surfaceRaised,
            pointBackgroundColor: ctx =>
              ctx.dataIndex === 0
                ? textSecondary
                : colorFor(points[ctx.dataIndex - 1].delta),
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
            displayColors: false,
            backgroundColor: surfaceRaised,
            titleColor: textStrong,
            bodyColor: textSecondary,
            footerColor: textSecondary,
            footerFont: { weight: 'normal', size: 11 },
            borderColor: borderDefault,
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: items => {
                const index = items[0]?.dataIndex ?? 0;
                return index === 0 ? 'Start' : points[index - 1].title;
              },
              label: item => {
                if (item.dataIndex === 0) {
                  return 'All square';
                }
                const point = points[item.dataIndex - 1];
                return [
                  `${signedLabel(point.delta)} brewskis`,
                  `Balance: ${signedLabel(point.running)}`,
                ];
              },
              footer: items => {
                const index = items[0]?.dataIndex ?? 0;
                return index === 0
                  ? ''
                  : formatDate(points[index - 1].settledAt, 'mediumDate', this.locale);
              },
            },
          },
        },
      },
    });
  }
}
