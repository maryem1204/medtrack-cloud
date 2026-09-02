package medtrack_backend.controllers;

import medtrack_backend.Entities.*;
import medtrack_backend.Repositories.*;
import medtrack_backend.Services.NotificationService;
import medtrack_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/commandes")
public class CommandeController {

    @Autowired private CommandeRepository repo;
    @Autowired private AppareilRepository appareilRepo;
    @Autowired private UtilisateurRepository utilisateurRepo;
    @Autowired private NotificationService notificationService;
    @Autowired private JwtUtil jwtUtil;

    // Récupère l'utilisateur connecté depuis le token
    private Utilisateur getUtilisateurConnecte(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return utilisateurRepo.findByEmail(email).orElse(null);
    }

    @GetMapping
    public List<Commande> getAll() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Commande> getById(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Commande create(@RequestBody Commande c,
                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        c.setReference(genererProchaineReference());
        if (c.getLignes() != null) {
            c.getLignes().forEach(l -> l.setCommande(c));
        }

        // Associer le créateur
        Utilisateur createur = getUtilisateurConnecte(authHeader);
        if (createur != null) {
            c.setCreePar(createur);
        }

        Commande saved = repo.save(c);

        // Notifier les admins seulement si c'est un COMMERCIAL qui crée
        if (createur != null && createur.getRole().name().equals("COMMERCIAL")) {
            notificationService.envoyerAuxAdmins(
                    "📦 Nouvelle commande " + saved.getReference() +
                            " créée par " + createur.getNom() + " " + createur.getPrenom(),
                    "COMMANDE"
            );
        }

        return saved;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Commande> update(@PathVariable Long id,
                                           @RequestBody Commande updated,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return repo.findById(id).map(existing -> {
            StatutCommande ancienStatut = existing.getStatut();
            StatutCommande nouveauStatut = updated.getStatut();
            existing.setStatut(nouveauStatut);
            Commande saved = repo.save(existing);

            // Notifier selon le nouveau statut
            if (ancienStatut != nouveauStatut) {
                String message = buildMessageStatut(saved.getReference(), nouveauStatut);

                if (nouveauStatut == StatutCommande.ANNULEE) {
                    // Notifier le créateur + tous les admins
                    if (saved.getCreePar() != null) {
                        notificationService.envoyerNotification(message, "COMMANDE", saved.getCreePar().getId());
                    }
                    notificationService.envoyerAuxAdmins(message, "COMMANDE");
                } else {
                    // Notifier uniquement le créateur
                    if (saved.getCreePar() != null) {
                        notificationService.envoyerNotification(message, "COMMANDE", saved.getCreePar().getId());
                    }
                }
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/recevoir")
    public ResponseEntity<Commande> recevoir(@PathVariable Long id) {
        return repo.findById(id).map(commande -> {
            commande.setStatut(StatutCommande.RECUE);
            if (commande.getLignes() != null) {
                commande.getLignes().forEach(ligne -> {
                    Appareil a = ligne.getAppareil();
                    if (a != null) {
                        a.setStatut(StatutAppareil.EN_STOCK);
                        appareilRepo.save(a);
                    }
                });
            }
            Commande saved = repo.save(commande);

            // Notifier le créateur
            if (saved.getCreePar() != null) {
                notificationService.envoyerNotification(
                        "📬 Commande " + saved.getReference() + " marquée comme REÇUE — stock mis à jour.",
                        "COMMANDE",
                        saved.getCreePar().getId()
                );
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String genererProchaineReference() {
        Optional<Commande> derniere = repo.findTopByOrderByIdDesc();
        int prochainNumero = 1;
        if (derniere.isPresent() && derniere.get().getReference() != null) {
            String ref = derniere.get().getReference();
            try {
                prochainNumero = Integer.parseInt(ref.replace("CMD-", "")) + 1;
            } catch (NumberFormatException ignored) {}
        }
        return String.format("CMD-%04d", prochainNumero);
    }

    private String buildMessageStatut(String reference, StatutCommande statut) {
        return switch (statut) {
            case VALIDEE  -> "✅ Commande " + reference + " a été validée.";
            case RECUE    -> "📬 Commande " + reference + " a été reçue.";
            case ANNULEE  -> "❌ Commande " + reference + " a été annulée.";
            default       -> "🔄 Commande " + reference + " — statut mis à jour.";
        };
    }
}