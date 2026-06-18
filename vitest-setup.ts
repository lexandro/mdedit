import { afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";

// Unmount components rendered by @testing-library between tests.
afterEach(() => cleanup());
