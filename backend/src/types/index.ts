import type { Db } from '../db/index.js';

export interface AppBindings extends Record<string, string> {
  DATABASE_URL: string;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
}

export interface AppContext {
  Bindings: AppBindings;
  Variables: {
    clerkId: string;
    userId: string | undefined;
    db: Db;
  };
}
