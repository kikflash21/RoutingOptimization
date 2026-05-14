package fr.uga.miage.l3.repository;

import fr.uga.miage.l3.models.MatriceDistanceEntity;
import fr.uga.miage.l3.models.MatriceDistanceId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface MatriceRepository extends JpaRepository<MatriceDistanceEntity, MatriceDistanceId> {

    Set<MatriceDistanceEntity> findAllByIdIdCommandeDepartInAndIdIdCommandeArriveeIn(
            List<Long> idIdCommandeDeparts,
            List<Long> idIdCommandeArrivees);

}

