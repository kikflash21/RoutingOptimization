package fr.uga.miage.l3.controllers;

import fr.uga.miage.l3.endpoints.TourneeEndpoints;
import fr.uga.miage.l3.endpoints.request.TourneeRequest;
import fr.uga.miage.l3.endpoints.response.TourneeResponse;
import fr.uga.miage.l3.mappers.TourneeMapper;
import fr.uga.miage.l3.models.domain.Tournee;
import fr.uga.miage.l3.services.TourneeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TourneeController implements TourneeEndpoints {

    private final TourneeService tourneeService;
    private final TourneeMapper tourneeMapper;

    @Override
    public TourneeResponse saveTournee(TourneeRequest request) {
        Tournee tournee = tourneeService.saveTournee(request);
        return tourneeMapper.toResponse(tournee);
    }

    @Override
    public List<TourneeResponse> getAllTournees() {
        return tourneeMapper.toResponse(tourneeService.getAllTournee());
    }

    @Override
    public void deleteTournee(Long tourneeId) {
        tourneeService.deleteTournee(tourneeId);
    }

    @Override
    public TourneeResponse updateTournee(Long tourneeId, TourneeRequest request) {
        Tournee tournee = tourneeService.updateTournee(tourneeId, request);
        return tourneeMapper.toResponse(tournee);
    }
}