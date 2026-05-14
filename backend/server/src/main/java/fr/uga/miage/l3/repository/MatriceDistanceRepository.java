package fr.uga.miage.l3.repository;

import fr.uga.miage.l3.models.MatriceDistanceEntity;
import fr.uga.miage.l3.models.MatriceDistanceId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatriceDistanceRepository extends JpaRepository<MatriceDistanceEntity, MatriceDistanceId> {
}
