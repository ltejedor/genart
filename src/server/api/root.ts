import { exampleProcedure } from "@/server/api/procedures/exampleProcedure";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * Procedures from api/procedures and subrouters from api/routers should be added here.
 */
export const appRouter = createTRPCRouter({
  exampleProcedure,
  // add procedures and subrouters here
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
