package fr.uga.miage.l3.component;

import fr.uga.miage.l3.mappers.LivreurMapper;
import fr.uga.miage.l3.models.domain.Livreur;
import fr.uga.miage.l3.repository.LivreurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class LivreurComponent {

    private final LivreurRepository livreurRepository;
    private final LivreurMapper livreurMapper;

    public List<Livreur> getAllLivreurs(){
        return livreurMapper.toLivreurs(livreurRepository.findAll());
    }
}