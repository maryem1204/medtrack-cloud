package medtrack_backend.controllers;

import medtrack_backend.Entities.Utilisateur;
import medtrack_backend.Repositories.UtilisateurRepository;
import medtrack_backend.Services.NotificationService;
import medtrack_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import medtrack_backend.Entities.PasswordResetToken;
import medtrack_backend.Repositories.PasswordResetTokenRepository;
import medtrack_backend.Services.EmailService;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired private UtilisateurRepository repo;
    @Autowired private JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String motDePasse = body.get("motDePasse");

        Utilisateur user = repo.findByEmail(email).orElse(null);
        if (user == null || !encoder.matches(motDePasse, user.getMotDePasse())) {
            return ResponseEntity.status(401).body(Map.of("message", "Email ou mot de passe incorrect"));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "nom", user.getNom(),
                "prenom", user.getPrenom(),
                "role", user.getRole().name(),
                "id", user.getId()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Utilisateur u) {
        u.setMotDePasse(encoder.encode(u.getMotDePasse()));
        return ResponseEntity.ok(repo.save(u));
    }

    @Autowired private PasswordResetTokenRepository tokenRepo;
    @Autowired private EmailService emailService;
    @Autowired private NotificationService notificationService;
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String recaptchaToken = body.get("recaptchaToken");

        if (!verifierRecaptcha(recaptchaToken)) {
            return ResponseEntity.status(400)
                    .body(Map.of("message", "Vérification anti-robot échouée. Réessayez."));
        }

        Utilisateur user = repo.findByEmail(email).orElse(null);
        if (user != null) {
            String token = UUID.randomUUID().toString();
            PasswordResetToken prt = new PasswordResetToken();
            prt.setToken(token);
            prt.setEmail(email);
            prt.setDateExpiration(LocalDateTime.now().plusHours(1));
            tokenRepo.save(prt);
            try {
                emailService.envoyerReinitialisation(email, token);
            } catch (Exception e) {
                System.err.println("Email non envoyé : " + e.getMessage());
            }
        }
        return ResponseEntity.ok(Map.of("message", "Si cet email existe, un lien a été envoyé."));
    }

    private boolean verifierRecaptcha(String token) {
        try {
            if (token == null || token.isBlank()) return false;

            String SECRET = "6LcrnZ8tAAAAAN15-eQ-UXBx82Nm6mP0A1srWjdk";
            String params = "secret=" + SECRET + "&response=" + token;
            byte[] postData = params.getBytes(java.nio.charset.StandardCharsets.UTF_8);

            java.net.URL apiUrl = new java.net.URL("https://www.google.com/recaptcha/api/siteverify");
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) apiUrl.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setRequestProperty("Content-Length", String.valueOf(postData.length));
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.getOutputStream().write(postData);

            String response = new String(conn.getInputStream().readAllBytes());
            System.out.println("reCAPTCHA v2 response: " + response);

            // v2 : juste vérifier success=true, pas de score
            return response.contains("\"success\": true");

        } catch (Exception e) {
            System.err.println("Erreur reCAPTCHA: " + e.getMessage());
            return false;
        }
    }
    @GetMapping("/verify-token/{token}")
    public ResponseEntity<?> verifyToken(@PathVariable String token) {
        PasswordResetToken prt = tokenRepo.findByToken(token).orElse(null);
        if (prt == null || prt.isUtilise() || prt.getDateExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(400).body(Map.of("valid", false));
        }
        return ResponseEntity.ok(Map.of("valid", true, "email", prt.getEmail()));
    }

    @PostMapping("/set-password")
    public ResponseEntity<?> setPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("motDePasse");
        PasswordResetToken prt = tokenRepo.findByToken(token).orElse(null);
        if (prt == null || prt.isUtilise() || prt.getDateExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(400).body(Map.of("message", "Lien invalide ou expiré."));
        }
        Utilisateur user = repo.findByEmail(prt.getEmail()).orElse(null);
        if (user == null) return ResponseEntity.status(404).build();
        user.setMotDePasse(encoder.encode(newPassword));
        repo.save(user);
        // Notifier les admins que l'utilisateur a activé son compte
        notificationService.envoyerAuxAdmins(
                "✅ " + user.getNom() + " " + user.getPrenom() + " a activé son compte.",
                "UTILISATEUR"
        );
        prt.setUtilise(true);
        tokenRepo.save(prt);
        return ResponseEntity.ok(Map.of("message", "Mot de passe défini."));
    }
}