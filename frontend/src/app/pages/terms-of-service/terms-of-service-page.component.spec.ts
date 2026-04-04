import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TermsOfServicePageComponent } from './terms-of-service-page.component';

describe('TermsOfServicePageComponent', () => {
  it('creates the component', async () => {
    await TestBed.configureTestingModule({
      imports: [TermsOfServicePageComponent],
    })
      .overrideComponent(TermsOfServicePageComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(TermsOfServicePageComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
