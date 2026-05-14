package fr.uga.miage.l3.controllers;

import fr.uga.miage.l3.endpoints.EquipeEndpoints;
import fr.uga.miage.l3.endpoints.response.EquipeResponse;
import fr.uga.miage.l3.mappers.EquipeMapper;
import fr.uga.miage.l3.services.EquipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EquipeController implements EquipeEndpoints {

    private final EquipeService equipeService;
    private final EquipeMapper equipeMapper;

    @Override
    public List<EquipeResponse> getAllEquipes() {
        return equipeMapper.toResponse(equipeService.getAllEquipes());
    }

}
