import { Injectable } from '@angular/core';
import { Adresse } from '../data/adresse';
import haversineDistance from 'haversine-distance';

interface GreedyRoute {
  orderedAddresses: Adresse[];
  totalDistance: number;
  orderedIndices: number[];
}

export interface GreedyClusterResult {
  clusterId: number;
  route: GreedyRoute;
}

interface RouteState {
  clusterId: number;
  addrs: Adresse[];
  indices: number[];
  totalDuration: number; // seconds, includes return-to-depot
}

@Injectable({ providedIn: 'root' })
export class GreedyService {

  /** Time spent at each delivery stop (setup + service), aligned with VROOM config */
  private static readonly SERVICE_TIME_PER_STOP = 330; // 30s setup + 300s service

  /** Circuity factor: real roads are ~40% longer than straight-line distance */
  private static readonly ROAD_CIRCUITY = 1.4;
  /** Conservative avg speed (km/h) for haversine-based depot-edge estimates */
  private static readonly HAVERSINE_SPEED_KMH = 35;

  /**
   * 2-opt local search improvement on top of greedy nearest-neighbor.
   * For each cluster route, repeatedly reverses sub-segments to reduce total distance.
   */
  solveWithTwoOpt(
    clusters: { id: number; adresses: Adresse[] }[],
    depot: { latitude: number; longitude: number },
    matrix: number[][],
    matrixIds: number[],
    maxTimePerVehicle: number = Infinity
  ): GreedyClusterResult[] {
    const greedy = this.solveGreedy(clusters, depot, matrix, matrixIds, maxTimePerVehicle);
    return greedy.map(cr => ({
      clusterId: cr.clusterId,
      route: this.twoOptImprove(cr.route, depot, matrix, matrixIds),
    }));
  }

  /**
   * 2-opt local search using ORS matrix durations for swap evaluation.
   * Falls back to haversine-estimated duration for depot edges (depot is not in the matrix).
   */
  private twoOptImprove(
    route: GreedyRoute,
    depot: { latitude: number; longitude: number },
    matrix: number[][],
    matrixIds: number[],
  ): GreedyRoute {
    if (route.orderedAddresses.length < 3) return route;

    const idToIdx = new Map<number, number>();
    for (let i = 0; i < matrixIds.length; i++) idToIdx.set(matrixIds[i], i);

    const addrs = [...route.orderedAddresses];
    const indices = [...route.orderedIndices];

    const getDuration = (
      a: { latitude: number; longitude: number; id?: number },
      b: { latitude: number; longitude: number; id?: number },
    ): number => {
      const mA = a.id != null ? idToIdx.get(a.id) : undefined;
      const mB = b.id != null ? idToIdx.get(b.id) : undefined;
      if (mA != null && mB != null) return matrix[mA][mB];
      return this.haversineDuration(a, b);
    };

    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < addrs.length - 1; i++) {
        for (let j = i + 2; j < addrs.length; j++) {
          const prevI = i === 0 ? depot : addrs[i - 1];
          const afterJ = j === addrs.length - 1 ? depot : addrs[j + 1];

          const currentCost = getDuration(prevI, addrs[i]) + getDuration(addrs[j], afterJ);
          const newCost = getDuration(prevI, addrs[j]) + getDuration(addrs[i], afterJ);

          if (newCost < currentCost - 1) {
            this.reverseSegment(addrs, i, j);
            this.reverseSegment(indices, i, j);
            improved = true;
          }
        }
      }
    }

    let totalDistance = 0;
    let prev: { latitude: number; longitude: number } = depot;
    for (const a of addrs) {
      totalDistance += haversineDistance(prev, a);
      prev = a;
    }
    totalDistance += haversineDistance(prev, depot);

    return { orderedAddresses: addrs, totalDistance, orderedIndices: indices };
  }

  private reverseSegment<T>(arr: T[], i: number, j: number): void {
    while (i < j) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
      j--;
    }
  }

  /**
   * Nearest-neighbor greedy with per-cluster time budget, plus a global redistribution pass:
   * any address left unassigned (because adding it would exceed maxTime in its cluster) is
   * re-inserted into the route with cheapest insertion cost that still fits within maxTime.
   * This prevents vehicles from sitting idle with spare time while packages remain unassigned.
   */
  solveGreedy(
    clusters: { id: number; adresses: Adresse[] }[],
    depot: { latitude: number; longitude: number },
    matrix: number[][],
    matrixIds: number[],
    maxTimePerVehicle: number = Infinity
  ): GreedyClusterResult[] {
    const idToMatrixIdx = new Map<number, number>();
    for (let i = 0; i < matrixIds.length; i++) idToMatrixIdx.set(matrixIds[i], i);

    const states: RouteState[] = [];
    const unassigned: Adresse[] = [];

    for (const cluster of clusters) {
      const nn = this.nearestNeighbor(cluster.adresses, depot, matrix, matrixIds, maxTimePerVehicle, idToMatrixIdx);
      states.push({
        clusterId: cluster.id,
        addrs: nn.orderedAddresses,
        indices: nn.orderedIndices,
        totalDuration: nn.totalDuration,
      });
      unassigned.push(...nn.unassignedAddresses);
    }

    if (unassigned.length > 0 && Number.isFinite(maxTimePerVehicle)) {
      this.redistributeUnassigned(states, unassigned, depot, matrix, idToMatrixIdx, maxTimePerVehicle);
    }

    return states.map(s => ({
      clusterId: s.clusterId,
      route: this.finalizeRoute(s.addrs, s.indices, depot),
    }));
  }

  /**
   * For each unassigned address, find the route+position with the cheapest insertion that keeps
   * the route within maxTime. Uses ORS matrix durations when both endpoints are matrix-indexed,
   * falls back to haversine estimate for depot edges.
   */
  private redistributeUnassigned(
    states: RouteState[],
    unassigned: Adresse[],
    depot: { latitude: number; longitude: number },
    matrix: number[][],
    idToMatrixIdx: Map<number, number>,
    maxTime: number,
  ): void {
    const getDuration = (
      a: { latitude: number; longitude: number; id?: number },
      b: { latitude: number; longitude: number; id?: number },
    ): number => {
      const mA = a.id != null ? idToMatrixIdx.get(a.id) : undefined;
      const mB = b.id != null ? idToMatrixIdx.get(b.id) : undefined;
      if (mA != null && mB != null) return matrix[mA][mB];
      return this.haversineDuration(a, b);
    };

    for (const addr of unassigned) {
      let bestState: RouteState | null = null;
      let bestPos = -1;
      let bestIncrease = Infinity;

      for (const state of states) {
        const n = state.addrs.length;
        for (let pos = 0; pos <= n; pos++) {
          const prev = pos === 0 ? depot : state.addrs[pos - 1];
          const next = pos === n ? depot : state.addrs[pos];

          const oldEdge = getDuration(prev, next);
          const newEdges = getDuration(prev, addr) + getDuration(addr, next);
          const increase = newEdges - oldEdge + GreedyService.SERVICE_TIME_PER_STOP;

          if (state.totalDuration + increase > maxTime) continue;
          if (increase < bestIncrease) {
            bestIncrease = increase;
            bestState = state;
            bestPos = pos;
          }
        }
      }

      if (bestState && bestPos >= 0) {
        bestState.addrs.splice(bestPos, 0, addr);
        bestState.indices.splice(bestPos, 0, bestState.indices.length); // synthetic local index
        bestState.totalDuration += bestIncrease;
      }
    }
  }

  /** Builds final GreedyRoute (haversine distance for cost estimation) from address list. */
  private finalizeRoute(
    addrs: Adresse[],
    indices: number[],
    depot: { latitude: number; longitude: number },
  ): GreedyRoute {
    let totalDistance = 0;
    let prev: { latitude: number; longitude: number } = depot;
    for (const a of addrs) {
      totalDistance += haversineDistance(prev, a);
      prev = a;
    }
    if (addrs.length > 0) totalDistance += haversineDistance(prev, depot);
    return { orderedAddresses: addrs, totalDistance, orderedIndices: indices };
  }

  private nearestNeighbor(
    adresses: Adresse[],
    depot: { latitude: number; longitude: number },
    matrix: number[][],
    matrixIds: number[],
    maxTime: number,
    idToMatrixIdx: Map<number, number>,
  ): { orderedAddresses: Adresse[]; orderedIndices: number[]; totalDuration: number; unassignedAddresses: Adresse[] } {
    if (adresses.length === 0) {
      return { orderedAddresses: [], orderedIndices: [], totalDuration: 0, unassignedAddresses: [] };
    }

    const visited = new Set<number>();
    const ordered: Adresse[] = [];
    const orderedIndices: number[] = [];
    let totalDuration = 0;

    let currentPos: { latitude: number; longitude: number } = depot;
    let currentMatrixIdx: number | null = null;

    for (let step = 0; step < adresses.length; step++) {
      let bestIdx = -1;
      let bestDuration = 0;
      let bestReturn = 0;

      for (let i = 0; i < adresses.length; i++) {
        if (visited.has(i)) continue;

        const addr = adresses[i];
        const addrMatrixIdx = addr.id != null ? idToMatrixIdx.get(addr.id) : undefined;

        let travelDuration: number;
        if (currentMatrixIdx != null && addrMatrixIdx != null) {
          travelDuration = matrix[currentMatrixIdx][addrMatrixIdx];
        } else {
          travelDuration = this.haversineDuration(currentPos, addr);
        }

        const returnDuration = this.haversineDuration(addr, depot);

        const projected = totalDuration + travelDuration + GreedyService.SERVICE_TIME_PER_STOP + returnDuration;
        if (projected > maxTime) continue;

        if (travelDuration < bestDuration || bestIdx === -1) {
          bestIdx = i;
          bestDuration = travelDuration;
          bestReturn = returnDuration;
        }
      }

      if (bestIdx === -1) break;

      visited.add(bestIdx);
      ordered.push(adresses[bestIdx]);
      orderedIndices.push(bestIdx);
      totalDuration += bestDuration + GreedyService.SERVICE_TIME_PER_STOP;

      currentPos = adresses[bestIdx];
      currentMatrixIdx = adresses[bestIdx].id != null ? (idToMatrixIdx.get(adresses[bestIdx].id!) ?? null) : null;
    }

    // Include final return-to-depot in totalDuration so redistribution sees true used time
    if (ordered.length > 0) {
      const last = ordered[ordered.length - 1];
      totalDuration += this.haversineDuration(last, depot);
    }

    const unassignedAddresses: Adresse[] = [];
    for (let i = 0; i < adresses.length; i++) {
      if (!visited.has(i)) unassignedAddresses.push(adresses[i]);
    }

    return { orderedAddresses: ordered, orderedIndices, totalDuration, unassignedAddresses };
  }

  /** Estimated road travel duration (seconds) from haversine distance with circuity factor. */
  private haversineDuration(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
  ): number {
    return (haversineDistance(a, b) * GreedyService.ROAD_CIRCUITY / 1000 / GreedyService.HAVERSINE_SPEED_KMH) * 3600;
  }
}
