import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { DistanceBadge } from "./ListingCard";

it("labels school distance as straight-line distance without claiming a driving time", () => {
  render(<DistanceBadge distanceKm={1.25} />);
  expect(screen.getByTitle("1,3 km tới trường theo đường chim bay")).toHaveTextContent(
    "1,3 km · chim bay",
  );
});
