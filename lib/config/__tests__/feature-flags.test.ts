import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isClassroomShellEnabled, isClassroomShellInjected } from '../feature-flags';

describe('classroom shell feature flag', () => {
  const originalEnv = process.env;
  beforeEach(() => { process.env = { ...originalEnv }; });
  afterEach(() => { process.env = originalEnv; });

  it('defaults to disabled', () => {
    delete process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED;
    expect(isClassroomShellEnabled()).toBe(false);
  });

  it('enables when NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED=true', () => {
    process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED = 'true';
    expect(isClassroomShellEnabled()).toBe(true);
  });

  it('isClassroomShellInjected = enabled AND existing piChat', () => {
    process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED = 'true';
    process.env.NEXT_PUBLIC_PI_CHAT_ENABLED = 'true';
    expect(isClassroomShellInjected()).toBe(true);
  });
});