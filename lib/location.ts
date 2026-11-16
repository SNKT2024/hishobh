export interface UserLocationResult {
  latitude: number;
  longitude: number;
  locationName: string;
}

/**
 * Attempts to retrieve browser coordinates using standard accuracy first
 * (which succeeds quickly on desktop Wi-Fi and mobile), falling back to high accuracy if needed.
 */
function getBrowserCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser or device."));
      return;
    }

    // Step 1: Standard accuracy first (fast network/Wi-Fi positioning, avoids desktop GPS timeout)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err1) => {
        // If user explicitly denied permission, don't retry GPS, reject immediately
        if (err1.code === err1.PERMISSION_DENIED) {
          reject(err1);
          return;
        }

        // Step 2: Try high accuracy with a 4-second timeout
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            resolve({
              latitude: pos2.coords.latitude,
              longitude: pos2.coords.longitude,
            });
          },
          (err2) => {
            reject(err2);
          },
          {
            enableHighAccuracy: true,
            timeout: 4000,
            maximumAge: 60000,
          }
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 120000,
      }
    );
  });
}

/**
 * Reverse-geocodes latitude and longitude into a readable neighborhood, place, or city name.
 * Uses BigDataCloud free client API (CORS friendly) with OpenStreetMap Nominatim fallback.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  // Strategy 1: BigDataCloud free client-side reverse geocoder (CORS enabled, fast, no auth needed)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.neighbourhood || data.suburb;
      const city = data.city || data.principalSubdivision;

      const parts = [locality, city].filter(
        (val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx
      );

      if (parts.length > 0) {
        return parts.join(", ");
      }
      if (data.countryName) {
        return `${city || locality || "Location"}, ${data.countryName}`;
      }
    }
  } catch (err) {
    // Continue to strategy 2
  }

  // Strategy 2: OpenStreetMap Nominatim (no forbidden User-Agent header)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.address) {
        const addr = data.address;
        const place =
          addr.amenity ||
          addr.shop ||
          addr.building ||
          addr.road ||
          addr.suburb ||
          addr.neighbourhood;
        const city =
          addr.city || addr.town || addr.county || addr.state_district || addr.state;

        const parts = [place, city].filter(
          (val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx
        );

        if (parts.length > 0) {
          return parts.slice(0, 2).join(", ");
        }
        if (data.display_name) {
          return data.display_name.split(",").slice(0, 2).join(", ");
        }
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // Fallback: Formatted GPS Coordinates
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/**
 * Fallback to IP-based approximate location if browser GPS is disabled, unavailable, or denied.
 */
async function getIpBasedLocation(): Promise<UserLocationResult | null> {
  // Try freeipapi.com
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch("https://freeipapi.com/api/json", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const place = [data.cityName, data.regionName].filter(Boolean).join(", ");
        return {
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          locationName: place || data.countryName || "Current Location",
        };
      }
    }
  } catch (err) {
    // Continue
  }

  // Try ipapi.co
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch("https://ipapi.co/json/", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const place = [data.city, data.region].filter(Boolean).join(", ");
        return {
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          locationName: place || data.country_name || "Current Location",
        };
      }
    }
  } catch (err) {
    // Continue
  }

  return null;
}

/**
 * Requests location with multi-stage resilience:
 * 1. Checks device/browser geolocation (standard accuracy first, then high accuracy).
 * 2. If device location is unavailable, times out, or is denied, falls back to IP-based city detection.
 * 3. Reverse-geocodes coordinates into an accurate human-readable place name.
 */
export async function getCurrentUserLocation(): Promise<UserLocationResult> {
  // 1. Try browser geolocation
  try {
    const coords = await getBrowserCoordinates();
    const locationName = await reverseGeocode(coords.latitude, coords.longitude);
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      locationName,
    };
  } catch (browserError: any) {
    console.warn("Browser GPS not available or denied, trying IP fallback:", browserError?.message);

    // 2. Try IP-based location fallback
    const ipResult = await getIpBasedLocation();
    if (ipResult) {
      return ipResult;
    }

    // 3. User-friendly error message if everything failed
    let errorMsg = "Unable to automatically detect location. Please enter your location or store name manually.";
    if (browserError?.code === 1) {
      errorMsg = "Location permission denied in browser. Please allow permission or enter location manually.";
    }
    throw new Error(errorMsg);
  }
}

/**
 * Builds an interactive Google Maps / Apple Maps URL from coordinates or location name.
 */
export function getMapUrl(
  lat?: number | null,
  lng?: number | null,
  name?: string | null
): string {
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      name
    )}`;
  }
  return "#";
}
