import { CircleMarker, circleMarker, divIcon, LatLngExpression, marker, Marker } from "leaflet";

type MarkerColor = string;

export function getMarker(
	latng: LatLngExpression,
	color: MarkerColor = '#64748b',
	large = false
): CircleMarker {
    return circleMarker(latng, {
		radius: large ? 7 : 4,
		color: '#ffffff',
		fillColor: color,
		fillOpacity: large ? 0.95 : 0.85,
		weight: large ? 2 : 1.5,
	});
}

const DEPOT_PIN_SVG = (color: string): string => `
<svg viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 12.4 20.7 13.13 21.35a1.3 1.3 0 0 0 1.74 0C15.6 34.7 28 23.5 28 14 28 6.27 21.73 0 14 0z"
        fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
  <path d="M14 7.2 7.2 12.5v7.3a1.3 1.3 0 0 0 1.3 1.3h3.4v-4.5h4.2v4.5h3.4a1.3 1.3 0 0 0 1.3-1.3v-7.3L14 7.2z"
        fill="#ffffff"/>
</svg>`;

export function getDepotMarker(latlng: LatLngExpression, color: MarkerColor = '#ef4444'): Marker {
	return marker(latlng, {
		icon: divIcon({
			className: 'map-symbol-icon map-depot-icon',
			html: DEPOT_PIN_SVG(color),
			iconSize: [22, 28],
			iconAnchor: [11, 28],
		}),
	});
}

const CROSS_SVG = (color: string): string => `
<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M5 5 L15 15 M15 5 L5 15" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
  <path d="M5 5 L15 15 M15 5 L5 15" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

export function getCrossMarker(latlng: LatLngExpression, color: MarkerColor = '#f59e0b'): Marker {
	return marker(latlng, {
		icon: divIcon({
			className: 'map-symbol-icon map-cross-icon',
			html: CROSS_SVG(color),
			iconSize: [20, 20],
			iconAnchor: [10, 10],
		}),
	});
}
