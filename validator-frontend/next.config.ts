import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // enable static HTML export
    output: 'export',
    distDir: '.next',
    images: {
        // required for static export
        unoptimized: true,
    },
    // add trailing slashes to URLs
    trailingSlash: true,
    // configure base path if not serving from domain root
    // basePath: '',
};

export default nextConfig;
