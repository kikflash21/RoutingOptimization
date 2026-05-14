package fr.uga.miage.l3.it.controller;

import fr.uga.miage.l3.component.TourneeComponent;
import fr.uga.miage.l3.endpoints.request.TourneeRequest;
import fr.uga.miage.l3.endpoints.response.TourneeResponse;
import fr.uga.miage.l3.exceptions.rest.BadRequestRestException;
import fr.uga.miage.l3.exceptions.rest.NotFoundElementRestException;
import fr.uga.miage.l3.models.domain.Tournee;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class TourneeControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoSpyBean
    private TourneeComponent tourneeComponent;

    // ==================== POST /api/tournee ====================

    @Test
    void saveTourneeCreated() {
        // GIVEN
        TourneeRequest request = TourneeRequest.builder()
                .commandeIds(List.of(1L, 2L))
                .equipeId(1L)
                .build();

        Tournee tournee = new Tournee();
        tournee.setId(1L);
        tournee.setDebutTournee(LocalDateTime.now());
        tournee.setFinTournee(LocalDateTime.now().plusHours(2));
        tournee.setDuree(2.0);
        tournee.setCommandesOrdonnees(List.of());

        doReturn(tournee).when(tourneeComponent).saveTournee(any(), any(), anyFloat(), any(), any());

        // WHEN - THEN
        webTestClient
                .post()
                .uri("/api/tournee")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody(TourneeResponse.class)
                .value(response -> assertThat(response).isNotNull());
    }

    @Test
    void saveTourneeBadRequest_commandesVides() {
        // GIVEN — le service valide avant d'appeler le component
        TourneeRequest request = TourneeRequest.builder()
                .commandeIds(List.of())
                .equipeId(1L)
                .build();

        // WHEN - THEN
        webTestClient
                .post()
                .uri("/api/tournee")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus()
                .isBadRequest();
    }

    @Test
    void saveTourneeBadRequest_equipeNull() {
        // GIVEN — le service valide avant d'appeler le component
        TourneeRequest request = TourneeRequest.builder()
                .commandeIds(List.of(1L))
                .equipeId(null)
                .build();

        // WHEN - THEN
        webTestClient
                .post()
                .uri("/api/tournee")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus()
                .isBadRequest();
    }

    // ==================== GET /api/tournee ====================

    @Test
    void getAllTourneesFound() {
        // GIVEN
        Tournee tournee = new Tournee();
        tournee.setId(1L);
        tournee.setDebutTournee(LocalDateTime.now());
        tournee.setDuree(1.5);
        tournee.setCommandesOrdonnees(List.of());

        doReturn(List.of(tournee)).when(tourneeComponent).getAllTournee();

        // WHEN - THEN
        webTestClient
                .get()
                .uri("/api/tournee")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(TourneeResponse.class)
                .value(responses -> assertThat(responses).hasSize(1));
    }

    @Test
    void getAllTourneesEmpty() {
        // GIVEN
        doReturn(List.of()).when(tourneeComponent).getAllTournee();

        // WHEN - THEN
        webTestClient
                .get()
                .uri("/api/tournee")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(TourneeResponse.class)
                .value(responses -> assertThat(responses).isEmpty());
    }

    // ==================== DELETE /api/tournee/{id} ====================

    @Test
    void deleteTourneeSuccess() {
        // GIVEN
        doNothing().when(tourneeComponent).deleteTournee(anyLong());

        // WHEN - THEN
        webTestClient
                .delete()
                .uri("/api/tournee/{tourneeId}", 1L)
                .exchange()
                .expectStatus()
                .isNoContent();
    }

    @Test
    void deleteTourneeNotFound() {
        // GIVEN
        doThrow(new NotFoundElementRestException("Tournée introuvable"))
                .when(tourneeComponent).deleteTournee(anyLong());

        // WHEN - THEN
        webTestClient
                .delete()
                .uri("/api/tournee/{tourneeId}", 999L)
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    // ==================== PUT /api/tournee/{id} ====================

    @Test
    void updateTourneeSuccess() {
        // GIVEN
        TourneeRequest request = TourneeRequest.builder()
                .commandeIds(List.of(1L, 2L))
                .equipeId(1L)
                .build();

        Tournee tournee = new Tournee();
        tournee.setId(1L);
        tournee.setCommandesOrdonnees(List.of());

        doReturn(tournee).when(tourneeComponent).updateTournee(anyLong(), any(), anyFloat());

        // WHEN - THEN
        webTestClient
                .put()
                .uri("/api/tournee/{tourneeId}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(TourneeResponse.class)
                .value(response -> assertThat(response).isNotNull());
    }

    @Test
    void updateTourneeBadRequest_commandesVides() {
        // GIVEN — le service valide avant d'appeler le component
        TourneeRequest request = TourneeRequest.builder()
                .commandeIds(List.of())
                .equipeId(1L)
                .build();

        // WHEN - THEN
        webTestClient
                .put()
                .uri("/api/tournee/{tourneeId}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus()
                .isBadRequest();
    }

    @Test
    void updateTourneeNotFound() {
        // GIVEN
        TourneeRequest request = TourneeRequest.builder()
                .commandeIds(List.of(1L))
                .equipeId(1L)
                .build();

        doThrow(new BadRequestRestException("Tournée introuvable"))
                .when(tourneeComponent).updateTournee(anyLong(), any(), anyFloat());

        // WHEN - THEN
        webTestClient
                .put()
                .uri("/api/tournee/{tourneeId}", 999L)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus()
                .isBadRequest();
    }
}