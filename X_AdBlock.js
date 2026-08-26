/*
 * X / Twitter timeline ad remover for Loon.
 * Removes promoted timeline entries while preserving tweets and cursors.
 */

(function () {
  "use strict";

  var REMOVE = {};
  var removedCount = 0;
  var body = typeof $response !== "undefined" ? $response.body : "";

  if (!body) {
    $done({});
    return;
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isPromotedNode(object) {
    if (!object || typeof object !== "object") {
      return false;
    }

    // Current GraphQL responses use promotedMetadata. The other keys cover
    // older mobile timeline shapes without matching includePromotedContent.
    if (
      hasOwn(object, "promotedMetadata") ||
      hasOwn(object, "promoted_metadata") ||
      hasOwn(object, "promotedTweet") ||
      hasOwn(object, "promoted_tweet")
    ) {
      return true;
    }

    var entryId = object.entryId || object.entry_id || "";
    return typeof entryId === "string" && /^promoted(?:-|_|$)/i.test(entryId);
  }

  function clean(value) {
    if (Array.isArray(value)) {
      var output = [];

      for (var index = 0; index < value.length; index += 1) {
        var cleanedItem = clean(value[index]);
        if (cleanedItem === REMOVE) {
          removedCount += 1;
        } else {
          output.push(cleanedItem);
        }
      }

      return output;
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    if (isPromotedNode(value)) {
      return REMOVE;
    }

    var keys = Object.keys(value);
    for (var keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      var key = keys[keyIndex];
      var cleanedValue = clean(value[key]);

      // Propagate the marker until the closest containing array. This removes
      // one ad entry instead of deleting an entire timeline instruction.
      if (cleanedValue === REMOVE) {
        return REMOVE;
      }

      value[key] = cleanedValue;
    }

    return value;
  }

  try {
    var parsed = JSON.parse(body);
    var cleaned = clean(parsed);

    // A valid timeline keeps its root object. If an unexpected response puts
    // promotion metadata at the root, leave it untouched rather than corrupting it.
    if (cleaned === REMOVE || removedCount === 0) {
      $done({});
      return;
    }

    console.log("[X AdBlock] removed " + removedCount + " promoted timeline item(s)");
    $done({ body: JSON.stringify(cleaned) });
  } catch (error) {
    console.log("[X AdBlock] skipped non-JSON or unknown response: " + error);
    $done({});
  }
})();
