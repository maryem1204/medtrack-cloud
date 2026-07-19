package medtrack_backend.controllers;

import medtrack_backend.Entities.Appareil;
import medtrack_backend.Repositories.AppareilRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/appareils")
public class AppareilController {
    @Autowired private AppareilRepository repo;

    @GetMapping public List<Appareil> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Appareil> getById(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Appareil create(@RequestBody Appareil a) { return repo.save(a); }
    @PutMapping("/{id}") public ResponseEntity<Appareil> update(@PathVariable Long id, @RequestBody Appareil updated) {
        return repo.findById(id).map(existing -> {
            existing.setNumeroSerie(updated.getNumeroSerie());
            existing.setNom(updated.getNom());
            existing.setCategorie(updated.getCategorie());
            existing.setDateImport(updated.getDateImport());
            existing.setStatut(updated.getStatut());
            existing.setFournisseur(updated.getFournisseur());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}