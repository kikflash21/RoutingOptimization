package fr.uga.miage.l3.it.repository;

import fr.uga.miage.l3.models.AdresseEntity;
import fr.uga.miage.l3.repository.AdresseRepository;
import fr.uga.miage.l3.repository.ClientRepository;
import fr.uga.miage.l3.repository.CommandeRepository;
import fr.uga.miage.l3.repository.LivreurRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class AdresseRepositoryTest {

    @Autowired
    private AdresseRepository adresseRepository;

    @Autowired
    private LivreurRepository livreurRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private CommandeRepository commandeRepository;

    @BeforeEach
    void setUp() {
        commandeRepository.deleteAll();
        livreurRepository.deleteAll();
        clientRepository.deleteAll();
        adresseRepository.deleteAll();
    }

    @AfterEach
    void clear() {
        adresseRepository.deleteAll();
    }

    @Test
    void findByEstDepotTrue(){
        AdresseEntity adresseDepot = AdresseEntity.builder()
                .id(500L)
                .numeroRue(10)
                .rue("Avenue de la République")
                .codePostale("38000")
                .ville("Grenoble")
                .estDepot(true)
                .build();

        AdresseEntity adresseNormale = AdresseEntity.builder()
                .id(501L)
                .numeroRue(25)
                .rue("Rue des Fleurs")
                .codePostale("38100")
                .ville("Grenoble")
                .estDepot(false)
                .build();

        adresseRepository.save(adresseDepot);
        adresseRepository.save(adresseNormale);

        Optional<AdresseEntity> result = adresseRepository.findByEstDepotTrue();

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(500L);
        assertThat(result.get().getEstDepot()).isTrue();
    }
}