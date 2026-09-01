import { describe, expect, test } from "bun:test";
import { loginFailure, networkLoginFailure } from "./login-feedback";

describe("login feedback", () => {
  test("does not reveal which credential was incorrect", () => {
    expect(loginFailure(401, { error: "INVALID_CREDENTIALS" })).toEqual({
      title: "We couldn’t sign you in",
      description: "Check your username and password, then try again.",
    });
  });

  test("keeps a server request ID available for support", () => {
    expect(
      loginFailure(500, {
        error: "LOGIN_FAILED",
        requestId: "request-123",
      }),
    ).toEqual({
      title: "Sign-in is temporarily unavailable",
      description:
        "Try again in a moment. If the problem continues, contact your Aamish administrator.",
      requestId: "request-123",
    });
  });

  test("uses actionable copy for network failures", () => {
    expect(networkLoginFailure.description).toContain("connection");
  });
});
