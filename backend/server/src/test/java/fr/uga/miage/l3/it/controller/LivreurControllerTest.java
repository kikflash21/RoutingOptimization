package fr.uga.miage.l3.it.controller;

import fr.uga.miage.l3.component.LivreurComponent;
import fr.uga.miage.l3.endpoints.response.LivreurResponse;
import fr.uga.miage.l3.models.LivreurEntity;
import fr.uga.miage.l3.repository.LivreurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;


@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class LivreurControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private LivreurComponent livreurComponent;

    @Autowired
    private LivreurRepository livreurRepository;

    @BeforeEach
    public void setUp() {
        livreurRepository.deleteAll();
    }

    @Test
    void getAllLivreurs() {
        List<LivreurEntity> livreurs = new ArrayList<>();
        for(int i = 0; i < 5; i++) {
            LivreurEntity livreur = new LivreurEntity();
            livreur.setId((long) i);
            livreur.setPrenom("John" + i);
            livreur.setNom("Doe" + i);
            livreur.setEstDisponible(true);
            livreurs.add(livreur);
        }
        livreurRepository.saveAll(livreurs);

        webTestClient.get()
                .uri("/api/livreur")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(LivreurResponse.class)
                .hasSize(5)
                .value(responses -> {
                    assertThat(responses.get(0).getPrenom()).isEqualTo("John0");
                });
    }

}
