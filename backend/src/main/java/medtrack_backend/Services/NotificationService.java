package medtrack_backend.Services;

import medtrack_backend.Entities.Notification;
import medtrack_backend.Entities.Utilisateur;
import medtrack_backend.Repositories.NotificationRepository;
import medtrack_backend.Repositories.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {

    @Autowired private NotificationRepository notificationRepo;
    @Autowired private UtilisateurRepository utilisateurRepo;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    // Envoyer à un utilisateur spécifique
    public void envoyerNotification(String message, String type, Long destinataireId) {
        Utilisateur destinataire = utilisateurRepo.findById(destinataireId).orElse(null);
        if (destinataire == null) return;

        Notification notif = new Notification(message, type, destinataire);
        notificationRepo.save(notif);

        // Envoyer en temps réel via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + destinataireId,
                new NotifDTO(notif)
        );
    }

    // Envoyer à tous les admins
    public void envoyerAuxAdmins(String message, String type) {
        utilisateurRepo.findAll().stream()
                .filter(u -> u.getRole().name().equals("ADMIN"))
                .forEach(admin -> envoyerNotification(message, type, admin.getId()));
    }

    public List<Notification> getNotifications(Long userId) {
        return notificationRepo.findByDestinataireIdOrderByDateCreationDesc(userId);
    }

    public long getNonLues(Long userId) {
        return notificationRepo.countByDestinataireIdAndLueFalse(userId);
    }

    public void marquerLues(Long userId) {
        List<Notification> notifs = notificationRepo.findByDestinataireIdOrderByDateCreationDesc(userId);
        notifs.forEach(n -> n.setLue(true));
        notificationRepo.saveAll(notifs);
    }

    // DTO interne
    public static class NotifDTO {
        public Long id;
        public String message;
        public String type;
        public boolean lue;
        public String dateCreation;

        public NotifDTO(Notification n) {
            this.id = n.getId();
            this.message = n.getMessage();
            this.type = n.getType();
            this.lue = n.isLue();
            this.dateCreation = n.getDateCreation().toString();
        }
    }
}