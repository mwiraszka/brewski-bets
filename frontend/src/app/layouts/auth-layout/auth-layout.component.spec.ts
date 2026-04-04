import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  it('creates the component', async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
    })
      .overrideComponent(AuthLayoutComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(AuthLayoutComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
