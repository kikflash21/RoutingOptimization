export interface Adresse {
    id?: number;
    latitude: number;
    longitude: number;
    name: string;
    postCode: string;
    city: string;
}

/**
 * Représente une location dans la réponse de l'API Matrix (source ou destination)
 */
interface MatrixLocation {
    location: [number, number]; // [lng, lat]
    snapped_distance: number;
}

/**
 * Métadonnées de la réponse Matrix
 */
interface MatrixMetadata {
    attribution: string;
    service: string;
    timestamp: number;
    query: {
        locations: Array<[number, number]>;
        profile: string;
        profileName: string;
        responseType: string;
    };
    engine: {
        version: string;
        build_date: string;
        graph_date: string;
        osm_date: string;
    };
}

/**
 * Réponse complète de l'API ORS Matrix
 */
export interface MatrixResponse {
    durations: number[][];
    destinations: MatrixLocation[];
    sources: MatrixLocation[];
    metadata: MatrixMetadata;
}

