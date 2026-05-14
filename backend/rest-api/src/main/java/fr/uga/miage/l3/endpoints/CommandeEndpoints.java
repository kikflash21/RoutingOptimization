package fr.uga.miage.l3.endpoints;

import fr.uga.miage.l3.endpoints.response.CommandeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RequestMapping("/api/commande")
public interface CommandeEndpoints {


    @Operation(description = "Récupération d'une liste précise de commandes via leurs IDs")
    @ApiResponse(responseCode = "200", description = "Les commandes demandées ont été récupérées")
    @ApiResponse(responseCode = "404", description = "Aucune commande trouvée pour les IDs fournis")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/batch")
    List<CommandeResponse> getCommandesByIds(@RequestParam Set<Long> ids);

    @Operation(description = "Récupération d'une liste précise de commandes via leurs statut")
    @ApiResponse(responseCode = "200", description = "Les commandes demandées ont été récupérées")
    @ApiResponse(responseCode = "404", description = "Aucune commande trouvée pour ce statut")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/statut/{statut}")
    List<CommandeResponse> getCommandesByStatut(@PathVariable String statut);
}
