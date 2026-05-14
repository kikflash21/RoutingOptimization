package fr.uga.miage.l3.endpoints;

import fr.uga.miage.l3.endpoints.response.LivreurResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

@RequestMapping("/api/livreur")
public interface LivreurEndpoints {

    @Operation(description = "Récupération d'une liste de tout les livreurs")
    @ApiResponse(responseCode = "200", description = "Les livreurs ont été recupérés avec succès")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping()
    List<LivreurResponse> getAllLivreurs();
}
