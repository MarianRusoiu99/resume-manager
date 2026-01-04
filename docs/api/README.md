# API Documentation

This document provides an overview of the Resume Optimizer API endpoints.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

All API endpoints (except public ones) require authentication via NextAuth.js session cookies.

### Session-Based Authentication

The API uses NextAuth.js for authentication. After logging in through the web interface, your session cookie will be automatically included in requests.

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes
- **Resume generation**: 5 requests per minute
- **General API**: 30 requests per minute
- **PDF export**: 10 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until you can retry (when rate limited)

## Common Response Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Error Response Format

```json
{
  "error": "Error message",
  "details": {
    "field": "Validation error message"
  },
  "requestId": "req_abc123"
}
```

## API Endpoints

### Authentication

#### POST /api/auth/signin
Login to the application

#### POST /api/auth/signout
Logout from the application

### Profiles (Master Resumes)

#### GET /api/profiles
Get all profiles for the authenticated user

**Response:**
```json
{
  "profiles": [
    {
      "id": "profile_id",
      "name": "My Resume",
      "isDefault": true,
      "resume": { /* JSON Resume format */ },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/profiles
Create a new profile

**Request:**
```json
{
  "name": "My Resume",
  "resume": { /* JSON Resume format */ },
  "isDefault": false
}
```

#### PUT /api/profiles/:id
Update a profile

#### DELETE /api/profiles/:id
Delete a profile

### Generated Resumes

#### GET /api/resumes
Get all generated resumes for the authenticated user

**Query Parameters:**
- `limit` (optional): Number of items per page (default: 100, max: 100)
- `offset` (optional): Number of items to skip (default: 0)

**Response:**
```json
{
  "resumes": [
    {
      "id": "resume_id",
      "resume": { /* JSON Resume format */ },
      "jobPosting": {
        "description": "Job description",
        "title": "Job Title",
        "company": { "name": "Company Name" }
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/resumes/generate
Generate a tailored resume for a job posting

**Request:**
```json
{
  "profileId": "profile_id",
  "jobDescription": "Job description text",
  "jobMetadata": {
    "title": "Software Engineer",
    "companyName": "Tech Corp"
  },
  "templateId": "template_id" // optional
}
```

**Rate Limit:** 5 requests per minute

#### GET /api/resumes/:id
Get a specific resume

#### PUT /api/resumes/:id
Update a resume

#### DELETE /api/resumes/:id
Delete a resume

### Export

#### POST /api/resumes/:id/export/pdf
Export a resume as PDF

**Request:**
```json
{
  "templateId": "template_id" // optional
}
```

**Response:** PDF file

**Rate Limit:** 10 requests per minute

#### POST /api/resumes/:id/export/json
Export a resume as JSON

**Response:** JSON Resume format

### Cover Letters

#### GET /api/cover-letters
Get all cover letters for the authenticated user

**Query Parameters:**
- `limit` (optional): Number of items per page (default: 100, max: 100)
- `offset` (optional): Number of items to skip (default: 0)

#### POST /api/cover-letters/generate
Generate a cover letter

**Request:**
```json
{
  "resumeId": "resume_id",
  "jobPostingId": "job_posting_id"
}
```

#### GET /api/cover-letters/:id
Get a specific cover letter

#### PUT /api/cover-letters/:id
Update a cover letter

#### DELETE /api/cover-letters/:id
Delete a cover letter

### AI Settings

#### GET /api/ai-settings
Get AI settings for the authenticated user

#### PUT /api/ai-settings
Update AI settings

**Request:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "apiKey": "encrypted_api_key"
}
```

### Health Check

#### GET /api/health
Check API health status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## Pagination

Endpoints that return lists support pagination through `limit` and `offset` query parameters:

- `limit`: Maximum number of items to return (default: 100, max: 100)
- `offset`: Number of items to skip (default: 0)

Example:
```
GET /api/resumes?limit=50&offset=100
```

## Data Formats

### JSON Resume

This API uses the [JSON Resume](https://jsonresume.org/) format for resume data. See the schema at:
https://jsonresume.org/schema

## Security

- All API keys are encrypted at rest using AES-256-GCM
- Sensitive fields are automatically redacted in logs
- HTTPS is required in production
- Rate limiting prevents abuse
- Input validation prevents injection attacks

## Support

For issues or questions, please file an issue on GitHub or consult the main documentation.
