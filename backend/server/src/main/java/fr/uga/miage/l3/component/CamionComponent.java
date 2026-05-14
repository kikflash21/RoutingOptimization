package fr.uga.miage.l3.component;

import fr.uga.miage.l3.mappers.CamionMapper;
import fr.uga.miage.l3.models.domain.Camion;
import fr.uga.miage.l3.repository.CamionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CamionComponent {

    private final CamionRepository camionRepository;
    private final CamionMapper camionMapper;

    public List<Camion> getAllCamions() {
        return camionMapper.toCamions(camionRepository.findAll());
    }
}