package fr.uga.miage.l3.endpoints.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipeResponse {
    private Long id;
    private String nom;
    private String camionPlaque;
    private List<Long> livreurIds;
}
