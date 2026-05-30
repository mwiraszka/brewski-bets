import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

import { LoginPageComponent } from './login-page.component';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

type MockClerkService = {
  logIn: jest.Mock<Promise<{ needsSecondFactor: boolean }>, [string, string]>;
  verifyLoginCode: jest.Mock<Promise<void>, [string]>;
  continueWithGoogle: jest.Mock<Promise<void>>;
  extractError: jest.Mock<string, [unknown]>;
};

type MockRouter = {
  navigate: jest.Mock<Promise<boolean>, [string[]]>;
};

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let mockClerk: MockClerkService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockClerk = {
      logIn: jest.fn().mockResolvedValue({ needsSecondFactor: false }),
      verifyLoginCode: jest.fn().mockResolvedValue(undefined),
      continueWithGoogle: jest.fn().mockResolvedValue(undefined),
      extractError: jest.fn().mockReturnValue('Something went wrong'),
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: ClerkService, useValue: mockClerk },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(LoginPageComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------

  describe('initial state', () => {
    it('has empty fields and no errors', () => {
      expect(component.email()).toBe('');
      expect(component.password()).toBe('');
      expect(component.verificationCode()).toBe('');
      expect(component.emailError()).toBe('');
      expect(component.passwordError()).toBe('');
      expect(component.verificationCodeError()).toBe('');
      expect(component.error()).toBe('');
      expect(component.loading()).toBe(false);
      expect(component.googleLoading()).toBe(false);
      expect(component.pendingSecondFactor()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onEmailBlur
  // ---------------------------------------------------------------------------

  describe('onEmailBlur', () => {
    it('does nothing when email is empty', () => {
      component.onEmailBlur();

      expect(component.emailError()).toBe('');
    });

    it('sets error for invalid email', () => {
      component.email.set('bad-email');

      component.onEmailBlur();

      expect(component.emailError()).toBe('Please enter a valid email address');
    });

    it('clears error for valid email', () => {
      component.email.set('user@test.com');

      component.onEmailBlur();

      expect(component.emailError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onPasswordBlur
  // ---------------------------------------------------------------------------

  describe('onPasswordBlur', () => {
    it('does nothing (no validation for login password)', () => {
      component.password.set('x');

      component.onPasswordBlur();

      expect(component.passwordError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit: validation
  // ---------------------------------------------------------------------------

  describe('onSubmit: validation', () => {
    it('sets email error when email is empty', async () => {
      component.password.set('password123');

      await component.onSubmit();

      expect(component.emailError()).toBe('Email is required');
      expect(mockClerk.logIn).not.toHaveBeenCalled();
    });

    it('sets email error for invalid email format', async () => {
      component.email.set('not-an-email');
      component.password.set('password123');

      await component.onSubmit();

      expect(component.emailError()).toBe('Please enter a valid email address');
      expect(mockClerk.logIn).not.toHaveBeenCalled();
    });

    it('sets password error when password is empty', async () => {
      component.email.set('user@test.com');

      await component.onSubmit();

      expect(component.passwordError()).toBe('Password is required');
      expect(mockClerk.logIn).not.toHaveBeenCalled();
    });

    it('sets both errors when both fields are empty', async () => {
      await component.onSubmit();

      expect(component.emailError()).toBe('Email is required');
      expect(component.passwordError()).toBe('Password is required');
    });

    it('clears previous errors on re-validation', async () => {
      await component.onSubmit();
      expect(component.emailError()).toBe('Email is required');

      component.email.set('user@test.com');
      component.password.set('password123');
      await component.onSubmit();

      expect(component.emailError()).toBe('');
      expect(component.passwordError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit: success
  // ---------------------------------------------------------------------------

  describe('onSubmit: success', () => {
    beforeEach(() => {
      component.email.set('user@test.com');
      component.password.set('password123');
    });

    it('calls clerk.logIn with email and password', async () => {
      await component.onSubmit();

      expect(mockClerk.logIn).toHaveBeenCalledWith('user@test.com', 'password123');
    });

    it('navigates to / on success', async () => {
      await component.onSubmit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('sets loading to false after success', async () => {
      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });

    it('clears the error signal before submitting', async () => {
      component.error.set('Previous error');

      await component.onSubmit();

      expect(component.error()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit: second factor
  // ---------------------------------------------------------------------------

  describe('onSubmit: second factor', () => {
    beforeEach(() => {
      component.email.set('user@test.com');
      component.password.set('password123');
      mockClerk.logIn.mockResolvedValue({ needsSecondFactor: true });
    });

    it('sets pendingSecondFactor to true when second factor is needed', async () => {
      await component.onSubmit();

      expect(component.pendingSecondFactor()).toBe(true);
    });

    it('does not navigate when second factor is needed', async () => {
      await component.onSubmit();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('sets loading to false after setting pendingSecondFactor', async () => {
      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onVerify
  // ---------------------------------------------------------------------------

  describe('onVerify', () => {
    it('calls clerk.verifyLoginCode and navigates on success', async () => {
      component.verificationCode.set('123456');

      await component.onVerify();

      expect(mockClerk.verifyLoginCode).toHaveBeenCalledWith('123456');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      expect(component.loading()).toBe(false);
    });

    it('sets error on verification failure', async () => {
      component.verificationCode.set('000000');
      mockClerk.verifyLoginCode.mockRejectedValue(new Error('Bad code'));

      await component.onVerify();

      expect(component.error()).toBe('Something went wrong');
      expect(component.loading()).toBe(false);
    });

    it('clears previous errors before verifying', async () => {
      component.error.set('Old error');
      component.verificationCodeError.set('Old code error');
      component.verificationCode.set('123456');

      await component.onVerify();

      expect(component.verificationCodeError()).toBe('');
      expect(component.error()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit: error
  // ---------------------------------------------------------------------------

  describe('onSubmit: error', () => {
    it('sets error from clerk.extractError on failure', async () => {
      component.email.set('user@test.com');
      component.password.set('password123');
      mockClerk.logIn.mockRejectedValue(new Error('Login failed'));

      await component.onSubmit();

      expect(component.error()).toBe('Something went wrong');
      expect(component.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onContinueWithGoogle
  // ---------------------------------------------------------------------------

  describe('onContinueWithGoogle', () => {
    it('sets googleLoading to true', async () => {
      let loadingDuringCall = false;
      mockClerk.continueWithGoogle.mockImplementation(async () => {
        loadingDuringCall = component.googleLoading();
      });

      await component.onContinueWithGoogle();

      expect(loadingDuringCall).toBe(true);
    });

    it('calls clerk.continueWithGoogle', async () => {
      await component.onContinueWithGoogle();

      expect(mockClerk.continueWithGoogle).toHaveBeenCalled();
    });

    it('sets error and resets googleLoading on failure', async () => {
      mockClerk.continueWithGoogle.mockRejectedValue(new Error('Google error'));

      await component.onContinueWithGoogle();

      expect(component.error()).toBe('Something went wrong');
      expect(component.googleLoading()).toBe(false);
    });

    it('does not reset googleLoading on success (redirect happens)', async () => {
      await component.onContinueWithGoogle();

      expect(component.googleLoading()).toBe(true);
    });
  });
});
