import { ConfigV1 } from "@opencode-ai/core/v1/config/config"
import { ProviderV2 } from "@opencode-ai/core/provider"
import { expect, test } from "bun:test"
import { isProviderChanged } from "@/server/routes/instance/httpapi/handlers/global"

const testProvider = ProviderV2.ID.make("test")
const otherProvider = ProviderV2.ID.make("other")

test("detects only the modified provider", () => {
  const before: ConfigV1.Info = {
    provider: {
      test: {
        options: { baseURL: "https://before.example.com" },
      },
    },
  }
  const after: ConfigV1.Info = {
    provider: {
      test: {
        options: { baseURL: "https://after.example.com" },
      },
    },
  }

  expect(isProviderChanged(before, after, testProvider)).toBe(true)
  expect(isProviderChanged(before, after, otherProvider)).toBe(false)
})

test("detects only the deleted provider", () => {
  const before: ConfigV1.Info = {}
  const after: ConfigV1.Info = { disabled_providers: ["test"] }

  expect(isProviderChanged(before, after, testProvider)).toBe(true)
  expect(isProviderChanged(before, after, otherProvider)).toBe(false)
})
