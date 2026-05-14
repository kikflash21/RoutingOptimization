package fr.uga.miage.l3.it.controller;

import fr.uga.miage.l3.endpoints.request.MatriceRequest;
import fr.uga.miage.l3.endpoints.response.MatriceResponse;
import fr.uga.miage.l3.models.MatriceDistanceEntity;
import fr.uga.miage.l3.models.MatriceDistanceId;
import fr.uga.miage.l3.repository.MatriceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class MatriceControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private MatriceRepository matriceRepository;

    @BeforeEach
    void setUp() {
        matriceRepository.deleteAll();
    }

    @Test
    void saveMatriceSuccess() {
        // Given
        List<Long> commandeIds = List.of(1L, 2L, 3L);
        List<List<Double>> durations = List.of(
                List.of(0.0, 10.5, 20.3),
                List.of(10.5, 0.0, 15.2),
                List.of(20.3, 15.2, 0.0)
        );

        MatriceRequest request = MatriceRequest.builder()
                .idsCommandes(commandeIds)
                .durations(durations)
                .build();

        // When - Then
        webTestClient
                .post()
                .uri("/api/matrice")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(String.class)
                .value(response -> assertThat(response).isNotEmpty());
    }

    @Test
    void saveMatriceWithLargeMatrix() {
        // Given - Create a larger matrix
        List<Long> commandeIds = new ArrayList<>();
        List<List<Double>> durations = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            commandeIds.add((long) i);
        }

        for (int i = 0; i < 5; i++) {
            List<Double> row = new ArrayList<>();
            for (int j = 0; j < 5; j++) {
                row.add((double) (i * j + 10));
            }
            durations.add(row);
        }

        MatriceRequest request = MatriceRequest.builder()
                .idsCommandes(commandeIds)
                .durations(durations)
                .build();

        // When - Then
        webTestClient
                .post()
                .uri("/api/matrice")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(String.class)
                .value(response -> assertThat(response).isNotEmpty());
    }

    @Test
    void getMatricesEmpty() {
        // When - Then
        webTestClient
                .get()
                .uri(uriBuilder -> uriBuilder.path("/api/matrice/get")
                        .queryParam("ids", 1L, 2L)
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(MatriceResponse.class)
                .value(responses -> assertThat(responses).isEmpty());
    }

    @Test
    void getMatricesWithData() {
        // Given - Create some matrices
        MatriceDistanceId id1 = new MatriceDistanceId(1L, 2L);
        MatriceDistanceEntity matrice1 = MatriceDistanceEntity.builder()
                .id(id1)
                .duree(10.5)
                .distance(5.0)
                .build();

        MatriceDistanceId id2 = new MatriceDistanceId(1L, 3L);
        MatriceDistanceEntity matrice2 = MatriceDistanceEntity.builder()
                .id(id2)
                .duree(20.3)
                .distance(10.5)
                .build();

        matriceRepository.saveAll(List.of(matrice1, matrice2));

        // When - Then
        webTestClient
                .get()
                .uri(uriBuilder -> uriBuilder.path("/api/matrice/get")
                        .queryParam("ids", 1L, 2L)
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(MatriceResponse.class)
                .value(responses -> {
                    assertThat(responses).isNotEmpty();
                });
    }

    @Test
    void getMatricesMultipleIds() {
        // Given - Create matrices for multiple IDs
        List<MatriceDistanceEntity> matrices = new ArrayList<>();

        for (int i = 1; i <= 3; i++) {
            for (int j = i + 1; j <= 4; j++) {
                MatriceDistanceId id = new MatriceDistanceId((long) i, (long) j);
                MatriceDistanceEntity matrice = MatriceDistanceEntity.builder()
                        .id(id)
                        .duree((double) (i * j))
                        .distance((double) (i * j * 0.5))
                        .build();
                matrices.add(matrice);
            }
        }
        matriceRepository.saveAll(matrices);

        // When - Then
        webTestClient
                .get()
                .uri(uriBuilder -> uriBuilder.path("/api/matrice/get")
                        .queryParam("ids", 1L, 2L, 3L)
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(MatriceResponse.class)
                .value(responses -> {
                    assertThat(responses).isNotEmpty();
                });
    }

    @Test
    void saveMatriceAndRetrieve() {
        // Given
        List<Long> commandeIds = List.of(100L, 101L, 102L);
        List<List<Double>> durations = List.of(
                List.of(0.0, 5.5, 10.0),
                List.of(5.5, 0.0, 8.5),
                List.of(10.0, 8.5, 0.0)
        );

        MatriceRequest request = MatriceRequest.builder()
                .idsCommandes(commandeIds)
                .durations(durations)
                .build();

        // When - Save
        webTestClient
                .post()
                .uri("/api/matrice")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();

        // Then - Retrieve
        webTestClient
                .get()
                .uri(uriBuilder -> uriBuilder.path("/api/matrice/get")
                        .queryParam("ids", 100L, 101L)
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(MatriceResponse.class)
                .value(responses -> {
                    assertThat(responses).isNotEmpty();
                });
    }
}