package fr.uga.miage.l3.component;

import fr.uga.miage.l3.models.MatriceDistanceEntity;
import fr.uga.miage.l3.models.MatriceDistanceId;
import fr.uga.miage.l3.mappers.MatriceMapper;
import fr.uga.miage.l3.models.domain.Matrice;
import fr.uga.miage.l3.repository.MatriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Component
public class MatriceComponent {

    private final MatriceRepository matriceRepository;
    private final MatriceMapper matriceMapper;

    public void saveMatrices(List<Matrice> matrices) {
        List<MatriceDistanceEntity> toutesLesEntites = matrices.stream()
                .map(matriceMapper::toEntity)
                .toList();

        int tailleDuLot = 50;
        int totalNouveauxTrajets = 0;

        for (int i = 0; i < toutesLesEntites.size(); i += tailleDuLot) {

            int fin = Math.min(i + tailleDuLot, toutesLesEntites.size());
            List<MatriceDistanceEntity> lotActuel = toutesLesEntites.subList(i, fin);

            List<MatriceDistanceId> idsAVerifier = lotActuel.stream()
                    .map(MatriceDistanceEntity::getId)
                    .toList();

            List<MatriceDistanceEntity> entitesExistantes = matriceRepository.findAllById(idsAVerifier);

            Set<MatriceDistanceId> idsExistants = entitesExistantes.stream()
                    .map(MatriceDistanceEntity::getId)
                    .collect(Collectors.toSet());

            List<MatriceDistanceEntity> nouvellesEntites = lotActuel.stream()
                    .filter(entite -> !idsExistants.contains(entite.getId()))
                    .toList();

            if (!nouvellesEntites.isEmpty()) {
                matriceRepository.saveAll(nouvellesEntites);
                totalNouveauxTrajets += nouvellesEntites.size();
            }
        }

    }

    public Set<Matrice> getMatrices(List<Long> listeId){
        return this.matriceMapper.toMatrices(matriceRepository.findAllByIdIdCommandeDepartInAndIdIdCommandeArriveeIn(listeId, listeId));
    }

}