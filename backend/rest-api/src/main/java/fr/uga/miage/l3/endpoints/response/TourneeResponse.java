package fr.uga.miage.l3.endpoints.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourneeResponse {

    private Long id;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime debutTournee;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime finTournee;
    private Double dureeTotal;
    private List<Long> commandeIdsOrdonnees;
    private Long equipeId;
    private String equipeNom;
    private String camionPlaque;
    private List<Long> livreurIds;
}
