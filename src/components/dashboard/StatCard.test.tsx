import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PawPrint } from "lucide-react";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the title and value", () => {
    render(<StatCard title="Total Livestock" value={128} icon={PawPrint} />);
    expect(screen.getByText("Total Livestock")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("renders an optional description when provided", () => {
    render(
      <StatCard
        title="Healthy Animals"
        value={120}
        icon={PawPrint}
        description="93% of herd"
      />
    );
    expect(screen.getByText("93% of herd")).toBeInTheDocument();
  });

  it("does not render a description block when none is provided", () => {
    render(<StatCard title="Total Livestock" value={128} icon={PawPrint} />);
    expect(screen.queryByText("93% of herd")).not.toBeInTheDocument();
  });

  it("shows a positive trend with a plus sign", () => {
    render(
      <StatCard
        title="Births this month"
        value={12}
        icon={PawPrint}
        trend={{ value: 8, positive: true }}
      />
    );
    expect(screen.getByText("+8%")).toBeInTheDocument();
  });

  it("shows a negative trend without a plus sign", () => {
    render(
      <StatCard
        title="Losses this month"
        value={2}
        icon={PawPrint}
        trend={{ value: 3, positive: false }}
      />
    );
    expect(screen.getByText("3%")).toBeInTheDocument();
  });
});
