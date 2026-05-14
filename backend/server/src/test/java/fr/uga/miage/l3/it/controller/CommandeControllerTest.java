package fr.uga.miage.l3.it.controller;

import fr.uga.miage.l3.endpoints.response.CommandeResponse;
import fr.uga.miage.l3.enums.Statut;
import fr.uga.miage.l3.models.CommandeEntity;
import fr.uga.miage.l3.repository.CommandeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class    CommandeControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private CommandeRepository commandeRepository;

    @BeforeEach
    void setUp() {
        commandeRepository.deleteAll();
    }

    @Test
    void getCommandesByStatutFound() {
        // GIVEN
        CommandeEntity commande = CommandeEntity.builder()
                .id(1L)
                .statut(Statut.EN_COURS_DE_TRAITEMENT)
                .dateCommande(LocalDateTime.now())
                .build();
        commandeRepository.save(commande);

        // WHEN - THEN
        webTestClient
                .get()
                .uri("/api/commande/statut/{statut}", "EN_COURS_DE_TRAITEMENT")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(CommandeResponse.class)
                .value(responses -> {
                    assertThat(responses).hasSize(1);
                    assertThat(responses.get(0).getStatut()).isEqualTo("EN_COURS_DE_TRAITEMENT");
                });
    }

    @Test
    void getCommandesByStatutNotFound() {
        // GIVEN — aucune commande en BDD

        // WHEN - THEN
        webTestClient
                .get()
                .uri("/api/commande/statut/{statut}", "EN_COURS_DE_TRAITEMENT")
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    @Test
    void getCommandesByIdsFound() {
        // GIVEN
        CommandeEntity commande = CommandeEntity.builder()
                .id(1L)
                .statut(Statut.EN_COURS_DE_TRAITEMENT)
                .dateCommande(LocalDateTime.now())
                .build();
        commandeRepository.save(commande);

        // WHEN - THEN
        webTestClient
                .get()
                .uri("/api/commande/batch?ids=1")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(CommandeResponse.class)
                .value(responses -> {
                    assertThat(responses).hasSize(1);
                });
    }

    @Test
    void getCommandesByIdsNotFound() {
        // GIVEN — aucune commande en BDD

        // WHEN - THEN
        webTestClient
                .get()
                .uri("/api/commande/batch?ids=999")
                .exchange()
                .expectStatus()
                .isNotFound();
    }
}