package medtrack_backend.controllers;

import medtrack_backend.Entities.*;
import medtrack_backend.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ventes")
public class VenteController {
    @Autowired private VenteRepository repo;
    @Autowired private AppareilRepository appareilRepo;

    @GetMapping public List<Vente> getAll() { return repo.findAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Vente v) {
        if (v.getAppareil() == null) return ResponseEntity.badRequest().body(Map.of("message", "Appareil requis."));
        Appareil a = appareilRepo.findById(v.getAppareil().getId()).orElse(null);
        if (a == null) return ResponseEntity.badRequest().body(Map.of("message", "Appareil introuvable."));
        if (a.getStatut() == StatutAppareil.VENDU) {
            return ResponseEntity.status(409).body(Map.of("message", "Cet appareil a déjà été vendu."));
        }

        Vente saved = repo.save(v);
        a.setStatut(StatutAppareil.VENDU);
        appareilRepo.save(a);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Vente v = repo.findById(id).orElse(null);
        if (v == null) return ResponseEntity.notFound().build();

        // Annuler une vente remet logiquement l'appareil disponible à la revente
        if (v.getAppareil() != null) {
            Appareil a = appareilRepo.findById(v.getAppareil().getId()).orElse(null);
            if (a != null) { a.setStatut(StatutAppareil.EN_STOCK); appareilRepo.save(a); }
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}