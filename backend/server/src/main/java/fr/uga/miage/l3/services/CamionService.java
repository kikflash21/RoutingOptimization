package fr.uga.miage.l3.services;

import fr.uga.miage.l3.component.CamionComponent;
import fr.uga.miage.l3.models.domain.Camion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CamionService {

    private final CamionComponent camionComponent;

    public List<Camion> getAllCamions() {
        return camionComponent.getAllCamions();
    }

}