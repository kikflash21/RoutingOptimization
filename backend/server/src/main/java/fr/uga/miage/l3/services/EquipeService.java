package fr.uga.miage.l3.services;

import fr.uga.miage.l3.component.EquipeComponent;
import fr.uga.miage.l3.models.domain.Equipe;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipeService {

    private final EquipeComponent equipeComponent;

    public List<Equipe> getAllEquipes() {
        return equipeComponent.getAllEquipes();
    }

}