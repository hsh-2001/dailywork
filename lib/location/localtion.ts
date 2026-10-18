export type UserLocation = {
  latitude: number;
  longitude: number;
};

function isUserLocation(value: unknown): value is UserLocation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const location = value as Record<string, unknown>;
  return (
    typeof location.latitude === "number" &&
    Number.isFinite(location.latitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    typeof location.longitude === "number" &&
    Number.isFinite(location.longitude) &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

function getPositionErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was denied.";
    case error.POSITION_UNAVAILABLE:
      return "The browser could not determine your location.";
    case error.TIMEOUT:
      return "The browser took too long to determine your location.";
    default:
      return "Unable to determine your location.";
  }
}

function getBrowserLocation(): Promise<UserLocation> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("This browser does not support location."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new Error(getPositionErrorMessage(error))),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export async function getCurrentUserLocation(): Promise<UserLocation> {
  const location = await getBrowserLocation();
  const response = await fetch("/api/v1/location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(location),
  });

  let result: unknown;
  try {
    result = await response.json();
    console.log("Location API response:", result);
  } catch {
    throw new Error("The location API returned an invalid response.");
  }

  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    throw new Error("The location API returned an invalid response.");
  }
  const payload = result as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      typeof payload.message === "string"
        ? payload.message
        : "Unable to retrieve your location.",
    );
  }
  if (!isUserLocation(payload.data)) {
    throw new Error("The location API returned invalid coordinates.");
  }

  return payload.data;
}
