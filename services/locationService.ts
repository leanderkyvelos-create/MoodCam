export const LocationService = {
  // Detects broad region based on Timezone (No permission needed)
  detectRegion: (): string => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone.startsWith('Europe/')) return 'EU';
      if (timeZone.startsWith('America/')) return 'US';
      if (timeZone.startsWith('Asia/')) return 'ASIA';
      if (timeZone.startsWith('Australia/')) return 'OC';
      if (timeZone.startsWith('Africa/')) return 'AF';
      return 'GLOBAL';
    } catch (e) {
      return 'GLOBAL';
    }
  },

  // Extracts city name from Timezone (e.g. "Europe/Berlin" -> "Berlin")
  // This is a fallback if GPS is denied
  getCityFromTimezone: (): string => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = timeZone.split('/')[1];
      return city ? city.replace(/_/g, ' ') : 'Unknown';
    } catch (e) {
      return 'Unknown';
    }
  },

  // Requests real GPS coordinates
  getCurrentPosition: async (): Promise<{lat: number, lng: number} | null> => {
    if (!navigator.geolocation) return null;
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation denied or failed:", error);
          resolve(null);
        }
      );
    });
  }
};