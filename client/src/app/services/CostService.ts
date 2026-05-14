import { Injectable, signal } from '@angular/core';

export interface TripCost {
  distanceKm: number;
  fuelLiters: number;
  fuelCost: number;
  totalCost: number;
}

interface CostParams {
  fuelPricePerLiter: number;       // €/L
  consumptionPer100km: number;     // L/100km (default: 12 for delivery truck)
}

const DEFAULT_PARAMS: CostParams = {
  fuelPricePerLiter: 1.75,
  consumptionPer100km: 12,
};

@Injectable({ providedIn: 'root' })
export class CostService {

  readonly currentFuelPrice = signal<number>(DEFAULT_PARAMS.fuelPricePerLiter);
  readonly fuelPriceSource = signal<string>('défaut');
  private _fetched = false;

  constructor() {
    this.fetchCurrentFuelPrice();
  }

  /**
   * Fetch current average Gazole price from French government open data.
   * Tries multiple query formats since the API field names can vary.
   */
  private async fetchCurrentFuelPrice(): Promise<void> {
    if (this._fetched) return;
    this._fetched = true;

    const attempts = [
      // Attempt 1: prix_nom field with single-quoted string (Opendatasoft v2.1 syntax)
      `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=prix_valeur&where=prix_nom%3D'Gazole'&limit=50`,
      // Attempt 2: carburant_nom field
      `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=prix_valeur&where=carburant_nom%3D'Gazole'&limit=50`,
      // Attempt 3: no filter — just grab records and look for Gazole
      `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?limit=50`,
    ];

    for (const url of attempts) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const records: any[] = data?.results ?? [];
        if (records.length === 0) continue;

        // Try to extract Gazole prices from records
        let prices: number[] = [];

        for (const rec of records) {
          // Format 1: prix_valeur field (when filtered by prix_nom)
          const pv = rec.prix_valeur;
          if (typeof pv === 'number' && pv > 0.5 && pv < 5) {
            prices.push(pv);
            continue;
          }
          // Format 2: gazole_prix field (denormalized)
          const gp = rec.gazole_prix;
          if (typeof gp === 'number' && gp > 0.5 && gp < 5) {
            prices.push(gp);
            continue;
          }
          // Format 3: price stored as prix/1000 (cents)
          if (typeof pv === 'number' && pv > 500 && pv < 5000) {
            prices.push(pv / 1000);
          }
        }

        if (prices.length > 0) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          this.applyPrice(avg);
          return;
        }
      } catch {
        // try next URL
      }
    }
    console.warn('[CostService] Impossible de récupérer le prix du carburant, utilisation du prix par défaut');
  }

  private applyPrice(price: number): void {
    const rounded = Math.round(price * 1000) / 1000;
    this.currentFuelPrice.set(rounded);
    this.fuelPriceSource.set('data.gouv.fr (temps réel)');
    console.log(`[CostService] Prix Gazole actuel: ${rounded} €/L (source: data.gouv.fr)`);
  }

  /**
   * Estimate the cost of a trip given its total duration (seconds) and distance (meters).
   * Uses average speed estimation from duration+distance when available,
   * otherwise estimates from duration alone.
   */
  estimateTripCost(
    durationSeconds: number,
    distanceMeters?: number,
    params: Partial<CostParams> = {}
  ): TripCost {
    const p = { ...DEFAULT_PARAMS, fuelPricePerLiter: this.currentFuelPrice(), ...params };

    // If distance not provided, estimate from duration (avg 35 km/h urban delivery)
    const distanceKm = distanceMeters != null
      ? distanceMeters / 1000
      : (durationSeconds / 3600) * 35;

    const fuelLiters = (distanceKm / 100) * p.consumptionPer100km;
    const fuelCost = fuelLiters * p.fuelPricePerLiter;

    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      fuelLiters: Math.round(fuelLiters * 100) / 100,
      fuelCost: Math.round(fuelCost * 100) / 100,
      totalCost: Math.round(fuelCost * 100) / 100,
    };
  }

  /**
   * Get default cost params
   */
  getDefaultParams(): CostParams {
    return { ...DEFAULT_PARAMS };
  }
}
