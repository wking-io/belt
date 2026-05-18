export const beltDefaultTheme = "system";
export const beltBuiltInThemes = ["belt-light", "belt-dark"] as const;

export type BeltBuiltInTheme = (typeof beltBuiltInThemes)[number];
