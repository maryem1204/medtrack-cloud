package medtrack_backend.controllers;

import medtrack_backend.Entities.Client;
import medtrack_backend.Entities.PasswordResetToken;
import medtrack_backend.Entities.Utilisateur;
import medtrack_backend.Repositories.ClientRepository;
import medtrack_backend.Repositories.PasswordResetTokenRepository;
import medtrack_backend.Repositories.UtilisateurRepository;
import medtrack_backend.Services.EmailService;
import medtrack_backend.Services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {

    @Autowired
    private UtilisateurRepository utilisateurRepository;
    @Autowired private ClientRepository clientRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @GetMapping
    public List<Utilisateur> getAll() {
        return utilisateurRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Utilisateur> getById(@PathVariable Long id) {
        return utilisateurRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Autowired private PasswordResetTokenRepository tokenRepo;
    @Autowired private EmailService emailService;
    @Autowired private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Utilisateur utilisateur) {
        if (utilisateurRepository.findByEmail(utilisateur.getEmail()).isPresent()) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Un utilisateur avec cet email existe déjà."));
        }

        String motDePasseTemporaire = UUID.randomUUID().toString();
        utilisateur.setMotDePasse(encoder.encode(motDePasseTemporaire));
        Utilisateur saved = utilisateurRepository.save(utilisateur);

        if (saved.getRole() == medtrack_backend.Entities.Role.CLIENT) {
            Client client = new Client();
            client.setUtilisateur(saved);
            client.setNom(saved.getNom() + " " + saved.getPrenom());
            client.setType(saved.getTypeClient());
            client.setAdresse(saved.getAdresse());
            client.setTelephone(saved.getTelephone());
            clientRepository.save(client);
        }

        String token = UUID.randomUUID().toString();
        PasswordResetToken prt = new PasswordResetToken();
        prt.setToken(token);
        prt.setEmail(saved.getEmail());
        prt.setDateExpiration(LocalDateTime.now().plusHours(48));
        tokenRepo.save(prt);

        // Email non bloquant — si ça rate, l'utilisateur est quand même créé
        try {
            emailService.envoyerInvitation(saved.getEmail(), saved.getNom(), token);
            // Notifier les admins
            notificationService.envoyerAuxAdmins(
                    "Nouvel utilisateur créé : " + saved.getNom() + " " + saved.getPrenom() + " (" + saved.getRole() + ")",
                    "UTILISATEUR"
            );
        } catch (Exception e) {
            System.err.println("⚠️ Email non envoyé pour " + saved.getEmail() + " : " + e.getMessage());
            // On retourne quand même succès mais avec un warning
            return ResponseEntity.ok(Map.of(
                    "utilisateur", saved,
                    "warning", "Utilisateur créé mais l'email n'a pas pu être envoyé. Vérifiez la config SMTP."
            ));
        }

        return ResponseEntity.ok(saved);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Utilisateur> update(@PathVariable Long id, @RequestBody Utilisateur updated) {
        return utilisateurRepository.findById(id)
                .map(existing -> {
                    existing.setNom(updated.getNom());
                    existing.setPrenom(updated.getPrenom());
                    existing.setEmail(updated.getEmail());
                    existing.setTelephone(updated.getTelephone());
                    existing.setRole(updated.getRole());
                    // Ne réencode que si un nouveau mot de passe est fourni
                    if (updated.getMotDePasse() != null && !updated.getMotDePasse().isBlank()) {
                        existing.setMotDePasse(encoder.encode(updated.getMotDePasse()));
                    }
                    return ResponseEntity.ok(utilisateurRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!utilisateurRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        utilisateurRepository.delete(utilisateurRepository.findById(id).get());
        return ResponseEntity.noContent().build();
    }
}