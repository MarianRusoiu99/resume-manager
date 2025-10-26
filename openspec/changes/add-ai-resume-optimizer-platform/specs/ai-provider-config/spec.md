# AI Provider Configuration & API Key Management

This specification defines the capabilities for managing AI provider configurations and user-supplied API keys (BYOK - Bring Your Own Key model).

## ADDED Requirements

### Requirement: API Key Storage

The system SHALL securely store user-provided API keys with encryption at rest.

#### Scenario: User adds OpenAI API key
- **Given** an authenticated user on the settings page
- **When** they enter their OpenAI API key
- **And** select the provider as "OpenAI"
- **And** submit the form
- **Then** the system encrypts the API key using AES-256-GCM
- **And** stores the encrypted key in the database
- **And** creates a key hash for validation
- **And** displays success message

#### Scenario: API key encrypted before storage
- **Given** a user submits an API key
- **When** the system processes the key
- **Then** it uses AES-256-GCM encryption algorithm
- **And** generates a unique initialization vector (IV)
- **And** stores encrypted key, IV, and auth tag
- **And** never logs the plaintext key

#### Scenario: API key hash stored for validation
- **Given** a user submits an API key
- **When** the system stores the key
- **Then** it creates a SHA-256 hash of the key
- **And** stores the hash separately from encrypted key
- **And** uses hash for quick validation without decryption

### Requirement: API Key Validation

The system SHALL validate API keys with the provider before storing them.

#### Scenario: Valid OpenAI API key accepted
- **Given** a user enters an OpenAI API key
- **When** they click "Validate Key"
- **Then** the system makes a test API call to OpenAI
- **And** uses a minimal request (e.g., list models)
- **And** confirms the key is valid and active
- **And** displays "API key validated successfully"
- **And** allows saving the key

#### Scenario: Invalid API key rejected
- **Given** a user enters an invalid API key
- **When** they attempt to validate or save
- **Then** the system makes a test API call
- **And** receives an authentication error
- **And** displays "Invalid API key"
- **And** does not store the key
- **And** suggests checking the key format

#### Scenario: Expired API key detected
- **Given** a user has a stored API key
- **When** the key expires or is revoked
- **And** the system attempts to use it
- **Then** the system detects the authentication failure
- **And** marks the key as inactive
- **And** notifies the user to update the key

### Requirement: API Key Management

The system SHALL allow users to manage multiple API keys per provider.

#### Scenario: User views saved API keys
- **Given** an authenticated user with saved API keys
- **When** they navigate to settings page
- **Then** the system displays a list of saved keys
- **And** shows only the last 4 characters of each key (e.g., "sk-...ABC123")
- **And** displays the provider name
- **And** shows active/inactive status
- **And** displays last used timestamp

#### Scenario: User sets active API key
- **Given** a user has multiple keys for same provider
- **When** they select a key and click "Set as Active"
- **Then** the system marks that key as active
- **And** marks other keys for same provider as inactive
- **And** uses the active key for AI operations

#### Scenario: User deletes API key
- **Given** a user has saved API keys
- **When** they click "Delete" on a key
- **And** confirm the deletion
- **Then** the system permanently removes the encrypted key
- **And** removes the key hash
- **And** updates the UI immediately
- **And** warns if it's the only active key

#### Scenario: User updates existing API key
- **Given** a user has a saved API key
- **When** they want to replace it
- **Then** they can enter a new key for the same provider
- **And** the system validates the new key
- **And** replaces the old encrypted key with new one
- **And** maintains the key's metadata (created date, etc.)

### Requirement: AI Provider Registry

The system SHALL maintain a registry of supported AI providers with their configurations.

#### Scenario: OpenAI provider registered
- **Given** the application initializes
- **When** the provider registry is loaded
- **Then** OpenAI is registered as a provider
- **And** provider configuration includes supported models (gpt-4o, gpt-4o-mini, gpt-4-turbo)
- **And** includes API endpoint URLs
- **And** includes validation requirements

#### Scenario: Provider configuration includes capabilities
- **Given** a provider is registered
- **When** provider details are accessed
- **Then** the configuration includes:
  - Provider ID (e.g., "openai")
  - Display name (e.g., "OpenAI")
  - Supported models with metadata
  - API key format validation regex
  - Rate limits and quotas
  - Pricing information (for display)

#### Scenario: System supports multiple providers (extensibility)
- **Given** the provider registry architecture
- **When** a new provider needs to be added
- **Then** the system supports adding new providers
- **And** each provider implements a common interface
- **And** provider-specific logic is encapsulated
- **Note**: v1 includes OpenAI only, architecture supports future providers

### Requirement: Model Selection

The system SHALL allow users to select which AI model to use from their provider.

#### Scenario: User selects AI model
- **Given** a user has an active OpenAI API key
- **When** they configure generation settings
- **Then** they can select from available models:
  - gpt-4o (default)
  - gpt-4o-mini
  - gpt-4-turbo
- **And** each model shows:
  - Performance characteristics
  - Cost per token
  - Recommended use cases

#### Scenario: Default model selected if not specified
- **Given** a user has not selected a specific model
- **When** they generate a resume
- **Then** the system uses the default model (gpt-4o)
- **And** displays which model was used in metadata

#### Scenario: Model selection persists as user preference
- **Given** a user selects a specific model
- **When** they generate resumes
- **Then** the system remembers their model preference
- **And** uses that model for subsequent generations
- **And** allows changing the preference at any time

### Requirement: API Key Security

The system SHALL implement comprehensive security measures for API key protection.

#### Scenario: API keys never exposed to client
- **Given** the application architecture
- **When** API keys are needed for AI operations
- **Then** keys are only accessed server-side
- **And** keys are never sent to the browser
- **And** keys are never included in API responses
- **And** keys are not logged in application logs

#### Scenario: API keys encrypted with unique keys
- **Given** the encryption system
- **When** API keys are encrypted
- **Then** the system uses a master encryption key from environment variables
- **And** master key is at least 256 bits
- **And** master key is rotated periodically (documented process)
- **And** each API key has unique IV

#### Scenario: Encryption key stored securely
- **Given** the production deployment
- **When** the application runs
- **Then** the master encryption key is stored in environment variables
- **And** environment variables are not committed to version control
- **And** production keys are managed through secure secrets management

#### Scenario: API key access audited
- **Given** an API key is used
- **When** AI operations occur
- **Then** the system logs the usage (without logging the key itself)
- **And** updates the lastUsedAt timestamp
- **And** tracks usage statistics for user dashboard

### Requirement: Provider Client Instantiation

The system SHALL create properly configured AI provider clients on demand.

#### Scenario: Create OpenAI client with user's key
- **Given** a user requests AI generation
- **And** they have an active OpenAI API key
- **When** the system needs to call OpenAI API
- **Then** it retrieves the encrypted key from database
- **And** decrypts the key
- **And** instantiates ChatOpenAI client with the decrypted key
- **And** configures the selected model
- **And** sets appropriate timeouts and retry logic

#### Scenario: Client creation fails without valid key
- **Given** a user requests AI generation
- **And** they have no active API key
- **When** the system attempts to create AI client
- **Then** it returns an error "No API key configured"
- **And** provides link to settings page
- **And** suggests adding an API key

#### Scenario: Client uses environment-specific configuration
- **Given** an AI client is being created
- **When** the client is instantiated
- **Then** it uses appropriate API endpoint (production vs staging)
- **And** sets timeout based on environment (30s prod, 60s dev)
- **And** configures retry logic (3 attempts with exponential backoff)

### Requirement: Rate Limiting & Quota Management

The system SHALL respect AI provider rate limits and track usage.

#### Scenario: Track token usage per request
- **Given** a resume generation request
- **When** the AI workflow completes
- **Then** the system records total tokens used
- **And** records prompt tokens and completion tokens separately
- **And** stores in generation metadata
- **And** updates user's usage statistics

#### Scenario: Handle rate limit errors gracefully
- **Given** a user makes frequent AI requests
- **When** the provider returns a rate limit error
- **Then** the system catches the error
- **And** displays "Rate limit reached. Please try again in a few moments"
- **And** suggests upgrading provider plan if needed
- **And** implements exponential backoff for retries

#### Scenario: Display usage statistics to user
- **Given** a user has generated resumes
- **When** they view their dashboard
- **Then** they can see total tokens used
- **And** approximate cost (based on provider pricing)
- **And** number of generations this month
- **And** breakdown by model used

### Requirement: Error Handling

The system SHALL handle API key and provider errors with clear user messaging.

#### Scenario: Handle insufficient quota error
- **Given** a user's API key has insufficient quota
- **When** they attempt to generate a resume
- **Then** the system catches the quota error
- **And** displays "Your API key has insufficient quota"
- **And** suggests adding credits to provider account
- **And** provides link to provider's billing page

#### Scenario: Handle network errors
- **Given** a generation request is made
- **When** network connection to provider fails
- **Then** the system retries up to 3 times with backoff
- **And** if all retries fail, displays "Unable to connect to AI provider"
- **And** suggests checking internet connection
- **And** allows retrying the request

#### Scenario: Handle malformed API key
- **Given** a user enters an API key
- **When** the key format is invalid (e.g., wrong prefix, length)
- **Then** the system detects the format issue
- **And** displays "API key format is invalid"
- **And** shows expected format (e.g., "OpenAI keys start with 'sk-'")
- **And** suggests checking the key from provider dashboard

## Implementation Notes

### Technology Stack
- **Encryption**: @noble/ciphers (AES-256-GCM)
- **LangChain**: @langchain/openai for OpenAI integration
- **Validation**: Zod schemas for API key formats
- **Storage**: PostgreSQL APIKey table

### Database Schema
```prisma
model APIKey {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  provider      String    // 'openai'
  encryptedKey  String    // AES-256-GCM encrypted
  keyHash       String    // SHA-256 hash
  isActive      Boolean   @default(true)
  lastUsedAt    DateTime?
  createdAt     DateTime  @default(now())
  
  @@index([userId, provider])
  @@index([userId, isActive])
}
```

### Provider Interface
```typescript
interface AIProvider {
  id: string;
  name: string;
  supportedModels: ModelConfig[];
  validateKey(key: string): Promise<boolean>;
  createClient(key: string, model: string): LLMClient;
}

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  costPerToken: { input: number; output: number };
}
```

### API Endpoints
- `GET /api/settings/api-keys` - List user's API keys (masked)
- `POST /api/settings/api-keys` - Add new API key
- `POST /api/settings/api-keys/:id/validate` - Validate a key
- `PATCH /api/settings/api-keys/:id` - Update key status
- `DELETE /api/settings/api-keys/:id` - Delete key
- `GET /api/settings/providers` - List available providers

### Security Considerations
1. Master encryption key stored in environment variable
2. Unique IV per encrypted API key
3. Keys never logged or exposed in API responses
4. Server-side only decryption
5. Audit trail for key usage
6. Rate limiting on key validation endpoints

### Testing Requirements
- Unit tests for encryption/decryption
- Unit tests for key validation
- Integration tests for API key CRUD
- Security tests for key exposure
- E2E tests for adding and using keys

## Cross-References
- Related to: **User Authentication** (requires authenticated user)
- Related to: **AI Resume Generation** (provides API keys for AI calls)
- Related to: **Provider Registry** (manages provider configurations)
