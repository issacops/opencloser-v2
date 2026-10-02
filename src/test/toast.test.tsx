import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { Toast } from "../ui/components/Toast";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the toast message and type", () => {
    render(
      <Toast toast={{ id: "t1", type: "success", message: "Lead added" }} onDismiss={vi.fn()} />,
    );
    expect(screen.getByText("Lead added")).toBeInTheDocument();
  });

  it("auto-dismisses after 4 seconds", () => {
    const onDismiss = vi.fn();
    render(<Toast toast={{ id: "t1", type: "info", message: "Hello" }} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(onDismiss).toHaveBeenCalledWith("t1");
  });

  it("dismisses when the close button is clicked", () => {
    const onDismiss = vi.fn();
    render(<Toast toast={{ id: "t9", type: "error", message: "Boom" }} onDismiss={onDismiss} />);
    const closeBtn = screen.getByRole("button");
    fireEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledWith("t9");
  });

  it("keeps the toast until dismissed when timers have not elapsed", () => {
    const onDismiss = vi.fn();
    render(
      <Toast toast={{ id: "t2", type: "warning", message: "Careful" }} onDismiss={onDismiss} />,
    );
    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText("Careful")).toBeInTheDocument();
  });
});
