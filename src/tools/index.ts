import { SendGridService } from '../services/sendgrid.js';
import { getStats } from './stats.js';
import { getEmailActivity } from './emailActivity.js';
import { getSuppressionStatus } from './suppressionStatus.js';
import { sendEmail } from './sendEmail.js';

/**
 * Tool definitions for the SendGrid MCP server.
 * Each tool corresponds to a SendGrid API operation.
 */
export const getToolDefinitions = () => [
  {
    name: 'send_email',
    description: 'Send an email using SendGrid',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address',
        },
        from: {
          type: 'string',
          description: 'Sender email address (must be verified with SendGrid)',
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        text: {
          type: 'string',
          description: 'Plain text content of the email',
        },
        html: {
          type: 'string',
          description: 'HTML content of the email (optional)',
        },
        template_id: {
          type: 'string',
          description: 'SendGrid template ID (optional)',
        },
        dynamic_template_data: {
          type: 'object',
          description: 'Dynamic data for template variables (optional)',
        },
      },
      required: ['to', 'from', 'subject', 'text'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get SendGrid email statistics for a given date range',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
        aggregated_by: {
          type: 'string',
          enum: ['day', 'week', 'month'],
          description: 'Aggregate level for the statistics (optional)',
        },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_email_activity',
    description: 'Retrieve recent email activity for a SendGrid recipient, optionally filtered by subject',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'Recipient email address to query',
        },
        subject: {
          type: 'string',
          description: 'Optional subject filter',
        },
      },
      required: ['recipient'],
    },
  },
  {
    name: 'get_suppression_status',
    description:
      'Check if an email address is currently suppressed due to a bounce or block. Returns suppression details including reason, status code, and timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address to check for bounce or block suppression',
        },
      },
      required: ['email'],
    },
  },
];

/**
 * Creates a text content response for MCP tool calls.
 */
function createTextResponse(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Handles tool calls by routing them to the appropriate service method.
 *
 * @param service - SendGrid service instance
 * @param name - Name of the tool to call
 * @param args - Arguments for the tool
 * @returns MCP tool response
 */
export async function handleToolCall(
  service: SendGridService,
  name: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'send_email': {
      const result = await sendEmail(service, args as { to: string; from: string; subject: string; text: string; html?: string; template_id?: string; dynamic_template_data?: Record<string, unknown> });
      return createTextResponse(result);
    }

    case 'get_stats': {
      const stats = await getStats(service, args as { start_date: string; end_date?: string; aggregated_by?: 'day' | 'week' | 'month' });
      return createTextResponse(stats);
    }

    case 'get_email_activity': {
      const activity = await getEmailActivity(service, args as { recipient: string; subject?: string });
      return createTextResponse(activity);
    }

    case 'get_suppression_status': {
      const status = await getSuppressionStatus(service, args as { email: string });
      return createTextResponse(status);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
