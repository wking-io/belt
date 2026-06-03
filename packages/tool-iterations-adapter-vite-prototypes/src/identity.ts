export type PrototypeGraphIdentity = {
  routePrefix: string;
  queryParam: string;
  fromRoutePath(url: string): string | null;
  fromModuleId(id?: string): string | null;
  fromModuleRequest(source?: string, importer?: string): string | null;
  strip(id: string): string;
  attach(id: string, prototypeName: string): string;
};

export function createPrototypeGraphIdentity(args: {
  routePrefix: string;
  queryParam: string;
}): PrototypeGraphIdentity {
  return {
    routePrefix: args.routePrefix,
    queryParam: args.queryParam,

    fromRoutePath(url) {
      if (!url.startsWith(args.routePrefix)) return null;

      const withoutPrefix = url.slice(args.routePrefix.length);
      const [encodedPrototypeName] = withoutPrefix.split(/[/?#]/);

      if (!encodedPrototypeName) return null;

      return decodeURIComponent(encodedPrototypeName);
    },

    fromModuleId(id) {
      if (!id) return null;

      const { query } = splitSpecifier(id);
      const params = new URLSearchParams(query);

      return params.get(args.queryParam);
    },

    fromModuleRequest(source, importer) {
      return this.fromModuleId(source) ?? this.fromModuleId(importer);
    },

    strip(id) {
      const { pathPart } = splitSpecifier(id);
      const queryIndex = pathPart.indexOf("?");

      return queryIndex === -1 ? pathPart : pathPart.slice(0, queryIndex);
    },

    attach(id, prototypeName) {
      const { pathPart, hash } = splitSpecifier(id);
      const queryIndex = pathPart.indexOf("?");
      const basePath = queryIndex === -1 ? pathPart : pathPart.slice(0, queryIndex);
      const params = new URLSearchParams(queryIndex === -1 ? "" : pathPart.slice(queryIndex + 1));

      params.set(args.queryParam, prototypeName);

      const query = params.toString();

      return `${basePath}${query ? `?${query}` : ""}${hash}`;
    }
  };
}

function splitSpecifier(id: string): { pathPart: string; query: string; hash: string } {
  const hashIndex = id.indexOf("#");
  const pathPart = hashIndex === -1 ? id : id.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : id.slice(hashIndex);
  const queryIndex = pathPart.indexOf("?");
  const query = queryIndex === -1 ? "" : pathPart.slice(queryIndex + 1);

  return { pathPart, query, hash };
}
