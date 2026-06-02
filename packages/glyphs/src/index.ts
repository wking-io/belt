export const glyphNames = [
  "add",
  "alert",
  "branch",
  "check",
  "chevronDown",
  "chevronRight",
  "chevronUp",
  "chevronVertical",
  "close",
  "copy",
  "edit",
  "expand",
  "info",
  "menu",
  "open",
  "search",
  "spinner",
  "trash",
] as const;

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
  Object.fromEntries(glyphNames.map((name) => [name, `${glyphIdPrefix}-${name}`])) as Record<
    GlyphName,
    string
  >,
);

export const glyphDefinitions = {
  add: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M12 5v14",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M5 12h14",
        },
      },
    ],
  },
  alert: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M12 9v4",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M12 17h.01",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M10.3 4.2 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z",
        },
      },
    ],
  },
  branch: {
    viewBox: "0 0 18 18",
    children: [
      {
        tag: "path",
        attrs: {
          d: "M2.75 7.75L8.414 13.414C8.789 13.789 9 14.298 9 14.828",
          stroke: "currentColor",
          "stroke-width": 1,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M15.25 7.75L9.586 13.414C9.211 13.789 9 14.298 9 14.828",
          stroke: "currentColor",
          "stroke-width": 1,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M9 1.75V16.25",
          stroke: "currentColor",
          "stroke-width": 1,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M11.75 4.5L9 1.75L6.25 4.5",
          stroke: "currentColor",
          "stroke-width": 1,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M15.25 11.25V7.75H11.75",
          stroke: "currentColor",
          "stroke-width": 1,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M2.75 11.25V7.75H6.25",
          stroke: "currentColor",
          "stroke-width": 1,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
        },
      },
    ],
  },
  check: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "m5 12 4 4L19 6",
        },
      },
    ],
  },
  chevronDown: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "m6 9 6 6 6-6",
        },
      },
    ],
  },
  chevronRight: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "m9 18 6-6-6-6",
        },
      },
    ],
  },
  chevronUp: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "m18 15-6-6-6 6",
        },
      },
    ],
  },
  chevronVertical: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "m7 15 5 5 5-5",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "m7 9 5-5 5 5",
        },
      },
    ],
  },
  close: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M18 6 6 18",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "m6 6 12 12",
        },
      },
    ],
  },
  copy: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "rect",
        attrs: {
          x: 8,
          y: 8,
          width: 12,
          height: 12,
          rx: 2,
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2",
        },
      },
    ],
  },
  edit: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M12 20h9",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
        },
      },
    ],
  },
  expand: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M15 3h6v6",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "m21 3-7 7",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M9 21H3v-6",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "m3 21 7-7",
        },
      },
    ],
  },
  info: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "circle",
        attrs: {
          cx: 12,
          cy: 12,
          r: 10,
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M12 16v-4",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M12 8h.01",
        },
      },
    ],
  },
  menu: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M4 6h16",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M4 12h16",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M4 18h16",
        },
      },
    ],
  },
  open: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M14 3h7v7",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "m10 14 11-11",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5",
        },
      },
    ],
  },
  search: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "circle",
        attrs: {
          cx: 11,
          cy: 11,
          r: 8,
        },
      },
      {
        tag: "path",
        attrs: {
          d: "m21 21-4.3-4.3",
        },
      },
    ],
  },
  spinner: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M21 12a9 9 0 1 1-6.2-8.6",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M21 3v6h-6",
        },
      },
    ],
  },
  trash: {
    viewBox: "0 0 24 24",
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
    },
    children: [
      {
        tag: "path",
        attrs: {
          d: "M3 6h18",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M10 11v6",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M14 11v6",
        },
      },
    ],
  },
} as const satisfies GlyphDefinitions;
