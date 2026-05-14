package fr.uga.miage.l3.controllers;


import fr.uga.miage.l3.endpoints.LivreurEndpoints;
import fr.uga.miage.l3.endpoints.response.LivreurResponse;
import fr.uga.miage.l3.mappers.LivreurMapper;
import fr.uga.miage.l3.services.LivreurService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class LivreurController implements LivreurEndpoints {
    private final LivreurService livreurService;
    private final LivreurMapper livreurMapper;

    @Override
    public List<LivreurResponse> getAllLivreurs(){
        return livreurMapper.toResponses(livreurService.getAllLivreurs());

    }

}
