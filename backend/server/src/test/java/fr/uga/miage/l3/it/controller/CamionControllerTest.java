package fr.uga.miage.l3.it.controller;

import fr.uga.miage.l3.endpoints.response.CamionResponse;
import fr.uga.miage.l3.models.CamionEntity;
import fr.uga.miage.l3.models.EquipeEntity;
import fr.uga.miage.l3.repository.CamionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class CamionControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoSpyBean
    private CamionRepository camionRepository;

    @Test
    void getAllCamions() {
        List<EquipeEntity> equipes = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            EquipeEntity equipe = new EquipeEntity();
            equipe.setId((long) 100 + i);
            equipe.setNom("Equipe " + 100 + i);
            equipes.add(equipe);
        }

        List<CamionEntity> camions = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            CamionEntity camion = new CamionEntity();
            camion.setPlaque("12345" + i);
            camion.setVolume(50f);
            camion.setEstDisponible(true);
            camion.setPoidsMax(150f);
            camion.setEquipe(equipes.get(i));
            camions.add(camion);
        }

        when(camionRepository.findAll()).thenReturn(camions);

        webTestClient
                .get()
                .uri("/api/camion")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(CamionResponse.class)
                .hasSize(5)
                .value(responses -> {
                    assertThat(responses.get(0).getPlaque()).isEqualTo("123450");
                    assertThat(responses.get(0).getVolume()).isEqualTo(50f);
                    assertThat(responses.get(0).getEstDisponible()).isTrue();
                    assertThat(responses.get(0).getPoidsMax()).isEqualTo(150f);
                });
    }

}