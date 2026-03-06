import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * SkillLoader - 扫描并加载 skills/<name>/SKILL.md 文件
 */
export class SkillLoader {
  constructor(skillsDir) {
    this.skillsDir = skillsDir;
    this.skills = {};
    this._loadAll();
  }

  /**
   * 扫描所有技能文件
   */
  _loadAll() {
    if (!fs.existsSync(this.skillsDir)) {
      console.log(`⚠️  Skills 目录不存在: ${this.skillsDir}`);
      return;
    }

    // 递归查找所有 SKILL.md 文件
    const findSkillFiles = (dir) => {
      const files = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...findSkillFiles(fullPath));
          } else if (entry.name === "SKILL.md") {
            files.push(fullPath);
          }
        }
      } catch (e) {
        // 忽略读取错误
      }
      return files;
    };

    const skillFiles = findSkillFiles(this.skillsDir).sort();

    for (const filePath of skillFiles) {
      try {
        const text = fs.readFileSync(filePath, "utf-8");
        const { meta, body } = this._parseFrontmatter(text);
        const name = meta.name || path.basename(path.dirname(filePath));
        this.skills[name] = { meta, body, path: filePath };
      } catch (e) {
        console.error(`加载技能失败: ${filePath}`, e.message);
      }
    }

    console.log(`✅ 加载了 ${Object.keys(this.skills).length} 个技能`);
  }

  /**
   * 解析 YAML frontmatter（--- 之间的元数据）
   * @param {string} text - 文件内容
   * @returns {{meta: Object, body: string}}
   */
  _parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
    if (!match) {
      return { meta: {}, body: text };
    }

    const meta = {};
    const frontmatter = match[1].trim();
    for (const line of frontmatter.split("\n")) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        meta[key] = value;
      }
    }

    return { meta, body: match[2].trim() };
  }

  /**
   * Layer 1: 获取所有技能的简短描述（用于系统提示词）
   * @returns {string}
   */
  getDescriptions() {
    const names = Object.keys(this.skills);
    if (names.length === 0) {
      return "(no skills available)";
    }

    const lines = [];
    for (const name of names) {
      const skill = this.skills[name];
      const desc = skill.meta.description || "No description";
      lines.push(`  - ${name}: ${desc}`);
    }

    return lines.join("\n");
  }

  /**
   * Layer 2: 获取指定技能的完整内容
   * @param {string} name - 技能名称
   * @returns {string}
   */
  getContent(name) {
    const skill = this.skills[name];
    if (!skill) {
      const available = Object.keys(this.skills).join(", ") || "none";
      return `Error: Unknown skill '${name}'. Available: ${available}`;
    }
    return `<skill name="${name}">\n${skill.body}\n</skill>`;
  }

  /**
   * 获取所有技能名称
   * @returns {string[]}
   */
  getSkillNames() {
    return Object.keys(this.skills);
  }
}

// 默认技能目录
const SKILLS_DIR = path.join(__dirname, "../../skills");

// 全局 SkillLoader 实例
export const skillLoader = new SkillLoader(SKILLS_DIR);
