import { LatLngTuple } from 'leaflet';
import { TripCost } from '../services/CostService';
import { GlobalOptimizationResult } from '../services/OptimizationService';
import { GreedyClusterResult } from '../services/GreedyService';

// ═══════════════════════════════════════════════════════════════════
//  ALGORITHM ENUM
// ═══════════════════════════════════════════════════════════════════

export enum AlgorithmType {
  KMedoids = 'kmedoids',
  KMeans   = 'kmeans',
  Greedy   = 'greedy',
  TwoOpt   = '2opt',
}

export const ALGORITHM_LABELS: Record<AlgorithmType, string> = {
  [AlgorithmType.KMedoids]: 'K-Medoids',
  [AlgorithmType.KMeans]:   'K-Means',
  [AlgorithmType.Greedy]:   'Greedy (nearest neighbor)',
  [AlgorithmType.TwoOpt]:   '2-Opt (amélioration locale)',
};

/** All algorithm values in execution order */
export const ALL_ALGORITHMS: readonly AlgorithmType[] = [
  AlgorithmType.KMedoids,
  AlgorithmType.KMeans,
  AlgorithmType.Greedy,
  AlgorithmType.TwoOpt,
];

/** Algorithms that use greedy-style results (route-based, no ORS optimization) */
export function isGreedyFamily(type: AlgorithmType): boolean {
  return type === AlgorithmType.Greedy || type === AlgorithmType.TwoOpt;
}

// ═══════════════════════════════════════════════════════════════════
//  WIZARD
// ═══════════════════════════════════════════════════════════════════

export type WizardStep = 'configuration' | 'resultats' | 'tournees';

export const WIZARD_STEPS: readonly WizardStep[] = [
  'configuration', 'resultats', 'tournees',
];

export interface WizardStepMeta {
  key: WizardStep;
  label: string;
  icon: string;
}

export const WIZARD_STEPS_META: readonly WizardStepMeta[] = [
  { key: 'configuration', label: 'Configuration', icon: '⚙️' },
  { key: 'resultats',     label: 'Résultats',      icon: '📊' },
  { key: 'tournees',      label: 'Tournées',       icon: '🗺️' },
];

// ═══════════════════════════════════════════════════════════════════
//  ALGORITHM COMPARISON
// ═══════════════════════════════════════════════════════════════════

export interface AlgoComparison {
  name: string;
  type: AlgorithmType;
  result?: GlobalOptimizationResult;
  greedyResult?: GreedyClusterResult[];
  greedyRoutes?: ReadonlyArray<LatLngTuple>[];
  greedySummaries?: { duration: number; distance: number }[];
  computeTimeMs: number;
  costs: TripCost[];
  totalCost: number;
  editableClusters?: EditableCluster[];
}

// ═══════════════════════════════════════════════════════════════════
//  EDITABLE CLUSTER
// ═══════════════════════════════════════════════════════════════════

export interface EditableCluster {
  commandeIds: number[];
  duree: number;
}

// ═══════════════════════════════════════════════════════════════════
//  STATS
// ═══════════════════════════════════════════════════════════════════

export interface AssignedStats {
  assigned: number;
  total: number;
  rate: number;
}
