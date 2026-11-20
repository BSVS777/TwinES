import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PartList } from "@/components/vehicle-health/PartList";
import type { PartId } from "@/domain/part-health/catalog";
import { PART_ROWS } from "./fixtures";

afterEach(cleanup);

function renderList(selectedPartId: PartId | null = null) {
  const onSelect = vi.fn();
  render(<PartList parts={PART_ROWS} selectedPartId={selectedPartId} onSelect={onSelect} />);
  return { items: screen.getAllByRole("listitem"), onSelect };
}

describe("PartList", () => {
  it("VIEW-02 lists all 8 parts in catalog order with name, status text and usage percentage", () => {
    const { items } = renderList();

    expect(items).toHaveLength(8);
    const expected = [
      ["Engine oil", "Red", "112%"],
      ["Oil filter", "Orange", "80%"],
      ["Air filter", "Yellow", "55%"],
      ["Brake pads", "Green", "20%"],
      ["Tires", "Green", "10%"],
      ["Battery", "Yellow", "60%"],
      ["Coolant", "Green", "15%"],
      ["Spark plugs", "Green", "12%"],
    ];
    expected.forEach(([name, status, usage], index) => {
      expect(items[index]).toHaveTextContent(name);
      expect(within(items[index]).getByText(status)).toBeInTheDocument();
      expect(items[index]).toHaveTextContent(usage);
    });
  });

  it("VIEW-02 never relies on color alone: every item pairs the status text with a color swatch", () => {
    const { items } = renderList();

    items.forEach((item, index) => {
      const swatch = item.querySelector("[data-status]");
      expect(swatch).not.toBeNull();
      expect(swatch).toHaveAttribute("data-status", PART_ROWS[index].status);
      expect(swatch).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("VIEW-02 shows remaining km and days and the due date, and Time-based for the battery", () => {
    const { items } = renderList();

    expect(items[1]).toHaveTextContent("1,000 km left");
    expect(items[1]).toHaveTextContent("36 days left");
    expect(items[1]).toHaveTextContent("2026-12-26");
    expect(items[5]).toHaveTextContent("Time-based");
    expect(items[5]).not.toHaveTextContent(/\bkm\b/);
    expect(items[5]).toHaveTextContent("430 days left");
  });

  it("VIEW-02 flags an overdue part explicitly and only that part", () => {
    const { items } = renderList();

    expect(items[0]).toHaveTextContent("Overdue");
    expect(items[0]).toHaveTextContent("600 km overdue");
    expect(items[0]).toHaveTextContent("12 days overdue");
    items.slice(1).forEach((item) => expect(item).not.toHaveTextContent(/overdue/i));
  });

  it("VIEW-05 marks the selected part with aria-pressed and no other", () => {
    renderList("oil-filter");

    expect(screen.getByRole("button", { name: "Oil filter" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Engine oil" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
  });

  it("VIEW-05 reports the part id when an item is chosen", () => {
    const { onSelect } = renderList();

    fireEvent.click(screen.getByRole("button", { name: "Brake pads" }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("brake-pads");
  });

  it("has no pressed item while nothing is selected", () => {
    renderList(null);

    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect(screen.getAllByRole("button")).toHaveLength(8);
  });
});
