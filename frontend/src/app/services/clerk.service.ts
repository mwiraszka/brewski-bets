import { Clerk } from '@clerk/clerk-js';

import { Injectable, signal } from '@angular/core';

import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class ClerkService {
  private clerk!: Clerk;

  readonly isLoaded = signal(false);
  readonly isLoggedIn = signal(false);
  readonly user = signal<Clerk['user']>(null, { equal: () => false });

  async load(): Promise<void> {
    this.clerk = new Clerk(environment.clerkPublishableKey);
    await this.clerk.load();
    this.syncState();

    this.clerk.addListener(() => this.syncState());
  }

  get client() {
    return this.clerk;
  }

  async createAccount(
    emailAddress: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<{ needsVerification: boolean }> {
    const signUp = await this.clerk.client!.signUp.create({
      emailAddress,
      password,
      firstName,
      lastName,
    });

    if (signUp.status === 'complete') {
      await this.clerk.setActive({ session: signUp.createdSessionId });
      return { needsVerification: false };
    }

    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    return { needsVerification: true };
  }

  async verifyEmail(code: string): Promise<void> {
    const result = await this.clerk.client!.signUp.attemptEmailAddressVerification({
      code,
    });

    if (result.status === 'complete') {
      await this.clerk.setActive({ session: result.createdSessionId });
    }
  }

  async logIn(identifier: string, password: string): Promise<void> {
    const result = await this.clerk.client!.signIn.create({
      strategy: 'password',
      identifier,
      password,
    });

    if (result.status === 'complete') {
      await this.clerk.setActive({ session: result.createdSessionId });
    }
  }

  async continueWithGoogle(): Promise<void> {
    await this.clerk.client!.signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    });
  }

  async handleSSOCallback(): Promise<void> {
    await this.clerk.handleRedirectCallback({
      signInForceRedirectUrl: '/',
      signUpForceRedirectUrl: '/',
    });
  }

  async logOut(): Promise<void> {
    await this.clerk.signOut();
  }

  async sendPasswordResetCode(email: string): Promise<void> {
    await this.clerk.client!.signIn.create({
      strategy: 'reset_password_email_code',
      identifier: email,
    });
  }

  async resetPassword(code: string, password: string): Promise<void> {
    const result = await this.clerk.client!.signIn.attemptFirstFactor({
      strategy: 'reset_password_email_code',
      code,
      password,
    });

    if (result.status === 'complete') {
      await this.clerk.setActive({ session: result.createdSessionId });
    }
  }

  async reloadUser(): Promise<void> {
    await this.clerk.user?.reload();
  }

  async getToken(): Promise<string | null> {
    return this.clerk.session?.getToken() ?? null;
  }

  async updateProfile(firstName: string, lastName: string): Promise<void> {
    await this.clerk.user!.update({ firstName, lastName });
  }

  async setProfileImage(file: Blob | null): Promise<string | undefined> {
    await this.clerk.user!.setProfileImage({ file });
    return this.clerk.user?.imageUrl ?? undefined;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.clerk.user!.updatePassword({ currentPassword, newPassword });
  }

  extractError(e: unknown): string {
    if (e && typeof e === 'object' && 'errors' in e) {
      const errors = (e as { errors: Array<{ code?: string; longMessage?: string }> })
        .errors;
      const error = errors[0];
      return this.friendlyMessage(error?.code, error?.longMessage);
    }
    return 'Something went wrong, please try again';
  }

  private friendlyMessage(code?: string, fallback?: string): string {
    const messages: Record<string, string> = {
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

    if (code && messages[code]) {
      return messages[code];
    }

    return fallback?.replace(/\.$/, '') ?? 'Something went wrong, please try again';
  }

  private syncState(): void {
    this.isLoaded.set(true);
    this.isLoggedIn.set(!!this.clerk.user);
    this.user.set(this.clerk.user ?? null);
  }
}
