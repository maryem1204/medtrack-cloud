package medtrack_backend.controllers;

import medtrack_backend.Entities.*;
import medtrack_backend.Repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/chat")
public class ChatProxyController {

    private static final Logger log = LoggerFactory.getLogger(ChatProxyController.class);

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Autowired private AppareilRepository appareilRepository;
    @Autowired private FournisseurRepository fournisseurRepository;
    @Autowired private CommandeRepository commandeRepository;
    @Autowired private MaintenanceRepository maintenanceRepository;
    @Autowired private AlerteRepository alerteRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private VenteRepository venteRepository;

    private final RestTemplate restTemplate;

    public ChatProxyController() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(20_000);
        this.restTemplate = new RestTemplate(factory);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> body, Authentication authentication) {
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.ok(reponseErreur("Le service IA n'est pas configuré pour le moment."));
        }

        String role = extraireRole(authentication);
        String email = authentication != null ? authentication.getName() : null;
        String contexte = construireContextePourRole(role, email);

        String system = "Tu es l'assistant MedTrack Cloud. Réponds toujours en français, de façon concise et professionnelle. "
                + "Ne mentionne jamais que tu utilises une API externe ou le nom d'un modèle. "
                + "Cet utilisateur a le rôle " + role + " : ne réponds qu'avec les données ci-dessous, "
                + "ne parle jamais de données d'autres rôles ou d'autres clients.\n\n" + contexte;

        Map<String, Object> bodyFinal = new HashMap<>();
        bodyFinal.put("messages", body.get("messages"));
        bodyFinal.put("system", system);

        try {
            return appellerGemini(bodyFinal);
        } catch (Exception e) {
            log.error("Erreur appel Gemini (1ère tentative)", e);
            try {
                Thread.sleep(500);
                return appellerGemini(bodyFinal);
            } catch (Exception e2) {
                log.error("Erreur appel Gemini (2ème tentative)", e2);
                return ResponseEntity.ok(reponseErreur("Je n'arrive pas à répondre pour le moment, réessayez dans quelques instants."));
            }
        }
    }

    private String extraireRole(Authentication authentication) {
        if (authentication == null) return "CLIENT";
        String autorite = authentication.getAuthorities().stream()
                .findFirst().map(GrantedAuthority::getAuthority).orElse("ROLE_CLIENT");
        return autorite.replace("ROLE_", "");
    }

    private String construireContextePourRole(String role, String email) {
        return switch (role) {
            case "ADMIN" -> construireContexteAdmin();
            case "COMMERCIAL" -> construireContexteCommercial();
            case "TECHNICIEN" -> construireContexteTechnicien();
            case "CLIENT" -> construireContexteClient(email);
            default -> "Aucune donnée accessible.";
        };
    }

    private String construireContexteAdmin() {
        List<Commande> commandes = commandeRepository.findAll();
        List<Appareil> appareils = appareilRepository.findAll();
        List<Fournisseur> fournisseurs = fournisseurRepository.findAll();
        List<Maintenance> maintenances = maintenanceRepository.findAll();
        List<Alerte> alertes = alerteRepository.findAll();

        return String.format(
                "COMMANDES (%d):\n%s\n\nAPPAREILS (%d):\n%s\n\nFOURNISSEURS (%d):\n%s\n\nMAINTENANCES (%d):\n%s\n\nALERTES ACTIVES (%d)",
                commandes.size(),
                commandes.stream().map(c -> c.getReference() + " | " + c.getStatut() + " | " + (c.getFournisseur() != null ? c.getFournisseur().getNom() : "N/A")).collect(Collectors.joining("\n")),
                appareils.size(),
                appareils.stream().map(a -> a.getNom() + " | " + a.getCategorie() + " | " + a.getStatut()).collect(Collectors.joining("\n")),
                fournisseurs.size(),
                fournisseurs.stream().map(Fournisseur::getNom).collect(Collectors.joining(", ")),
                maintenances.size(),
                maintenances.stream().map(m -> (m.getAppareil() != null ? m.getAppareil().getNom() : "N/A") + " | " + m.getType() + " | " + m.getStatut()).collect(Collectors.joining("\n")),
                alertes.size()
        );
    }

    private String construireContexteCommercial() {
        // Accès commercial : commandes, appareils, fournisseurs, clients, ventes — PAS maintenance/alertes internes technique
        List<Commande> commandes = commandeRepository.findAll();
        List<Fournisseur> fournisseurs = fournisseurRepository.findAll();
        List<Client> clients = clientRepository.findAll();
        List<Vente> ventes = venteRepository.findAll();

        return String.format(
                "COMMANDES (%d):\n%s\n\nFOURNISSEURS (%d):\n%s\n\nCLIENTS (%d)\n\nVENTES (%d):\n%s",
                commandes.size(),
                commandes.stream().map(c -> c.getReference() + " | " + c.getStatut()).collect(Collectors.joining("\n")),
                fournisseurs.size(),
                fournisseurs.stream().map(Fournisseur::getNom).collect(Collectors.joining(", ")),
                clients.size(),
                ventes.size(),
                ventes.stream().map(v -> v.getClient().getNom() + " | " + v.getAppareil().getNom() + " | " + v.getMontant() + "€").collect(Collectors.joining("\n"))
        );
    }

    private String construireContexteTechnicien() {
        // Accès technicien : appareils, maintenance, alertes — PAS données commerciales
        List<Appareil> appareils = appareilRepository.findAll();
        List<Maintenance> maintenances = maintenanceRepository.findAll();
        List<Alerte> alertes = alerteRepository.findAll();

        return String.format(
                "APPAREILS (%d):\n%s\n\nMAINTENANCES (%d):\n%s\n\nALERTES ACTIVES (%d):\n%s",
                appareils.size(),
                appareils.stream().map(a -> a.getNom() + " | " + a.getCategorie() + " | " + a.getStatut()).collect(Collectors.joining("\n")),
                maintenances.size(),
                maintenances.stream().map(m -> (m.getAppareil() != null ? m.getAppareil().getNom() : "N/A") + " | " + m.getType() + " | " + m.getStatut()).collect(Collectors.joining("\n")),
                alertes.size(),
                alertes.stream().map(Object::toString).collect(Collectors.joining("\n"))
        );
    }

    private String construireContexteClient(String email) {
        if (email == null) return "Aucune donnée accessible.";
        Optional<Client> clientOpt = clientRepository.findByUtilisateur_Email(email);
        if (clientOpt.isEmpty()) return "Aucune fiche client trouvée pour ce compte.";

        Client client = clientOpt.get();
        List<Vente> ventes = venteRepository.findByClient_Id(client.getId());

        return String.format(
                "VOS ACHATS (%d):\n%s",
                ventes.size(),
                ventes.stream().map(v -> v.getAppareil().getNom() + " | " + v.getDateVente() + " | " + v.getMontant() + "€").collect(Collectors.joining("\n"))
        );
    }

    private ResponseEntity<Map<String, Object>> appellerGemini(Map<String, Object> body) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey;

        List<Map<String, Object>> contents = new ArrayList<>();
        List<Map<String, Object>> historique = (List<Map<String, Object>>) body.get("messages");
        for (Map<String, Object> msg : historique) {
            String role = "user".equals(msg.get("role")) ? "user" : "model";
            contents.add(Map.of("role", role, "parts", List.of(Map.of("text", msg.get("content")))));
        }

        Map<String, Object> geminiBody = new HashMap<>();
        geminiBody.put("contents", contents);
        geminiBody.put("systemInstruction", Map.of("parts", List.of(Map.of("text", body.get("system")))));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(geminiBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        Map bodyResponse = response.getBody();

        List candidates = (List) bodyResponse.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            return ResponseEntity.ok(reponseErreur("Je n'ai pas pu générer de réponse, reformulez votre question."));
        }
        Map firstCandidate = (Map) candidates.get(0);
        Map content = (Map) firstCandidate.get("content");
        List parts = (List) content.get("parts");
        String text = (String) ((Map) parts.get(0)).get("text");

        return ResponseEntity.ok(Map.of("content", List.of(Map.of("text", text))));
    }

    private Map<String, Object> reponseErreur(String message) {
        return Map.of("content", List.of(Map.of("text", message)));
    }
}