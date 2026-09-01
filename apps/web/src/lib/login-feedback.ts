export type LoginPayload = {
  error?: string;
  redirectTo?: unknown;
  requestId?: string;
};

export type LoginFailure = {
  title: string;
  description: string;
  requestId?: string;
};

export function loginFailure(
  status: number,
  payload: LoginPayload,
): LoginFailure {
  if (status === 401 && payload.error === "INVALID_CREDENTIALS") {
    return {
      title: "We couldn’t sign you in",
      description: "Check your username and password, then try again.",
    };
  }

  return {
    title: "Sign-in is temporarily unavailable",
    description:
      "Try again in a moment. If the problem continues, contact your Aamish administrator.",
    requestId: payload.requestId,
  };
}

export const networkLoginFailure: LoginFailure = {
  title: "We couldn’t reach Aamish",
  description: "Check your connection and try signing in again.",
};
