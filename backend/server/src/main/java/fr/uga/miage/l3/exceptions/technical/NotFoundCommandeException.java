package fr.uga.miage.l3.exceptions.technical;

public class NotFoundCommandeException extends RuntimeException {
    public NotFoundCommandeException(String message) {
        super(message);
    }
}
