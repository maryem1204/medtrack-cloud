package medtrack_backend.controllers;

import medtrack_backend.Entities.Client;
import medtrack_backend.Repositories.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {
    @Autowired private ClientRepository repo;

    @GetMapping public List<Client> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Client> getById(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Client create(@RequestBody Client c) { return repo.save(c); }
    @PutMapping("/{id}") public ResponseEntity<Client> update(@PathVariable Long id, @RequestBody Client updated) {
        return repo.findById(id).map(existing -> {
            existing.setNom(updated.getNom());
            existing.setType(updated.getType());
            existing.setAdresse(updated.getAdresse());
            existing.setTelephone(updated.getTelephone());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}