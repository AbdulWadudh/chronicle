const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/u;
const PORT_LABEL = /^\d+$/u;

function portSubdomain(labels: readonly string[], hostname: string): boolean {
  return labels.length > 1 && PORT_LABEL.test(labels[0] ?? "") && !IPV4.test(hostname);
}

export function assetUrl(url: string): string {
  if (!URL.canParse(url)) return url;

  const asset = new URL(url);
  if (!LOOPBACK.has(asset.hostname)) return url;

  const { hostname, protocol } = window.location;
  if (LOOPBACK.has(hostname)) return url;

  const labels = hostname.split(".");

  if (asset.port.length > 0 && portSubdomain(labels, hostname)) {
    asset.protocol = protocol;
    asset.hostname = [asset.port, ...labels.slice(1)].join(".");
    asset.port = "";
    return asset.toString();
  }

  asset.hostname = hostname;
  return asset.toString();
}
