/**
 * tools/index.js 单元测试
 * 
 * 测试文件操作和安全检查功能
 */
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 直接导入被测模块（不 mock 外部命令执行）
const tools = await import("../src/tools/index.js");

describe("tools/index.js", () => {
  const testDir = path.join(__dirname, "test-workspace");

  beforeAll(async () => {
    // 创建测试工作目录
    await fs.mkdir(testDir, { recursive: true });
    tools.setWorkDir(testDir);
  });

  afterAll(async () => {
    // 清理测试目录
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("setWorkDir", () => {
    it("should set the working directory", () => {
      const newDir = "/tmp/new-dir";
      tools.setWorkDir(newDir);
      // 恢复原目录
      tools.setWorkDir(testDir);
    });
  });

  describe("runBash - security checks", () => {
    it("should block rm -rf / command", async () => {
      const result = await tools.runBash("rm -rf /");
      expect(result).toBe("Error: Dangerous command blocked");
    });

    it("should block sudo commands", async () => {
      const result = await tools.runBash("sudo apt-get install");
      expect(result).toBe("Error: Dangerous command blocked");
    });

    it("should block shutdown commands", async () => {
      const result = await tools.runBash("shutdown -h now");
      expect(result).toBe("Error: Dangerous command blocked");
    });

    it("should block reboot commands", async () => {
      const result = await tools.runBash("reboot");
      expect(result).toBe("Error: Dangerous command blocked");
    });

    it("should block /dev/ redirects", async () => {
      const result = await tools.runBash("echo test > /dev/sda");
      expect(result).toBe("Error: Dangerous command blocked");
    });
  });

  describe("runRead", () => {
    const testFile = "test-read.txt";
    const testContent = "line1\nline2\nline3\nline4\nline5";

    beforeEach(async () => {
      await fs.writeFile(path.join(testDir, testFile), testContent);
    });

    afterEach(async () => {
      await fs.unlink(path.join(testDir, testFile)).catch(() => {});
    });

    it("should read file contents", async () => {
      const result = await tools.runRead(testFile);
      expect(result).toBe(testContent);
    });

    it("should limit lines when specified", async () => {
      const result = await tools.runRead(testFile, 2);
      expect(result).toContain("line1");
      expect(result).toContain("line2");
      expect(result).toContain("... (3 more lines)");
    });

    it("should return error for non-existent file", async () => {
      const result = await tools.runRead("non-existent.txt");
      expect(result).toContain("Error:");
    });

    it("should prevent path traversal", async () => {
      const result = await tools.runRead("../../../etc/passwd");
      expect(result).toContain("Error:");
    });
  });

  describe("runWrite", () => {
    const testFile = "test-write.txt";

    afterEach(async () => {
      await fs.unlink(path.join(testDir, testFile)).catch(() => {});
    });

    it("should write content to file", async () => {
      const content = "test content";
      const result = await tools.runWrite(testFile, content);
      expect(result).toContain("Wrote");
      expect(result).toContain(testFile);

      const written = await fs.readFile(path.join(testDir, testFile), "utf-8");
      expect(written).toBe(content);
    });

    it("should create nested directories", async () => {
      const nestedFile = "nested/dir/file.txt";
      const content = "nested content";
      const result = await tools.runWrite(nestedFile, content);
      expect(result).toContain("Wrote");

      await fs.rm(path.join(testDir, "nested"), { recursive: true });
    });
  });

  describe("runEdit", () => {
    const testFile = "test-edit.txt";

    beforeEach(async () => {
      await fs.writeFile(path.join(testDir, testFile), "hello world");
    });

    afterEach(async () => {
      await fs.unlink(path.join(testDir, testFile)).catch(() => {});
    });

    it("should replace text in file", async () => {
      const result = await tools.runEdit(testFile, "world", "jest");
      expect(result).toContain("Edited");

      const content = await fs.readFile(path.join(testDir, testFile), "utf-8");
      expect(content).toBe("hello jest");
    });

    it("should return error if text not found", async () => {
      const result = await tools.runEdit(testFile, "notfound", "replacement");
      expect(result).toContain("Error: Text not found");
    });
  });
});
