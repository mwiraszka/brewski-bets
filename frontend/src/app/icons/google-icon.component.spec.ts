import { TestBed } from '@angular/core/testing';

import { GoogleIconComponent } from './google-icon.component';

describe('GoogleIconComponent', () => {
  it('creates the component', async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleIconComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(GoogleIconComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
