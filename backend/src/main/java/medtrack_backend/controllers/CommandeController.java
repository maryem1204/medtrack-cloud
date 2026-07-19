package medtrack_backend.controllers;

import medtrack_backend.Entities.Commande;
import medtrack_backend.Repositories.CommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/commandes")
public class CommandeController {
    @Autowired private CommandeRepository repo;

    @GetMapping public List<Commande> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Commande> getById(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Commande create(@RequestBody Commande c) { return repo.save(c); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}