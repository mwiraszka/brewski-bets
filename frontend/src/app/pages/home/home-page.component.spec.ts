import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  it('creates the component', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
    })
      .overrideComponent(HomePageComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
