import { inject, Injectable } from '@angular/core';

import { environment } from '@env';

import { ClerkService } from './clerk.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly clerk = inject(ClerkService);

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: BodyInit): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.clerk.getToken();
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${environment.apiUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? `Request failed (${response.status})`);
    }

    return response.json();
  }
}
