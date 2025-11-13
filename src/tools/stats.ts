import { SendGridService } from '../services/sendgrid.js';
import type { SendGridStats } from '../types/index.js';

/**
 * Parameters for email statistics query.
 */
export interface GetStatsParams {
  start_date: string;
  end_date?: string;
  aggregated_by?: 'day' | 'week' | 'month';
}

/**
 * Retrieves email statistics for a given date range.
 * This is a simple pass-through to the SendGrid service.
 *
 * @param service - SendGrid service instance
 * @param params - Statistics query parameters
 * @returns SendGrid statistics response
 */
export async function getStats(
  service: SendGridService,
  params: GetStatsParams
): Promise<SendGridStats> {
  return service.getStats(params);
}

