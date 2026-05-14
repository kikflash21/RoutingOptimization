package fr.uga.miage.l3.exceptions.rest;

public class NotFoundEntrepotRestException extends RuntimeException{
    public NotFoundEntrepotRestException(String message){
        super(message);
    }
}
