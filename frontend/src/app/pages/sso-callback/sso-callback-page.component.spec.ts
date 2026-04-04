import { TestBed } from '@angular/core/testing';

import { SSOCallbackPageComponent } from './sso-callback-page.component';

describe('SSOCallbackPageComponent', () => {
  it('creates the component', async () => {
    await TestBed.configureTestingModule({
      imports: [SSOCallbackPageComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SSOCallbackPageComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
