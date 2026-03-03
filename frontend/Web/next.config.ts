import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/landing',
        destination: '/',
        permanent: true,
      },
      {
        source: '/landing/about',
        destination: '/#brand-philosophy',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/#brand-philosophy',
        permanent: true,
      },
      {
        source: '/landing/contact',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/landing/courses',
        destination: '/courses',
        permanent: true,
      },
      {
        source: '/landing/course-details',
        destination: '/course-details',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
