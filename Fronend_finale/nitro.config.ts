// Overrides the Cloudflare default that @lovable.dev/vite-tanstack-config
// otherwise builds for. Nitro loads this file on its own (independent of
// the Lovable wrapper), so this is respected for a real `vercel` deploy.
// Only takes effect outside Lovable's own build sandbox.
export default {
  preset: "vercel",
};
