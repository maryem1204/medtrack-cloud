package medtrack_backend.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    @Autowired private JavaMailSender mailSender;
    @Value("${app.frontend.url}") private String frontendUrl;

    public void envoyerInvitation(String email, String nom, String token) {
        String lien = frontendUrl + "/create-password?token=" + token;
        String html = buildEmailHtml(
                "Bienvenue sur MedTrack Cloud",
                "Bonjour " + nom + ",",
                "Un compte vient d'être créé pour toi sur MedTrack Cloud. Clique sur le bouton ci-dessous pour créer ton mot de passe et activer ton compte. Ce lien est valable 48 heures.",
                lien, "Créer mon mot de passe"
        );
        envoyer(email, "Bienvenue sur MedTrack Cloud — Activez votre compte", html);
    }

    public void envoyerReinitialisation(String email, String token) {
        String lien = frontendUrl + "/create-password?token=" + token;
        String html = buildEmailHtml(
                "Réinitialisation du mot de passe",
                "Bonjour,",
                "Tu as demandé la réinitialisation de ton mot de passe MedTrack Cloud. Clique sur le bouton ci-dessous (valide 1 heure). Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.",
                lien, "Réinitialiser mon mot de passe"
        );
        envoyer(email, "Réinitialisation de votre mot de passe MedTrack Cloud", html);
    }

    private void envoyer(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Erreur envoi email: " + e.getMessage());
        }
    }

    private String buildEmailHtml(String titre, String salutation, String message, String lien, String bouton) {
        return "<div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;'>"
                + "<div style='background:linear-gradient(135deg,#0d8f9e,#22aebc);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;'>"
                + "<h1 style='color:white;margin:0;font-size:20px;'>MedTrack Cloud</h1></div>"
                + "<div style='background:white;border-radius:16px;padding:32px;'>"
                + "<h2 style='color:#1f2937;font-size:18px;'>" + titre + "</h2>"
                + "<p style='color:#4b5563;'>" + salutation + "</p>"
                + "<p style='color:#4b5563;'>" + message + "</p>"
                + "<div style='text-align:center;margin:32px 0;'>"
                + "<a href='" + lien + "' style='background:#0d8f9e;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;'>" + bouton + "</a></div>"
                + "<p style='color:#9ca3af;font-size:12px;'>Si le bouton ne fonctionne pas, copie ce lien : " + lien + "</p>"
                + "</div></div>";
    }
}