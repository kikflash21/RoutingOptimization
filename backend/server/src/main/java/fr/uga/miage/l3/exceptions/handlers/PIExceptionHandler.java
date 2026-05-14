package fr.uga.miage.l3.exceptions.handlers;

import fr.uga.miage.l3.errors.ErrorDTO;
import fr.uga.miage.l3.exceptions.rest.BadRequestRestException;
import fr.uga.miage.l3.exceptions.rest.NotFoundCommandesRestExcption;
import fr.uga.miage.l3.exceptions.rest.NotFoundEntrepotRestException;
import fr.uga.miage.l3.exceptions.rest.NotFoundElementRestException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class PIExceptionHandler {

    @ExceptionHandler(NotFoundElementRestException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ErrorDTO notFoundException(HttpServletRequest httpServletRequest, NotFoundElementRestException ex){
        return new ErrorDTO(
                httpServletRequest.getRequestURI(),
                ex.getMessage()
        );
    }

    @ExceptionHandler(BadRequestRestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ErrorDTO badRequest(HttpServletRequest httpServletRequest, BadRequestRestException ex){
        return new ErrorDTO(
                httpServletRequest.getRequestURI(),
                ex.getMessage()
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ErrorDTO illegalArgument(HttpServletRequest httpServletRequest, IllegalArgumentException ex){
        return new ErrorDTO(
                httpServletRequest.getRequestURI(),
                ex.getMessage()
        );
    }

    @ExceptionHandler(NotFoundEntrepotRestException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ErrorDTO notFoundEntrepotException(HttpServletRequest httpServletRequest, NotFoundEntrepotRestException ex){
        return new ErrorDTO(
                httpServletRequest.getRequestURI(),
                ex.getMessage()
        );
    }

    @ExceptionHandler(NotFoundCommandesRestExcption.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ErrorDTO notFoundCommandeException(HttpServletRequest httpServletRequest, NotFoundCommandesRestExcption ex) {
        return new ErrorDTO(
                httpServletRequest.getRequestURI(),
                ex.getMessage()
        );
    }
}
