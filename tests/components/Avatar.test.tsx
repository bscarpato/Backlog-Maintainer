import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../../renderer/src/components/Avatar";

describe("Avatar", () => {
  it("renders the initials of a single-word name", () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByTitle("Alice")).toHaveTextContent("A");
  });

  it("renders two initials for a first-and-last name", () => {
    render(<Avatar name="Bruno Costa" />);
    expect(screen.getByTitle("Bruno Costa")).toHaveTextContent("BC");
  });

  it("does NOT render the full name by default (showName = false)", () => {
    render(<Avatar name="Carla Mendes" />);
    // The initials span should be there; the full name text should not be visible
    expect(screen.queryByText("Carla Mendes")).toBeNull();
  });

  it("renders the full name when showName = true", () => {
    render(<Avatar name="Carla Mendes" showName />);
    expect(screen.getByText("Carla Mendes")).toBeInTheDocument();
  });

  it("applies the xs size class for size='xs'", () => {
    render(<Avatar name="X" size="xs" />);
    const badge = screen.getByTitle("X");
    expect(badge.className).toContain("h-5");
    expect(badge.className).toContain("w-5");
  });

  it("applies the sm size class for size='sm'", () => {
    render(<Avatar name="X" size="sm" />);
    const badge = screen.getByTitle("X");
    expect(badge.className).toContain("h-6");
    expect(badge.className).toContain("w-6");
  });

  it("applies the md size class by default", () => {
    render(<Avatar name="X" />);
    const badge = screen.getByTitle("X");
    expect(badge.className).toContain("h-8");
    expect(badge.className).toContain("w-8");
  });

  it("applies the lg size class for size='lg'", () => {
    render(<Avatar name="X" size="lg" />);
    const badge = screen.getByTitle("X");
    expect(badge.className).toContain("h-10");
    expect(badge.className).toContain("w-10");
  });

  it("always applies a background colour class from the palette", () => {
    const { container } = render(<Avatar name="Test User" />);
    const badge = container.querySelector("[title='Test User']")!;
    expect(badge.className).toMatch(/\bbg-\w+-\d+\b/);
  });
});
