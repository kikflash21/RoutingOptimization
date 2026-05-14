package fr.uga.miage.l3.it.repository;

import fr.uga.miage.l3.enums.Statut;
import fr.uga.miage.l3.models.CommandeEntity;
import fr.uga.miage.l3.repository.CommandeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class CommandeRepositoryTest {
    @Autowired
    private CommandeRepository commandeRepository;

    @AfterEach
    void clear() {
        commandeRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        commandeRepository.deleteAll();
    }

    @Test
    void findAllByStatutEnCourDeTraitement() {
        CommandeEntity commande1 = CommandeEntity.builder()
                .id(1L)
                .statut(Statut.EN_COURS_DE_TRAITEMENT)
                .build();

        CommandeEntity commande2 = CommandeEntity.builder()
                .id(2L)
                .statut(Statut.LIVREE)
                .build();

        commandeRepository.save(commande1);
        commandeRepository.save(commande2);

        List<CommandeEntity> result = commandeRepository.findAllByStatut(Statut.EN_COURS_DE_TRAITEMENT);

        assertThat(result).isNotNull();
        assertThat(result.size()).isEqualTo(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

}
