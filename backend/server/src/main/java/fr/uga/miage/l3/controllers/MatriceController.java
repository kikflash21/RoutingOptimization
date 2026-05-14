package fr.uga.miage.l3.controllers;

import fr.uga.miage.l3.endpoints.MatriceEndpoint;
import fr.uga.miage.l3.endpoints.request.MatriceRequest;
import fr.uga.miage.l3.endpoints.response.MatriceResponse;
import fr.uga.miage.l3.mappers.MatriceMapper;
import fr.uga.miage.l3.services.MatriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class MatriceController implements MatriceEndpoint {
    private final MatriceService matriceService;
    private final MatriceMapper matriceMapper;


    @Override
    public String saveMatrice(MatriceRequest matrice) {
        matriceService.saveMatrice(matrice);
        return "Matrice";
    }

    @Override
    public Set<MatriceResponse> getMatrices(List<Long> ids){
        return matriceMapper.toResponses(matriceService.getMatrices(ids));
    }
}
