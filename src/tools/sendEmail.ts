import { SendGridService } from '../services/sendgrid.js';

/**
 * Parameters for sending an email.
 */
export interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  template_id?: string;
  dynamic_template_data?: Record<string, unknown>;
}

/**
 * Response from sending an email.
 */
export interface SendEmailResult {
  success: boolean;
  message: string;
  statusCode?: number;
}

/**
 * Sends an email using SendGrid.
 *
 * @param service - SendGrid service instance
 * @param params - Email parameters
 * @returns Send email result
 */
export async function sendEmail(
  service: SendGridService,
  params: SendEmailParams
): Promise<SendEmailResult> {
  try {
    const response = await service.sendEmail(params);
    
    // Extract status code from SendGrid response
    const statusCode = Array.isArray(response) && response[0]?.statusCode 
      ? response[0].statusCode 
      : undefined;

    return {
      success: true,
      message: `Email sent successfully to ${params.to}`,
      statusCode,
    };
  } catch (error: unknown) {
    // SendGrid mail errors typically have a response.body.errors structure
    const apiError = error as { 
      response?: { 
        body?: { errors?: Array<{ message?: string; field?: string }> };
        statusCode?: number;
      };
      message?: string;
    };
    
    let errorMessage = 'Unknown error occurred';
    if (apiError.response?.body?.errors?.[0]?.message) {
      errorMessage = apiError.response.body.errors[0].message;
    } else if (apiError.message) {
      errorMessage = apiError.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: `Failed to send email: ${errorMessage}`,
      statusCode: apiError.response?.statusCode,
    };
  }
}

