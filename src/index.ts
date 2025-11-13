#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SendGridService } from './services/sendgrid.js';
import { getToolDefinitions, handleToolCall } from './tools/index.js';
import { formatSendGridError } from './utils/errors.js';

// Validate required environment variable
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is required');
}

// Initialize the SendGrid service
const sendGridService = new SendGridService(SENDGRID_API_KEY);

// Initialize MCP server
const server = new Server(
  {
    name: 'sendgrid-minimal-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getToolDefinitions(),
}));

/**
 * Handler for tool calls.
 * Routes each tool call to the appropriate SendGrid service method.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await handleToolCall(
      sendGridService,
      request.params.name,
      request.params.arguments
    );
  } catch (error: unknown) {
    console.error('SendGrid Error:', error);
    throw formatSendGridError(error);
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SendGrid Minimal MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

