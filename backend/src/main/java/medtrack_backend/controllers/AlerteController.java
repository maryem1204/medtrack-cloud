package medtrack_backend.controllers;

import medtrack_backend.Entities.Alerte;
import medtrack_backend.Repositories.AlerteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/alertes")
public class AlerteController {
    @Autowired private AlerteRepository repo;

    @GetMapping public List<Alerte> getAll() { return repo.findAll(); }
    @PostMapping public Alerte create(@RequestBody Alerte a) { return repo.save(a); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}