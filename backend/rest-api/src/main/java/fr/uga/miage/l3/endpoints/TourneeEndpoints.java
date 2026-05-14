package fr.uga.miage.l3.endpoints;


import fr.uga.miage.l3.endpoints.request.TourneeRequest;
import fr.uga.miage.l3.endpoints.response.TourneeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/tournee")
public interface TourneeEndpoints {

    @Operation(description = "envoi de certain colis a l'optimisation")
    @ApiResponse(responseCode = "201", description = "La tournée a été créée avec succès")
    @ApiResponse(responseCode = "400", description = "Données invalides (ex: liste d'IDs vide)")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    TourneeResponse saveTournee(@RequestBody TourneeRequest request);

    @Operation(description = "Récupération de toutes les tournées")
    @ApiResponse(responseCode = "200", description = "Tournées récupérées avec succès")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping()
    List<TourneeResponse> getAllTournees();


    @Operation(description = "Suppression d'une tournée")
    @ApiResponse(responseCode = "204", description = "Tournée supprimée avec succès")
    @ApiResponse(responseCode = "404", description = "Tournée introuvable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{tourneeId}")
    void deleteTournee(@PathVariable Long tourneeId);

    @Operation(description = "Mise à jour d'une tournée (modification des arrêts)")
    @ApiResponse(responseCode = "200", description = "Tournée mise à jour")
    @ApiResponse(responseCode = "404", description = "Tournée introuvable")
    @ResponseStatus(HttpStatus.OK)
    @PutMapping("/{tourneeId}")
    TourneeResponse updateTournee(@PathVariable Long tourneeId, @RequestBody TourneeRequest request);
}