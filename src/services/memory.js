import fs from "fs";
import path from "path";

const VALID_TYPES = new Set(["user", "feedback", "project", "reference"]);

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const index = line.indexOf(":");
    if (index > 0) meta[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return { meta, body: match[2].trim() };
}

export class MemoryStore {
  constructor(baseDir = process.cwd()) {
    this.setBaseDir(baseDir);
  }

  setBaseDir(baseDir) {
    this.baseDir = path.resolve(baseDir);
    this.memoryDir = path.join(this.baseDir, ".memory");
  }

  list() {
    if (!fs.existsSync(this.memoryDir)) return [];
    return fs.readdirSync(this.memoryDir)
      .filter((name) => name.endsWith(".md") && name !== "MEMORY.md")
      .sort()
      .map((filename) => {
        const content = fs.readFileSync(path.join(this.memoryDir, filename), "utf8");
        const { meta, body } = parseFrontmatter(content);
        return { filename, name: meta.name || filename.slice(0, -3), description: meta.description || "", type: meta.type || "project", body };
      });
  }

  getIndex() {
    const indexPath = path.join(this.memoryDir, "MEMORY.md");
    return fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8").trim() : "";
  }

  write({ name, description, type = "project", body }) {
    if (!name || !body) throw new Error("Memory name and body are required");
    const safeType = VALID_TYPES.has(type) ? type : "project";
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || "memory";
    fs.mkdirSync(this.memoryDir, { recursive: true });
    fs.writeFileSync(path.join(this.memoryDir, `${slug}.md`), `---\nname: ${name}\ndescription: ${description || name}\ntype: ${safeType}\n---\n\n${body.trim()}\n`, "utf8");
    this.rebuildIndex();
    return `Memory saved: ${slug}.md`;
  }

  rebuildIndex() {
    fs.mkdirSync(this.memoryDir, { recursive: true });
    const lines = this.list().map((item) => `- [${item.name}](${item.filename}) — ${item.description}`);
    fs.writeFileSync(path.join(this.memoryDir, "MEMORY.md"), `${lines.join("\n")}\n`, "utf8");
  }

  selectRelevant(query, maxItems = 5) {
    const terms = String(query).toLowerCase().match(/[a-z0-9_\-]+|[\u4e00-\u9fff]{2,}/g) || [];
    return this.list().map((item) => {
      const haystack = `${item.name} ${item.description} ${item.body}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { ...item, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, maxItems);
  }

  formatRelevant(query) {
    return this.selectRelevant(query).map((item) => `<memory name="${item.name}" type="${item.type}">\n${item.body}\n</memory>`).join("\n\n");
  }
}

export const memoryStore = new MemoryStore();
