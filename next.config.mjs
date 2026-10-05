/** @type {import("next").NextConfig} */
const nextConfig = {
  compress: true,
  async rewrites() {
    return [
      { source: "/student/search", destination: "/gatpat/student/search" },
      { source: "/student/search/:identifier", destination: "/gatpat/student/search/:identifier" },
      { source: "/student/applications", destination: "/gatpat/student/applications" },
    ];
  },
};

export default nextConfig;
