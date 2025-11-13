import { Client } from '@sendgrid/client';
import sgMail from '@sendgrid/mail';
import type {
  SendGridBounce,
  SendGridBlock,
  SendGridEmailActivityResponse,
  SendGridStats,
} from '../types/index.js';

type ClientRequestOptions = Parameters<Client['request']>[0];

/**
 * Service for interacting with the SendGrid API.
 * Provides operations for sending emails, querying email statistics, activity, and suppression checks.
 */
export class SendGridService {
  private readonly client: Client;

  constructor(apiKey: string) {
    this.client = new Client();
    this.client.setApiKey(apiKey);
    sgMail.setApiKey(apiKey);
  }

  /**
   * Generic request wrapper that extracts the response body.
   */
  private async request<T>(options: ClientRequestOptions): Promise<T> {
    const [response] = await this.client.request(options);
    return response.body as T;
  }

  /**
   * Sends an email using SendGrid.
   *
   * @param params - Email parameters
   * @param params.to - Recipient email address
   * @param params.from - Sender email address (must be verified with SendGrid)
   * @param params.subject - Email subject line
   * @param params.text - Plain text content of the email
   * @param params.html - Optional HTML content of the email
   * @param params.template_id - Optional SendGrid template ID
   * @param params.dynamic_template_data - Optional dynamic data for template variables
   * @returns Promise resolving to SendGrid mail API response
   */
  async sendEmail(params: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html?: string;
    template_id?: string;
    dynamic_template_data?: Record<string, unknown>;
  }): Promise<unknown> {
    return await sgMail.send(params);
  }

  /**
   * Retrieves email statistics for a given date range.
   *
   * @param params - Statistics query parameters
   * @param params.start_date - Start date in YYYY-MM-DD format
   * @param params.end_date - Optional end date in YYYY-MM-DD format
   * @param params.aggregated_by - Optional aggregation level (day, week, month)
   * @returns Promise resolving to SendGrid statistics
   */
  async getStats(params: {
    start_date: string;
    end_date?: string;
    aggregated_by?: 'day' | 'week' | 'month';
  }): Promise<SendGridStats> {
    return this.request<SendGridStats>({
      method: 'GET',
      url: '/v3/stats',
      qs: params,
    });
  }

  /**
   * Retrieves email activity using a query string.
   *
   * @param query - SendGrid query string (e.g., 'to_email="user@example.com"')
   * @returns Promise resolving to email activity response
   */
  async getEmailActivity(query: string): Promise<SendGridEmailActivityResponse> {
    return this.request<SendGridEmailActivityResponse>({
      method: 'GET',
      url: '/v3/messages',
      qs: { query },
    });
  }

  /**
   * Retrieves bounce suppression information for an email address.
   *
   * @param email - Email address to check
   * @returns Promise resolving to bounce record or null if not suppressed
   */
  async getBounce(email: string): Promise<SendGridBounce | null> {
    return this.getSuppression<SendGridBounce>(
      email,
      '/v3/suppression/bounces'
    );
  }

  /**
   * Retrieves block suppression information for an email address.
   *
   * @param email - Email address to check
   * @returns Promise resolving to block record or null if not suppressed
   */
  async getBlock(email: string): Promise<SendGridBlock | null> {
    return this.getSuppression<SendGridBlock>(
      email,
      '/v3/suppression/blocks'
    );
  }

  /**
   * Generic method to retrieve suppression data (bounces or blocks).
   * Handles various response formats from SendGrid API:
   * - Empty array [] = suppressed but no detailed record
   * - Non-empty array = suppression record with full details
   * - Object = suppression record
   *
   * @param email - Email address to check
   * @param baseUrl - Base URL for the suppression endpoint
   * @returns Promise resolving to suppression record or null if not suppressed
   */
  private async getSuppression<T extends { email?: string }>(
    email: string,
    baseUrl: string
  ): Promise<T | null> {
    try {
      const [response] = await this.client.request({
        method: 'GET',
        url: `${baseUrl}/${encodeURIComponent(email)}`,
      });

      const body = response.body;

      // Handle array response
      if (Array.isArray(body)) {
        if (body.length === 0) {
          // Empty array = suppressed but no detailed record
          return { email } as T;
        }
        // Non-empty array = first element contains the suppression record
        return body[0] as T;
      }

      // Handle object response (normal case)
      if (body && typeof body === 'object') {
        return body as T;
      }

      // Unexpected response format
      return null;
    } catch (error: unknown) {
      const apiError = error as { response?: { statusCode?: number } };
      if (apiError.response?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}
