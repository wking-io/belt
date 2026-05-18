import { get, route } from "remix/fetch-router/routes";

export const routes = route({
  home: get("/"),
  primitives: route("primitives", {
    index: get("/")
  })
});
