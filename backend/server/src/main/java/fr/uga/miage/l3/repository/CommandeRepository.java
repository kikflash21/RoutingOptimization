package fr.uga.miage.l3.repository;

import fr.uga.miage.l3.enums.Statut;
import fr.uga.miage.l3.models.CommandeEntity;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<CommandeEntity,Long> {

    List<CommandeEntity> findAllByStatut(Statut statut);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE CommandeEntity c SET c.tournee = NULL, c.ordreDansTournee = NULL WHERE c.tournee.id = :tourneeId")
    int clearTourneeByTourneeId(@Param("tourneeId") Long tourneeId);

    @Query("SELECT c.id FROM CommandeEntity c WHERE c.tournee.id = :tourneeId ORDER BY c.ordreDansTournee ASC")
    List<Long> findIdsByTourneeId(@Param("tourneeId") Long tourneeId);
}
