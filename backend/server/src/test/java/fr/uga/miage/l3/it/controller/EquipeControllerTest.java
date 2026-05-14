package fr.uga.miage.l3.it.controller;

import fr.uga.miage.l3.endpoints.response.EquipeResponse;
import fr.uga.miage.l3.models.EquipeEntity;
import fr.uga.miage.l3.repository.CamionRepository;
import fr.uga.miage.l3.repository.EquipeRepository;
import fr.uga.miage.l3.repository.LivreurRepository;
import fr.uga.miage.l3.repository.TourneeRepository;
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
public class EquipeControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private EquipeRepository equipeRepository;

    @Autowired
    private CamionRepository camionRepository;

    @Autowired
    private LivreurRepository livreurRepository;

    @Autowired
    private TourneeRepository tourneeRepository;

    @BeforeEach
    public void setUp() {
        camionRepository.deleteAllInBatch();
        livreurRepository.deleteAllInBatch();
        tourneeRepository.deleteAllInBatch();
        equipeRepository.deleteAllInBatch();
    }

    @Test
    void getAllEquipesFound() {
        EquipeEntity equipeEntity = new EquipeEntity();
        equipeEntity.setId(1L);
        equipeEntity.setNom("Equipe1");

        equipeRepository.save(equipeEntity);

        webTestClient
                .get()
                .uri("/api/equipe")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(EquipeResponse.class)
                .value(responses -> {
                    assertThat(responses).hasSize(1);
                    assertThat(responses.get(0).getId()).isEqualTo(1L);
                    assertThat(responses.get(0).getNom()).isEqualTo("Equipe1");
                });
    }
}