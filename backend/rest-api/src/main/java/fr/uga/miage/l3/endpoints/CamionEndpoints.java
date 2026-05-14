package fr.uga.miage.l3.endpoints;

import fr.uga.miage.l3.endpoints.response.CamionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/camion")
public interface CamionEndpoints {

    @Operation(description = "Récupération de tous les camions")
    @ApiResponse(responseCode = "200", description = "Camions récupérés")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    List<CamionResponse> getAllCamions();

}