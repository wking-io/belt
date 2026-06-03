import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");
const defaultIconsDir = path.join(packageRoot, "icons");
const defaultOutputPath = path.join(packageRoot, "src", "index.ts");
const execFileAsync = promisify(execFile);
const supportedChildTags = new Set(["circle", "line", "path", "polyline", "rect"]);
const ignoredTags = new Set(["desc", "metadata", "title"]);
const inheritedAttrNames = new Set([
  "fill",
  "stroke",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-width",
  "vector-effect",
]);

const { iconsDir, outputPath, check } = parseArgs(process.argv.slice(2));
const glyphs = await readGlyphs(iconsDir);
const source = await formatSource(renderSource(glyphs));

if (check) {
  const current = await readFile(outputPath, "utf8");

  if (current !== source) {
    console.error(
      `${path.relative(packageRoot, outputPath)} is out of date. Run pnpm --filter @repo/glyphs build:glyphs.`,
    );
    process.exitCode = 1;
  }
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, source);
}

function parseArgs(args) {
  const options = {
    iconsDir: defaultIconsDir,
    outputPath: defaultOutputPath,
    check: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--check") {
      options.check = true;
    } else if (arg === "--icons-dir") {
      options.iconsDir = path.resolve(packageRoot, requiredValue(args, index));
      index += 1;
    } else if (arg === "--out") {
      options.outputPath = path.resolve(packageRoot, requiredValue(args, index));
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function requiredValue(args, index) {
  const value = args[index + 1];

  if (value === undefined) {
    throw new Error(`Missing value for ${args[index]}`);
  }

  return value;
}

async function readGlyphs(iconsDir) {
  const entries = await readdir(iconsDir, { withFileTypes: true });
  const svgFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".svg"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (svgFiles.length === 0) {
    throw new Error(`No SVG files found in ${path.relative(packageRoot, iconsDir)}`);
  }

  return Promise.all(
    svgFiles.map(async (fileName) => {
      const name = glyphNameFromFileName(fileName);
      const svg = await readFile(path.join(iconsDir, fileName), "utf8");

      return {
        name,
        ...parseSvg(svg, fileName),
      };
    }),
  );
}

async function formatSource(source) {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "belt-glyphs-"));
  const tmpPath = path.join(tmpDir, "index.ts");

  try {
    await writeFile(tmpPath, source);
    await execFileAsync("pnpm", ["exec", "oxfmt", tmpPath, "--write"], { cwd: workspaceRoot });
    return await readFile(tmpPath, "utf8");
  } finally {
    await rm(tmpDir, { force: true, recursive: true });
  }
}

function glyphNameFromFileName(fileName) {
  const baseName = fileName.replace(/\.svg$/, "");
  const name = baseName.replace(/[-_ ]+([a-z0-9])/g, (_match, char) => char.toUpperCase());

  if (!/^[a-z][A-Za-z0-9]*$/.test(name)) {
    throw new Error(`SVG file name ${fileName} must convert to a valid camelCase glyph name`);
  }

  return name;
}

function parseSvg(svg, fileName) {
  const rootMatch = svg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);

  if (rootMatch === null) {
    throw new Error(`${fileName} must contain one root <svg> element`);
  }

  const rootAttrs = parseAttrs(rootMatch[1]);
  const viewBox = rootAttrs.viewBox ?? rootAttrs.viewbox;

  if (typeof viewBox !== "string") {
    throw new Error(`${fileName} must define a viewBox`);
  }

  const attrs = pickRootAttrs(rootAttrs);
  const children = parseChildren(rootMatch[2], fileName, {});

  if (children.length === 0) {
    throw new Error(`${fileName} must include at least one supported shape element`);
  }

  return {
    viewBox,
    attrs,
    children,
  };
}

function parseChildren(source, fileName, inheritedAttrs) {
  const nodes = [];
  const tagPattern = /<([a-zA-Z][\w:-]*)(\s[^<>]*)?(\/?)>|<\/([a-zA-Z][\w:-]*)>/g;
  let match;

  while ((match = tagPattern.exec(source)) !== null) {
    const [, openTagName, rawAttrs = "", selfClosing, closeTagName] = match;

    if (closeTagName !== undefined) continue;

    const tagName = openTagName;
    const attrs = parseAttrs(rawAttrs);

    if (ignoredTags.has(tagName)) continue;

    if (tagName === "g") {
      if (selfClosing === "/") continue;

      const groupCloseStart = findClosingTag(source, tagName, tagPattern.lastIndex);
      const groupBody = source.slice(tagPattern.lastIndex, groupCloseStart);
      const nextInheritedAttrs = {
        ...inheritedAttrs,
        ...pickInheritedAttrs(attrs),
      };

      nodes.push(...parseChildren(groupBody, fileName, nextInheritedAttrs));
      tagPattern.lastIndex = groupCloseStart + `</${tagName}>`.length;
      continue;
    }

    if (!supportedChildTags.has(tagName)) {
      throw new Error(`${fileName} includes unsupported SVG element <${tagName}>`);
    }

    nodes.push({
      tag: tagName,
      attrs: {
        ...inheritedAttrs,
        ...attrs,
      },
    });
  }

  return nodes;
}

function findClosingTag(source, tagName, startIndex) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>|</${tagName}>`, "gi");
  pattern.lastIndex = startIndex;
  let depth = 1;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    if (match[0].startsWith(`</${tagName}`)) {
      depth -= 1;
    } else if (!match[0].endsWith("/>")) {
      depth += 1;
    }

    if (depth === 0) {
      return match.index;
    }
  }

  throw new Error(`Missing closing </${tagName}>`);
}

function parseAttrs(rawAttrs) {
  const attrs = {};
  const attrPattern = /([:\w-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g;
  let match;

  while ((match = attrPattern.exec(rawAttrs)) !== null) {
    const [, name, doubleQuoted, singleQuoted] = match;
    const value = doubleQuoted ?? singleQuoted ?? "";

    attrs[name] = numericValue(value);
  }

  return attrs;
}

function numericValue(value) {
  return /^-?(?:\d+|\d*\.\d+)$/.test(value) ? Number(value) : value;
}

function pickRootAttrs(attrs) {
  const nextAttrs = pickInheritedAttrs(attrs);

  return Object.keys(nextAttrs).length === 0 ? undefined : nextAttrs;
}

function pickInheritedAttrs(attrs) {
  const nextAttrs = {};

  for (const [name, value] of Object.entries(attrs)) {
    if (inheritedAttrNames.has(name)) {
      nextAttrs[name] = value;
    }
  }

  return nextAttrs;
}

function renderSource(glyphs) {
  const glyphNames = glyphs.map((glyph) => glyph.name);

  return `${renderGlyphNames(glyphNames)}

export type GlyphName = (typeof glyphNames)[number];

export type GlyphNode = {
  readonly tag: "circle" | "line" | "path" | "polyline" | "rect";
  readonly attrs: Readonly<Record<string, string | number>>;
};

export type GlyphDefinition = {
  readonly viewBox: string;
  readonly attrs?: Readonly<Record<string, string | number>>;
  readonly children: readonly GlyphNode[];
};

export type GlyphDefinitions = {
  readonly [name in GlyphName]: GlyphDefinition;
};

const glyphIdPrefix = "rmx-glyph";

export const glyphIds = Object.freeze(
  Object.fromEntries(glyphNames.map((name) => [name, \`\${glyphIdPrefix}-\${name}\`])) as Record<GlyphName, string>,
);

export const glyphDefinitions = ${renderObject(glyphs)} as const satisfies GlyphDefinitions;
`;
}

function renderGlyphNames(glyphNames) {
  return `export const glyphNames = ${renderValue(glyphNames)} as const;`;
}

function renderObject(glyphs) {
  const entries = glyphs.map(
    (glyph) =>
      `${glyph.name}: ${renderValue({
        viewBox: glyph.viewBox,
        attrs: glyph.attrs,
        children: glyph.children,
      })}`,
  );

  return `{\n${indent(entries.join(",\n"))}\n}`;
}

function renderValue(value) {
  if (Array.isArray(value)) {
    return value.length === 0 ? "[]" : `[\n${indent(value.map(renderValue).join(",\n"))}\n]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => `${propertyKey(key)}: ${renderValue(entryValue)}`);

    return entries.length === 0 ? "{}" : `{\n${indent(entries.join(",\n"))}\n}`;
  }

  return JSON.stringify(value);
}

function propertyKey(key) {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

function indent(source) {
  return source
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}
