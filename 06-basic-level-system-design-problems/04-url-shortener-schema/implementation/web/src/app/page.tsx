import { ShortenForm } from "../components/ShortenForm";
import { LinksList } from "../components/LinksList";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <h1>URL Shortener</h1>
      <p style={{ color: "#666" }}>Shorten a link, then manage your links below.</p>
      <ShortenForm />
      <h2>My Links</h2>
      <LinksList />
    </main>
  );
}
