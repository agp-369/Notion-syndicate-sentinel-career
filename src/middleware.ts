import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are public (so the site doesn't crash without keys)
const isPublicRoute = createRouteMatcher(['/', '/api/sentinel', '/api/watchdog']);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // Only protect private routes if keys are present
    if (process.env.CLERK_SECRET_KEY) {
      await auth.protect();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
