import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  controlField,
  controlPanelTool,
  controlPanelToolId,
  defineControlPanel,
  EmptyControlSelectOptionsError,
  InvalidControlFieldIdError,
  InvalidControlRangeError,
  InvalidControlSelectDefaultError,
  validateControlPanel,
  type ControlPanelValues
} from "../src/index.ts";

it("defines a control panel config with v1 field builders", () => {
  const config = defineControlPanel({
    fieldsets: {
      hero: {
        label: "Hero",
        fields: {
          title: controlField.text({ default: "Hello" }),
          enabled: controlField.boolean({ default: true }),
          density: controlField.select({
            default: "comfortable",
            options: [
              { label: "Compact", value: "compact" },
              { label: "Comfortable", value: "comfortable" }
            ]
          }),
          accent: controlField.color({ default: "oklch(62% 0.2 260)" }),
          scale: controlField.range({ min: 0, max: 2, step: 0.1, default: 1 }),
          offset: controlField.vector2({ default: { x: 1, y: 2 } }),
          rotation: controlField.vector3({ default: { x: 0, y: 90, z: 0 } })
        }
      }
    }
  });

  assert.strictEqual(config.fieldsets.hero.fields.title.type, "text");
  assert.strictEqual(config.fieldsets.hero.fields.scale.min, 0);
});

it("infers control values from a defined control panel config", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Hello" }),
          count: controlField.number({ default: 2 }),
          visible: controlField.boolean({ default: true }),
          position: controlField.vector3({ default: { x: 1, y: 2, z: 3 } })
        }
      }
    }
  });

  const values: ControlPanelValues<typeof config> = {
    scene: {
      title: "Updated",
      count: 3,
      visible: false,
      position: { x: 0, y: 1, z: 2 }
    }
  };

  assert.strictEqual(values.scene.position.z, 2);
});

it.effect("validates control panel config through an Effect API", () =>
  Effect.gen(function*() {
    const config = yield* validateControlPanel({
      fieldsets: {
        empty: {
          fields: {}
        }
      }
    });

    assert.deepStrictEqual(config, {
      fieldsets: {
        empty: {
          fields: {}
        }
      }
    });
  }));

it("registers the control panel as a toolbar tool", async () => {
  const registration = controlPanelTool({
    fieldsets: {
      layout: {
        fields: {
          width: controlField.number({ default: 640 })
        }
      }
    }
  });

  const route = registration.tool.routes?.index;
  const response = route ? await Effect.runPromise(route(new Request("http://localhost"))) : undefined;

  assert.strictEqual(registration.tool.id, controlPanelToolId);
  assert.deepStrictEqual(response, { config: registration.config });
});

it("throws for invalid field ids", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              "bad field": controlField.text()
            }
          }
        }
      }),
    InvalidControlFieldIdError
  );
});

it("throws for empty select options", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              density: controlField.select({ options: [] })
            }
          }
        }
      }),
    EmptyControlSelectOptionsError
  );
});

it("throws for select defaults outside static options", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              density: controlField.select({
                default: "loose",
                options: [{ label: "Compact", value: "compact" }]
              })
            }
          }
        }
      }),
    InvalidControlSelectDefaultError
  );
});

it("throws for invalid range constraints", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              opacity: controlField.range({ min: 1, max: 0 })
            }
          }
        }
      }),
    InvalidControlRangeError
  );
});
