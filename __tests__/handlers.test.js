/**
 * tools/handlers.js 单元测试
 */
import { jest } from "@jest/globals";

// Mock tools
jest.unstable_mockModule("../src/tools/index.js", () => ({
  runBash: jest.fn(),
  runRead: jest.fn(),
  runWrite: jest.fn(),
  runEdit: jest.fn(),
  runFind: jest.fn(),
  runFindProjects: jest.fn(),
  runOpenProject: jest.fn(),
  runSearchCode: jest.fn(),
  runSearchAllProjects: jest.fn(),
  runOpenInIDE: jest.fn(),
}));

// Mock skills
jest.unstable_mockModule("../src/utils/skills.js", () => ({
  skillLoader: {
    getContent: jest.fn(),
  },
}));

const tools = await import("../src/tools/index.js");
const { skillLoader } = await import("../src/utils/skills.js");
const { TOOL_HANDLERS } = await import("../src/tools/handlers.js");

describe("TOOL_HANDLERS", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("bash handler", () => {
    it("should call runBash with command", async () => {
      tools.runBash.mockResolvedValue("output");

      const result = await TOOL_HANDLERS.bash({ command: "echo hello" });

      expect(tools.runBash).toHaveBeenCalledWith("echo hello");
      expect(result).toBe("output");
    });
  });

  describe("read_file handler", () => {
    it("should call runRead with path and limit", async () => {
      tools.runRead.mockResolvedValue("file content");

      const result = await TOOL_HANDLERS.read_file({ path: "test.txt", limit: 100 });

      expect(tools.runRead).toHaveBeenCalledWith("test.txt", 100);
      expect(result).toBe("file content");
    });
  });

  describe("write_file handler", () => {
    it("should call runWrite with path and content", async () => {
      tools.runWrite.mockResolvedValue("Wrote 10 bytes");

      const result = await TOOL_HANDLERS.write_file({
        path: "test.txt",
        content: "hello",
      });

      expect(tools.runWrite).toHaveBeenCalledWith("test.txt", "hello");
      expect(result).toBe("Wrote 10 bytes");
    });
  });

  describe("edit_file handler", () => {
    it("should call runEdit with path, old_text, new_text", async () => {
      tools.runEdit.mockResolvedValue("Edited test.txt");

      const result = await TOOL_HANDLERS.edit_file({
        path: "test.txt",
        old_text: "old",
        new_text: "new",
      });

      expect(tools.runEdit).toHaveBeenCalledWith("test.txt", "old", "new");
      expect(result).toBe("Edited test.txt");
    });
  });

  describe("find_file handler", () => {
    it("should call runFind with pattern and dir", async () => {
      tools.runFind.mockResolvedValue("Found 1 file");

      const result = await TOOL_HANDLERS.find_file({
        pattern: "*.js",
        dir: "src",
      });

      expect(tools.runFind).toHaveBeenCalledWith("*.js", "src");
      expect(result).toBe("Found 1 file");
    });
  });

  describe("find_projects handler", () => {
    it("should call runFindProjects with refresh", async () => {
      tools.runFindProjects.mockResolvedValue("Found 5 projects");

      const result = await TOOL_HANDLERS.find_projects({ refresh: true });

      expect(tools.runFindProjects).toHaveBeenCalledWith(true);
      expect(result).toBe("Found 5 projects");
    });
  });

  describe("open_project handler", () => {
    it("should call runOpenProject with name", async () => {
      tools.runOpenProject.mockResolvedValue("Switched to project");

      const result = await TOOL_HANDLERS.open_project({ name: "my-project" });

      expect(tools.runOpenProject).toHaveBeenCalledWith("my-project");
      expect(result).toBe("Switched to project");
    });
  });

  describe("search_code handler", () => {
    it("should call runSearchCode with all params", async () => {
      tools.runSearchCode.mockResolvedValue("Found 10 matches");

      const result = await TOOL_HANDLERS.search_code({
        keyword: "function",
        file_pattern: "*.js",
        max_results: 20,
      });

      expect(tools.runSearchCode).toHaveBeenCalledWith("function", "*.js", 20);
      expect(result).toBe("Found 10 matches");
    });
  });

  describe("search_all_projects handler", () => {
    it("should call runSearchAllProjects with all params", async () => {
      tools.runSearchAllProjects.mockResolvedValue("Found in 3 projects");

      const result = await TOOL_HANDLERS.search_all_projects({
        keyword: "import",
        project_filter: "web",
        max_results: 10,
      });

      expect(tools.runSearchAllProjects).toHaveBeenCalledWith("import", "web", 10);
      expect(result).toBe("Found in 3 projects");
    });
  });

  describe("open_in_ide handler", () => {
    it("should call runOpenInIDE with path and ide", async () => {
      tools.runOpenInIDE.mockResolvedValue("Opened in windsurf");

      const result = await TOOL_HANDLERS.open_in_ide({
        path: "/path/to/project",
        ide: "windsurf",
      });

      expect(tools.runOpenInIDE).toHaveBeenCalledWith("/path/to/project", "windsurf");
      expect(result).toBe("Opened in windsurf");
    });
  });

  describe("load_skill handler", () => {
    it("should call skillLoader.getContent with name", async () => {
      skillLoader.getContent.mockReturnValue("<skill>content</skill>");

      const result = await TOOL_HANDLERS.load_skill({ name: "git-workflow" });

      expect(skillLoader.getContent).toHaveBeenCalledWith("git-workflow");
      expect(result).toBe("<skill>content</skill>");
    });
  });
});
