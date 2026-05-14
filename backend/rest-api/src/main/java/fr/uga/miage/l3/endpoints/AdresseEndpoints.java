package fr.uga.miage.l3.endpoints;

import fr.uga.miage.l3.endpoints.response.AdresseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;

@RequestMapping("/api/adresse")
public interface AdresseEndpoints {

    @Operation(description = "Récupération de l'entrepot")
    @ApiResponse(responseCode = "200", description = "L'entrepot a bien été recupéré")
    @ApiResponse(responseCode = "404", description = "L'entrepot est introuvable")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/entrepot")
    AdresseResponse getEntrepot();

}