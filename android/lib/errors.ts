import type { CombinedError } from 'urql';

/**
 * Convert a URQL CombinedError into a user-friendly message.
 * Hides internal GraphQL details and distinguishes network vs server errors.
 */
export function friendlyError(error: CombinedError): string {
  if (error.networkError) {
    return 'Unable to connect. Please check your internet and try again.';
  }

  const gqlMessage = error.graphQLErrors?.[0]?.message;
  if (gqlMessage) {
    // Pass through messages that are already user-facing from our backend
    const userFacing = [
      'Invalid or expired code',
      'Too many attempts',
      'User not found',
      'Email not found',
    ];
    if (userFacing.some((msg) => gqlMessage.includes(msg))) {
      return gqlMessage;
    }
  }

  return 'Something went wrong. Please try again.';
}
