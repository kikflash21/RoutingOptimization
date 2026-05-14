package fr.uga.miage.l3.it.controller;

import fr.uga.miage.l3.endpoints.response.AdresseResponse;
import fr.uga.miage.l3.exceptions.technical.NotFoundEntrepotException;
import fr.uga.miage.l3.models.AdresseEntity;
import fr.uga.miage.l3.repository.AdresseRepository;
import fr.uga.miage.l3.repository.ClientRepository;
import fr.uga.miage.l3.repository.CommandeRepository;
import fr.uga.miage.l3.repository.LivreurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class AdresseControllerTest {

    @Autowired
    private WebTestClient webTestClient;

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


    // TEST 1 : OK 200
    @Test
    void getEntrepotFound() throws NotFoundEntrepotException {
        // Given
        AdresseEntity adresse = new AdresseEntity();
        adresse.setId(1L);
        adresse.setNumeroRue(10);
        adresse.setRue("Rue de la Paix");
        adresse.setCodePostale("38000");
        adresse.setVille("Grenoble");
        adresse.setEstDepot(true);
        adresseRepository.save(adresse);

        // when - then
        webTestClient
                .get()
                .uri("/api/adresse/entrepot")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(AdresseResponse.class)
                .value(response -> {
                    assertThat(response).isNotNull();
                    assertThat(response.getVille()).isEqualTo("Grenoble");
                });
    }

    // TEST 2 NOT FOUND 404
    @Test
    void getEntrepotNotFound() {
        AdresseEntity adresse = new AdresseEntity();
        adresse.setId(1L);
        adresse.setNumeroRue(10);
        adresse.setRue("Rue de la Paix");
        adresse.setCodePostale("38000");
        adresse.setVille("Grenoble");
        adresse.setEstDepot(false);
        adresseRepository.save(adresse);


        webTestClient
                .get()
                .uri("/api/adresse/entrepot")
                .exchange()
                .expectStatus()
                .isNotFound();
    }
}
