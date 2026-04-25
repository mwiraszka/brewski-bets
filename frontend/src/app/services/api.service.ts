import { Injectable, inject } from '@angular/core';

import { environment } from '@env';

import { ClerkService } from './clerk.service';

// Dev-only: artificial latency on every API request to preview loading states.
// Set to 0 to disable. Has no effect in production builds.
const DEV_ARTIFICIAL_DELAY_MS = 2000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly clerk = inject(ClerkService);

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: BodyInit | unknown): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(path, {
      method: 'POST',
      ...(isFormData || !body
        ? { body: body as BodyInit }
        : {
            headers: { 'Content-Type': 'application/json' },
            body: typeof body === 'string' ? body : JSON.stringify(body),
          }),
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async patch<T>(path: string, body: BodyInit | unknown): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(path, {
      method: 'PATCH',
      ...(isFormData
        ? { body }
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!environment.production && DEV_ARTIFICIAL_DELAY_MS > 0) {
      await new Promise(resolve => setTimeout(resolve, DEV_ARTIFICIAL_DELAY_MS));
    }

    const token = await this.clerk.getToken();
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${environment.apiUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new ApiError(
        error?.error ?? `Request failed (${response.status})`,
        response.status,
      );
    }

    return response.json();
  }
}
