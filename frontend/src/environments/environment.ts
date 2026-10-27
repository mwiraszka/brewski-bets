export const environment = {
  production: false,
  clerkPublishableKey: 'pk_test_ZGFzaGluZy1nb2xkZmlzaC0zMy5jbGVyay5hY2NvdW50cy5kZXYk',
  apiUrl: 'http://localhost:3000/api',
  preview: null as { branch: string; commit: string; date: string; prUrl: string } | null,
  sentryDsn:
    'https://3e83776683e1442e921bf4afff939101@o4511323014234112.ingest.de.sentry.io/4512325510496336',
  sentryEnvironment: 'development',
};
