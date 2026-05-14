package fr.uga.miage.l3.repository;

import fr.uga.miage.l3.models.EquipeEntity;
import fr.uga.miage.l3.models.TourneeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TourneeRepository extends JpaRepository<TourneeEntity,Long> {
    Optional<TourneeEntity> findByEquipe(EquipeEntity equipe);

    @Query("SELECT DISTINCT t FROM TourneeEntity t " +
            "LEFT JOIN FETCH t.equipe e " +
            "LEFT JOIN FETCH e.livreurs " +
            "LEFT JOIN FETCH e.camion")
    List<TourneeEntity> findAll();
}
