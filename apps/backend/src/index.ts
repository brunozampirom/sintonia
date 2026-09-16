// Worker entrypoint. `routePartykitRequest` maps the request path onto a
// Durable Object: /parties/<binding-in-kebab-case>/<room-name>. The binding
// is named `Main`, so the path stays /parties/main/<ROOM_CODE>, the same URL
// the mobile and web clients already build.

import { routePartykitRequest } from "partyserver";

import { SintoniaRoom } from "./server";

export { SintoniaRoom };

export default {
  async fetch(request, env) {
    return (
      (await routePartykitRequest(request, env)) ??
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
