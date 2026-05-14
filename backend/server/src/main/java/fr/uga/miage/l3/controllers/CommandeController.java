package fr.uga.miage.l3.controllers;

import fr.uga.miage.l3.endpoints.CommandeEndpoints;
import fr.uga.miage.l3.endpoints.response.CommandeResponse;
import fr.uga.miage.l3.enums.Statut;
import fr.uga.miage.l3.mappers.CommandeMapper;
import fr.uga.miage.l3.services.CommandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class CommandeController implements CommandeEndpoints {
    private final CommandeService commandeService;
    private final CommandeMapper commandeMapper;


    @Override
    public List<CommandeResponse> getCommandesByIds(Set<Long> ids) {
        return commandeMapper.toResponses(commandeService.getCommandesByIds(ids));
    }
    @Override
    public List<CommandeResponse> getCommandesByStatut(String statut) {
        return commandeMapper.toResponses(commandeService.getCommandesByStatut(Statut.valueOf(statut)));
    }
}