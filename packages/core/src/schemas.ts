import { Schema } from "effect";

export const NonEmptyStringSchema = Schema.String.check(Schema.isMinLength(1));
