import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

import { ForgotPasswordPageComponent } from './forgot-password-page.component';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

type MockClerkService = {
  sendPasswordResetCode: jest.Mock<Promise<void>, [string]>;
  resetPassword: jest.Mock<Promise<void>, [string, string]>;
  extractError: jest.Mock<string, [unknown]>;
};

type MockRouter = {
  navigate: jest.Mock<Promise<boolean>, [string[]]>;
};

describe('ForgotPasswordPageComponent', () => {
  let component: ForgotPasswordPageComponent;
  let mockClerk: MockClerkService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockClerk = {
      sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      extractError: jest.fn().mockReturnValue('Something went wrong'),
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPageComponent],
      providers: [
        { provide: ClerkService, useValue: mockClerk },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(ForgotPasswordPageComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ForgotPasswordPageComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('clears password fields', () => {
      component.newPassword.set('secret');
      component.confirmPassword.set('secret');

      component.ngOnDestroy();

      expect(component.newPassword()).toBe('');
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

  describe('onCodeBlur', () => {
    it('does nothing (no validation needed)', () => {
      component.code.set('123');

      component.onCodeBlur();

      expect(component.codeError()).toBe('');
    });
  });

  describe('onNewPasswordBlur', () => {
    it('does nothing when password is empty', () => {
      component.onNewPasswordBlur();

      expect(component.newPasswordError()).toBe('');
    });

    it('sets error when password is too short', () => {
      component.newPassword.set('short');

      component.onNewPasswordBlur();

      expect(component.newPasswordError()).toBe('Must be at least 8 characters');
    });

    it('clears error when password is long enough', () => {
      component.newPassword.set('longpassword');

      component.onNewPasswordBlur();

      expect(component.newPasswordError()).toBe('');
    });
  });

  describe('onConfirmPasswordBlur', () => {
    it('does nothing when confirmPassword is empty', () => {
      component.onConfirmPasswordBlur();

      expect(component.confirmPasswordError()).toBe('');
    });

    it('sets error when passwords do not match', () => {
      component.newPassword.set('password1');
      component.confirmPassword.set('password2');

      component.onConfirmPasswordBlur();

      expect(component.confirmPasswordError()).toBe('Passwords do not match');
    });

    it('clears error when passwords match', () => {
      component.newPassword.set('password1');
      component.confirmPassword.set('password1');

      component.onConfirmPasswordBlur();

      expect(component.confirmPasswordError()).toBe('');
    });

    it('clears error when newPassword is empty', () => {
      component.confirmPassword.set('something');

      component.onConfirmPasswordBlur();

      expect(component.confirmPasswordError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onSendCode
  // ---------------------------------------------------------------------------

  describe('onSendCode', () => {
    it('sets email error when email is empty', async () => {
      await component.onSendCode();

      expect(component.emailError()).toBe('Email is required');
      expect(mockClerk.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('sets email error for invalid email', async () => {
      component.email.set('bad');

      await component.onSendCode();

      expect(component.emailError()).toBe('Please enter a valid email address');
      expect(mockClerk.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('sends password reset code on valid email', async () => {
      component.email.set('user@test.com');

      await component.onSendCode();

      expect(mockClerk.sendPasswordResetCode).toHaveBeenCalledWith('user@test.com');
      expect(component.codeSent()).toBe(true);
    });

    it('sets loading during the call', async () => {
      let loadingDuringCall = false;
      mockClerk.sendPasswordResetCode.mockImplementation(async () => {
        loadingDuringCall = component.loading();
      });
      component.email.set('user@test.com');

      await component.onSendCode();

      expect(loadingDuringCall).toBe(true);
      expect(component.loading()).toBe(false);
    });

    it('sets error on failure', async () => {
      component.email.set('user@test.com');
      mockClerk.sendPasswordResetCode.mockRejectedValue(new Error('fail'));

      await component.onSendCode();

      expect(component.error()).toBe('Something went wrong');
      expect(component.loading()).toBe(false);
      expect(component.codeSent()).toBe(false);
    });

    it('clears previous error before sending', async () => {
      component.error.set('previous error');
      component.email.set('user@test.com');

      await component.onSendCode();

      expect(component.error()).toBe('');
    });

    it('clears email error before sending', async () => {
      component.emailError.set('old error');
      component.email.set('user@test.com');

      await component.onSendCode();

      expect(component.emailError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onResetPassword — validation
  // ---------------------------------------------------------------------------

  describe('onResetPassword — validation', () => {
    it('sets code error when code is empty', async () => {
      component.newPassword.set('password1');
      component.confirmPassword.set('password1');

      await component.onResetPassword();

      expect(component.codeError()).toBe('Reset code is required');
      expect(mockClerk.resetPassword).not.toHaveBeenCalled();
    });

    it('sets password error when password is empty', async () => {
      component.code.set('123456');
      component.confirmPassword.set('password1');

      await component.onResetPassword();

      expect(component.newPasswordError()).toBe('Password is required');
    });

    it('sets password error when password is too short', async () => {
      component.code.set('123456');
      component.newPassword.set('short');
      component.confirmPassword.set('short');

      await component.onResetPassword();

      expect(component.newPasswordError()).toBe('Must be at least 8 characters');
    });

    it('sets confirmPassword error when empty', async () => {
      component.code.set('123456');
      component.newPassword.set('password1');

      await component.onResetPassword();

      expect(component.confirmPasswordError()).toBe('Please confirm your password');
    });

    it('sets confirmPassword error when passwords do not match', async () => {
      component.code.set('123456');
      component.newPassword.set('password1');
      component.confirmPassword.set('password2');

      await component.onResetPassword();

      expect(component.confirmPasswordError()).toBe('Passwords do not match');
    });
  });

  // ---------------------------------------------------------------------------
  // onResetPassword — success
  // ---------------------------------------------------------------------------

  describe('onResetPassword — success', () => {
    beforeEach(() => {
      component.code.set('123456');
      component.newPassword.set('newpass123');
      component.confirmPassword.set('newpass123');
    });

    it('calls clerk.resetPassword and navigates on success', async () => {
      await component.onResetPassword();

      expect(mockClerk.resetPassword).toHaveBeenCalledWith('123456', 'newpass123');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('sets loading to false after success', async () => {
      await component.onResetPassword();

      expect(component.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onResetPassword — error
  // ---------------------------------------------------------------------------

  describe('onResetPassword — error', () => {
    it('sets error on failure', async () => {
      component.code.set('123456');
      component.newPassword.set('newpass123');
      component.confirmPassword.set('newpass123');
      mockClerk.resetPassword.mockRejectedValue(new Error('fail'));

      await component.onResetPassword();

      expect(component.error()).toBe('Something went wrong');
      expect(component.loading()).toBe(false);
    });
  });
});
