import { brand } from "@/brand.config";

/**
 * A standard, machine-discoverable channel for responsibly reporting a
 * vulnerability. Replace the example support address in brand.config before
 * launching the service, then make sure this inbox is actively monitored.
 */
export function GET() {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const text = [
    `Contact: mailto:${brand.supportEmail}`,
    "Policy: /safety",
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
  ].join("\n");

  return new Response(`${text}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
