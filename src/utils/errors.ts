import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

interface SendGridApiError {
  response?: {
    body?: {
      errors?: Array<{ message: string }>;
    };
  };
}

/**
 * Formats SendGrid API errors into user-friendly MCP errors.
 */
export function formatSendGridError(error: unknown): McpError {
  // Handle SendGrid API errors
  const apiError = error as SendGridApiError;
  if (apiError.response?.body?.errors) {
    const messages = apiError.response.body.errors
      .map((e) => e.message)
      .join(', ');
    return new McpError(ErrorCode.InternalError, `SendGrid API Error: ${messages}`);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new McpError(ErrorCode.InternalError, error.message);
  }

  // Handle unknown errors
  return new McpError(ErrorCode.InternalError, 'An unexpected error occurred');
}

