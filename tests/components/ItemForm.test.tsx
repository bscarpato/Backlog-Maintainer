import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ItemForm } from "../../renderer/src/components/ItemForm";
import type { TeamMember } from "../../shared/types";

const members: TeamMember[] = [
  { id: 1, name: "Alice", created_at: "2024-01-01" },
  { id: 2, name: "Bruno", created_at: "2024-01-02" }
];

function getForm() {
  return screen.getByRole("button", { name: /salvar/i }).closest("form")!;
}

describe("ItemForm", () => {
  it("renders the title input", () => {
    render(<ItemForm members={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText(/descreva o que precisa ser feito/i)).toBeInTheDocument();
  });

  it("renders the description textarea", () => {
    render(<ItemForm members={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText(/crit[eé]rios de aceite/i)).toBeInTheDocument();
  });

  it("renders a 'Ninguém' option plus all provided members in the assignee dropdown", () => {
    render(<ItemForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    // The assignee select is the first combobox (Status and Priority are the 2nd and 3rd)
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const assigneeSelect = selects[0];
    const optionValues = Array.from(assigneeSelect.options).map((o) => o.value);
    expect(optionValues).toContain(""); // "Ninguém"
    expect(optionValues).toContain("1"); // Alice
    expect(optionValues).toContain("2"); // Bruno
  });

  it("renders the three status options", () => {
    render(<ItemForm members={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const statusSelect = selects[1];
    const values = Array.from(statusSelect.options).map((o) => o.value);
    expect(values).toEqual(["todo", "doing", "done"]);
  });

  it("renders the three priority options", () => {
    render(<ItemForm members={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const prioritySelect = selects[2];
    const values = Array.from(prioritySelect.options).map((o) => o.value);
    expect(values).toEqual(["high", "medium", "low"]);
  });

  it("defaults status to 'todo' and priority to 'medium'", () => {
    render(<ItemForm members={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects[1].value).toBe("todo");
    expect(selects[2].value).toBe("medium");
  });

  it("pre-fills fields when initial data is supplied", () => {
    const initial = {
      title: "Existing Item",
      description: "Existing desc",
      status: "doing" as const,
      priority: "high" as const,
      assignee_id: 1
    };
    render(<ItemForm members={members} initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(
      (screen.getByPlaceholderText(/descreva o que precisa ser feito/i) as HTMLInputElement).value
    ).toBe("Existing Item");

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects[0].value).toBe("1"); // assignee Alice
    expect(selects[1].value).toBe("doing");
    expect(selects[2].value).toBe("high");
  });

  it("shows the Avatar preview when an assignee is selected", () => {
    render(<ItemForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];

    fireEvent.change(selects[0], { target: { value: "1" } });

    // Avatar renders a span with title = member name
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
  });

  it("calls onSubmit with correct data when the form is submitted", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ItemForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/descreva o que precisa ser feito/i), {
      target: { value: "New task" }
    });
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    fireEvent.change(selects[0], { target: { value: "2" } }); // Bruno
    fireEvent.change(selects[1], { target: { value: "doing" } });
    fireEvent.change(selects[2], { target: { value: "high" } });

    fireEvent.submit(getForm());

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      title: "New task",
      description: "",
      status: "doing",
      priority: "high",
      assignee_id: 2
    });
  });

  it("submits assignee_id as null when no member is selected", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ItemForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/descreva o que precisa ser feito/i), {
      target: { value: "Task" }
    });

    fireEvent.submit(getForm());

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].assignee_id).toBeNull();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<ItemForm members={[]} onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
