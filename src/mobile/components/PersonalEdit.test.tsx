import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PersonalEdit } from "./PersonalEdit";
import { studioSample } from "../lib/studio-sample";

describe("Personal Edit", () => {
  it.each(["Urban and luxurious", "Country and bold", "Casual Miami", "New York classics"])(
    "preserves the member's %s direction without normalizing it",
    (archetype) => {
      const html = renderToStaticMarkup(
        <PersonalEdit guide={{ ...studioSample, archetype }} looks={[]} />,
      );
      expect(html).toContain(archetype);
      expect(html).toContain("The Outfit Playbook");
      expect(html).toContain("The Wardrobe Edit");
      expect(html).not.toContain("<img");
      expect(html).toContain("Your stylist’s notes");
    },
  );
  it("labels sample imagery as illustrative", () => {
    const html = renderToStaticMarkup(<PersonalEdit guide={studioSample} looks={[]} sample />);
    expect(html).toContain("Fictional client");
    expect(html).toContain("AI outfit illustration:");
  });
  it("uses the member's own photo and name when an outfit is not ready", () => {
    const html = renderToStaticMarkup(
      <PersonalEdit
        guide={studioSample}
        looks={[]}
        memberName="Maya"
        portrait="https://example.com/member-photo.jpg"
      />,
    );
    expect(html).toContain("Maya’s Personal Edit");
    expect(html).toContain("https://example.com/member-photo.jpg");
    expect(html).toContain("not an outfit preview");
    expect(html).not.toContain("Fictional client");
  });
});
