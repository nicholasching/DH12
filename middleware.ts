import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/transcription(.*)",
  "/drawing/(.*)" // Allow public access to drawing pages for iPad
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      // Build an origin-dynamic external URL for Clerk's `redirect_url`.
      // - On localhost / LAN: uses the Host header (e.g. 192.168.x.x:3000)
      // - Behind tunnels/proxies: uses x-forwarded-host / x-forwarded-proto (e.g. dh.nicholasching.ca)
      // Note: `request.url` can appear as localhost behind a reverse proxy, so don't rely on it.
      const host =
        request.headers.get("x-forwarded-host") || request.headers.get("host");

      const protoFromForwarded =
        request.headers.get("x-forwarded-proto") ||
        request.headers.get("x-forwarded-scheme");

      // Note: In dev/proxied setups, `nextUrl.protocol` can be misleading.
      // For LAN IP/localhost dev access we default to http unless a proxy explicitly says otherwise.
      const protoFromRequest = request.nextUrl.protocol.replace(":", "");
      const looksLikeIpHost =
        !!host && /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(host);
      const looksLikeLocalDev = !!host && (host.includes("localhost") || looksLikeIpHost);

      const proto =
        protoFromForwarded ||
        (looksLikeLocalDev ? "http" : protoFromRequest || "https");

      const origin = host ? `${proto}://${host}` : request.nextUrl.origin;
      const pathWithQuery =
        request.nextUrl.pathname + request.nextUrl.search + request.nextUrl.hash;

      const returnBackUrl = `${origin}${pathWithQuery}`;

      return redirectToSignIn({
        returnBackUrl,
      });
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
