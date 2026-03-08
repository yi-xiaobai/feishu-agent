/**
 * utils/skills.js 单元测试
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { SkillLoader } from "../src/utils/skills.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("SkillLoader", () => {
  const testSkillsDir = path.join(__dirname, "test-skills");

  beforeAll(() => {
    // 创建测试技能目录
    fs.mkdirSync(path.join(testSkillsDir, "test-skill"), { recursive: true });

    // 创建测试技能文件
    const skillContent = `---
name: test-skill
description: A test skill for unit testing
tags: test, unit
---

# Test Skill

This is a test skill body.

## Usage
Use this skill for testing.
`;
    fs.writeFileSync(
      path.join(testSkillsDir, "test-skill", "SKILL.md"),
      skillContent
    );

    // 创建另一个技能（无 frontmatter）
    fs.mkdirSync(path.join(testSkillsDir, "simple-skill"), { recursive: true });
    fs.writeFileSync(
      path.join(testSkillsDir, "simple-skill", "SKILL.md"),
      "# Simple Skill\n\nNo frontmatter here."
    );
  });

  afterAll(() => {
    // 清理测试目录
    fs.rmSync(testSkillsDir, { recursive: true, force: true });
  });

  describe("constructor", () => {
    it("should load skills from directory", () => {
      const loader = new SkillLoader(testSkillsDir);
      expect(loader.getSkillNames()).toContain("test-skill");
    });

    it("should handle non-existent directory", () => {
      const loader = new SkillLoader("/non/existent/path");
      expect(loader.getSkillNames()).toHaveLength(0);
    });
  });

  describe("_parseFrontmatter", () => {
    it("should parse YAML frontmatter correctly", () => {
      const loader = new SkillLoader(testSkillsDir);
      const text = `---
name: test
description: Test description
---

Body content`;

      const result = loader._parseFrontmatter(text);
      expect(result.meta.name).toBe("test");
      expect(result.meta.description).toBe("Test description");
      expect(result.body).toBe("Body content");
    });

    it("should handle text without frontmatter", () => {
      const loader = new SkillLoader(testSkillsDir);
      const text = "Just plain text without frontmatter";

      const result = loader._parseFrontmatter(text);
      expect(result.meta).toEqual({});
      expect(result.body).toBe(text);
    });
  });

  describe("getDescriptions", () => {
    it("should return formatted skill descriptions", () => {
      const loader = new SkillLoader(testSkillsDir);
      const descriptions = loader.getDescriptions();

      expect(descriptions).toContain("test-skill");
      expect(descriptions).toContain("A test skill for unit testing");
    });

    it("should return placeholder for empty skills", () => {
      const loader = new SkillLoader("/non/existent");
      const descriptions = loader.getDescriptions();

      expect(descriptions).toBe("(no skills available)");
    });
  });

  describe("getContent", () => {
    it("should return skill content wrapped in tags", () => {
      const loader = new SkillLoader(testSkillsDir);
      const content = loader.getContent("test-skill");

      expect(content).toContain('<skill name="test-skill">');
      expect(content).toContain("# Test Skill");
      expect(content).toContain("</skill>");
    });

    it("should return error for unknown skill", () => {
      const loader = new SkillLoader(testSkillsDir);
      const content = loader.getContent("unknown-skill");

      expect(content).toContain("Error: Unknown skill");
      expect(content).toContain("Available:");
    });
  });

  describe("getSkillNames", () => {
    it("should return array of skill names", () => {
      const loader = new SkillLoader(testSkillsDir);
      const names = loader.getSkillNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain("test-skill");
      expect(names).toContain("simple-skill");
    });
  });
});
