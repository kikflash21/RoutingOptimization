package fr.uga.miage.l3.endpoints;

import fr.uga.miage.l3.endpoints.request.MatriceRequest;
import fr.uga.miage.l3.endpoints.response.MatriceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RequestMapping("/api/matrice")
public interface MatriceEndpoint {

    @Operation(description = "Sauvegarde de la matrice")
    @ApiResponse(responseCode = "200", description = "La matrice à était sauvegardé avec succès")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping()
    String saveMatrice(@RequestBody MatriceRequest matrice);

    @Operation(description = "Récupération de d'un liste de matrice de distance à partir d'une liste d'id d'adresse ")
    @ApiResponse(responseCode = "200", description = "La liste de matrice de distance à bien  été recupéré")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("get")
    Set<MatriceResponse> getMatrices(@RequestParam List<Long> ids); //Peut etre remplacé par un Set par la suite
}