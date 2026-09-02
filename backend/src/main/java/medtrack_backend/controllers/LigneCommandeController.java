package medtrack_backend.controllers;

import medtrack_backend.Entities.LigneCommande;
import medtrack_backend.Repositories.LigneCommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lignes-commande")
public class LigneCommandeController {
    @Autowired private LigneCommandeRepository repo;

    @GetMapping("/commande/{commandeId}")
    public List<LigneCommande> getByCommande(@PathVariable Long commandeId) {
        return repo.findAll().stream()
                .filter(l -> l.getCommande() != null && l.getCommande().getId().equals(commandeId))
                .toList();
    }
}