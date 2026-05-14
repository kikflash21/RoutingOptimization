package fr.uga.miage.l3.endpoints.request;

import lombok.Builder;

import java.util.List;

@Builder
public record MatriceRequest (
         List<Long> idsCommandes,
         List<List<Double>> durations
)
{
}