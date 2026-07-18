/**
 * Ad slot configuration
 *
 * Paste your AdSense or direct sponsor snippets into the matching
 * container in index.html, or inject them here at runtime.
 *
 * To show ads: add class "ads-enabled" to <html> (see css/ads.css).
 *
 * Side slots (adSideLeft, adSideRight) — desktop 1024px+ only.
 * Bottom slot (adBottom) — all screen sizes including WhatsApp.
 */

const AdSlots = {
    enabled: false,
    ids: {
        bottom: "adBottom",
        sideLeft: "adSideLeft",
        sideRight: "adSideRight"
    }
};
