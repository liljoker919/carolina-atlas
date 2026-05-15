import { render, screen } from "@testing-library/react";
import PageHeader from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Crime Explorer" />);

    expect(screen.getByRole("heading", { name: "Crime Explorer" })).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    render(<PageHeader title="Crime Explorer" subtitle="Browse Raleigh police incidents." />);

    expect(screen.getByText("Browse Raleigh police incidents.")).toBeInTheDocument();
  });

  it("does not render a subtitle element when subtitle is omitted", () => {
    const { container } = render(<PageHeader title="Crime Explorer" />);

    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  it("renders the badge when provided", () => {
    render(<PageHeader title="Crime Explorer" badge="Beta" />);

    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("does not render a badge element when badge is omitted", () => {
    const { container } = render(<PageHeader title="Crime Explorer" />);

    // Badge is rendered as a <span> before the heading; should be absent
    expect(container.querySelector("span")).not.toBeInTheDocument();
  });

  it("renders both badge and subtitle together", () => {
    render(
      <PageHeader
        title="Crime Explorer"
        subtitle="Browse incidents."
        badge="Live"
      />
    );

    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("Browse incidents.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Crime Explorer" })).toBeInTheDocument();
  });
});
