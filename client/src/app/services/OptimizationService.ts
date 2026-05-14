import { LatLngTuple } from 'leaflet';
import { Cluster } from './ClusteringService';
import { OptimizationResult } from './OptimizationResult';

export interface GlobalOptimizationResult {
  clusterResults: Array<{
    deliveryPerson: number;
    cluster: Cluster;
    subOptimizations: OptimizationResult[];
    routes: ReadonlyArray<ReadonlyArray<LatLngTuple>>;
    totalDuration: number;
    totalDistance: number;
    totalStops: number;
  }>;
  totalVehicles: number;
  totalAPIcalls: number;
}
