import { SendGridService } from '../services/sendgrid.js';
import type { SendGridBounce, SendGridBlock } from '../types/index.js';

export interface SuppressionStatusParams {
  email: string;
}

export interface SuppressionStatusResult {
  email: string;
  suppressed: boolean;
  type: 'bounce' | 'block' | null;
  reason: string | null;
  status: string | null;
  created: string | null;
  created_timestamp: number | null;
  note?: string;
}

/**
 * Determines if a suppression record has meaningful data.
 */
function hasSuppressionData(
  suppression: SendGridBounce | SendGridBlock | null
): boolean {
  if (!suppression) return false;
  return (
    suppression.reason !== undefined ||
    suppression.status !== undefined ||
    suppression.created !== undefined
  );
}

/**
 * Retrieves suppression status for an email address.
 * Checks both bounce and block suppressions, prioritizing records with actual data.
 *
 * @param service - SendGrid service instance
 * @param params - Parameters containing the email address
 * @returns Suppression status result
 */
export async function getSuppressionStatus(
  service: SendGridService,
  params: SuppressionStatusParams
): Promise<SuppressionStatusResult> {
  const { email } = params;

  // Check both bounces and blocks in parallel
  const [bounce, block] = await Promise.all([
    service.getBounce(email),
    service.getBlock(email),
  ]);

  // If neither exists, return not suppressed
  if (!bounce && !block) {
    return {
      email,
      suppressed: false,
      type: null,
      reason: null,
      status: null,
      created: null,
      created_timestamp: null,
      note: 'No bounce or block suppression found',
    };
  }

  // Determine which suppression to use (prioritize records with data, prefer blocks)
  const suppression: SendGridBounce | SendGridBlock | null =
    hasSuppressionData(block)
      ? block
      : hasSuppressionData(bounce)
        ? bounce
        : block || bounce;

  const suppressionType: 'bounce' | 'block' =
    suppression === block ? 'block' : 'bounce';

  // Build result with all fields
  const result: SuppressionStatusResult = {
    email: suppression?.email || email,
    suppressed: true,
    type: suppressionType,
    reason: suppression?.reason ?? null,
    status: suppression?.status ?? null,
    created: suppression?.created
      ? new Date(suppression.created * 1000).toISOString()
      : null,
    created_timestamp: suppression?.created ?? null,
  };

  // Add note if critical fields are missing
  if (!hasSuppressionData(suppression)) {
    result.note = `${suppressionType === 'block' ? 'Block' : 'Bounce'} suppression exists but detailed information (reason, status, timestamp) is not available. This may occur if the suppression data is incomplete in SendGrid or if the API key lacks sufficient permissions.`;
  }

  return result;
}

