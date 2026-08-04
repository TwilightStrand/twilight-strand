import { describe, it, expect } from "vitest";
import { parsePobXml } from "../pob-xml-parser";

describe("pob-xml-parser", () => {
  const MINIMAL_XML = `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="90" className="Marauder" ascendClassName="Juggernaut" mainSocketGroup="1" targetVersion="3_0"/>
  <Skills>
    <SkillSet>
      <Skill mainActiveSkill="1" enabled="true" slot="Body Armour">
        <Gem level="20" quality="20" skillId="GroundSlam" nameSpec="Ground Slam" enabled="true"/>
      </Skill>
    </SkillSet>
  </Skills>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29"><URL></URL></Spec>
  </Tree>
  <Items/>
</PathOfBuilding>`;

  it("should parse build stats", () => {
    const result = parsePobXml(MINIMAL_XML);
    expect(result.stats.class_name).toBe("Marauder");
    expect(result.stats.ascendancy).toBe("Juggernaut");
    expect(result.stats.level).toBe(90);
    expect(result.stats.main_socket_group).toBe(1);
  });

  it("should parse skills", () => {
    const result = parsePobXml(MINIMAL_XML);
    expect(result.skills.length).toBe(1);
    expect(result.skills[0].label).toBe("Ground Slam");
    expect(result.skills[0].gems.length).toBe(1);
    expect(result.skills[0].gems[0].skillId).toBe("GroundSlam");
  });

  it("should throw on invalid XML", () => {
    expect(() => parsePobXml("<notpob/>")).toThrow("Invalid PoB XML");
  });

  it("should extract notes", () => {
    const xmlWithNotes = MINIMAL_XML.replace(
      "</PathOfBuilding>",
      "<Notes>Test notes here</Notes></PathOfBuilding>"
    );
    const result = parsePobXml(xmlWithNotes);
    expect(result.notes).toBe("Test notes here");
  });

  it("should return empty notes when none present", () => {
    const result = parsePobXml(MINIMAL_XML);
    expect(result.notes).toBe("");
  });

  it("should handle missing skills section", () => {
    const xml = `<?xml version="1.0"?><PathOfBuilding><Build level="1" className="Scion" targetVersion="3_0"/><Tree activeSpec="1"><Spec treeVersion="3_29"><URL></URL></Spec></Tree><Items/></PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.skills).toEqual([]);
    expect(result.stats.class_name).toBe("Scion");
  });
});
