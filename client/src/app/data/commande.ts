export interface CommandeResponse {
    id: number;
    nomClient: string;
    prenomClient: string;
    latitude: number;
    longitude: number;
    adresseComplete: string;
    statut: string;
    produits: unknown[]; 
}   
