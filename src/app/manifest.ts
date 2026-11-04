import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MMSU CommuteHub",
    short_name: "CommuteHub",
    description:
      "Plan your student commute along the Laoag, Batac, Paoay, Badoc, and Vigan corridors.",
    id: "/",
    start_url: "/commute",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#163d2c",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
