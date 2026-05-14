package fr.uga.miage.l3.controllers;

import fr.uga.miage.l3.endpoints.AdresseEndpoints;
import fr.uga.miage.l3.endpoints.response.AdresseResponse;
import fr.uga.miage.l3.mappers.AdresseMapper;
import fr.uga.miage.l3.services.AdresseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AdresseController implements AdresseEndpoints {
    private final AdresseService adresseService;
    private final AdresseMapper adresseMapper;

    @Override
    public AdresseResponse getEntrepot() {
        return adresseMapper.toResponse(adresseService.getEntrepot());
    }
}
