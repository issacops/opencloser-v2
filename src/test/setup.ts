import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();
