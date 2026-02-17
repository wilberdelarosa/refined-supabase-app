# Security Best Practices

## Input Validation

All user inputs must be validated and sanitized before processing:

```typescript
import { sanitizeInput, isValidEmail } from "@/lib/sanitize";

// Sanitize text input
const cleanInput = sanitizeInput(userInput);

// Validate email
if (!isValidEmail(email)) {
  throw new Error("Invalid email format");
}
```

## Rate Limiting

Implement rate limiting for sensitive operations:

```typescript
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limiter";

// Check rate limit before API call
if (!rateLimiter.check("api:products", RATE_LIMITS.API_CALL)) {
  const resetTime = rateLimiter.getTimeUntilReset("api:products");
  throw new Error(`Rate limit exceeded. Try again in ${resetTime}ms`);
}
```

## Error Handling

Use ErrorBoundary for graceful error handling:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Logging

Use structured logging for debugging and monitoring:

```typescript
import { logger } from "@/lib/logger";

// Log user actions
logger.userAction("product_purchased", { productId, amount });

// Log API calls
logger.apiCall("GET", "/api/products");

// Log errors
logger.error("Failed to load products", error, { userId });
```

## CSRF Protection

- All state-changing requests must include CSRF tokens
- Use Supabase's built-in CSRF protection
- Verify Origin header on sensitive endpoints

## XSS Prevention

- Always sanitize user input before rendering
- Use React's built-in XSS protection (don't use dangerouslySetInnerHTML)
- Escape HTML in user-generated content

## SQL Injection Prevention

- Use Supabase's parameterized queries
- Never concatenate user input into SQL queries
- Validate all inputs before database operations

## Authentication

- Use Supabase Auth for authentication
- Implement MFA for admin accounts
- Use secure session management
- Implement proper password policies

## Secrets Management

- Never commit secrets to git
- Use environment variables for sensitive data
- Rotate API keys regularly
- Use different keys for dev/staging/production

## Security Headers

Ensure these headers are set in production:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Monitoring

- Monitor for suspicious activity
- Set up alerts for rate limit violations
- Track failed authentication attempts
- Log all security-relevant events
