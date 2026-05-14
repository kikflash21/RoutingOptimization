package fr.uga.miage.l3.services;

import fr.uga.miage.l3.component.LivreurComponent;
import fr.uga.miage.l3.models.domain.Livreur;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LivreurService {

    private final LivreurComponent livreurComponent;

    public List<Livreur> getAllLivreurs(){
        return livreurComponent.getAllLivreurs();
    }

}