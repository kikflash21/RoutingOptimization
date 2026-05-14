import { inject, Injectable } from '@angular/core';
import { Adresse } from '../data/adresse';
import { LatLngLiteral, LatLngTuple } from 'leaflet';
import { unparse } from "papaparse";
import { extractAdressesFromApiGouvResponseString } from '../utils/extractAdressesFromApiGouvResponseString';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
//import { orsKey } from './orsKey';
import { environment } from '../../environemments/environment';
import { OptimizationResult, parseOptimizationResultP, RouteStepBase } from './OptimizationResult';
import { GeoJSONFeatureCollectionSchema, GeoJSONLineStringSchema } from 'zod-geojson';


/**
 * Encapsulates access to gouv.fr cartographic services (geocoding, etc.).
 * See https://adresse.data.gouv.fr/api-doc/adresse
 *     https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage
 *     https://data.geopf.fr/geocodage/openapi
 * Indication : Paramétrer le script de telle sorte que la fréquence d'appel à l'API de géocodage ne dépasse pas 50 requêtes par seconde, en instaurant par exemple un plafond à 40 ou 45 requêtes par seconde.
 */
const cartoURL = 'https://api-adresse.data.gouv.fr';

@Injectable({
  providedIn: 'root',
})
export class Carto {
  private readonly _httpClient = inject(HttpClient);

  /**
   * Gouv.api Reverse geocoding: from coordinates to addresses.
   * @param L List of coordinates (latitude, longitude)
   * @returns Promise resolving to the list of addresses corresponding to the given coordinates.
   * Only the coordinates that could be reverse geocoded will be present in the result.
   */
  public getAdressesFromCoordinates(L: readonly LatLngLiteral[]): Promise<readonly Adresse[]> {
    const url = new URL(cartoURL + '/reverse/csv');
    const formData = new FormData();
    const csvContent = unparse([...L], { delimiter: ';' });
    const csvBlob = new Blob([csvContent], {
      type: 'text/csv'
    });
    formData.append("lon", "lng");
    formData.append("columns", "lat");

    formData.append("data", csvBlob); // Suffixer avec nom de fichier ???

    // Observable de la requête HTTP POST
    const req$ = this._httpClient.post(url.toString(), formData, { responseType: 'text' });

    // Déclanchement de l'observable par la souscription et conversion en Promesse (fonction firstValueFrom)
    return firstValueFrom(req$).then(
      extractAdressesFromApiGouvResponseString
    )
  }

  /**
   * OpenRouteService Optimization API call.
   * @param nbVehicules Number of vehicles to use for the optimization. 
   * @param adresses 
   * @returns 
   */
  public optimize(params: Readonly<{
    nbVehicules: number,
    maxTimePerVehicule: number,
    adresses: readonly Adresse[],
    parking: Adresse
  }>): Promise<OptimizationResult> {
    const { nbVehicules, maxTimePerVehicule, adresses, parking } = params;
    const parkingLngLat: [number, number] = [parking.longitude, parking.latitude];
    const LVehicules = Array.from(
      { length: nbVehicules },
      (_, i) => ({
        id: i + 1,
        profile: "driving-car",
        start: parkingLngLat,
        end: parkingLngLat,
        max_travel_time: maxTimePerVehicule,
      })
    );

    // depotLngLat
    const usedJobIds = new Set<number>();
    const Ljobs = adresses.map((a, i) => {
      let jobId = typeof a.id === 'number' ? a.id : (i + 1);
      while (usedJobIds.has(jobId)) {
        jobId = 1_000_000 + i;
      }
      usedJobIds.add(jobId);

      return {
        id: jobId,
        location: [a.longitude, a.latitude],
        setup: 30,
        service: 300,
      };
    });

    // Request
    const req$ = this._httpClient.post(
      'https://api.openrouteservice.org/optimization',
      {
        jobs: Ljobs,
        vehicles: LVehicules,
      },
      {
        headers: {
          Authorization: environment.orsKey,
        }
      }
    );

    // Send request using firstValueFrom
    return firstValueFrom(req$).then(
      parseOptimizationResultP
    );
  }

  /** Max waypoints per ORS Directions call (free plan limit is ~70) */
  private static readonly DIRECTIONS_CHUNK_SIZE = 60;

  /**
   * Like getDirectionsWithSummary but handles routes with many waypoints by chunking.
   * Splits long routes into segments, calls ORS for each, and merges results.
   */
  public async getDirectionsWithSummaryChunked(
    lngLatCoordinates: readonly RouteStepBase['location'][]
  ): Promise<{ route: ReadonlyArray<LatLngTuple>; duration: number; distance: number }> {
    const sanitized = lngLatCoordinates
      .filter((coord): coord is RouteStepBase['location'] =>
        Array.isArray(coord) && coord.length === 2 && Number.isFinite(coord[0]) && Number.isFinite(coord[1])
      )
      .filter((coord, idx, arr) => idx === 0 || coord[0] !== arr[idx - 1][0] || coord[1] !== arr[idx - 1][1]);

    if (sanitized.length < 2) {
      return { route: [], duration: 0, distance: 0 };
    }

    if (sanitized.length <= Carto.DIRECTIONS_CHUNK_SIZE) {
      return this.getDirectionsWithSummary(sanitized);
    }

    // Split into overlapping chunks (last point of chunk N = first point of chunk N+1)
    const chunkSize = Carto.DIRECTIONS_CHUNK_SIZE;
    const chunks: RouteStepBase['location'][][] = [];
    for (let i = 0; i < sanitized.length; i += chunkSize - 1) {
      chunks.push(sanitized.slice(i, i + chunkSize));
      if (i + chunkSize >= sanitized.length) break;
    }

    let totalRoute: LatLngTuple[] = [];
    let totalDuration = 0;
    let totalDistance = 0;

    for (let ci = 0; ci < chunks.length; ci++) {
      // Delay between chunks to avoid rate limiting
      if (ci > 0) {
        await new Promise(r => setTimeout(r, 1500));
      }
      const chunk = chunks[ci];
      try {
        const result = await this.getDirectionsWithSummary(chunk);
        // Merge: skip first point of subsequent chunks to avoid duplicate
        if (totalRoute.length > 0 && result.route.length > 0) {
          totalRoute.push(...result.route.slice(1));
        } else {
          totalRoute.push(...result.route);
        }
        totalDuration += result.duration;
        totalDistance += result.distance;
      } catch {
        // If a chunk fails, use straight line for that segment
        const fallback = chunk.map(c => [c[1], c[0]] as LatLngTuple);
        if (totalRoute.length > 0) {
          totalRoute.push(...fallback.slice(1));
        } else {
          totalRoute.push(...fallback);
        }
      }
    }

    return { route: totalRoute, duration: totalDuration, distance: totalDistance };
  }

  /**
   * OpenRouteService direction API call.
   */
  public getDirections(lngLatCoordinates: readonly RouteStepBase['location'][]): Promise<ReadonlyArray<LatLngTuple>> {
    const sanitizedCoordinates = lngLatCoordinates
      .filter((coord): coord is RouteStepBase['location'] =>
        Array.isArray(coord) &&
        coord.length === 2 &&
        Number.isFinite(coord[0]) &&
        Number.isFinite(coord[1])
      )
      .filter((coord, idx, arr) => idx === 0 || coord[0] !== arr[idx - 1][0] || coord[1] !== arr[idx - 1][1]);

    // ORS directions needs at least 2 distinct points.
    if (sanitizedCoordinates.length < 2) {
      return Promise.resolve([]);
    }

    const directFallback = sanitizedCoordinates.map(geoJsonLngLatToLatLng);

    // Utilise uniquement l'endpoint standard + format=geojson.
    // L'endpoint /geojson renvoie souvent 406 dans ce projet.
    return this.requestDirections(
      'https://api.openrouteservice.org/v2/directions/driving-car?format=geojson',
      {
        coordinates: sanitizedCoordinates,
        radiuses: sanitizedCoordinates.map(() => 1500),
      },
      sanitizedCoordinates
    )
      .catch((error: any) => {
        console.warn('Directions ORS indisponible, fallback trace directe utilise.', error?.error ?? error);
        return directFallback;
      });
  }

  /**
   * Like getDirections, but also returns duration (seconds) and distance (meters) from the ORS response.
   */
  public getDirectionsWithSummary(lngLatCoordinates: readonly RouteStepBase['location'][]): Promise<{route: ReadonlyArray<LatLngTuple>; duration: number; distance: number}> {
    const sanitizedCoordinates = lngLatCoordinates
      .filter((coord): coord is RouteStepBase['location'] =>
        Array.isArray(coord) &&
        coord.length === 2 &&
        Number.isFinite(coord[0]) &&
        Number.isFinite(coord[1])
      )
      .filter((coord, idx, arr) => idx === 0 || coord[0] !== arr[idx - 1][0] || coord[1] !== arr[idx - 1][1]);

    if (sanitizedCoordinates.length < 2) {
      return Promise.resolve({ route: [], duration: 0, distance: 0 });
    }

    const directFallback = sanitizedCoordinates.map(geoJsonLngLatToLatLng);

    return this.requestDirectionsWithSummary(
      'https://api.openrouteservice.org/v2/directions/driving-car?format=geojson',
      {
        coordinates: sanitizedCoordinates,
        radiuses: sanitizedCoordinates.map(() => 1500),
      },
      sanitizedCoordinates
    ).catch(() => ({ route: directFallback, duration: 0, distance: 0 }));
  }

  private static readonly DIRECTIONS_MAX_RETRIES = 2;
  private static readonly DIRECTIONS_RETRY_DELAY_MS = 120_000; // 2 minutes

  private async requestDirectionsWithSummary(
    url: string,
    body: Record<string, unknown>,
    fallbackCoordinates: readonly RouteStepBase['location'][]
  ): Promise<{route: ReadonlyArray<LatLngTuple>; duration: number; distance: number}> {
    for (let attempt = 0; attempt <= Carto.DIRECTIONS_MAX_RETRIES; attempt++) {
      try {
        const req$ = this._httpClient.post(url, body, {
          headers: {
            Authorization: environment.orsKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        const res: any = await firstValueFrom(req$);

        if (res?.error?.message) {
          throw new Error(res.error.message);
        }

        let duration = 0;
        let distance = 0;

        // Extract summary from GeoJSON features or routes
        if (res?.type === 'FeatureCollection' && Array.isArray(res?.features)) {
          const summary = res.features?.[0]?.properties?.summary;
          duration = summary?.duration ?? 0;
          distance = summary?.distance ?? 0;
          const fc = await GeoJSONFeatureCollectionSchema.parseAsync(res);
          const lineStrings = await Promise.all(
            fc.features.map(f => GeoJSONLineStringSchema.parseAsync(f.geometry))
          );
          const route = lineStrings.flatMap(line => line.coordinates.map(geoJsonLngLatToLatLng));
          return { route, duration, distance };
        }

        const routeSummary = res?.routes?.[0]?.summary;
        duration = routeSummary?.duration ?? 0;
        distance = routeSummary?.distance ?? 0;

        const routeGeometry = res?.routes?.[0]?.geometry;
        if (routeGeometry?.type === 'LineString' && Array.isArray(routeGeometry.coordinates)) {
          return { route: routeGeometry.coordinates.map(geoJsonLngLatToLatLng), duration, distance };
        }

        if (typeof routeGeometry === 'string') {
          const decoded = decodeEncodedPolyline(routeGeometry);
          if (decoded.length >= 2) {
            return { route: decoded, duration, distance };
          }
          return { route: fallbackCoordinates.map(geoJsonLngLatToLatLng), duration, distance };
        }

        throw new Error('Format ORS directions non supporté.');
      } catch (err: any) {
        const status = err?.status ?? err?.error?.status ?? 0;
        const isRetryable = status === 429 || status === 0 || status === 503;
        if (isRetryable && attempt < Carto.DIRECTIONS_MAX_RETRIES) {
          const label = status === 429 ? '429 Too Many Requests' : status === 0 ? 'Network/CORS error' : `${status}`;
          console.warn(`[ORS Directions] ${label} — retry ${attempt + 1}/${Carto.DIRECTIONS_MAX_RETRIES} dans 2 min…`);
          await new Promise(r => setTimeout(r, Carto.DIRECTIONS_RETRY_DELAY_MS));
          continue;
        }
        throw err;
      }
    }
    throw new Error('ORS Directions: max retries exceeded');
  }

  private async requestDirections(
    url: string,
    body: Record<string, unknown>,
    fallbackCoordinates: readonly RouteStepBase['location'][]
  ): Promise<ReadonlyArray<LatLngTuple>> {
    for (let attempt = 0; attempt <= Carto.DIRECTIONS_MAX_RETRIES; attempt++) {
      try {
        const req$ = this._httpClient.post(url, body, {
          headers: {
            Authorization: environment.orsKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        const res: any = await firstValueFrom(req$);

        if (res?.error?.message) {
          throw new Error(res.error.message);
        }

        if (res?.type === 'FeatureCollection' && Array.isArray(res?.features)) {
          const fc = await GeoJSONFeatureCollectionSchema.parseAsync(res);
          const lineStrings = await Promise.all(
            fc.features.map(f => GeoJSONLineStringSchema.parseAsync(f.geometry))
          );
          return lineStrings.flatMap(line => line.coordinates.map(geoJsonLngLatToLatLng));
        }

        const routeGeometry = res?.routes?.[0]?.geometry;
        if (routeGeometry?.type === 'LineString' && Array.isArray(routeGeometry.coordinates)) {
          return routeGeometry.coordinates.map(geoJsonLngLatToLatLng);
        }

        if (typeof routeGeometry === 'string') {
          const decoded = decodeEncodedPolyline(routeGeometry);
          if (decoded.length >= 2) {
            return decoded;
          }
          return fallbackCoordinates.map(geoJsonLngLatToLatLng);
        }

        throw new Error('Format ORS directions non supporté.');
      } catch (err: any) {
        const status = err?.status ?? err?.error?.status ?? 0;
        const isRetryable = status === 429 || status === 0 || status === 503;
        if (isRetryable && attempt < Carto.DIRECTIONS_MAX_RETRIES) {
          const label = status === 429 ? '429 Too Many Requests' : status === 0 ? 'Network/CORS error' : `${status}`;
          console.warn(`[ORS Directions] ${label} — retry ${attempt + 1}/${Carto.DIRECTIONS_MAX_RETRIES} dans 2 min…`);
          await new Promise(r => setTimeout(r, Carto.DIRECTIONS_RETRY_DELAY_MS));
          continue;
        }
        throw err;
      }
    }
    throw new Error('ORS Directions: max retries exceeded');
  }
}

/**
 * Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
 * @param lngLat GeoJSON coordinate, contains at least [longitude, latitude]s
 * @returns a leaflet LatLngTuple
 */
function geoJsonLngLatToLatLng(lngLat: readonly number[]): LatLngTuple {
  return [lngLat[1], lngLat[0]];
}

/**
 * Decode an encoded polyline string (ORS) into Leaflet [lat, lng] tuples.
 */
function decodeEncodedPolyline(encoded: string, precision = 5): LatLngTuple[] {
  const coordinates: LatLngTuple[] = [];
  const factor = Math.pow(10, precision);
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}
