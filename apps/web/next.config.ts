import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // YouTube thumbnail CDN — course detail dialogs show thumbnails for courses the
    // YouTube Data API fallback surfaces (see ml/app/data/course_index.py).
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

export default nextConfig;
