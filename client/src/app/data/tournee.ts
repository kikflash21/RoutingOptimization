export interface TourneeResponse {
  id: number;
  debutTournee: string;
  finTournee: string;
  dureeTotal: number;
  commandeIdsOrdonnees: number[];
  equipeId: number;
  equipeNom: string;
  camionPlaque: string;
  livreurIds: number[];
}