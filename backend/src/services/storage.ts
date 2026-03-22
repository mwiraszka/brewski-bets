import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { AppBindings } from '../types/index.js';

let client: S3Client | null = null;

function getClient(env: AppBindings): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function uploadAvatar(
  env: AppBindings,
  userId: string,
  file: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const s3 = getClient(env);
  const key = `avatars/${userId}/original`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(file),
      ContentType: contentType,
    }),
  );

  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteAvatar(
  env: AppBindings,
  userId: string,
): Promise<void> {
  const s3 = getClient(env);

  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: `avatars/${userId}/original`,
    }),
  );
}
