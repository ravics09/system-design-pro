"use client";

import { useState } from "react";
import {
  useListV1Mutation,
  useListV2Mutation,
  useGetUserMutation,
  useCreateUserMutation,
  useTraceDemoMutation,
} from "../store/apiConsoleApi";
import type { CallResult } from "../types";
import { Badge, Button, Card } from "./ui";
import { ResultView } from "./ResultView";

export function Console() {
  const [result, setResult] = useState<CallResult | null>(null);
  const [lastCall, setLastCall] = useState<string>("");

  const [listV1, v1State] = useListV1Mutation();
  const [listV2, v2State] = useListV2Mutation();
  const [getUser, getState] = useGetUserMutation();
  const [createUser, createState] = useCreateUserMutation();
  const [traceDemo, traceState] = useTraceDemoMutation();

  const busy =
    v1State.isLoading || v2State.isLoading || getState.isLoading || createState.isLoading || traceState.isLoading;

  const run = async (label: string, thunk: () => Promise<{ data?: CallResult }>) => {
    setLastCall(label);
    const res = await thunk();
    if (res.data) setResult(res.data);
  };

  // Create form + a lookup id
  const [form, setForm] = useState({ firstName: "Katherine", lastName: "Johnson", email: "kj@example.com" });
  const [lookupId, setLookupId] = useState("1");
  const [lookupVersion, setLookupVersion] = useState<"1" | "2">("2");

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
    style: { padding: "7px 9px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, width: "100%" },
  });

  return (
    <div style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(320px, 1fr) minmax(340px, 1.1fr)" }}>
      <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
        <Card title="Versioning — list users">
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475569" }}>
            Same underlying data, two shapes. v1 returns <code>{`{ id, name }`}</code> and is deprecated; v2 returns the
            full record with pagination meta.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="ghost" disabled={busy} onClick={() => run("GET /api/v1/users", () => listV1().unwrap().then((data) => ({ data })))}>
              GET v1 (deprecated)
            </Button>
            <Button disabled={busy} onClick={() => run("GET /api/v2/users", () => listV2().unwrap().then((data) => ({ data })))}>
              GET v2
            </Button>
          </div>
        </Card>

        <Card title="Error envelope — get user by id">
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475569" }}>
            A missing id returns a standardized error envelope with code <code>USER_NOT_FOUND</code>. Try id <code>999</code>.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={lookupVersion}
              onChange={(e) => setLookupVersion(e.target.value as "1" | "2")}
              style={{ padding: "7px 9px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }}
            >
              <option value="2">v2</option>
              <option value="1">v1</option>
            </select>
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              style={{ padding: "7px 9px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, width: 90 }}
            />
            <Button
              disabled={busy}
              onClick={() =>
                run(`GET /api/v${lookupVersion}/users/${lookupId}`, () =>
                  getUser({ version: lookupVersion, id: lookupId }).unwrap().then((data) => ({ data })),
                )
              }
            >
              GET user
            </Button>
          </div>
        </Card>

        <Card title="Validation — create user (v2)">
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475569" }}>
            Zod validates the body. Clear a field or break the email to see a <code>VALIDATION_ERROR</code> with per-field
            messages.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            <input placeholder="firstName" {...field("firstName")} />
            <input placeholder="lastName" {...field("lastName")} />
            <input placeholder="email" {...field("email")} />
            <div>
              <Button
                disabled={busy}
                onClick={() => run("POST /api/v2/users", () => createUser(form).unwrap().then((data) => ({ data })))}
              >
                POST create
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Tracing — downstream propagation">
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475569" }}>
            The request id flows via AsyncLocalStorage into a simulated downstream call, which echoes back the{" "}
            <strong>same</strong> id.
          </p>
          <Button disabled={busy} onClick={() => run("GET /api/v2/users/trace-demo", () => traceDemo().unwrap().then((data) => ({ data })))}>
            GET trace-demo
          </Button>
        </Card>
      </div>

      <Card title={lastCall ? `Response · ${lastCall}` : "Response"}>
        {busy ? <Badge label="status" value="loading…" tone="amber" /> : <ResultView result={result} />}
      </Card>
    </div>
  );
}
