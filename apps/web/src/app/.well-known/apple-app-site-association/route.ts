// Apple App Site Association (AASA)
// Apple fetches this file to verify which apps can handle Universal Links
// for sintonia.party. Apple caches it heavily (CDN edge ~48h), so update
// it before changing the iOS app's associatedDomains entitlement.
//
// Verify after deploy with:
//   https://branch.io/resources/aasa-validator/?domain=sintonia.party

const APPLE_TEAM_ID = "AT677MHAU4";
const BUNDLE_ID = "com.bruno.wavelength";

const AASA = {
  applinks: {
    details: [
      {
        appIDs: [`${APPLE_TEAM_ID}.${BUNDLE_ID}`],
        components: [
          // Match /join/* — the room-code share links.
          { "/": "/join/*", comment: "Open share links in the app" },
        ],
      },
    ],
  },
  // Future: webcredentials, appclips. Leave commented for now.
  // webcredentials: { apps: [`${APPLE_TEAM_ID}.${BUNDLE_ID}`] },
};

export async function GET() {
  return new Response(JSON.stringify(AASA), {
    status: 200,
    headers: {
      // Apple requires application/json — anything else and it ignores the
      // file. Don't add charset; some validators get pickier than others.
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
