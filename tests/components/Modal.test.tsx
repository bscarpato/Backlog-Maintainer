import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "../../renderer/src/components/Modal";

describe("Modal", () => {
  it("renders the title in the header", () => {
    render(
      <Modal title="My Modal" onClose={vi.fn()}>
        <p>Content here</p>
      </Modal>
    );
    expect(screen.getByText("My Modal")).toBeInTheDocument();
  });

  it("renders child content", () => {
    render(
      <Modal title="Test" onClose={vi.fn()}>
        <p>Hello from inside</p>
      </Modal>
    );
    expect(screen.getByText("Hello from inside")).toBeInTheDocument();
  });

  it("calls onClose when the close (✕) button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Test" onClose={onClose}>
        <p>body</p>
      </Modal>
    );
    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop overlay is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Test" onClose={onClose}>
        <p>body</p>
      </Modal>
    );
    // The overlay is the absolute-positioned div immediately inside the root
    const overlay = container.querySelector(".fixed > .absolute") as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Test" onClose={onClose}>
        <p>body</p>
      </Modal>
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose for non-Escape key presses", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Test" onClose={onClose}>
        <p>body</p>
      </Modal>
    );
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
