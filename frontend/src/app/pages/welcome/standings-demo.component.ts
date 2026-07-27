import { AvatarComponent, BottleIconComponent } from '@eagami/ui';

import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  StandingChartComponent,
  type StandingChartPoint,
} from '@app/pages/bets/standing-chart.component';

const DEMO_BETS: ReadonlyArray<{ date: [number, number]; title: string; delta: number }> =
  [
    { date: [5, 24], title: 'Mexico vs. Czechia', delta: -3 },
    { date: [5, 25], title: 'Ecuador vs. Germany', delta: 3 },
    { date: [5, 27], title: 'Paraguay vs. Australia', delta: -3 },
    { date: [5, 28], title: 'South Africa vs. Canada', delta: -2 },
    { date: [5, 29], title: 'Brazil vs. Japan', delta: 2 },
    { date: [5, 30], title: 'England vs. Mexico', delta: -4 },
    { date: [6, 1], title: 'Spain vs. Austria', delta: 2 },
    { date: [6, 2], title: 'Portugal vs. Croatia', delta: 1 },
    { date: [6, 3], title: 'Argentina vs. Cape Verde', delta: -2 },
    { date: [6, 4], title: 'Canada vs. Morocco', delta: 3 },
    { date: [6, 5], title: 'Belgium vs. Senegal', delta: 2 },
    { date: [6, 7], title: 'England vs. DR Congo', delta: -1 },
    { date: [6, 9], title: 'France vs. Sweden', delta: 2 },
    { date: [6, 11], title: 'Norway vs. England', delta: 3 },
    { date: [6, 13], title: 'Egypt vs. Colombia', delta: -2 },
    { date: [6, 15], title: 'Morocco vs. France', delta: 4 },
    { date: [6, 17], title: 'Spain vs. England', delta: 1 },
  ];

const DEMO_POINTS: StandingChartPoint[] = (() => {
  let running = 0;
  return DEMO_BETS.map(bet => {
    running += bet.delta;
    return {
      settledAt: new Date(2026, bet.date[0], bet.date[1]),
      title: bet.title,
      delta: bet.delta,
      running,
    };
  });
})();

// Standings snapshot with sample data for the welcome screen
@Component({
  selector: 'bb-standings-demo',
  templateUrl: './standings-demo.component.html',
  styleUrl: './standings-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AvatarComponent, BottleIconComponent, StandingChartComponent],
})
export class StandingsDemoComponent {
  readonly points = DEMO_POINTS;
}
