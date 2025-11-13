import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Warn if SENDGRID_API_KEY is missing so integration tests can be skipped gracefully.
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY environment variable is not set. SendGrid integration tests will be skipped.');
}
