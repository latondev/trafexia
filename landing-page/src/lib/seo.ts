export const siteConfig = {
  name: "Trafexia",
  title: "Trafexia — Mobile Traffic Interceptor",
  description: "Intercept and analyze HTTP/HTTPS traffic from Android and iOS. MITM proxy with real-time capture, pattern detection, export to HAR, cURL, Postman.",
  url: "https://trafexia.chocode.com.vn",
  keywords: [
    "mobile traffic interceptor",
    "MITM proxy",
    "HTTP interceptor",
    "HTTPS proxy desktop",
    "reverse engineering tool",
    "Android traffic capture",
    "iOS proxy",
    "API key detector",
    "HAR export",
    "network traffic analyzer"
  ],
  links: {
    github: "https://github.com/danieldev23/trafexia",
    releases: "https://github.com/danieldev23/trafexia/releases/latest"
  }
};

export const DOCS_NAVIGATION = [
  { slug: "getting-started", title: "Getting Started" },
  { slug: "android-setup", title: "Android Setup" },
  { slug: "ios-setup", title: "iOS Setup" },
  { slug: "features", title: "Features & Rules" },
  { slug: "export", title: "Export Guide" },
  { slug: "security", title: "Security & Cert" },
  { slug: "mcp-server", title: "MCP Server Setup" }
];

export function getJsonLdSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Trafexia",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "macOS, Windows, Linux",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "downloadUrl": siteConfig.links.releases,
    "description": siteConfig.description,
    "url": siteConfig.url
  };
}
