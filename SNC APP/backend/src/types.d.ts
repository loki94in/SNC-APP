import type { Context } from "hono";
// Augments Hono's context to include our user variable
declare module "hono" {
  interface ContextVariableMap {
    user: {
      id: string;
      login_id: string;
      name: string;
      role: string;
    };
  }
}
