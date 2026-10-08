export const pageHead = (title: string, description: string) => ({
  meta: [
    { title: `${title} · ASHA Saath (synthetic demo)` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · ASHA Saath` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});

