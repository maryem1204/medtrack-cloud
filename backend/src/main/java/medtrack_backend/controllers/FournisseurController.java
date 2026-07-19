package medtrack_backend.controllers;

import medtrack_backend.Entities.Fournisseur;
import medtrack_backend.Repositories.FournisseurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/fournisseurs")
public class FournisseurController {
    @Autowired private FournisseurRepository repo;

    @GetMapping public List<Fournisseur> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Fournisseur> getById(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Fournisseur create(@RequestBody Fournisseur f) { return repo.save(f); }
    @PutMapping("/{id}") public ResponseEntity<Fournisseur> update(@PathVariable Long id, @RequestBody Fournisseur updated) {
        return repo.findById(id).map(existing -> {
            existing.setNom(updated.getNom());
            existing.setPays(updated.getPays());
            existing.setContact(updated.getContact());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}