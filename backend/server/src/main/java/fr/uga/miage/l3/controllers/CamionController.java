package fr.uga.miage.l3.controllers;

import fr.uga.miage.l3.endpoints.CamionEndpoints;
import fr.uga.miage.l3.endpoints.response.CamionResponse;
import fr.uga.miage.l3.mappers.CamionMapper;
import fr.uga.miage.l3.services.CamionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CamionController implements CamionEndpoints {

    private final CamionService camionService;
    private final CamionMapper camionMapper;

    @Override
    public List<CamionResponse> getAllCamions() {
        return camionMapper.toResponses(camionService.getAllCamions());
    }

}
