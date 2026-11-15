
const profileApi = process.env.PROFILE_API_URL || 'http://localhost:5000';
const gigApi = process.env.GIG_API_URL || 'http://localhost:5001';
const workApi = process.env.WORK_API_URL || 'http://localhost:5002';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${profileApi}/api/auth/:path*`,
      },
      {
        source: '/api/profiles/:path*',
        destination: `${profileApi}/api/profiles/:path*`,
      },
      {
        source: '/api/gigs/:path*',
        destination: `${gigApi}/api/gigs/:path*`,
      },
      {
        source: '/api/works/:path*',
        destination: `${workApi}/api/works/:path*`,
      },
    ];
  },
};

export default nextConfig;
