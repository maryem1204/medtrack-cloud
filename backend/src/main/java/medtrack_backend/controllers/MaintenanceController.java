package medtrack_backend.controllers;

import medtrack_backend.Entities.Maintenance;
import medtrack_backend.Repositories.MaintenanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/maintenances")
public class MaintenanceController {
    @Autowired private MaintenanceRepository repo;

    @GetMapping public List<Maintenance> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Maintenance> getById(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/appareil/{appareilId}") public List<Maintenance> getByAppareil(@PathVariable Long appareilId) {
        return repo.findByAppareilId(appareilId);
    }
    @PostMapping public Maintenance create(@RequestBody Maintenance m) { return repo.save(m); }
    @PutMapping("/{id}") public ResponseEntity<Maintenance> update(@PathVariable Long id, @RequestBody Maintenance updated) {
        return repo.findById(id).map(existing -> {
            existing.setDatePrevue(updated.getDatePrevue());
            existing.setDateRealisee(updated.getDateRealisee());
            existing.setType(updated.getType());
            existing.setStatut(updated.getStatut());
            existing.setTechnicien(updated.getTechnicien());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}