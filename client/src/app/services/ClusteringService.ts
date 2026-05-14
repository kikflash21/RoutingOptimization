import { Adresse } from '../data/adresse';

export interface Cluster {
  id: number;
  adresses: Adresse[];
  center: { latitude: number; longitude: number };
  size: number;
  medoidIndex?: number;
}
