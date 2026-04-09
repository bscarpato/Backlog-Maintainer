import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Dashboard } from "../../renderer/src/pages/Dashboard";
import type { FeatureSummary } from "../../shared/types";

function makeFeature(overrides: Partial<FeatureSummary> = {}): FeatureSummary {
  return {
    id: Math.floor(Math.random() * 10_000),
    title: "Feature",
    description: "",
    status: "in_progress",
    created_at: new Date().toISOString(),
    item_count: 0,
    done_count: 0,
    progress_percent: 0,
    ...overrides
  };
}

const defaultProps = {
  onOpenFeature: vi.fn(),
  onCreateFeature: vi.fn(),
  onEditFeature: vi.fn(),
  onDeleteFeature: vi.fn<[number], Promise<void>>().mockResolvedValue(undefined)
};

describe("Dashboard — empty state", () => {
  it("shows the empty state message when there are no features", () => {
    render(<Dashboard features={[]} {...defaultProps} />);
    expect(screen.getByText(/backlog vazio/i)).toBeInTheDocument();
  });

  it("does NOT render group sections when there are no features", () => {
    render(<Dashboard features={[]} {...defaultProps} />);
    expect(screen.queryByText("Em Andamento")).toBeNull();
  });
});

describe("Dashboard — group rendering", () => {
  it("renders all four group headings when there are features", () => {
    render(<Dashboard features={[makeFeature()]} {...defaultProps} />);
    // "Em Andamento" can appear in both the group header AND the feature badge —
    // we just assert at least one instance exists
    expect(screen.getAllByText("Em Andamento").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("A Iniciar")).toBeInTheDocument();
    expect(screen.getByText("Concluídas")).toBeInTheDocument();
    expect(screen.getByText("Arquivadas")).toBeInTheDocument();
  });

  it("shows the correct count badge for each group", () => {
    const features = [
      makeFeature({ id: 1, status: "in_progress" }),
      makeFeature({ id: 2, status: "in_progress" }),
      makeFeature({ id: 3, status: "a_iniciar" })
    ];
    render(<Dashboard features={features} {...defaultProps} />);

    // Each group header has a badge showing the count
    // We find the header buttons and inspect their text content
    const buttons = screen.getAllByRole("button").filter((b) =>
      ["Em Andamento", "A Iniciar", "Concluídas", "Arquivadas"].some((label) =>
        b.textContent?.includes(label)
      )
    );

    const inProgressBtn = buttons.find((b) => b.textContent?.includes("Em Andamento"))!;
    const aIniciarBtn = buttons.find((b) => b.textContent?.includes("A Iniciar"))!;
    const completedBtn = buttons.find((b) => b.textContent?.includes("Concluídas"))!;

    expect(within(inProgressBtn).getByText("2")).toBeInTheDocument();
    expect(within(aIniciarBtn).getByText("1")).toBeInTheDocument();
    expect(within(completedBtn).getByText("0")).toBeInTheDocument();
  });

  it("places features in the correct group", () => {
    const f1 = makeFeature({ id: 1, title: "Active Feature", status: "in_progress" });
    const f2 = makeFeature({ id: 2, title: "Planned Feature", status: "a_iniciar" });
    render(<Dashboard features={[f1, f2]} {...defaultProps} />);

    // "Em Andamento" is expanded by default; its feature title should be visible
    expect(screen.getByText("Active Feature")).toBeInTheDocument();
    // "A Iniciar" is collapsed by default; its feature title should NOT be visible
    expect(screen.queryByText("Planned Feature")).toBeNull();
  });
});

describe("Dashboard — collapsible groups", () => {
  it("expands 'Em Andamento' and shows its features by default", () => {
    const f = makeFeature({ id: 1, title: "My Active Feature", status: "in_progress" });
    render(<Dashboard features={[f]} {...defaultProps} />);
    expect(screen.getByText("My Active Feature")).toBeInTheDocument();
  });

  it("collapses 'Em Andamento' when its header is clicked", () => {
    const f = makeFeature({ id: 1, title: "My Active Feature", status: "in_progress" });
    render(<Dashboard features={[f]} {...defaultProps} />);

    const groupBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Em Andamento"))!;

    fireEvent.click(groupBtn);

    expect(screen.queryByText("My Active Feature")).toBeNull();
  });

  it("expands 'A Iniciar' when its header is clicked", () => {
    const f = makeFeature({ id: 1, title: "Planned Feature", status: "a_iniciar" });
    render(<Dashboard features={[f]} {...defaultProps} />);

    const groupBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("A Iniciar"))!;

    // Initially collapsed — title not visible
    expect(screen.queryByText("Planned Feature")).toBeNull();

    fireEvent.click(groupBtn);

    // Now expanded
    expect(screen.getByText("Planned Feature")).toBeInTheDocument();
  });

  it("toggles back to collapsed on a second click", () => {
    const f = makeFeature({ id: 1, title: "A Iniciar Feature", status: "a_iniciar" });
    render(<Dashboard features={[f]} {...defaultProps} />);

    const groupBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("A Iniciar"))!;

    fireEvent.click(groupBtn); // expand
    expect(screen.getByText("A Iniciar Feature")).toBeInTheDocument();

    fireEvent.click(groupBtn); // collapse again
    expect(screen.queryByText("A Iniciar Feature")).toBeNull();
  });
});

describe("Dashboard — feature cards", () => {
  it("shows a progress bar for each visible feature card", () => {
    const f = makeFeature({ id: 1, title: "Feature with Progress", status: "in_progress", done_count: 3, item_count: 4, progress_percent: 75 });
    render(<Dashboard features={[f]} {...defaultProps} />);

    // The progress percentage text
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("calls onOpenFeature with the correct feature when 'Abrir' is clicked", () => {
    const onOpenFeature = vi.fn();
    const f = makeFeature({ id: 99, title: "Open Me", status: "in_progress" });
    render(<Dashboard features={[f]} {...{ ...defaultProps, onOpenFeature }} />);

    fireEvent.click(screen.getByRole("button", { name: /abrir/i }));
    expect(onOpenFeature).toHaveBeenCalledWith(f);
  });

  it("calls onEditFeature with the correct feature when 'Editar' is clicked", () => {
    const onEditFeature = vi.fn();
    const f = makeFeature({ id: 99, title: "Edit Me", status: "in_progress" });
    render(<Dashboard features={[f]} {...{ ...defaultProps, onEditFeature }} />);

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    expect(onEditFeature).toHaveBeenCalledWith(f);
  });

  it("calls onDeleteFeature with the correct id when 'Excluir' is clicked", () => {
    const onDeleteFeature = vi.fn().mockResolvedValue(undefined);
    const f = makeFeature({ id: 42, title: "Delete Me", status: "in_progress" });
    render(<Dashboard features={[f]} {...{ ...defaultProps, onDeleteFeature }} />);

    fireEvent.click(screen.getByRole("button", { name: /excluir/i }));
    expect(onDeleteFeature).toHaveBeenCalledWith(42);
  });
});

describe("Dashboard — summary line", () => {
  it("shows the correct counts in the summary below the title", () => {
    const features = [
      makeFeature({ id: 1, status: "in_progress" }),
      makeFeature({ id: 2, status: "in_progress" }),
      makeFeature({ id: 3, status: "a_iniciar" }),
      makeFeature({ id: 4, status: "completed" })
    ];
    render(<Dashboard features={features} {...defaultProps} />);

    expect(screen.getByText(/2 em andamento/i)).toBeInTheDocument();
    expect(screen.getByText(/1 a iniciar/i)).toBeInTheDocument();
    expect(screen.getByText(/1 conclu[ií]da/i)).toBeInTheDocument();
  });
});
