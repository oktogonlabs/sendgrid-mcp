import { SendGridService } from '../services/sendgrid.js';

/**
 * Parameters for email activity lookup.
 */
export interface GetEmailActivityParams {
  recipient: string;
  subject?: string;
}

/**
 * Summary of email activity for a recipient.
 */
export interface EmailActivitySummary {
  id: string;
  to: string;
  subject: string;
  status: string;
  last_event_time: string | null;
}

/**
 * Retrieves email activity for a recipient, optionally filtered by subject.
 * Builds a SendGrid query string and transforms the response into a simplified format.
 *
 * @param service - SendGrid service instance
 * @param params - Parameters containing recipient and optional subject filter
 * @returns Array of email activity summaries
 * @throws Error if recipient is not provided
 */
export async function getEmailActivity(
  service: SendGridService,
  { recipient, subject }: GetEmailActivityParams
): Promise<EmailActivitySummary[]> {
  if (!recipient) {
    throw new Error('recipient is required');
  }

  // Build SendGrid query string
  const queryParts = [`to_email="${recipient}"`];
  if (subject) {
    queryParts.push(`subject="${subject}"`);
  }
  const query = queryParts.join(' AND ');

  // Fetch activity from SendGrid
  const { messages = [] } = await service.getEmailActivity(query);

  // Transform and filter messages
  return messages
    .map((message) => ({
      id: message.msg_id ?? '',
      to: message.to_email ?? '',
      subject: message.subject ?? '',
      status: message.status ?? 'unknown',
      last_event_time: message.last_event_time ?? null,
    }))
    .filter((message) => message.id && message.to);
}

