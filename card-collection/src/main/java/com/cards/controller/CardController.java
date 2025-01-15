package com.cards.controller;

import com.cards.model.Card;
import com.cards.repository.CardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;

@Controller
public class CardController {

    @Autowired
    private CardRepository cardRepository;
    private Random random = new Random();

    @GetMapping("/")
    public String index(Model model) {
        List<Card> cards = cardRepository.findAll();
        model.addAttribute("cards", cards);
        return "index";
    }

    @PostMapping("/openPack")
    @ResponseBody
    public Card openPack(@RequestParam int size) {
        List<Card> allCards = cardRepository.findAll();
        if (allCards.isEmpty()) {
            return null;
        }
        return allCards.get(random.nextInt(allCards.size()));
    }

    @PostMapping("/unlockCard")
    @ResponseBody
    public void unlockCard(@RequestParam Long cardId) {
        // In a real application, you would save this to user's collection
        // For now, we'll just acknowledge the request
    }
} 