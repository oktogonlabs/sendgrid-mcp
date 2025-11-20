# SendGrid Minimal MCP

<img src="assets/sendgrid-logo.png" width="256" height="256" alt="SendGrid Logo" />

A lean Model Context Protocol (MCP) server that exposes read-only SendGrid tools for email analytics and suppression checks. Designed for querying email statistics, activity, and suppression status.

## Features

- 📊 **Email Statistics** - Query email metrics for date ranges
- 📧 **Email Activity** - Look up email events for specific recipients
- 🚫 **Supression Status** - Check if email addresses are suppressed due to bounces or blocks
- 🔒 **Read-Only** - No sending, marketing, or contact management features
- 🎯 **Focused** - Minimal codebase focused on analytics use cases

## Prerequisites

- **Node.js 18+** - Required runtime
- **SendGrid API Key** - With the following scopes:
  - `Email Activity` (read) - For activity lookups
  - `Stats` (read) - For statistics queries
  - `Suppressions` (read) - For bounce/block status checks

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd sendgrid-mcp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your SENDGRID_API_KEY
```

## Usage

### Starting the Server

```bash
npm start
```

The server runs on stdio transport, suitable for MCP client integration.

### Development

```bash
# Watch mode for development
npm run watch

# Build TypeScript
npm run build

# Run tests
npm test

# Test with MCP Inspector
npm run inspector
```

## Docker

### Multi-Architecture Support

This project builds Docker images that support multiple architectures:
- `linux/amd64` - For most cloud servers and x86_64 systems
- `linux/arm64` - For Apple Silicon (M1/M2/M3) and ARM-based servers

### Using the Pre-built Image

The Docker image is automatically built and published to Docker Hub for both architectures:

```bash
# Pull the latest multi-arch image
docker pull joaomiguelinacio/sendgrid-mcp:latest

# Run the container
docker run -it --rm \
  -e SENDGRID_API_KEY=your-api-key \
  joaomiguelinacio/sendgrid-mcp:latest
```

The image will automatically match your system's architecture.

### Building Multi-Architecture Images Locally

#### Using the Build Script (Recommended)

A convenience script is provided for building multi-architecture images:

```bash
# Build for local platform only (quick test)
./build-docker.sh

# Build and push multi-arch image
PUSH=true ./build-docker.sh

# Custom image name and tag
IMAGE_NAME=my-registry/sendgrid-mcp TAG=v1.0.0 PUSH=true ./build-docker.sh
```

#### Manual Build with Docker Buildx

To build a multi-architecture image manually using Docker Buildx:

```bash
# Create and use a buildx builder (if not already created)
docker buildx create --name multiarch-builder --use
docker buildx inspect --bootstrap

# Build for multiple architectures and push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag joaomiguelinacio/sendgrid-mcp:latest \
  --push \
  .

# Or build and load for local architecture only
docker buildx build \
  --platform linux/amd64 \
  --load \
  --tag joaomiguelinacio/sendgrid-mcp:latest \
  .
```

### Building Single-Architecture Images

For a quick single-architecture build (your local platform):

```bash
# Standard build (single architecture)
docker build -t joaomiguelinacio/sendgrid-mcp:latest .

# Run the container
docker run -it --rm \
  -e SENDGRID_API_KEY=your-api-key \
  joaomiguelinacio/sendgrid-mcp:latest
```

### Automated Builds

The project uses GitHub Actions to automatically build and push multi-architecture images on:
- Pushes to the `main` branch
- Version tags (e.g., `v1.0.0`)
- Manual workflow triggers

The CI/CD pipeline uses Docker Buildx to create manifest lists that include both architectures.

#### Setting up GitHub Actions

To enable automated builds, configure the following secrets in your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following repository secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username (e.g., `joaomiguelinacio`)
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token

**Note:** For better security, use a Docker Hub [Access Token](https://docs.docker.com/docker-hub/access-tokens/) instead of your password.

Once configured, the workflow will automatically build and push multi-architecture images on every push to `main` or when you create a version tag.

## Available Tools

### `get_stats`

Retrieves SendGrid email statistics for a given date range.

**Parameters:**
- `start_date` (required) - Start date in `YYYY-MM-DD` format
- `end_date` (optional) - End date in `YYYY-MM-DD` format
- `aggregated_by` (optional) - Aggregation level: `day`, `week`, or `month`

**Example:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "aggregated_by": "day"
}
```

**Returns:** Array of date-aggregated statistics with metrics including opens, clicks, bounces, spam reports, deliveries, and more.

---

### `get_email_activity`

Fetches recent email activity for a specific recipient, optionally filtered by subject.

**Parameters:**
- `recipient` (required) - Email address to query
- `subject` (optional) - Subject line filter

**Example:**
```json
{
  "recipient": "user@example.com",
  "subject": "Welcome Email"
}
```

**Returns:** Array of email activity summaries with message ID, recipient, subject, status, and last event time.

---

### `get_suppression_status`

Checks if an email address is currently suppressed due to bounces or blocks. Checks both suppression types and returns the most relevant information.

**Parameters:**
- `email` (required) - Email address to check

**Example:**
```json
{
  "email": "bounced@example.com"
}
```

**Returns:** Suppression status object with:
- `suppressed` - Boolean indicating if email is suppressed
- `type` - `"bounce"` or `"block"` or `null`
- `reason` - Suppression reason message (if available)
- `status` - Status code (if available)
- `created` - ISO timestamp when suppression occurred
- `created_timestamp` - Unix timestamp
- `note` - Additional information if details are incomplete

## Project Structure

```
src/
├── index.ts                    # Main MCP server entry point
├── services/
│   └── sendgrid.ts            # SendGrid API client service
├── tools/
│   ├── index.ts               # Tool definitions and routing
│   ├── stats.ts               # Email statistics handler
│   ├── emailActivity.ts       # Email activity lookup handler
│   └── suppressionStatus.ts   # Suppression status handler
├── types/
│   └── index.ts               # TypeScript type definitions
└── utils/
    └── errors.ts              # Error handling utilities
```

## Architecture

The project follows a clean separation of concerns:

- **Services** - API client layer for SendGrid interactions
- **Tools** - MCP tool definitions and request handlers
- **Activity** - Business logic for specific operations
- **Types** - Shared TypeScript interfaces
- **Utils** - Reusable utility functions

All tools are read-only and use the SendGrid v3 REST API.

## Testing

The test suite includes:

- **Unit Tests** - Mocked SendGrid client for fast, isolated tests
- **Integration Tests** - Real API calls (requires `SENDGRID_API_KEY`)

```bash
# Run all tests
npm test

# Integration tests are skipped automatically if API key is missing
```

## Error Handling

The server provides consistent error handling:

- SendGrid API errors are formatted with clear messages
- Standard errors are wrapped in MCP error format
- Unknown errors return a generic message

All errors are logged to stderr for debugging.

## Contributing

Contributions welcome! Please ensure:

- Code follows existing patterns and style
- Tests are included and passing
- TypeScript types are properly defined
- Documentation is updated

## Support

For issues or questions:
- Check SendGrid API documentation for endpoint details
- Review MCP SDK documentation for protocol information
- Open an issue for bugs or feature requests
