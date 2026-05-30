import { type WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ApiService } from '@app/services/api.service';
import { ClerkService } from '@app/services/clerk.service';

import { type UserRecord, UserService } from './user.service';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

interface MockClerkService {
  isLoggedIn: WritableSignal<boolean>;
  user: WritableSignal<{ hasImage: boolean; imageUrl: string } | null>;
}

interface MockApiService {
  get: jest.Mock<Promise<unknown>>;
}

const MOCK_USER_RECORD: UserRecord = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  clerkImageUrl: 'https://img.clerk.com/abc',
  avatarOriginalUrl: 'https://s3.example.com/avatar.jpg',
  avatarCropState: { zoom: 1.5, offsetX: 10, offsetY: 5 },
  lastModifiedDate: '2026-04-01T00:00:00.000Z',
};

describe('UserService', () => {
  let service: UserService;
  let mockClerk: MockClerkService;
  let mockApi: MockApiService;

  beforeEach(() => {
    mockClerk = {
      isLoggedIn: signal(true),
      user: signal({ hasImage: true, imageUrl: 'https://img.clerk.com/user' }),
    };

    mockApi = {
      get: jest.fn().mockResolvedValue({ ...MOCK_USER_RECORD }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ClerkService, useValue: mockClerk },
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(UserService);
  });

  // ---------------------------------------------------------------------------
  // load
  // ---------------------------------------------------------------------------

  describe('load', () => {
    it('fetches the user record from the API', async () => {
      await service.load();

      expect(mockApi.get).toHaveBeenCalledWith('/users/me');
      expect(service.user()).toEqual(MOCK_USER_RECORD);
    });

    it('does not fetch when the user is not logged in', async () => {
      mockClerk.isLoggedIn.set(false);

      await service.load();

      expect(mockApi.get).not.toHaveBeenCalled();
      expect(service.user()).toBeNull();
    });

    it('silently handles API errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      await service.load();

      expect(service.user()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // fullSizeAvatarUrl
  // ---------------------------------------------------------------------------

  describe('fullSizeAvatarUrl', () => {
    it('returns the backend avatar URL with cache buster when user has an original avatar', async () => {
      await service.load();

      const url = service.fullSizeAvatarUrl();
      const expectedTimestamp = new Date(MOCK_USER_RECORD.lastModifiedDate).getTime();

      expect(url).toBe(
        `http://localhost:3000/api/users/user-1/avatar?t=${expectedTimestamp}`,
      );
    });

    it('returns undefined when user has no original avatar', async () => {
      mockApi.get.mockResolvedValue({
        ...MOCK_USER_RECORD,
        avatarOriginalUrl: null,
      });
      await service.load();

      expect(service.fullSizeAvatarUrl()).toBeUndefined();
    });

    it('returns undefined when user record is null', () => {
      expect(service.fullSizeAvatarUrl()).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // avatarUrl
  // ---------------------------------------------------------------------------

  describe('avatarUrl', () => {
    it('returns the backend avatar URL with cache buster when user has an original avatar', async () => {
      await service.load();

      const url = service.avatarUrl();
      const expectedTimestamp = new Date(MOCK_USER_RECORD.lastModifiedDate).getTime();

      expect(url).toBe(
        `http://localhost:3000/api/users/user-1/avatar?t=${expectedTimestamp}`,
      );
    });

    it('returns the clerk image URL when user has no original avatar but clerk has one', async () => {
      mockApi.get.mockResolvedValue({
        ...MOCK_USER_RECORD,
        avatarOriginalUrl: null,
      });
      await service.load();

      const url = service.avatarUrl();

      expect(url).toBe('https://img.clerk.com/user');
    });

    it('returns undefined when no avatar exists anywhere', async () => {
      mockClerk.user.set({ hasImage: false, imageUrl: '' });
      mockApi.get.mockResolvedValue({
        ...MOCK_USER_RECORD,
        avatarOriginalUrl: null,
      });
      await service.load();

      expect(service.avatarUrl()).toBeUndefined();
    });

    it('returns undefined when user record is null', () => {
      mockClerk.user.set({ hasImage: false, imageUrl: '' });

      expect(service.avatarUrl()).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // avatarCropState
  // ---------------------------------------------------------------------------

  describe('avatarCropState', () => {
    it('returns the crop state from the user record', async () => {
      await service.load();

      expect(service.avatarCropState()).toEqual({ zoom: 1.5, offsetX: 10, offsetY: 5 });
    });

    it('returns null when there is no user record', () => {
      expect(service.avatarCropState()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // hasAvatar
  // ---------------------------------------------------------------------------

  describe('hasAvatar', () => {
    it('returns true when avatarUrl is present', async () => {
      await service.load();

      expect(service.hasAvatar()).toBe(true);
    });

    it('returns false when avatarUrl is undefined', () => {
      mockClerk.user.set({ hasImage: false, imageUrl: '' });

      expect(service.hasAvatar()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // setUser
  // ---------------------------------------------------------------------------

  describe('setUser', () => {
    it('sets the user record', () => {
      const record: UserRecord = {
        ...MOCK_USER_RECORD,
        firstName: 'Jane',
      };

      service.setUser(record);

      expect(service.user()).toEqual(record);
    });
  });

  // ---------------------------------------------------------------------------
  // clearAvatar
  // ---------------------------------------------------------------------------

  describe('clearAvatar', () => {
    it('clears avatarOriginalUrl and avatarCropState from the user record', async () => {
      await service.load();

      service.clearAvatar();

      expect(service.user()?.avatarOriginalUrl).toBeNull();
      expect(service.user()?.avatarCropState).toBeNull();
    });

    it('does nothing when there is no user record', () => {
      service.clearAvatar();

      expect(service.user()).toBeNull();
    });
  });
});
