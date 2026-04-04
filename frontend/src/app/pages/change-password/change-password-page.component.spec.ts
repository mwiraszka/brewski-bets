import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

import { ChangePasswordPageComponent } from './change-password-page.component';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

type MockClerkService = {
  changePassword: jest.Mock<Promise<void>, [string, string]>;
  extractError: jest.Mock<string, [unknown]>;
};

type MockRouter = {
  navigate: jest.Mock<Promise<boolean>, [string[]]>;
};

describe('ChangePasswordPageComponent', () => {
  let component: ChangePasswordPageComponent;
  let mockClerk: MockClerkService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockClerk = {
      changePassword: jest.fn().mockResolvedValue(undefined),
      extractError: jest.fn().mockReturnValue('Something went wrong'),
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [ChangePasswordPageComponent],
      providers: [
        { provide: ClerkService, useValue: mockClerk },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(ChangePasswordPageComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ChangePasswordPageComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('clears all password fields', () => {
      component.currentPassword.set('old');
      component.newPassword.set('new');
      component.confirmPassword.set('new');

      component.ngOnDestroy();

      expect(component.currentPassword()).toBe('');
      expect(component.newPassword()).toBe('');
      expect(component.confirmPassword()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Blur handlers
  // ---------------------------------------------------------------------------

  describe('onCurrentPasswordBlur', () => {
    it('does nothing (no validation needed)', () => {
      component.currentPassword.set('x');

      component.onCurrentPasswordBlur();

      expect(component.currentPasswordError()).toBe('');
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
  // onSubmit — validation
  // ---------------------------------------------------------------------------

  describe('onSubmit — validation', () => {
    it('sets all errors when all fields are empty', async () => {
      await component.onSubmit();

      expect(component.currentPasswordError()).toBe('Current password is required');
      expect(component.newPasswordError()).toBe('New password is required');
      expect(component.confirmPasswordError()).toBe('Please confirm your password');
      expect(mockClerk.changePassword).not.toHaveBeenCalled();
    });

    it('sets password error when new password is too short', async () => {
      component.currentPassword.set('oldpass');
      component.newPassword.set('short');
      component.confirmPassword.set('short');

      await component.onSubmit();

      expect(component.newPasswordError()).toBe('Must be at least 8 characters');
    });

    it('sets confirmPassword error when passwords do not match', async () => {
      component.currentPassword.set('oldpass');
      component.newPassword.set('newpass123');
      component.confirmPassword.set('different');

      await component.onSubmit();

      expect(component.confirmPasswordError()).toBe('Passwords do not match');
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit — success
  // ---------------------------------------------------------------------------

  describe('onSubmit — success', () => {
    beforeEach(() => {
      component.currentPassword.set('oldpass123');
      component.newPassword.set('newpass123');
      component.confirmPassword.set('newpass123');
    });

    it('calls clerk.changePassword and navigates on success', async () => {
      await component.onSubmit();

      expect(mockClerk.changePassword).toHaveBeenCalledWith('oldpass123', 'newpass123');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('sets loading to false after success', async () => {
      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });

    it('clears error before submitting', async () => {
      component.error.set('previous error');

      await component.onSubmit();

      expect(component.error()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmit — error
  // ---------------------------------------------------------------------------

  describe('onSubmit — error', () => {
    it('sets error on failure', async () => {
      component.currentPassword.set('oldpass123');
      component.newPassword.set('newpass123');
      component.confirmPassword.set('newpass123');
      mockClerk.changePassword.mockRejectedValue(new Error('fail'));

      await component.onSubmit();

      expect(component.error()).toBe('Something went wrong');
      expect(component.loading()).toBe(false);
    });
  });
});
