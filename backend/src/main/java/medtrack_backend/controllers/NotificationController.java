package medtrack_backend.controllers;

import medtrack_backend.Services.NotificationService;
import medtrack_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import medtrack_backend.Repositories.UtilisateurRepository;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired private NotificationService notificationService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UtilisateurRepository utilisateurRepo;

    private Long getUserId(String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        return utilisateurRepo.findByEmail(email).map(u -> u.getId()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestHeader("Authorization") String auth) {
        Long userId = getUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/count")
    public ResponseEntity<?> count(@RequestHeader("Authorization") String auth) {
        Long userId = getUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(java.util.Map.of("count", notificationService.getNonLues(userId)));
    }

    @PostMapping("/lire")
    public ResponseEntity<?> marquerLues(@RequestHeader("Authorization") String auth) {
        Long userId = getUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();
        notificationService.marquerLues(userId);
        return ResponseEntity.ok().build();
    }
}