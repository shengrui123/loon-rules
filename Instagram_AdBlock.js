/*
 * Instagram feed ad remover for Loon.
 *
 * Supported response shapes:
 * - App private API: /api/v1/feed/timeline/ -> feed_items[].media_or_ad
 * - Web GraphQL: xdt_api__v1__feed__timeline__connection.edges[].node
 *
 * Only entries with explicit advertising signals are removed. Suggested posts,
 * paid-partnership posts from followed creators, and pagination data are kept.
 */

(function () {
  "use strict";

  var body = typeof $response !== "undefined" ? $response.body : "";
  var removedCount = 0;

  if (!body) {
    $done({});
    return;
  }

  // Most timeline responses contain no ads. Avoid JSON parsing and recursive
  // traversal unless the raw payload contains a known advertising signal.
  if (
    body.indexOf('"ad_id"') === -1 &&
    body.indexOf('"is_sponsored":true') === -1 &&
    body.indexOf('"product_type":"ad"') === -1 &&
    body.indexOf('"ad_metadata"') === -1 &&
    body.indexOf('"sponsored_label_info"') === -1 &&
    body.indexOf('"ad_tracking_token"') === -1 &&
    body.indexOf('"ad_media_items"') === -1
  ) {
    $done({});
    return;
  }

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function hasOwn(object, key) {
    return isObject(object) && Object.prototype.hasOwnProperty.call(object, key);
  }

  function hasValue(object, key) {
    return hasOwn(object, key) && object[key] !== null && object[key] !== "";
  }

  function hasAdContainer(object, key) {
    if (!hasOwn(object, key)) {
      return false;
    }

    var value = object[key];
    return isObject(value) || value === true ||
      (typeof value === "string" && value !== "");
  }

  function isAdMedia(media) {
    if (!isObject(media)) {
      return false;
    }

    // Current App responses put the full advertising payload below
    // media_or_ad.injected (including ad_id, campaign_id and tracking_token).
    // Inspect that object before checking legacy root-level fields.
    if (
      isObject(media.injected) &&
      (
        hasValue(media.injected, "ad_id") ||
        hasValue(media.injected, "campaign_id") ||
        hasValue(media.injected, "tracking_token") ||
        media.injected.label === "Sponsored" ||
        media.injected.label === "Ad"
      )
    ) {
      return true;
    }

    // Strong, explicit flags used by native and web feed responses.
    if (
      hasValue(media, "ad_id") ||
      media.is_sponsored === true ||
      media.product_type === "ad" ||
      hasValue(media, "ad_metadata") ||
      hasValue(media, "sponsored_label_info")
    ) {
      return true;
    }

    // Native ads commonly carry both an injection marker and ad tracking data.
    // Requiring both avoids treating ordinary posts with analytics tokens as ads.
    var hasInjectionMarker =
      hasValue(media, "injected") ||
      media.is_injected === true ||
      media.is_injected_post === true;
    var hasAdTracking =
      hasValue(media, "ad_tracking_token") ||
      hasValue(media, "ad_action") ||
      hasValue(media, "ad_link_type");

    return hasInjectionMarker && hasAdTracking;
  }

  function isAdFeedItem(item) {
    if (!isObject(item)) {
      return false;
    }

    if (hasAdContainer(item, "ad") || item.is_sponsored === true) {
      return true;
    }

    if (isAdMedia(item.media_or_ad) || isAdMedia(item.media)) {
      return true;
    }

    // Some web edges place the advertising wrapper one level below node.
    if (isObject(item.node)) {
      return isAdFeedItem(item.node);
    }

    return false;
  }

  function filterArray(array) {
    var output = [];
    var index;

    for (index = 0; index < array.length; index += 1) {
      if (isAdFeedItem(array[index])) {
        removedCount += 1;
      } else {
        output.push(array[index]);
      }
    }

    return output;
  }

  function clean(object, depth) {
    if (!isObject(object) || depth > 30) {
      return;
    }

    if (Array.isArray(object.feed_items)) {
      object.feed_items = filterArray(object.feed_items);
    }

    if (Array.isArray(object.edges)) {
      object.edges = filterArray(object.edges);
    }

    // Story ads sometimes accompany the web home-feed GraphQL payload. Clearing
    // this explicit ad-only list does not remove the user's normal story tray.
    if (
      isObject(object.xdt_injected_story_units) &&
      Array.isArray(object.xdt_injected_story_units.ad_media_items)
    ) {
      removedCount += object.xdt_injected_story_units.ad_media_items.length;
      object.xdt_injected_story_units.ad_media_items = [];
    }

    var keys = Object.keys(object);
    var keyIndex;
    for (keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      clean(object[keys[keyIndex]], depth + 1);
    }
  }

  try {
    var data = JSON.parse(body);
    clean(data, 0);

    if (removedCount === 0) {
      $done({});
      return;
    }

    console.log(
      "[Instagram AdBlock] removed " +
        removedCount +
        " sponsored feed item(s)"
    );
    $done({ body: JSON.stringify(data) });
  } catch (error) {
    console.log(
      "[Instagram AdBlock] skipped non-JSON or unknown response: " + error
    );
    $done({});
  }
})();
