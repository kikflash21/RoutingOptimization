import * as zod from "zod";
import { Adresse } from "../data/adresse";

interface GouvBatchedAdressResult {
    readonly lat: string;
    readonly lng: string;
    readonly result_name: string;
    readonly result_citycode: string;
    readonly result_city: string;
}

const GouvBatchedAdressResultSchema = zod.object({
    lat: zod.string(),
    lng: zod.string(),
    result_name: zod.string(),
    result_citycode: zod.string(),
    result_city: zod.string(),
});

const GouvBatchedAdressResultArraySchema = zod.array(GouvBatchedAdressResultSchema);

export function isArrayOfGouvBatchedAdressResultP(data: unknown): Promise<readonly GouvBatchedAdressResult[]> {
    return GouvBatchedAdressResultArraySchema.parseAsync(data);
}

const errorBadLatLng = new Error("Bad latitude or longitude in GouvBatchedAdressResult");
const errorNoAdressFound = new Error("No address found");

export function mapGouvBatchedAdressResultToAdresse(result: GouvBatchedAdressResult): Promise<Adresse> {
    const latitude = parseFloat(result.lat);
    const lng = parseFloat(result.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(lng)) return Promise.reject(errorBadLatLng);
    if (result.result_name === "") return Promise.reject(errorNoAdressFound);

    return Promise.resolve<Adresse>({
        latitude,
        longitude: lng,
        name: result.result_name,
        postCode: result.result_citycode,
        city: result.result_city,
    });
}
