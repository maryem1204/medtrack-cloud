package medtrack_backend.config;

import medtrack_backend.Entities.Role;
import medtrack_backend.Entities.Utilisateur;
import medtrack_backend.Repositories.UtilisateurRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initAdmin(UtilisateurRepository utilisateurRepository,
                                PasswordEncoder passwordEncoder) {
        return args -> {
            if (utilisateurRepository.findByEmail("admin@medtrack.com").isEmpty()) {
                Utilisateur admin = new Utilisateur();
                admin.setNom("Admin");
                admin.setPrenom("MedTrack");
                admin.setEmail("admin@medtrack.com");
                admin.setMotDePasse(passwordEncoder.encode("admin123"));
                admin.setRole(Role.ADMIN);
                utilisateurRepository.save(admin);
                System.out.println(">>> Compte admin créé automatiquement : admin@medtrack.com / admin123");
            } else {
                System.out.println(">>> Compte admin déjà existant, rien à faire.");
            }
        };
    }
}