import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

import { authGuard, guestGuard, ssoCallbackGuard } from './auth.guard';

type MockClerkService = {
  isLoggedIn: WritableSignal<boolean>;
  handleSSOCallback: jest.Mock<Promise<void>>;
};

type MockRouter = {
  createUrlTree: jest.Mock<UrlTree, [string[]]>;
};

describe('auth guards', () => {
  let mockClerk: MockClerkService;
  let mockRouter: MockRouter;
  const fakeUrlTree = {} as UrlTree;

  beforeEach(() => {
    mockClerk = {
      isLoggedIn: signal(false),
      handleSSOCallback: jest.fn().mockResolvedValue(undefined),
    };

    mockRouter = {
      createUrlTree: jest.fn().mockReturnValue(fakeUrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ClerkService, useValue: mockClerk },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  // ---------------------------------------------------------------------------
  // authGuard
  // ---------------------------------------------------------------------------

  describe('authGuard', () => {
    it('returns true when the user is logged in', () => {
      mockClerk.isLoggedIn.set(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as never, {} as never),
      );

      expect(result).toBe(true);
    });

    it('redirects to /login when the user is not logged in', () => {
      mockClerk.isLoggedIn.set(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as never, {} as never),
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).toBe(fakeUrlTree);
    });
  });

  // ---------------------------------------------------------------------------
  // guestGuard
  // ---------------------------------------------------------------------------

  describe('guestGuard', () => {
    it('returns true when the user is not logged in', () => {
      mockClerk.isLoggedIn.set(false);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as never, {} as never),
      );

      expect(result).toBe(true);
    });

    it('redirects to / when the user is logged in', () => {
      mockClerk.isLoggedIn.set(true);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as never, {} as never),
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(fakeUrlTree);
    });
  });

  // ---------------------------------------------------------------------------
  // ssoCallbackGuard
  // ---------------------------------------------------------------------------

  describe('ssoCallbackGuard', () => {
    it('handles the SSO callback and redirects to / on success', async () => {
      const result = await TestBed.runInInjectionContext(() =>
        ssoCallbackGuard({} as never, {} as never),
      );

      expect(mockClerk.handleSSOCallback).toHaveBeenCalled();
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(fakeUrlTree);
    });

    it('redirects to /login when the SSO callback fails', async () => {
      mockClerk.handleSSOCallback.mockRejectedValue(new Error('SSO failed'));
      const loginTree = { toString: () => '/login' } as UrlTree;
      mockRouter.createUrlTree.mockImplementation((segments: string[]) =>
        segments[0] === '/login' ? loginTree : fakeUrlTree,
      );

      const result = await TestBed.runInInjectionContext(() =>
        ssoCallbackGuard({} as never, {} as never),
      );

      expect(result).toBe(loginTree);
    });
  });
});
