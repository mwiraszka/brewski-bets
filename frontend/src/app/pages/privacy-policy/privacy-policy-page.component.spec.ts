import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PrivacyPolicyPageComponent } from './privacy-policy-page.component';

describe('PrivacyPolicyPageComponent', () => {
  it('creates the component', async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyPageComponent],
    })
      .overrideComponent(PrivacyPolicyPageComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(PrivacyPolicyPageComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
