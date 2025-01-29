import pygame
import random
from PIL import Image, ImageDraw
from dataclasses import dataclass
from typing import List, Dict, Optional

# Inicializace Pygame
pygame.init()

# Konstanty
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 720
FPS = 60

# Barvy
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GOLD = (255, 215, 0)

# Herní stavy
class GameState:
    MENU = "menu"
    COLLECTION = "collection"
    TEAM_SELECTION = "team_selection"
    MATCH = "match"
    TOURNAMENT = "tournament"

@dataclass
class PlayerCard:
    id: str
    name: str
    number: str
    position: str  # "GK", "DEF", "FWD"
    level: int
    rarity: str
    image_path: str = "/Images/question_mark.png"

@dataclass
class Team:
    name: str
    goalkeeper: Optional[PlayerCard]
    defenders: List[PlayerCard]
    forwards: List[PlayerCard]

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Hockey Cards Game")
        self.clock = pygame.time.Clock()
        
        # Herní stav
        self.current_state = GameState.MENU
        self.money = 100
        self.level = 1
        self.xp = 0
        
        # Kolekce karet
        self.unlocked_cards: List[PlayerCard] = []
        self.card_levels: Dict[str, int] = {}
        
        # Týmy
        self.selected_team = Team(
            name="Litvínov Lancers",
            goalkeeper=None,
            defenders=[],
            forwards=[]
        )
        
        # Načtení základních karet
        self.load_initial_cards()
    
    def load_initial_cards(self):
        # Základní karty
        initial_cards = [
            PlayerCard(
                id="jagr_basic",
                name="Jaromír Jágr",
                number="68",
                position="FWD",
                level=1,
                rarity="common"
            ),
            PlayerCard(
                id="hasek_basic",
                name="Dominik Hašek",
                number="39",
                position="GK",
                level=1,
                rarity="common"
            ),
            PlayerCard(
                id="pastrnak_basic",
                name="David Pastrňák",
                number="88",
                position="FWD",
                level=1,
                rarity="common"
            )
        ]
        self.unlocked_cards.extend(initial_cards)
    
    def open_pack(self):
        new_cards = []
        # Generování 3 náhodných karet
        for _ in range(3):
            rarity = self.generate_rarity()
            card = self.generate_random_card(rarity)
            new_cards.append(card)
            self.unlocked_cards.append(card)
        return new_cards
    
    def generate_rarity(self) -> str:
        roll = random.random()
        if roll < 0.60:  # 60% šance
            return "common"
        elif roll < 0.85:  # 25% šance
            return "rare"
        elif roll < 0.95:  # 10% šance
            return "epic"
        else:  # 5% šance
            return "legendary"
    
    def generate_random_card(self, rarity: str) -> PlayerCard:
        # Seznam možných jmen podle pozice
        goalkeepers = ["Dominik Hašek", "Jiří Králík", "Roman Turek"]
        defenders = ["Roman Hamrlík", "Tomáš Kaberle", "Filip Kuba"]
        forwards = ["Jaromír Jágr", "David Pastrňák", "Milan Hejduk"]
        
        position = random.choice(["GK", "DEF", "FWD"])
        if position == "GK":
            name = random.choice(goalkeepers)
        elif position == "DEF":
            name = random.choice(defenders)
        else:
            name = random.choice(forwards)
            
        return PlayerCard(
            id=f"{name.lower().replace(' ', '_')}_{random.randint(1000, 9999)}",
            name=name,
            number=str(random.randint(1, 99)),
            position=position,
            level=1,
            rarity=rarity
        )
    
    def run(self):
        running = True
        while running:
            # Zpracování událostí
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_SPACE:
                        if self.current_state == GameState.MENU:
                            new_cards = self.open_pack()
                            # TODO: Zobrazit animaci otevření balíčku
                    elif event.key == pygame.K_c:
                        self.current_state = GameState.COLLECTION
                    elif event.key == pygame.K_ESCAPE:
                        self.current_state = GameState.MENU
            
            # Vykreslení
            self.screen.fill((20, 20, 50))  # Tmavě modré pozadí
            
            # Vykreslení podle aktuálního stavu
            if self.current_state == GameState.MENU:
                self.draw_menu()
            elif self.current_state == GameState.COLLECTION:
                self.draw_collection()
            
            pygame.display.flip()
            self.clock.tick(FPS)
        
        pygame.quit()
    
    def draw_menu(self):
        # Pokyny
        font = pygame.font.Font(None, 36)
        
        text_lines = [
            ("Stiskni MEZERNÍK pro otevření balíčku", WINDOW_WIDTH//2, 50),
            (f"Peníze: {self.money} Kč", WINDOW_WIDTH//2, 100),
            (f"Level: {self.level}", WINDOW_WIDTH//2, 150),
            (f"XP: {self.xp}", WINDOW_WIDTH//2, 200),
            ("Stiskni C pro zobrazení kolekce", WINDOW_WIDTH//2, WINDOW_HEIGHT - 50)
        ]
        
        for text, x, y in text_lines:
            rendered = font.render(text, True, WHITE)
            rect = rendered.get_rect(center=(x, y))
            self.screen.blit(rendered, rect)
    
    def draw_collection(self):
        font = pygame.font.Font(None, 36)
        text = font.render("Kolekce karet (ESC pro návrat)", True, WHITE)
        text_rect = text.get_rect(center=(WINDOW_WIDTH//2, 50))
        self.screen.blit(text, text_rect)
        
        # TODO: Zobrazit karty v mřížce

if __name__ == "__main__":
    game = Game()
    game.run() 