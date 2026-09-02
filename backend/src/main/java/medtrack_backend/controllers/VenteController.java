package medtrack_backend.controllers;

import medtrack_backend.Entities.*;
import medtrack_backend.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ventes")
public class VenteController {
    @Autowired private VenteRepository repo;
    @Autowired private AppareilRepository appareilRepo;

    @GetMapping public List<Vente> getAll() { return repo.findAll(); }

    @PostMapping public Vente create(@RequestBody Vente v) {
        Vente saved = repo.save(v);
        if (v.getAppareil() != null) {
            Appareil a = appareilRepo.findById(v.getAppareil().getId()).orElse(null);
            if (a != null) { a.setStatut(StatutAppareil.VENDU); appareilRepo.save(a); }
        }
        return saved;
    }

    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}