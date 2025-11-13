/**
 * Type definitions for SendGrid API responses used by this MCP server.
 * All types represent read-only data from the SendGrid v3 REST API.
 */

/**
 * SendGrid statistics response structure.
 * Contains email metrics aggregated by date.
 */
export interface SendGridStats extends Array<{
  date: string;
  stats: Array<{
    metrics: {
      opens: number;
      clicks: number;
      bounces: number;
      spam_reports: number;
      unique_opens: number;
      unique_clicks: number;
      blocks: number;
      delivered: number;
      bounce_drops?: number;
      deferred?: number;
      invalid_emails?: number;
      processed?: number;
      requests?: number;
      spam_report_drops?: number;
      unsubscribe_drops?: number;
      unsubscribes?: number;
    };
  }>;
}> {}

/**
 * Individual email activity message from SendGrid.
 */
export interface SendGridEmailActivityMessage {
  msg_id?: string;
  to_email?: string;
  subject?: string;
  status?: string;
  last_event_time?: string;
}

/**
 * SendGrid email activity API response.
 */
export interface SendGridEmailActivityResponse {
  messages: SendGridEmailActivityMessage[];
}

/**
 * SendGrid bounce suppression record.
 * Represents an email address that has bounced and been suppressed.
 */
export interface SendGridBounce {
  email?: string;
  created?: number; // Unix timestamp
  reason?: string; // Bounce reason message
  status?: string; // Bounce status code
}

/**
 * SendGrid block suppression record.
 * Represents an email address that has been blocked and suppressed.
 */
export interface SendGridBlock {
  email?: string;
  created?: number; // Unix timestamp
  reason?: string; // Block reason message
  status?: string; // Block status code
}
