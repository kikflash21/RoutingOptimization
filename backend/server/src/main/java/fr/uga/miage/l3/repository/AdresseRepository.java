package fr.uga.miage.l3.repository;

import fr.uga.miage.l3.models.AdresseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdresseRepository extends JpaRepository<AdresseEntity,Long> {

    public Optional<AdresseEntity> findByEstDepotTrue();

}
