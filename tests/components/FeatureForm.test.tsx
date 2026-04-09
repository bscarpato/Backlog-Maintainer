import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FeatureForm } from "../../renderer/src/components/FeatureForm";

function getSubmit() {
  return screen.getByRole("button", { name: /salvar/i });
}

function getCancelButton() {
  return screen.getByRole("button", { name: /cancelar/i });
}

describe("FeatureForm", () => {
  it("renders the title input", () => {
    render(<FeatureForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText(/nome da feature/i)).toBeInTheDocument();
  });

  it("renders the description textarea", () => {
    render(<FeatureForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText(/contexto, objetivos/i)).toBeInTheDocument();
  });

  it("renders all four status options", () => {
    render(<FeatureForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByRole("combobox");
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toContain("a_iniciar");
    expect(options).toContain("in_progress");
    expect(options).toContain("completed");
    expect(options).toContain("archived");
  });

  it("defaults to status 'a_iniciar'", () => {
    render(<FeatureForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("a_iniciar");
  });

  it("pre-fills fields when initial data is supplied", () => {
    const initial = {
      title: "Existing Feature",
      description: "Existing description",
      status: "in_progress" as const
    };
    render(<FeatureForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect((screen.getByPlaceholderText(/nome da feature/i) as HTMLInputElement).value).toBe(
      "Existing Feature"
    );
    expect(
      (screen.getByPlaceholderText(/contexto, objetivos/i) as HTMLTextAreaElement).value
    ).toBe("Existing description");
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("in_progress");
  });

  it("calls onSubmit with the form data when submitted", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<FeatureForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/nome da feature/i), {
      target: { value: "New Feature" }
    });
    fireEvent.change(screen.getByPlaceholderText(/contexto, objetivos/i), {
      target: { value: "Some context" }
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "in_progress" }
    });

    fireEvent.submit(getSubmit().closest("form")!);

    // Wait for async onSubmit
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      title: "New Feature",
      description: "Some context",
      status: "in_progress"
    });
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<FeatureForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(getCancelButton());
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
