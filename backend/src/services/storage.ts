import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { AppBindings } from '../types/index.js';

function createClient(env: AppBindings): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export type AvatarVariant = 'original' | 'cropped';

function avatarKey(userId: string, variant: AvatarVariant): string {
  return `avatars/${userId}/${variant}`;
}

export async function uploadAvatar(
  env: AppBindings,
  userId: string,
  file: ArrayBuffer,
  contentType: string,
  variant: AvatarVariant = 'original',
): Promise<string> {
  const s3 = createClient(env);
  const key = avatarKey(userId, variant);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vercel's TS build cannot resolve S3Client.send()
  await (s3 as any).send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(file),
      ContentType: contentType,
    }),
  );

  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteAvatar(env: AppBindings, userId: string): Promise<void> {
  const s3 = createClient(env);

  await Promise.all(
    (['original', 'cropped'] as const).map(variant =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vercel's TS build cannot resolve S3Client.send()
      (s3 as any).send(
        new DeleteObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: avatarKey(userId, variant),
        }),
      ),
    ),
  );
}
