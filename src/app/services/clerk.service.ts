import { Clerk } from '@clerk/clerk-js';

import { Injectable, signal } from '@angular/core';

import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class ClerkService {
  private clerk!: Clerk;

  readonly isLoaded = signal(false);
  readonly isSignedIn = signal(false);
  readonly user = signal<Clerk['user']>(null);

  async load(): Promise<void> {
    this.clerk = new Clerk(environment.clerkPublishableKey);
    await this.clerk.load();
    this.syncState();

    this.clerk.addListener(() => this.syncState());
  }

  get client() {
    return this.clerk;
  }

  async signUp(
    emailAddress: string,
    password: string,
  ): Promise<{ needsVerification: boolean }> {
    const signUp = await this.clerk.client!.signUp.create({
      emailAddress,
      password,
    });

    if (signUp.status === 'complete') {
      await this.clerk.setActive({ session: signUp.createdSessionId });
      return { needsVerification: false };
    }

    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    return { needsVerification: true };
  }

  async verifyEmail(code: string): Promise<void> {
    const result =
      await this.clerk.client!.signUp.attemptEmailAddressVerification({
        code,
      });

    if (result.status === 'complete') {
      await this.clerk.setActive({ session: result.createdSessionId });
    }
  }

  async signIn(identifier: string, password: string): Promise<void> {
    const result = await this.clerk.client!.signIn.create({
      strategy: 'password',
      identifier,
      password,
    });

    if (result.status === 'complete') {
      await this.clerk.setActive({ session: result.createdSessionId });
    }
  }

  async signOut(): Promise<void> {
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

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.clerk.user!.updatePassword({ currentPassword, newPassword });
  }

  private syncState(): void {
    this.isLoaded.set(true);
    this.isSignedIn.set(!!this.clerk.user);
    this.user.set(this.clerk.user ?? null);
  }
}
