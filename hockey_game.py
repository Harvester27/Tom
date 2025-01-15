import pygame
import math
import random

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)

# Team colors
team_colors = {
    "Lancers": (255, 0, 0),    # Red
    "Kocouři": (0, 0, 0),      # Black
    "Netopýři": (128, 0, 128), # Purple
    "Lopaty": (0, 0, 139),     # Dark Blue
    "Ducks": (255, 255, 255),  # White
    "Viper": (173, 216, 230),  # Light Blue
    "červený": (255, 0, 0),    # Red for fun match
    "modrý": (0, 0, 255)       # Blue for fun match
}

class Mantinel:
    def __init__(self, x, y, width, height):
        self.rect = pygame.Rect(x, y, width, height)

class ArcBarrier:
    def __init__(self, center_x, center_y, radius, start_angle, end_angle, thickness):
        self.center_x = center_x
        self.center_y = center_y
        self.radius = radius
        self.start_angle = math.radians(start_angle)
        self.end_angle = math.radians(end_angle)
        self.thickness = thickness
        self.segments = []
        self._generate_segments()

    def _generate_segments(self):
        num_segments = 20
        for i in range(num_segments):
            angle = self.start_angle + (self.end_angle - self.start_angle) * i / (num_segments - 1)
            inner_x = self.center_x + (self.radius - self.thickness / 2) * math.cos(angle)
            inner_y = self.center_y + (self.radius - self.thickness / 2) * math.sin(angle)
            outer_x = self.center_x + (self.radius + self.thickness / 2) * math.cos(angle)
            outer_y = self.center_y + (self.radius + self.thickness / 2) * math.sin(angle)
            self.segments.append(pygame.Rect(
                min(inner_x, outer_x),
                min(inner_y, outer_y),
                abs(outer_x - inner_x),
                abs(outer_y - inner_y)
            ))

    def collides_with(self, rect):
        return any(segment.colliderect(rect) for segment in self.segments)

class Goal:
    def __init__(self, x, y, width, height):
        self.rect = pygame.Rect(x, y, width, height)
    
    def check_goal(self, puck):
        return self.rect.colliderect(puck.rect)

class Goalie:
    def __init__(self, x, y, size, is_left, name="Goalie"):
        self.x = x
        self.y = y
        self.size = size
        self.is_left = is_left
        self.name = name
        self.color = RED if is_left else BLUE
        self.rect = pygame.Rect(x - size//2, y - size//2, size, size)
        self.speed = 5

    def update(self, puck, dt):
        target_y = puck.y
        if abs(self.y - target_y) > self.speed:
            if self.y < target_y:
                self.y += self.speed
            else:
                self.y -= self.speed
        self.rect.center = (self.x, self.y)

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.size // 2)
        pygame.draw.circle(screen, WHITE, (int(self.x), int(self.y)), self.size // 2, 2)

    def check_collision(self, puck):
        return self.rect.colliderect(puck.rect)

def main():
    # Set up the display
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Hockey Game")
    clock = pygame.time.Clock()

    # Game loop
    running = True
    while running:
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False

        # Update game state
        
        # Clear the screen
        screen.fill(BLACK)
        
        # Draw game objects
        
        # Update the display
        pygame.display.flip()
        
        # Control game speed
        clock.tick(FPS)

    pygame.quit()

if __name__ == "__main__":
    main() 