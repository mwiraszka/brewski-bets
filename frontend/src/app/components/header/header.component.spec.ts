import { Subject } from 'rxjs';

import { WritableSignal, signal } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

import { HeaderComponent } from './header.component';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

type MockUser = {
  firstName: string;
  lastName: string;
  hasImage: boolean;
  imageUrl: string;
};

type MockClerkService = {
  isLoaded: WritableSignal<boolean>;
  isLoggedIn: WritableSignal<boolean>;
  user: WritableSignal<MockUser | null>;
  logOut: jest.Mock<Promise<void>>;
};

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let mockClerk: MockClerkService;
  let routerEvents$: Subject<unknown>;

  beforeEach(async () => {
    mockClerk = {
      isLoaded: signal(true),
      isLoggedIn: signal(false),
      user: signal<MockUser | null>(null),
      logOut: jest.fn().mockResolvedValue(undefined),
    };

    routerEvents$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: ClerkService, useValue: mockClerk },
        {
          provide: Router,
          useValue: { events: routerEvents$.asObservable(), url: '/' },
        },
      ],
    })
      .overrideComponent(HeaderComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // previewInfo
  // ---------------------------------------------------------------------------

  describe('previewInfo', () => {
    it('is null when environment preview is null', () => {
      expect(component.previewInfo).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // isLoggedIn
  // ---------------------------------------------------------------------------

  describe('isLoggedIn', () => {
    it('reflects the clerk isLoggedIn state', () => {
      expect(component.isLoggedIn()).toBe(false);

      mockClerk.isLoggedIn.set(true);

      expect(component.isLoggedIn()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // showLoginButton
  // ---------------------------------------------------------------------------

  describe('showLoginButton', () => {
    it('returns true when loaded, not logged in, and on a public page', () => {
      routerEvents$.next(new NavigationEnd(1, '/privacy-policy', '/privacy-policy'));

      expect(component.showLoginButton()).toBe(true);
    });

    it('returns false when clerk has not loaded yet', () => {
      mockClerk.isLoaded.set(false);

      expect(component.showLoginButton()).toBe(false);
    });

    it('returns false when logged in', () => {
      mockClerk.isLoggedIn.set(true);

      expect(component.showLoginButton()).toBe(false);
    });

    it('returns false on /', () => {
      expect(component.showLoginButton()).toBe(false);
    });

    it('returns false on /login', () => {
      routerEvents$.next(new NavigationEnd(1, '/login', '/login'));

      expect(component.showLoginButton()).toBe(false);
    });

    it('returns true on /create-account', () => {
      routerEvents$.next(new NavigationEnd(1, '/create-account', '/create-account'));

      expect(component.showLoginButton()).toBe(true);
    });

    it('returns true on /forgot-password', () => {
      routerEvents$.next(new NavigationEnd(1, '/forgot-password', '/forgot-password'));

      expect(component.showLoginButton()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // avatarSrc
  // ---------------------------------------------------------------------------

  describe('avatarSrc', () => {
    it('returns undefined when user has no image', () => {
      mockClerk.user.set({
        firstName: 'John',
        lastName: 'Doe',
        hasImage: false,
        imageUrl: '',
      });

      expect(component.avatarSrc()).toBeUndefined();
    });

    it('returns the image URL when user has an image', () => {
      mockClerk.user.set({
        firstName: 'John',
        lastName: 'Doe',
        hasImage: true,
        imageUrl: 'https://img.clerk.com/user',
      });

      expect(component.avatarSrc()).toBe('https://img.clerk.com/user');
    });

    it('returns undefined when there is no user', () => {
      expect(component.avatarSrc()).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // initials
  // ---------------------------------------------------------------------------

  describe('initials', () => {
    it('returns uppercase initials from first and last name', () => {
      mockClerk.user.set({
        firstName: 'john',
        lastName: 'doe',
        hasImage: false,
        imageUrl: '',
      });

      expect(component.initials()).toBe('JD');
    });

    it('returns undefined when user has no name', () => {
      mockClerk.user.set({
        firstName: '',
        lastName: '',
        hasImage: false,
        imageUrl: '',
      });

      expect(component.initials()).toBeUndefined();
    });

    it('returns undefined when there is no user', () => {
      expect(component.initials()).toBeUndefined();
    });

    it('handles user with only firstName', () => {
      mockClerk.user.set({
        firstName: 'John',
        lastName: '',
        hasImage: false,
        imageUrl: '',
      });

      expect(component.initials()).toBe('J');
    });
  });

  // ---------------------------------------------------------------------------
  // menuOpen / toggleMenu / closeMenu
  // ---------------------------------------------------------------------------

  describe('menu', () => {
    it('starts with menu closed', () => {
      expect(component.menuOpen()).toBe(false);
    });

    it('toggles menu open and closed', () => {
      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);

      component.toggleMenu();
      expect(component.menuOpen()).toBe(false);
    });

    it('closes menu', () => {
      component.menuOpen.set(true);

      component.closeMenu();

      expect(component.menuOpen()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onLogOut
  // ---------------------------------------------------------------------------

  describe('onLogOut', () => {
    it('closes the menu and calls clerk.logOut', async () => {
      component.menuOpen.set(true);

      await component.onLogOut();

      expect(component.menuOpen()).toBe(false);
      expect(mockClerk.logOut).toHaveBeenCalled();
    });
  });
});
