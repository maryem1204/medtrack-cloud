package medtrack_backend.controllers;

import medtrack_backend.Entities.Vente;
import medtrack_backend.Repositories.VenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ventes")
public class VenteController {
    @Autowired private VenteRepository repo;

    @GetMapping public List<Vente> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Vente> getById(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Vente create(@RequestBody Vente v) { return repo.save(v); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}