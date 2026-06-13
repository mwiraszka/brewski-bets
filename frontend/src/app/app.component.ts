import { ToastComponent, ToastService } from '@eagami/ui';

import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { FooterComponent } from '@app/components/footer/footer.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
})
export class AppComponent implements AfterViewInit {
  private readonly clerk = inject(ClerkService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly mainEl = viewChild.required<ElementRef<HTMLElement>>('mainEl');
  readonly scrolled = signal(false);

  constructor() {
    effect(() => {
      if (this.clerk.externallyDeleted()) {
        this.toast.success('Account deleted');
        this.router.navigate(['/']);
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.mainEl().nativeElement;
    const onScroll = (): void => this.scrolled.set(el.scrollTop > 4);
    el.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => el.removeEventListener('scroll', onScroll));
  }
}
