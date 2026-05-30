import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

import { CreateAccountPageComponent } from './create-account-page.component';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

type MockClerkService = {
  createAccount: jest.Mock<
    Promise<{ needsVerification: boolean }>,
    [string, string, string, string]
  >;
  verifyEmail: jest.Mock<Promise<void>, [string]>;
  continueWithGoogle: jest.Mock<Promise<void>>;
  extractError: jest.Mock<string, [unknown]>;
};

type MockRouter = {
  navigate: jest.Mock<Promise<boolean>, [string[]]>;
};

describe('CreateAccountPageComponent', () => {
  let component: CreateAccountPageComponent;
  let mockClerk: MockClerkService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockClerk = {
      createAccount: jest.fn().mockResolvedValue({ needsVerification: false }),
      verifyEmail: jest.fn().mockResolvedValue(undefined),
      continueWithGoogle: jest.fn().mockResolvedValue(undefined),
      extractError: jest.fn().mockReturnValue('Something went wrong'),
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [CreateAccountPageComponent],
      providers: [
        { provide: ClerkService, useValue: mockClerk },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(CreateAccountPageComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(CreateAccountPageComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('clears password fields', () => {
      component.password.set('secret');
      component.confirmPassword.set('secret');

      component.ngOnDestroy();

      expect(component.password()).toBe('');
      expect(component.confirmPassword()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Blur handlers
  // ---------------------------------------------------------------------------

  describe('onEmailBlur', () => {
    it('does nothing when email is empty', () => {
      component.onEmailBlur();

      expect(component.emailError()).toBe('');
    });

    it('sets error for invalid email', () => {
      component.email.set('bad');

      component.onEmailBlur();

      expect(component.emailError()).toBe('Please enter a valid email address');
    });

    it('clears error for valid email', () => {
      component.email.set('user@test.com');

      component.onEmailBlur();

      expect(component.emailError()).toBe('');
    });
  });

  describe('onPasswordBlur', () => {
    it('does nothing when password is empty', () => {
      component.onPasswordBlur();

      expect(component.passwordError()).toBe('');
    });

    it('sets error when password is too short', () => {
      component.password.set('short');

      component.onPasswordBlur();

      expect(component.passwordError()).toBe('Must be at least 8 characters');
    });

    it('clears error when password is long enough', () => {
      component.password.set('longpassword');

      component.onPasswordBlur();

      expect(component.passwordError()).toBe('');
    });
  });

  describe('onConfirmPasswordBlur', () => {
    it('does nothing when confirmPassword is empty', () => {
      component.onConfirmPasswordBlur();

      expect(component.confirmPasswordError()).toBe('');
    });

    it('sets error when passwords do not match', () => {
      component.password.set('password1');
      component.confirmPassword.set('password2');

      component.onConfirmPasswordBlur();

      expect(component.confirmPasswordError()).toBe('Passwords do not match');
    });

    it('clears error when passwords match', () => {
      component.password.set('password1');
      component.confirmPassword.set('password1');

      component.onConfirmPasswordBlur();

      expect(component.confirmPasswordError()).toBe('');
    });

    it('clears error when password is empty (no comparison needed)', () => {
      component.confirmPassword.set('something');

      component.onConfirmPasswordBlur();

      expect(component.confirmPasswordError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit: validation
  // ---------------------------------------------------------------------------

  describe('onSubmit: validation', () => {
    it('sets all errors when all fields are empty', async () => {
      await component.onSubmit();

      expect(component.firstNameError()).toBe('First name is required');
      expect(component.lastNameError()).toBe('Last name is required');
      expect(component.emailError()).toBe('Email is required');
      expect(component.passwordError()).toBe('Password is required');
      expect(component.confirmPasswordError()).toBe('Please confirm your password');
      expect(mockClerk.createAccount).not.toHaveBeenCalled();
    });

    it('sets email error for invalid format', async () => {
      component.firstName.set('John');
      component.lastName.set('Doe');
      component.email.set('not-valid');
      component.password.set('password1');
      component.confirmPassword.set('password1');

      await component.onSubmit();

      expect(component.emailError()).toBe('Please enter a valid email address');
      expect(mockClerk.createAccount).not.toHaveBeenCalled();
    });

    it('sets password error for short password', async () => {
      component.firstName.set('John');
      component.lastName.set('Doe');
      component.email.set('user@test.com');
      component.password.set('short');
      component.confirmPassword.set('short');

      await component.onSubmit();

      expect(component.passwordError()).toBe('Must be at least 8 characters');
      expect(mockClerk.createAccount).not.toHaveBeenCalled();
    });

    it('sets confirmPassword error when passwords do not match', async () => {
      component.firstName.set('John');
      component.lastName.set('Doe');
      component.email.set('user@test.com');
      component.password.set('password1');
      component.confirmPassword.set('password2');

      await component.onSubmit();

      expect(component.confirmPasswordError()).toBe('Passwords do not match');
      expect(mockClerk.createAccount).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit: success without verification
  // ---------------------------------------------------------------------------

  describe('onSubmit: success without verification', () => {
    beforeEach(() => {
      component.firstName.set('John');
      component.lastName.set('Doe');
      component.email.set('user@test.com');
      component.password.set('password1');
      component.confirmPassword.set('password1');
    });

    it('calls clerk.createAccount and navigates on immediate success', async () => {
      await component.onSubmit();

      expect(mockClerk.createAccount).toHaveBeenCalledWith(
        'user@test.com',
        'password1',
        'John',
        'Doe',
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      expect(component.pendingVerification()).toBe(false);
    });

    it('sets loading to false after success', async () => {
      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit: success with verification
  // ---------------------------------------------------------------------------

  describe('onSubmit: success with verification', () => {
    it('sets pendingVerification when verification is needed', async () => {
      component.firstName.set('John');
      component.lastName.set('Doe');
      component.email.set('user@test.com');
      component.password.set('password1');
      component.confirmPassword.set('password1');
      mockClerk.createAccount.mockResolvedValue({ needsVerification: true });

      await component.onSubmit();

      expect(component.pendingVerification()).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit: error
  // ---------------------------------------------------------------------------

  describe('onSubmit: error', () => {
    it('sets error from clerk.extractError on failure', async () => {
      component.firstName.set('John');
      component.lastName.set('Doe');
      component.email.set('user@test.com');
      component.password.set('password1');
      component.confirmPassword.set('password1');
      mockClerk.createAccount.mockRejectedValue(new Error('fail'));

      await component.onSubmit();

      expect(component.error()).toBe('Something went wrong');
      expect(component.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onVerify
  // ---------------------------------------------------------------------------

  describe('onVerify', () => {
    it('calls clerk.verifyEmail and navigates on success', async () => {
      component.verificationCode.set('123456');

      await component.onVerify();

      expect(mockClerk.verifyEmail).toHaveBeenCalledWith('123456');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('sets error on verification failure', async () => {
      component.verificationCode.set('000000');
      mockClerk.verifyEmail.mockRejectedValue(new Error('fail'));

      await component.onVerify();

      expect(component.error()).toBe('Something went wrong');
      expect(component.loading()).toBe(false);
    });

    it('clears error and verificationCodeError before verifying', async () => {
      component.error.set('previous error');
      component.verificationCodeError.set('previous code error');
      component.verificationCode.set('123456');

      await component.onVerify();

      expect(component.error()).toBe('');
      expect(component.verificationCodeError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onContinueWithGoogle
  // ---------------------------------------------------------------------------

  describe('onContinueWithGoogle', () => {
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
