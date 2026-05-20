import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  controlField,
  controlPanelTool,
  controlPanelToolId,
  defineControlPanel,
  DuplicateControlSelectOptionValueError,
  EmptyControlSelectOptionsError,
  getControlConfigHash,
  getControlPanelDefaults,
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

it("normalizes range constraints without materializing field defaults", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          opacity: controlField.range()
        }
      }
    }
  });

  assert.deepStrictEqual(config.fieldsets.scene.fields.opacity, {
    type: "range",
    min: 0,
    max: 1,
    step: 0.01
  });
});

it("exposes internal defaults separately from normalized config", () => {
  const config = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text(),
          count: controlField.number(),
          visible: controlField.boolean(),
          density: controlField.select({
            options: [
              { label: "Compact", value: "compact" },
              { label: "Comfortable", value: "comfortable" }
            ]
          }),
          accent: controlField.color(),
          scale: controlField.range(),
          offset: controlField.vector2(),
          rotation: controlField.vector3()
        }
      }
    }
  });

  assert.deepStrictEqual(getControlPanelDefaults(config), {
    scene: {
      title: "",
      count: 0,
      visible: false,
      density: "compact",
      accent: "oklch(0% 0 0)",
      scale: 0,
      offset: { x: 0, y: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    }
  });
});

it("computes a shallow config hash from fieldset ids, field ids, and field types", () => {
  const first = defineControlPanel({
    fieldsets: {
      scene: {
        label: "Scene",
        fields: {
          title: controlField.text({ label: "Title", default: "Hello" }),
          scale: controlField.range({ min: 0, max: 10, step: 1, default: 2 })
        }
      }
    }
  });
  const copyOnlyChange = defineControlPanel({
    fieldsets: {
      scene: {
        label: "Scene controls",
        fields: {
          title: controlField.text({ label: "Headline", default: "Goodbye" }),
          scale: controlField.range({ min: -10, max: 10, step: 0.5, default: 4 })
        }
      }
    }
  });
  const shapeChange = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text(),
          enabled: controlField.boolean()
        }
      }
    }
  });
  const reorderOnlyChange = defineControlPanel({
    fieldsets: {
      scene: {
        fields: {
          scale: controlField.range({ min: 0, max: 10, step: 1, default: 2 }),
          title: controlField.text({ label: "Title", default: "Hello" })
        },
        label: "Scene"
      }
    }
  });

  assert.strictEqual(first.configHash, getControlConfigHash(first));
  assert.strictEqual(first.configHash, copyOnlyChange.configHash);
  assert.strictEqual(first.configHash, reorderOnlyChange.configHash);
  assert.notStrictEqual(first.configHash, shapeChange.configHash);
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
      configHash: getControlConfigHash(config),
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

it("throws for duplicate select option values", () => {
  assert.throws(
    () =>
      defineControlPanel({
        fieldsets: {
          scene: {
            fields: {
              density: controlField.select({
                options: [
                  { label: "Compact", value: "compact" },
                  { label: "Compact again", value: "compact" }
                ]
              })
            }
          }
        }
      }),
    DuplicateControlSelectOptionValueError
  );
});

it("throws for color defaults with alpha", () => {
  assert.throws(() =>
    defineControlPanel({
      fieldsets: {
        scene: {
          fields: {
            accent: controlField.color({ default: "oklch(62% 0.2 260 / 0.5)" })
          }
        }
      }
    })
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
