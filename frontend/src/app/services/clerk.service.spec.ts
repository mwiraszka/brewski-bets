import { TestBed } from '@angular/core/testing';

import { ClerkService } from './clerk.service';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'pk_test_abc',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

type MockSignUp = {
  create: jest.Mock;
  prepareEmailAddressVerification: jest.Mock;
  attemptEmailAddressVerification: jest.Mock;
  firstName: string | null;
  lastName: string | null;
};

type MockSignIn = {
  create: jest.Mock;
  authenticateWithRedirect: jest.Mock;
  attemptFirstFactor: jest.Mock;
  firstFactorVerification: { status: string } | null;
};

type MockClerk = {
  load: jest.Mock;
  addListener: jest.Mock;
  setActive: jest.Mock;
  signOut: jest.Mock;
  handleRedirectCallback: jest.Mock;
  user: {
    reload: jest.Mock;
    update: jest.Mock;
    setProfileImage: jest.Mock;
    imageUrl: string;
  } | null;
  session: { getToken: jest.Mock } | null;
  client: {
    signUp: MockSignUp;
    signIn: MockSignIn;
  };
};

let mockClerkInstance: MockClerk;

jest.mock('@clerk/clerk-js', () => ({
  Clerk: jest.fn().mockImplementation(() => {
    mockClerkInstance = {
      load: jest.fn().mockResolvedValue(undefined),
      addListener: jest.fn(),
      setActive: jest.fn().mockResolvedValue(undefined),
      signOut: jest.fn().mockResolvedValue(undefined),
      handleRedirectCallback: jest.fn().mockResolvedValue(undefined),
      user: null,
      session: { getToken: jest.fn().mockResolvedValue('mock-token') },
      client: {
        signUp: {
          create: jest.fn(),
          prepareEmailAddressVerification: jest.fn().mockResolvedValue(undefined),
          attemptEmailAddressVerification: jest.fn(),
          firstName: null,
          lastName: null,
        },
        signIn: {
          create: jest.fn(),
          authenticateWithRedirect: jest.fn().mockResolvedValue(undefined),
          attemptFirstFactor: jest.fn(),
          firstFactorVerification: null,
        },
      },
    };
    return mockClerkInstance;
  }),
}));

describe('ClerkService', () => {
  let service: ClerkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClerkService);
  });

  // ---------------------------------------------------------------------------
  // load
  // ---------------------------------------------------------------------------

  describe('load', () => {
    it('loads clerk and syncs state', async () => {
      await service.load();

      expect(mockClerkInstance.load).toHaveBeenCalled();
      expect(service.isLoaded()).toBe(true);
    });

    it('sets isLoggedIn to true when clerk has a user', async () => {
      await service.load();
      mockClerkInstance.user = {
        reload: jest.fn(),
        update: jest.fn(),
        setProfileImage: jest.fn(),
        imageUrl: 'https://img.clerk.com/user',
      };

      const listener = mockClerkInstance.addListener.mock.calls[0][0];
      listener();

      expect(service.isLoggedIn()).toBe(true);
    });

    it('registers a listener that syncs state on changes', async () => {
      await service.load();

      expect(mockClerkInstance.addListener).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  // ---------------------------------------------------------------------------
  // client getter
  // ---------------------------------------------------------------------------

  describe('client', () => {
    it('returns the clerk instance', async () => {
      await service.load();

      expect(service.client).toBe(mockClerkInstance);
    });
  });

  // ---------------------------------------------------------------------------
  // createAccount
  // ---------------------------------------------------------------------------

  describe('createAccount', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('returns needsVerification false when signup completes immediately', async () => {
      mockClerkInstance.client.signUp.create.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session-1',
      });

      const result = await service.createAccount('a@b.com', 'pass1234', 'John', 'Doe');

      expect(result).toEqual({ needsVerification: false });
      expect(mockClerkInstance.setActive).toHaveBeenCalledWith({ session: 'session-1' });
    });

    it('returns needsVerification true when email verification is needed', async () => {
      mockClerkInstance.client.signUp.create.mockResolvedValue({
        status: 'missing_requirements',
        prepareEmailAddressVerification:
          mockClerkInstance.client.signUp.prepareEmailAddressVerification,
      });

      const result = await service.createAccount('a@b.com', 'pass1234', 'John', 'Doe');

      expect(result).toEqual({ needsVerification: true });
      expect(
        mockClerkInstance.client.signUp.prepareEmailAddressVerification,
      ).toHaveBeenCalledWith({ strategy: 'email_code' });
    });
  });

  // ---------------------------------------------------------------------------
  // verifyEmail
  // ---------------------------------------------------------------------------

  describe('verifyEmail', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('sets the active session when verification completes', async () => {
      mockClerkInstance.client.signUp.attemptEmailAddressVerification.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session-2',
      });

      await service.verifyEmail('123456');

      expect(mockClerkInstance.setActive).toHaveBeenCalledWith({ session: 'session-2' });
    });

    it('does not set session when verification is not complete', async () => {
      mockClerkInstance.client.signUp.attemptEmailAddressVerification.mockResolvedValue({
        status: 'missing_requirements',
      });

      await service.verifyEmail('123456');

      expect(mockClerkInstance.setActive).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // logIn
  // ---------------------------------------------------------------------------

  describe('logIn', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('creates a sign-in and sets session on success', async () => {
      mockClerkInstance.client.signIn.create.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session-3',
      });

      await service.logIn('user@test.com', 'password');

      expect(mockClerkInstance.client.signIn.create).toHaveBeenCalledWith({
        strategy: 'password',
        identifier: 'user@test.com',
        password: 'password',
      });
      expect(mockClerkInstance.setActive).toHaveBeenCalledWith({ session: 'session-3' });
    });

    it('does not set session when sign-in is not complete', async () => {
      mockClerkInstance.client.signIn.create.mockResolvedValue({
        status: 'needs_second_factor',
      });

      await service.logIn('user@test.com', 'password');

      expect(mockClerkInstance.setActive).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // continueWithGoogle
  // ---------------------------------------------------------------------------

  describe('continueWithGoogle', () => {
    it('calls authenticateWithRedirect with oauth_google', async () => {
      await service.load();

      await service.continueWithGoogle();

      expect(
        mockClerkInstance.client.signIn.authenticateWithRedirect,
      ).toHaveBeenCalledWith({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // handleSSOCallback
  // ---------------------------------------------------------------------------

  describe('handleSSOCallback', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('creates a transferable signup when firstFactorVerification is transferable', async () => {
      mockClerkInstance.client.signIn.firstFactorVerification = {
        status: 'transferable',
      };
      mockClerkInstance.client.signUp.firstName = 'John';
      mockClerkInstance.client.signUp.lastName = null;
      mockClerkInstance.client.signUp.create.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session-sso',
      });

      await service.handleSSOCallback();

      expect(mockClerkInstance.client.signUp.create).toHaveBeenCalledWith({
        transfer: true,
        firstName: 'John',
        lastName: '-',
      });
      expect(mockClerkInstance.setActive).toHaveBeenCalledWith({
        session: 'session-sso',
      });
    });

    it('falls back to handleRedirectCallback when not transferable', async () => {
      mockClerkInstance.client.signIn.firstFactorVerification = {
        status: 'verified',
      };

      await service.handleSSOCallback();

      expect(mockClerkInstance.handleRedirectCallback).toHaveBeenCalledWith({
        signInForceRedirectUrl: '/',
        signUpForceRedirectUrl: '/',
      });
    });

    it('falls back when transferable signup does not complete', async () => {
      mockClerkInstance.client.signIn.firstFactorVerification = {
        status: 'transferable',
      };
      mockClerkInstance.client.signUp.create.mockResolvedValue({
        status: 'missing_requirements',
      });

      await service.handleSSOCallback();

      expect(mockClerkInstance.handleRedirectCallback).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // logOut
  // ---------------------------------------------------------------------------

  describe('logOut', () => {
    it('signs out via clerk', async () => {
      await service.load();

      await service.logOut();

      expect(mockClerkInstance.signOut).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // sendPasswordResetCode
  // ---------------------------------------------------------------------------

  describe('sendPasswordResetCode', () => {
    it('creates a sign-in with reset_password_email_code strategy', async () => {
      await service.load();
      mockClerkInstance.client.signIn.create.mockResolvedValue({});

      await service.sendPasswordResetCode('user@test.com');

      expect(mockClerkInstance.client.signIn.create).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        identifier: 'user@test.com',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // resetPassword
  // ---------------------------------------------------------------------------

  describe('resetPassword', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('attempts first factor and sets session on success', async () => {
      mockClerkInstance.client.signIn.attemptFirstFactor.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session-reset',
      });

      await service.resetPassword('123456', 'newpass123');

      expect(mockClerkInstance.client.signIn.attemptFirstFactor).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        code: '123456',
        password: 'newpass123',
      });
      expect(mockClerkInstance.setActive).toHaveBeenCalledWith({
        session: 'session-reset',
      });
    });

    it('does not set session when reset is not complete', async () => {
      mockClerkInstance.client.signIn.attemptFirstFactor.mockResolvedValue({
        status: 'needs_second_factor',
      });

      await service.resetPassword('123456', 'newpass123');

      expect(mockClerkInstance.setActive).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // reloadUser
  // ---------------------------------------------------------------------------

  describe('reloadUser', () => {
    it('reloads the clerk user and syncs state', async () => {
      await service.load();
      mockClerkInstance.user = {
        reload: jest.fn().mockResolvedValue(undefined),
        update: jest.fn(),
        setProfileImage: jest.fn(),
        imageUrl: 'https://img.clerk.com/user',
      };

      await service.reloadUser();

      expect(mockClerkInstance.user.reload).toHaveBeenCalled();
      expect(service.isLoggedIn()).toBe(true);
    });

    it('handles null user gracefully', async () => {
      await service.load();
      mockClerkInstance.user = null;

      await service.reloadUser();

      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getToken
  // ---------------------------------------------------------------------------

  describe('getToken', () => {
    it('returns the session token', async () => {
      await service.load();

      const token = await service.getToken();

      expect(token).toBe('mock-token');
    });

    it('returns null when there is no session', async () => {
      await service.load();
      mockClerkInstance.session = null;

      const token = await service.getToken();

      expect(token).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // updateProfile
  // ---------------------------------------------------------------------------

  describe('updateProfile', () => {
    it('updates the clerk user profile', async () => {
      await service.load();
      mockClerkInstance.user = {
        reload: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        setProfileImage: jest.fn(),
        imageUrl: '',
      };

      await service.updateProfile('Jane', 'Smith');

      expect(mockClerkInstance.user.update).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // setProfileImage
  // ---------------------------------------------------------------------------

  describe('setProfileImage', () => {
    it('sets the profile image and returns the new URL', async () => {
      await service.load();
      mockClerkInstance.user = {
        reload: jest.fn(),
        update: jest.fn(),
        setProfileImage: jest.fn().mockResolvedValue(undefined),
        imageUrl: 'https://img.clerk.com/new',
      };

      const result = await service.setProfileImage(new Blob());

      expect(mockClerkInstance.user.setProfileImage).toHaveBeenCalledWith({
        file: expect.any(Blob),
      });
      expect(result).toBe('https://img.clerk.com/new');
    });

    it('sets profile image to null to remove it', async () => {
      await service.load();
      mockClerkInstance.user = {
        reload: jest.fn(),
        update: jest.fn(),
        setProfileImage: jest.fn().mockResolvedValue(undefined),
        imageUrl: 'https://img.clerk.com/default',
      };

      await service.setProfileImage(null);

      expect(mockClerkInstance.user.setProfileImage).toHaveBeenCalledWith({ file: null });
    });

    it('returns undefined when user is null after setProfileImage', async () => {
      await service.load();
      mockClerkInstance.user = {
        reload: jest.fn(),
        update: jest.fn(),
        setProfileImage: jest.fn().mockImplementation(async () => {
          mockClerkInstance.user = null;
        }),
        imageUrl: '',
      };

      const result = await service.setProfileImage(new Blob());

      expect(result).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // changePassword
  // ---------------------------------------------------------------------------

  describe('changePassword', () => {
    it('updates the password via clerk user', async () => {
      await service.load();
      mockClerkInstance.user = {
        reload: jest.fn(),
        update: jest.fn(),
        setProfileImage: jest.fn(),
        imageUrl: '',
        updatePassword: jest.fn().mockResolvedValue(undefined),
      } as never;

      await service.changePassword('oldpass', 'newpass');

      expect(
        (mockClerkInstance.user as unknown as { updatePassword: jest.Mock })
          .updatePassword,
      ).toHaveBeenCalledWith({
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // extractError
  // ---------------------------------------------------------------------------

  describe('extractError', () => {
    it('extracts a known clerk error code to a friendly message', () => {
      const error = {
        errors: [{ code: 'form_password_incorrect', longMessage: 'Password wrong.' }],
      };

      expect(service.extractError(error)).toBe('Incorrect password');
    });

    it('falls back to longMessage when code is unknown', () => {
      const error = {
        errors: [{ code: 'unknown_code', longMessage: 'Some detailed message.' }],
      };

      expect(service.extractError(error)).toBe('Some detailed message');
    });

    it('strips trailing period from longMessage', () => {
      const error = {
        errors: [{ code: 'unknown_code', longMessage: 'Has a period.' }],
      };

      expect(service.extractError(error)).toBe('Has a period');
    });

    it('returns default message when error has no errors array', () => {
      expect(service.extractError('string error')).toBe(
        'Something went wrong, please try again',
      );
    });

    it('returns default message when error is null', () => {
      expect(service.extractError(null)).toBe('Something went wrong, please try again');
    });

    it('returns default message when errors array is empty or has no code/message', () => {
      const error = { errors: [{}] };

      expect(service.extractError(error)).toBe('Something went wrong, please try again');
    });

    it('maps all known error codes', () => {
      const knownCodes: Record<string, string> = {
        form_identifier_not_found: 'No account found with that email',
        form_password_incorrect: 'Incorrect password',
        form_password_pwned:
          'This password has been found in a data breach, please choose a different one',
        form_password_length_too_short: 'Password must be at least 8 characters',
        form_identifier_exists: 'An account with that email already exists',
        form_code_incorrect: 'Incorrect verification code',
        form_param_format_invalid: 'Please enter a valid email address',
        form_password_not_strong_enough:
          'Password is not strong enough, please choose a stronger one',
        form_param_nil: 'Please fill in all required fields',
        strategy_for_user_invalid: 'No account found with that email',
        identifier_invalid: 'Please enter a valid email address',
      };

      for (const [code, expected] of Object.entries(knownCodes)) {
        const error = { errors: [{ code }] };

        expect(service.extractError(error)).toBe(expected);
      }
    });
  });
});
