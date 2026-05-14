package fr.uga.miage.l3.repository;

import fr.uga.miage.l3.models.CamionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CamionRepository extends JpaRepository<CamionEntity,String> {
}
