import MagicString from "magic-string";
import ts from "typescript";
import type { PrototypeGraphIdentity } from "./identity.js";

export function isAppLocalSpecifier(source: string, aliases: readonly string[]): boolean {
  return source.startsWith("/src/") || aliases.some((alias) => source.startsWith(alias));
}

export async function appendPrototypeToImports(args: {
  code: string;
  id: string;
  prototypeName: string;
  aliases: readonly string[];
  identity: PrototypeGraphIdentity;
}): Promise<{ code: string; map: null } | null> {
  const sourceFile = ts.createSourceFile(
    args.id,
    args.code,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(args.id, args.identity),
  );
  const rewritten = new MagicString(args.code);
  let changed = false;

  function rewriteStringLiteral(node: ts.StringLiteralLike) {
    const specifier = node.text;

    if (!isAppLocalSpecifier(specifier, args.aliases)) {
      return;
    }

    rewritten.overwrite(
      node.getStart(sourceFile) + 1,
      node.getEnd() - 1,
      args.identity.attach(specifier, args.prototypeName),
    );
    changed = true;
  }

  function visit(node: ts.Node) {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      rewriteStringLiteral(node.moduleSpecifier);
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      rewriteStringLiteral(node.moduleSpecifier);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1
    ) {
      const [argument] = node.arguments;

      if (argument && ts.isStringLiteralLike(argument)) {
        rewriteStringLiteral(argument);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!changed) {
    return null;
  }

  return {
    code: rewritten.toString(),
    map: null,
  };
}

function getScriptKind(id: string, identity?: PrototypeGraphIdentity): ts.ScriptKind {
  const filePath = identity?.strip(id) ?? id;

  if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filePath.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (filePath.endsWith(".ts") || filePath.endsWith(".mts")) return ts.ScriptKind.TS;

  return ts.ScriptKind.JS;
}
