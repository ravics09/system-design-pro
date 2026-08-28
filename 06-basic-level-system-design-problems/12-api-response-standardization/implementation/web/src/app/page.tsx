import { Console } from "../components/Console";

export default function Page() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px 56px" }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 26 }}>Production API Platform</h1>
        <p style={{ margin: 0, color: "#475569", fontSize: 15, maxWidth: 760 }}>
          One NestJS API demonstrating three production concerns at once: <strong>URI versioning</strong> (v1 deprecated /
          v2 current), a <strong>standardized response envelope</strong> for every success and error, and{" "}
          <strong>request-id tracing</strong> propagated end to end. Each call below surfaces the envelope, the version,
          and the correlation id.
        </p>
      </header>
      <Console />
    </main>
  );
}
