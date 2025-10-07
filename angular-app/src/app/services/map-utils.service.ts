import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapUtilsService {
  /**
   * Calculate distance between two coordinates
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
   * @param unit Unit of measurement: 'M' for miles, 'K' for kilometers, 'N' for nautical miles
   * @returns Distance in specified units
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number, unit: 'M' | 'K' | 'N' = 'M'): number {
    const radlat1 = Math.PI * lat1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const theta = lon1 - lon2;
    const radtheta = Math.PI * theta / 180;
    
    let dist = Math.sin(radlat1) * Math.sin(radlat2) +
               Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    
    if (unit === 'K') {
      dist = dist * 1.609344;
    }
    if (unit === 'N') {
      dist = dist * 0.8684;
    }
    
    return dist;
  }

  /**
   * Shade or blend colors
   * @param p Percentage (-1 to 1, negative for darker, positive for lighter)
   * @param from Source color
   * @param to Target color (optional)
   * @returns Blended color
   */
  shadeBlendConvert(p: number, from: string, to?: string): string | null {
    if (typeof p !== 'number' || p < -1 || p > 1 ||
        typeof from !== 'string' || (from[0] !== 'r' && from[0] !== '#') ||
        (typeof to !== 'string' && typeof to !== 'undefined')) {
      return null;
    }

    const sbcRip = (d: string): number[] | null => {
      const l = d.length;
      const RGB: any = {};
      
      if (l > 9) {
        const parts = d.split(',');
        if (parts.length < 3 || parts.length > 4) return null;
        RGB[0] = parseInt(parts[0].slice(4));
        RGB[1] = parseInt(parts[1]);
        RGB[2] = parseInt(parts[2]);
        RGB[3] = parts[3] ? parseFloat(parts[3]) : -1;
      } else {
        if (l === 8 || l === 6 || l === 3 || l === 2 || l === 1) return null;
        
        let hex = d;
        if (l < 6) {
          hex = '#' + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? d[4] + d[4] : '');
        }
        
        const num = parseInt(hex.slice(1), 16);
        RGB[0] = num >> 16 & 255;
        RGB[1] = num >> 8 & 255;
        RGB[2] = num & 255;
        RGB[3] = l === 9 || l === 5 ? Math.round(((num >> 24 & 255) / 255) * 10000) / 10000 : -1;
      }
      return RGB;
    };

    const i = parseInt;
    const r = Math.round;
    const h = from.length > 9;
    const toColor = to && to !== 'c' ? to : (p < 0 ? '#000000' : '#FFFFFF');
    const b = p < 0;
    p = b ? p * -1 : p;
    
    const f = sbcRip(from);
    const t = sbcRip(toColor);
    
    if (!f || !t) return null;
    
    if (h) {
      return 'rgb(' + r((t[0] - f[0]) * p + f[0]) + ',' +
             r((t[1] - f[1]) * p + f[1]) + ',' +
             r((t[2] - f[2]) * p + f[2]) +
             (f[3] < 0 && t[3] < 0 ? ')' : ',' +
              (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000 :
               t[3] < 0 ? f[3] : t[3]) + ')');
    } else {
      return '#' + (0x100000000 +
             (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 255) :
              t[3] > -1 ? r(t[3] * 255) :
              f[3] > -1 ? r(f[3] * 255) : 255) * 0x1000000 +
             r((t[0] - f[0]) * p + f[0]) * 0x10000 +
             r((t[1] - f[1]) * p + f[1]) * 0x100 +
             r((t[2] - f[2]) * p + f[2]))
             .toString(16).slice(f[3] > -1 || t[3] > -1 ? 1 : 3);
    }
  }

  /**
   * Default Leaflet icon configuration
   */
  configureLeafletIcons(): void {
    const iconRetinaUrl = 'assets/images/marker-icon-2x.png';
    const iconUrl = 'assets/images/marker-icon.png';
    const shadowUrl = 'assets/images/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }
}
