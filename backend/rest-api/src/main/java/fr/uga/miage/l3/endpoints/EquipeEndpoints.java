package fr.uga.miage.l3.endpoints;

import fr.uga.miage.l3.endpoints.response.EquipeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/equipe")
public interface EquipeEndpoints {

    @Operation(description = "Récupération de toutes les équipes")
    @ApiResponse(responseCode = "200", description = "Équipes récupérées")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    List<EquipeResponse> getAllEquipes();

}
