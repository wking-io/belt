import { renderPage } from "../render.ts";
import { HomePage } from "./home.ts";

export default {
  actions: {
    home() {
      return renderPage(HomePage());
    },
  },
};
