package medtrack_backend.controllers;

import medtrack_backend.Entities.HistoriqueAppareil;
import medtrack_backend.Repositories.HistoriqueAppareilRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/historique")
public class HistoriqueAppareilController {
    @Autowired private HistoriqueAppareilRepository repo;

    @GetMapping public List<HistoriqueAppareil> getAll() { return repo.findAll(); }

    @GetMapping("/appareil/{appareilId}")
    public List<HistoriqueAppareil> getByAppareil(@PathVariable Long appareilId) {
        return repo.findAll().stream()
                .filter(h -> h.getAppareil() != null && h.getAppareil().getId().equals(appareilId))
                .toList();
    }

    @PostMapping public HistoriqueAppareil create(@RequestBody HistoriqueAppareil h) { return repo.save(h); }
}