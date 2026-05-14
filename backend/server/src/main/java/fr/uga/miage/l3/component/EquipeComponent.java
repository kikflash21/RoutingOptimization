package fr.uga.miage.l3.component;

import fr.uga.miage.l3.mappers.EquipeMapper;
import fr.uga.miage.l3.models.domain.Equipe;
import fr.uga.miage.l3.repository.CamionRepository;
import fr.uga.miage.l3.repository.EquipeRepository;
import fr.uga.miage.l3.repository.LivreurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EquipeComponent {

    private final EquipeRepository equipeRepository;
    private final LivreurRepository livreurRepository;
    private final CamionRepository camionRepository;

    private final EquipeMapper equipeMapper;

    @Transactional(readOnly = true)
    public List<Equipe> getAllEquipes() {
        return equipeMapper.toEquipes(equipeRepository.findAll());
    }

}