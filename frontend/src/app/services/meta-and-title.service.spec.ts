import type { Mock } from 'vitest';

import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { MetaAndTitleService } from './meta-and-title.service';

describe('MetaAndTitleService', () => {
  let service: MetaAndTitleService;
  let mockMeta: { updateTag: Mock };
  let mockTitle: { setTitle: Mock };

  beforeEach(() => {
    mockMeta = { updateTag: vi.fn() };
    mockTitle = { setTitle: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: Meta, useValue: mockMeta },
        { provide: Title, useValue: mockTitle },
      ],
    });

    service = TestBed.inject(MetaAndTitleService);
  });

  describe('updateTitle', () => {
    it('sets the document title', () => {
      service.updateTitle('My Page');

      expect(mockTitle.setTitle).toHaveBeenCalledWith('My Page');
    });
  });

  describe('updateDescription', () => {
    it('updates the og:description meta tag', () => {
      service.updateDescription('A great page');

      expect(mockMeta.updateTag).toHaveBeenCalledWith({
        property: 'og:description',
        content: 'A great page',
      });
    });

    it('updates the description meta tag', () => {
      service.updateDescription('A great page');

      expect(mockMeta.updateTag).toHaveBeenCalledWith({
        name: 'description',
        content: 'A great page',
      });
    });
  });
});
