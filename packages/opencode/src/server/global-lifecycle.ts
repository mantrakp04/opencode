import { GlobalBus } from "@/bus/global"
import { Config } from "@/config/config"
import { InstanceRef } from "@/effect/instance-ref"
import { InstanceStore } from "@/project/instance-store"
import { Provider } from "@/provider/provider"
import { SessionRunState } from "@/session/run-state"
import { ProviderV2 } from "@opencode-ai/core/provider"
import { Effect } from "effect"
import { Event } from "./event"

export const emitGlobalDisposed = Effect.sync(() =>
  GlobalBus.emit("event", {
    directory: "global",
    payload: {
      type: Event.Disposed.type,
      properties: {},
    },
  }),
)

export const disposeAllInstancesAndEmitGlobalDisposed = Effect.fn("Server.disposeAllInstancesAndEmitGlobalDisposed")(
  function* (options?: { swallowErrors?: boolean }) {
    const store = yield* InstanceStore.Service
    yield* Effect.gen(function* () {
      yield* options?.swallowErrors
        ? store.disposeAll().pipe(Effect.catchCause((cause) => Effect.logWarning("global disposal failed", { cause })))
        : store.disposeAll()
      yield* emitGlobalDisposed
    }).pipe(Effect.uninterruptible)
  },
)

export const invalidateProviders = Effect.fn("Server.invalidateProviders")(function* (
  matches: (providerID: ProviderV2.ID) => boolean,
) {
  const store = yield* InstanceStore.Service
  const config = yield* Config.Service
  const provider = yield* Provider.Service
  const runs = yield* SessionRunState.Service
  const contexts = yield* store.list()
  yield* config.invalidate()
  yield* Effect.forEach(
    contexts,
    (ctx) =>
      Effect.gen(function* () {
        yield* runs.cancelProviders(matches)
        yield* config.invalidateInstance()
        yield* provider.invalidate()
      }).pipe(Effect.provideService(InstanceRef, ctx)),
    { concurrency: "unbounded", discard: true },
  )
})

export * as GlobalLifecycle from "./global-lifecycle"
