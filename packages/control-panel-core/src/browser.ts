export {
  controlPanelToolId,
  defineControlPanel,
  getControlFieldDefault,
  type ControlPanelDefinition,
} from "./config/index.js";
export type { ControlField, ControlFieldValue, ControlFieldsetValueMap } from "./config/fields.js";
export type {
  ControlPanelDeleteSnapshotResponse,
  ControlPanelIndexResponse,
  ControlPanelRouteState,
  ControlPanelSnapshotStateResponse,
  ControlPanelSnapshotsResponse,
  ControlPanelStateResponse,
} from "./session/index.js";
export type { ControlBase, ControlSnapshot } from "./state/index.js";

export const controlPanelRoutePaths = {
  index: "index",
  state: "state",
  selectFieldset: "state/select-fieldset",
  selectBase: "state/select-base",
  snapshots: "snapshots",
  readSnapshot: "snapshots/read",
  branchSnapshot: "snapshots/branch",
  saveSnapshot: "snapshots/save",
  deleteSnapshot: "snapshots/delete",
} as const;
