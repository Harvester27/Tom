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

        def dribble(self, puck):
            puck.x = self.x + self.size/2 + self.puck_offset
            puck.y = self.y
            self.x += random.uniform(-2, 2) * self.dribbling_skill
            self.y += random.uniform(-2, 2) * self.dribbling_skill

        def try_to_get_puck(self, puck):
            if self.distance_to(puck.x, puck.y) < self.size + puck.size:
                self.has_puck = True
                puck.x = self.x + self.size/2 + self.puck_offset
                puck.y = self.y

        def is_puck_in_defensive_zone(self, puck):
            return puck.x < 940 if self.is_red_team else puck.x > 940

        def distance_to(self, x, y):
            return math.sqrt((self.x - x)**2 + (self.y - y)**2)

init python:
    class Center(AIOpponent):
        def __init__(self, x, y, size, is_red_team, name):
            super(Center, self).__init__(x, y, size, "Center", is_red_team, name)
            self.team = "červený" if is_red_team else "modrý"
            self.aggression = 0.7  # Vyvážená agresivita
            self.speed = 2.4  # Dobrá rychlost
            self.passing_accuracy = 0.85  # Vynikající přihrávky
            self.shooting_accuracy = 0.75  # Dobrá střelba
            self.defensive_ability = 0.8  # Výborné obranné schopnosti
            self.faceoff_skill = 0.9  # Vynikající na buly

        def update_state(self, puck, goal):
            if self.has_puck:
                self.state = "playmaking"
            elif self.is_puck_in_offensive_zone(puck):
                self.state = "offensive_support"
            elif self.is_puck_in_defensive_zone(puck):
                self.state = "defensive_coverage"
            else:
                self.state = "neutral_zone_control"

        def move_to_target(self, puck, mantinely, arc_barriers):
            if self.state == "playmaking":
                self.target_x, self.target_y = self.calculate_playmaking_position(puck)
            elif self.state == "offensive_support":
                self.target_x, self.target_y = self.calculate_offensive_support_position(puck)
            elif self.state == "defensive_coverage":
                self.target_x, self.target_y = self.calculate_defensive_coverage_position(puck)
            else:  # neutral_zone_control
                self.target_x, self.target_y = self.calculate_neutral_zone_position(puck)

            dx = self.target_x - self.x
            dy = self.target_y - self.y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance > 0:
                dx /= distance
                dy /= distance

            self.velocity_x = dx * self.speed
            self.velocity_y = dy * self.speed

        def calculate_playmaking_position(self, puck):
            offensive_x = 1300 if self.is_red_team else 600
            return offensive_x, puck.y + random.randint(-70, 70)

        def calculate_offensive_support_position(self, puck):
            if self.is_red_team:
                return min(puck.x + 100, 1700), puck.y + random.randint(-100, 100)
            else:
                return max(puck.x - 100, 200), puck.y + random.randint(-100, 100)

        def calculate_defensive_coverage_position(self, puck):
            defensive_x = 600 if self.is_red_team else 1300
            return defensive_x, puck.y

        def calculate_neutral_zone_position(self, puck):
            return 940 + random.randint(-50, 50), 550 + random.randint(-100, 100)

        def is_puck_in_offensive_zone(self, puck):
            return puck.x > 940 if self.is_red_team else puck.x < 940

        def is_puck_in_defensive_zone(self, puck):
            return puck.x < 700 if self.is_red_team else puck.x > 1200

        def handle_puck(self, puck, goal, teammates):
            if self.has_puck:
                if self.should_pass(puck):
                    self.pass_puck(puck)
                elif self.should_shoot(goal):
                    self.shoot(puck, goal)
                elif self.should_deke():
                    self.perform_deke(puck)
                else:
                    self.move_with_puck(puck)

        def should_pass(self, puck):
            return random.random() < self.passing_accuracy * 0.8

        def pass_puck(self, puck):
            pass_speed = 15  # Rychlé a přesné přihrávky
            target_x, target_y = self.find_teammate_to_pass()
            angle = math.atan2(target_y - self.y, target_x - self.x)
            puck.speed_x = pass_speed * math.cos(angle)
            puck.speed_y = pass_speed * math.sin(angle)
            self.has_puck = False

        def find_teammate_to_pass(self):
            if self.is_red_team:
                return random.choice([(1600, 450), (1600, 650), (1500, 550)])
            else:
                return random.choice([(300, 450), (300, 650), (400, 550)])

        def should_shoot(self, goal):
            distance_to_goal = math.sqrt((self.x - goal.rect.centerx)**2 + (self.y - goal.rect.centery)**2)
            shoot_probability = max(0, 1 - distance_to_goal / 1100) * self.shooting_accuracy
            return random.random() < shoot_probability

        def shoot(self, puck, goal):
            self.has_puck = False
            target_x = goal.rect.centerx + random.randint(-30, 30)
            target_y = goal.rect.centery + random.randint(-30, 30)
            angle = math.atan2(target_y - puck.y, target_x - puck.x)
            shot_speed = 17 + random.uniform(-1, 1.5)  # Silná a přesná střela
            puck.speed_x = shot_speed * math.cos(angle)
            puck.speed_y = shot_speed * math.sin(angle)

        def should_deke(self):
            return random.random() < self.aggression * 0.4  # Občasné kličkování

        def perform_deke(self, puck):
            # Simulace kličky
            self.x += random.choice([-1, 1]) * 15
            self.y += random.choice([-1, 1]) * 15
            self.move_with_puck(puck)

        def move_with_puck(self, puck):
            puck.x = self.x + self.size/2 + self.puck_offset
            puck.y = self.y
            # Jemné úpravy pozice pro realističtější pohyb
            self.x += random.uniform(-2, 2)
            self.y += random.uniform(-2, 2)

        def perform_faceoff(self, opponent):
            # Simulace buly
            if random.random() < self.faceoff_skill:
                self.has_puck = True
                return True
            return False

init python:
    class RightWing(AIOpponent):
        def __init__(self, x, y, size, is_red_team, name=None):
            super(RightWing, self).__init__(x, y, size, "RightWing", is_red_team, name)
            self.aggression = 0.6  # Střední agresivita
            self.speed = 2.3  # Trochu pomalejší než levé křídlo, ale stále rychlý
            self.passing_accuracy = 0.8  # Vysoká přesnost přihrávek
            self.defensive_awareness = 0.6  # Lepší obranné vnímání než levé křídlo
            self.offensive_x = 1400 if is_red_team else 500  # Preferovaná útočná pozice

        def update_state(self, puck, goal):
            if self.has_puck:
                self.state = "create_opportunity"
            elif self.is_puck_in_offensive_zone(puck):
                self.state = "support_attack"
            elif self.is_puck_in_defensive_zone(puck):
                self.state = "backcheck"
            else:
                self.state = "position_for_breakout"

        def move_to_target(self, puck, mantinely, arc_barriers):
            if self.state == "create_opportunity":
                self.target_x, self.target_y = self.calculate_playmaking_position(puck)
            elif self.state == "support_attack":
                self.target_x, self.target_y = self.calculate_support_position(puck)
            elif self.state == "backcheck":
                self.target_x, self.target_y = self.calculate_backcheck_position(puck)
            else:  # position_for_breakout
                self.target_x, self.target_y = self.calculate_breakout_position(puck)

            dx = self.target_x - self.x
            dy = self.target_y - self.y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance > 0:
                dx /= distance
                dy /= distance

            self.velocity_x = dx * self.speed
            self.velocity_y = dy * self.speed

        def calculate_playmaking_position(self, puck):
            goal_x = 1750 if self.is_red_team else 140
            return self.offensive_x, 550 + random.randint(-100, 100)

        def calculate_support_position(self, puck):
            if self.is_red_team:
                return min(puck.x + 150, 1700), puck.y + random.randint(-80, 80)
            else:
                return max(puck.x - 150, 200), puck.y + random.randint(-80, 80)

        def calculate_backcheck_position(self, puck):
            defensive_x = 800 if self.is_red_team else 1100
            return defensive_x, puck.y

        def calculate_breakout_position(self, puck):
            breakout_x = 900 if self.is_red_team else 1000
            return breakout_x, 550 + random.randint(-150, 150)

        def is_puck_in_offensive_zone(self, puck):
            return puck.x > 940 if self.is_red_team else puck.x < 940

        def is_puck_in_defensive_zone(self, puck):
            return puck.x < 700 if self.is_red_team else puck.x > 1200

        def handle_puck(self, puck, goal, teammates):
            if self.has_puck:
                if self.should_pass(puck):
                    self.pass_puck(puck)
                elif self.should_shoot(goal):
                    self.shoot(puck, goal)
                elif self.should_cycle():
                    self.cycle_puck(puck)
                else:
                    self.move_with_puck(puck)

        def should_pass(self, puck):
            return random.random() < self.passing_accuracy * 0.7  # Vysoká šance na přihrávku

        def pass_puck(self, puck):
            pass_speed = 14  # Středně rychlé, ale přesné přihrávky
            target_x, target_y = self.find_teammate_to_pass()
            angle = math.atan2(target_y - self.y, target_x - self.x)
            puck.speed_x = pass_speed * math.cos(angle)
            puck.speed_y = pass_speed * math.sin(angle)
            self.has_puck = False

        def find_teammate_to_pass(self):
            if self.is_red_team:
                return random.choice([(1200, 450), (1600, 550), (1400, 650)])
            else:
                return random.choice([(700, 450), (300, 550), (500, 650)])

        def should_shoot(self, goal):
            distance_to_goal = math.sqrt((self.x - goal.rect.centerx)**2 + (self.y - goal.rect.centery)**2)
            shoot_probability = max(0, 1 - distance_to_goal / 1200) * 0.5  # Menší pravděpodobnost střelby než levé křídlo
            return random.random() < shoot_probability

        def shoot(self, puck, goal):
            self.has_puck = False
            target_x = goal.rect.centerx + random.randint(-40, 40)
            target_y = goal.rect.centery + random.randint(-40, 40)
            angle = math.atan2(target_y - puck.y, target_x - puck.x)
            shot_speed = 16 + random.uniform(-1, 1)  # Středně silná střela
            puck.speed_x = shot_speed * math.cos(angle)
            puck.speed_y = shot_speed * math.sin(angle)

        def should_cycle(self):
            return random.random() < 0.4  # Šance na cyklování puku v rohu

        def cycle_puck(self, puck):
            # Simulace cyklování puku v útočném pásmu
            if self.is_red_team:
                self.x = max(self.x - 20, 1400)
                self.y += random.choice([-1, 1]) * 30
            else:
                self.x = min(self.x + 20, 500)
                self.y += random.choice([-1, 1]) * 30
            self.move_with_puck(puck)

        def move_with_puck(self, puck):
            puck.x = self.x + self.size/2 + self.puck_offset
            puck.y = self.y
            # Plynulejší pohyb s pukem
            self.x += random.uniform(-3, 3)
            self.y += random.uniform(-3, 3)

init python:
    class LeftWing(AIOpponent):  # změněno z Player na AIOpponent
        def __init__(self, x, y, size, is_red_team, name=None):
            super(LeftWing, self).__init__(x, y, size, "LeftWing", is_red_team, name)
            self.aggression = 0.8  # Vysoká agresivita
            self.speed = 2.5  # Vyšší rychlost než obránci
            self.shooting_accuracy = 0.7  # Vysoká přesnost střelby
            self.offensive_x = 1200 if is_red_team else 700  # Preferovaná útočná pozic

        def update_state(self, puck, goal):
            if self.has_puck:
                self.state = "attack"
            elif self.is_puck_in_offensive_zone(puck):
                self.state = "chase_puck"
            elif self.is_puck_in_defensive_zone(puck):
                self.state = "defend"
            else:
                self.state = "position_for_pass"

        def move_to_target(self, puck, mantinely, arc_barriers):
            if self.state == "attack":
                self.target_x, self.target_y = self.calculate_attack_position(puck)
            elif self.state == "chase_puck":
                self.target_x, self.target_y = puck.x, puck.y
            elif self.state == "defend":
                self.target_x, self.target_y = self.calculate_defensive_position()
            else:  # position_for_pass
                self.target_x, self.target_y = self.calculate_pass_receiving_position(puck)

            dx = self.target_x - self.x
            dy = self.target_y - self.y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance > 0:
                dx /= distance
                dy /= distance

            self.velocity_x = dx * self.speed
            self.velocity_y = dy * self.speed

        def calculate_attack_position(self, puck):
            goal_x = 1750 if self.is_red_team else 140
            return self.offensive_x, puck.y + random.randint(-50, 50)

        def calculate_defensive_position(self):
            defensive_x = 600 if self.is_red_team else 1300
            return defensive_x, random.randint(450, 650)

        def calculate_pass_receiving_position(self, puck):
            if self.is_red_team:
                return max(puck.x + 100, self.offensive_x), random.randint(450, 650)
            else:
                return min(puck.x - 100, self.offensive_x), random.randint(450, 650)

        def is_puck_in_offensive_zone(self, puck):
            return puck.x > 940 if self.is_red_team else puck.x < 940

        def is_puck_in_defensive_zone(self, puck):
            return puck.x < 700 if self.is_red_team else puck.x > 1200

        def handle_puck(self, puck, goal, teammates):
            if self.has_puck:
                if self.should_shoot(goal):
                    self.shoot(puck, goal)
                elif self.should_dribble():
                    self.dribble(puck)
                elif self.should_pass(puck):
                    self.pass_puck(puck)
                else:
                    self.move_with_puck(puck)

        def should_shoot(self, goal):
            distance_to_goal = math.sqrt((self.x - goal.rect.centerx)**2 + (self.y - goal.rect.centery)**2)
            shoot_probability = max(0, 1 - distance_to_goal / 1000) * self.shooting_accuracy
            return random.random() < shoot_probability

        def pass_puck(self, puck):
            # Implementace přihrávky
            pass_speed = 12
            target_x, target_y = self.find_teammate_to_pass()
            angle = math.atan2(target_y - self.y, target_x - self.x)
            puck.speed_x = pass_speed * math.cos(angle)
            puck.speed_y = pass_speed * math.sin(angle)
            self.has_puck = False

        def find_teammate_to_pass(self):
            # Logika pro nalezení vhodného spoluhráče pro přihrávku
            # Toto je zjednodušená verze, v reálu by zde byla složitější logika
            return 940, 550  # Střed hřiště jako ukázkový cíl

        def move_with_puck(self, puck):
            # Pohyb s pukem, když se nerozhodne přihrát nebo vystřelit
            puck.x = self.x + self.size + self.puck_offset
            puck.y = self.y

        def shoot(self, puck, goal):
            self.has_puck = False
            target_x = goal.rect.centerx
            target_y = goal.rect.centery + random.randint(-30, 30)
            angle = math.atan2(target_y - puck.y, target_x - puck.x)
            shot_speed = 10 + random.uniform(-1, 1)  # Slabší střela pro obránce
            puck.speed_x = shot_speed * math.cos(angle)
            puck.speed_y = shot_speed * math.sin(angle)

        def should_shoot(self, goal):
            # Obránce střílí méně často než útočník
            distance_to_goal = math.sqrt((self.x - goal.rect.centerx)**2 + (self.y - goal.rect.centery)**2)
            shoot_probability = max(0, 1 - distance_to_goal / 1500) * 0.2  # 20% šance oproti útočníkovi
            return random.random() < shoot_probability

        def collides_with(self, rect):
            circle_distance_x = abs(self.x - rect.centerx)
            circle_distance_y = abs(self.y - rect.centery)

            if circle_distance_x > (rect.width/2 + self.radius):
                return False
            if circle_distance_y > (rect.height/2 + self.radius):
                return False

            if circle_distance_x <= (rect.width/2):
                return True
            if circle_distance_y <= (rect.height/2):
                return True

            corner_distance_sq = (circle_distance_x - rect.width/2)**2 + (circle_distance_y - rect.height/2)**2

            return corner_distance_sq <= (self.radius**2)

init python:
    import math

    class MovingSquare:
        def __init__(self, name=None, team=None):
            self.x = 640 
            self.y = 360
            self.size = 50
            self.speed = 3
            self.has_puck = False
            self.puck_offset = 10
            self.charge_time = 0
            self.max_charge_time = 1.0
            self.min_shot_speed = 10
            self.max_shot_speed = 40
            self.shot_power = 0
            self.velocity_x = 0
            self.velocity_y = 0
            self.mass = 1
            self.puck_angle = 0
            self.team = team  # Přidaný atribut team
            self.name = name if name else "Player"
     
            # Nové atributy
            self.role = "Center"
            self.is_red_team = False
            self.color = "#0000FF"

        def update(self, mantinely, arc_barriers, puck, dt, all_players):
            keys = pygame.key.get_pressed()
            dx = keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]
            dy = keys[pygame.K_DOWN] - keys[pygame.K_UP]
    
            new_x = self.x + dx * self.speed
            new_y = self.y + dy * self.speed
    
            new_rect = pygame.Rect(new_x, new_y, self.size, self.size)
   
            can_move_x = True
            can_move_y = True
    
            for mantinel in mantinely:
                if new_rect.colliderect(mantinel.rect):
                    if dx != 0:
                        can_move_x = False
                    if dy != 0:
                        can_move_y = False
    
            for barrier in arc_barriers:
                if barrier.collides_with(new_rect):
                    if dx != 0:
                        can_move_x = False
                    if dy != 0:
                        can_move_y = False
    
            if can_move_x:
                self.x = new_x
            if can_move_y:
                self.y = new_y

            # Omezení pozice čtverce na hrací plochu
            self.x = max(30, min(self.x, 1855 - self.size))
            self.y = max(50, min(self.y, 1060 - self.size))

            # Interakce s pukem
            puck_rect = pygame.Rect(puck.x - puck.radius, puck.y - puck.radius, puck.size, puck.size)
            player_rect = pygame.Rect(self.x, self.y, self.size, self.size)

            if player_rect.colliderect(puck_rect):
                self.has_puck = True
                self.puck_angle = math.atan2(puck.y - self.y, puck.x - self.x)
        
            if self.has_puck:
                # Plynulé přesouvání puku s hráčem
                target_angle = math.atan2(dy, dx) if (dx != 0 or dy != 0) else self.puck_angle
                self.puck_angle = self.lerp_angle(self.puck_angle, target_angle, 0.1)
                
                puck.x = self.x + math.cos(self.puck_angle) * (self.size/2 + puck.radius + self.puck_offset)
                puck.y = self.y + math.sin(self.puck_angle) * (self.size/2 + puck.radius + self.puck_offset)
        
                # Nabíjení střely (numerická klávesa 4)
                if keys[pygame.K_KP4]:
                    self.charge_time = min(self.charge_time + dt, self.max_charge_time)
                    self.shot_power = (self.charge_time / self.max_charge_time) * 100
                elif self.charge_time > 0:
                    # Střelba při uvolnění klávesy
                    shot_speed = self.min_shot_speed + (self.max_shot_speed - self.min_shot_speed) * (self.shot_power / 100)
                    
                    self.has_puck = False
                    puck.speed_x = shot_speed * math.cos(self.puck_angle)
                    puck.speed_y = shot_speed * math.sin(self.puck_angle)
                    self.charge_time = 0
                    self.shot_power = 0
        
                # Přihrávka pukem (numerická klávesa 5)
                if keys[pygame.K_KP5]:
                    self.has_puck = False
                    pass_speed = 15
                    puck.speed_x = pass_speed * math.cos(self.puck_angle)
                    puck.speed_y = pass_speed * math.sin(self.puck_angle)

            # Aplikace rychlosti
            self.velocity_x = dx * self.speed
            self.velocity_y = dy * self.speed

            # Nová část: Kontrola kolizí s ostatními hráči
            for player in all_players:
                if player != self:
                    self.check_collision_with_player(player)

        def check_collision_with_player(self, other_player):
            dx = other_player.x - self.x
            dy = other_player.y - self.y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance < self.size / 2 + other_player.size / 2:
                # Kolize nastala
                collision_normal = (dx / distance, dy / distance)
                
                # Výpočet relativní rychlosti
                rv_x = other_player.velocity_x - self.velocity_x
                rv_y = other_player.velocity_y - self.velocity_y
                
                # Výpočet impulsu
                impulse = 2 * (rv_x * collision_normal[0] + rv_y * collision_normal[1]) / (self.mass + other_player.mass)
                
                # Aplikace impulsu
                self.velocity_x += impulse * other_player.mass * collision_normal[0]
                self.velocity_y += impulse * other_player.mass * collision_normal[1]
                other_player.velocity_x -= impulse * self.mass * collision_normal[0]
                other_player.velocity_y -= impulse * self.mass * collision_normal[1]
                
                # Oddělení hráčů, aby se nepřekrývali
                overlap = (self.size / 2 + other_player.size / 2) - distance
                self.x -= overlap * collision_normal[0] / 2
                self.y -= overlap * collision_normal[1] / 2
                other_player.x += overlap * collision_normal[0] / 2
                other_player.y += overlap * collision_normal[1] / 2

        def get_shot_power_percentage(self):
            return (self.charge_time / self.max_charge_time) * 100

        def lerp_angle(self, a, b, t):
            diff = (b - a + math.pi) % (2 * math.pi) - math.pi
            return a + diff * t

# Definice mantinelů (x, y, šířka, výška)
default mantinely = [
    Mantinel(350, 50, 1300, 20),   # Horní mantinel   
    Mantinel(340, 1060, 1320, 20), # Dolní mantinel
    Mantinel(30, 350, 20, 550),    # Levý mantinel
    Mantinel(1855, 330, 20, 550)   # Pravý mantinel
]

# Definice obloukových bariér
default arc_barriers = [
    ArcBarrier(30 + CORNER_RADIUS, 50 + CORNER_RADIUS, CORNER_RADIUS, 180, 270, 20),  # Levý horní roh
    ArcBarrier(1855 - CORNER_RADIUS, 50 + CORNER_RADIUS, CORNER_RADIUS, 270, 360, 20),  # Pravý horní roh
    ArcBarrier(30 + CORNER_RADIUS, 1060 - CORNER_RADIUS, CORNER_RADIUS, 90, 180, 20),   # Levý dolní roh
    ArcBarrier(1855 - CORNER_RADIUS, 1060 - CORNER_RADIUS, CORNER_RADIUS, 0, 90, 20)    # Pravý dolní roh
]

init python:
    from renpy.display.core import Displayable
    import math

    class ObloukDisplayable(Displayable):
        def __init__(self, barva, radius, start_uhel, konec_uhel, tloustka=20):
            super(ObloukDisplayable, self).__init__()
            self.barva = barva
            self.radius = radius
            self.start_uhel = math.radians(start_uhel)  
            self.konec_uhel = math.radians(konec_uhel)
            self.tloustka = tloustka

        def render(self, width, height, st, at):
            render = renpy.Render(self.radius * 2, self.radius * 2)
            canvas = render.canvas()
            
            for uhel in [i/100.0 for i in range(int(self.start_uhel*100), int(self.konec_uhel*100))]:
                x1 = self.radius + int(math.cos(uhel) * (self.radius - self.tloustka/2))
                y1 = self.radius + int(math.sin(uhel) * (self.radius - self.tloustka/2))
                x2 = self.radius + int(math.cos(uhel) * (self.radius + self.tloustka/2)) 
                y2 = self.radius + int(math.sin(uhel) * (self.radius + self.tloustka/2))
                canvas.line(self.barva, (x1, y1), (x2, y2), self.tloustka)

            return render

# Definice konstant pro oblouky  
define CORNER_RADIUS = 350
define MANTINEL_COLOR = "#8B4513"  # Hnědá barva pro mantinely a rohy

# Vytvoření oblouků
define oblouky = [
    ObloukDisplayable(MANTINEL_COLOR, CORNER_RADIUS, 180, 270),  # Levý horní roh
    ObloukDisplayable(MANTINEL_COLOR, CORNER_RADIUS, 270, 360),  # Pravý horní roh  
    ObloukDisplayable(MANTINEL_COLOR, CORNER_RADIUS, 90, 180),   # Levý dolní roh
    ObloukDisplayable(MANTINEL_COLOR, CORNER_RADIUS, 0, 90)      # Pravý dolní roh
]

# Pozice oblouků
define pozice_oblouku = [
    (30, 50),           # Levý horní roh       
    (1855 - CORNER_RADIUS*2, 50),  # Pravý horní roh
    (30, 1060 - CORNER_RADIUS*2),  # Levý dolní roh
    (1855 - CORNER_RADIUS*2, 1060 - CORNER_RADIUS*2)  # Pravý dolní roh  
]

init python:
    team_colors = {
        "Lancers": "#FF0000",   # Červená
        "Kocouři": "#000000",   # Černá
        "Netopýři": "#800080",  # Fialová
        "Lopaty": "#00008B",    # Tmavě modrá
        "Ducks": "#FFFFFF",     # Bílá
        "Viper": "#ADD8E6",     # Světle modrá
        "červený": "#FF0000",   # Přidáno pro sranda mač
        "modrý": "#0000FF"      # Přidáno pro sranda mač
    }

init python:
    def get_attr_safe(obj, attr, default=0):
        return getattr(obj, attr, default)

init python:
    def update_scoreboard(home_team, away_team, home_score, away_score, current_period, home_scorers, away_scorers, time_left, home_players, away_players, home_penalties, away_penalties, home_goalie_strength, home_defense_strength, home_offense_strength, away_goalie_strength, away_defense_strength, away_offense_strength):
        renpy.hide_screen("game_scoreboard")
        renpy.show_screen("game_scoreboard",
            home_team=home_team,
            away_team=away_team,
            home_score=home_score,
            away_score=away_score,
            current_period=current_period,
            home_scorers=home_scorers,
            away_scorers=away_scorers,
            time_left=time_left,
            home_players=home_players,
            away_players=away_players,
            home_penalties=home_penalties,
            away_penalties=away_penalties,
            home_goalie_strength=home_goalie_strength,
            home_defense_strength=home_defense_strength,
            home_offense_strength=home_offense_strength,
            away_goalie_strength=away_goalie_strength,
            away_defense_strength=away_defense_strength,
            away_offense_strength=away_offense_strength
        )

init python:
    config.custom_text_tags = {}

init python:
    global messages
    messages = []

init python:
    def get_unread_messages_count():
        return sum(1 for msg in messages if not msg.read and msg.sender != "Player")

init python:
    current_conversation = None

init python:
    def shoot_at_goal(shooter, goalkeeper, assistants=[]):
        shot_chance = (shooter.shooting_accuracy - goalkeeper.catching + 100) / 200
        if random.random() < shot_chance:
            renpy.say(None, f"{shooter.name} střílí a skóruje! Gól!")
            return 1, shooter.name, assistants
        else:
            renpy.say(None, f"{goalkeeper.name} chytá střelu od {shooter.name}!")
            return 0, None, []

    def restore_original_teams(red_team_players, blue_team_players):
        for p in red_team_players + blue_team_players:
            if hasattr(p, 'original_team'):
                p.team = p.original_team
                del p.original_team

    def has_unplayed_future_match():
        global current_date, current_round, full_schedule, vybrany_tym

        tomorrow = current_date + datetime.timedelta(days=0)

        for round_matches in full_schedule[current_round - 1:]:
            for match in round_matches:
                if isinstance(match, tuple):
                    if len(match) == 3:  # (home, away, date)
                        home, away, match_date = match
                        match_date = datetime.datetime.strptime(match_date, "%d.%m.%Y").date()
                        if match_date == tomorrow and vybrany_tym in (home, away):
                            return True
                    elif len(match) == 2:  # ((home, away), result)
                        (home, away), result = match
                        if result is None and vybrany_tym in (home, away):
                            return True

        return False

init python:
    import os
    import subprocess

    def run_external_game():
        game_path = os.path.join(config.gamedir, "external_games", "Arena", "Arena of Trophies.exe")
        try:
            subprocess.Popen([game_path])
            renpy.pause(1.0)  # Krátká pauza, aby se hra stihla spustit
        except Exception as e:
            renpy.notify(f"Nepodařilo se spustit hru: {e}")

init python:
    def is_match_today():
        global current_date, current_round, full_schedule, vybrany_tym
        today_str = current_date.strftime("%d.%m.%Y")
        if current_round - 1 < len(full_schedule):
            todays_matches = [match for match in full_schedule[current_round - 1] if match[2] == today_str]
            return any(vybrany_tym in (match[0], match[1]) for match in todays_matches)
        return False

init python:
    import datetime
    import time

    config.custom_text_tags = {}

    class Message:
        def __init__(self, sender, content):
            self.sender = sender
            self.content = content
            self.read = False

    messages = []
    current_conversation = None
    current_date = datetime.date(2025, 6, 1)
    typing_message = ""
    typing_complete = False

    def add_initial_messages(current_date):
        print(f"Debug: Volání add_initial_messages s datem {current_date}")
        if current_date == datetime.date(2025, 6, 1) and not messages:
            print("Debug: Podmínka pro přidání zpráv splněna")
            messages.append(Message("Honza", "Ahoj. Mám novou hru! Nechceš se stavit? :)"))
            messages.append(Message("Petr", "Čau! Zamluvili jsme si led na hokej. Nechceš se přidat? Bude to super!"))
            renpy.restart_interaction()
            print(f"Debug: Přidány zprávy. Celkový počet: {len(messages)}")
        else:
            print("Debug: Podmínka pro přidání zpráv nesplněna")

    def start_typing(sender, message):
        global typing_message, typing_complete
        typing_message = ""
        typing_complete = False
        renpy.show_screen("typing_indicator", sender=sender)
        for char in message:
            typing_message += char
            renpy.restart_interaction()
            time.sleep(0.05)
        typing_complete = True
        renpy.hide_screen("typing_indicator")
        add_message(sender, message)

    def add_message(sender, content):
        global messages, current_conversation, show_honza_button, honza_visit_tomorrow
        print(f"Debug: Přidávání zprávy od {sender}: {content}")
        new_message = Message(sender, content)
        new_message.read = (sender == "Player")  # Zprávy od hráče jsou automaticky přečtené
        messages.append(new_message)
        print(f"Debug: Počet zpráv po přidání: {len(messages)}")
        if sender == "Player":
            print(f"Debug: Odpověď hráče v konverzaci s {current_conversation}")
            if current_conversation == "Honza":
                response = get_honza_response(content)
                if "Jasně, přijdu hned!" in content:
                    show_honza_button = True
                    print(f"Debug: show_honza_button set to {show_honza_button}")
                    renpy.restart_interaction()
                elif "Promiň, dneska nemůžu. Co zítra?" in content:
                    honza_visit_tomorrow = True
                    print(f"Debug: honza_visit_tomorrow set to {honza_visit_tomorrow}")
                    renpy.restart_interaction()
            elif current_conversation == "Petr":
                response = get_petr_response(content)
            else:
                response = None

            if response:
                response_message = Message(current_conversation, response)
                response_message.read = True  # Označíme odpověď jako přečtenou
                messages.append(response_message)
            else:
                current_conversation = None  # Konec konverzace, pokud už není odpověď
        renpy.restart_interaction()

    def get_honza_response(player_message):
        if "Jasně, přijdu hned!" in player_message:
            return "Super! Tak tě čekám za chvíli. Mám nachystanou novou střílečku!"
        elif "Promiň, dneska nemůžu. Co zítra?" in player_message:
            return "Zítra by to šlo. Co třeba v 15:00?"
        elif "Nemám zájem, díky." in player_message:
            return "Ok, nevadí. Třeba někdy příště."
        else:
            return None  # Žádná další odpověď, konec konverzace

    def get_petr_response(player_message):
        global petrův_led_info
        if "Super nápad!" in player_message or "Možná bych mohl" in player_message:
            petrův_led_info = {
                "date": "03.06.2025",
                "is_playing": True
            }
            return "Skvělé! Máme zamluvený led v úterý 3.června. Sraz v 17:30 před stadionem"
        elif "Díky za pozvání, ale dneska nemůžu." in player_message:
            petrův_led_info = {
                "date": "03.06.2025",
                "is_playing": False
            }
            return "Škoda, snad to vyjde příště. Dáme vědět, až budeme zase něco plánovat."
        elif "Jasně, počítejte se mnou!" in player_message:
            petrův_led_info["is_playing"] = True
            return "Super! Těšíme se na tebe. Jako vždy, v 17:30 před stadionem."
        elif "Bohužel, tentokrát to nevyjde." in player_message:
            petrův_led_info["is_playing"] = False
            return "Škoda, snad příště. Budeme tě informovat o dalších termínech."
        else:
            return None

    def get_unread_messages_count():
        count = sum(1 for msg in messages if not msg.read and msg.sender != "Player")
        print(f"Debug: Počet nepřečtených zpráv: {count}")
        return count

    def mark_messages_read(sender):
        global messages
        print(f"Debug: Označování zpráv od {sender} jako přečtené")
        for msg in messages:
            if msg.sender == sender:
                msg.read = True
        print(f"Debug: Zprávy po označení: {[(msg.sender, msg.content, msg.read) for msg in messages]}")
        renpy.restart_interaction()

    def mark_conversation_as_read(sender):
        global messages
        for msg in messages:
            if msg.sender == sender:
                msg.read = True
        renpy.restart_interaction()

    def get_conversation_options():
        if not current_conversation or current_conversation == "inbox":
            return []
    
        last_message = next((msg for msg in reversed(messages) if msg.sender == current_conversation), None)
        if current_conversation == "Honza":
            if "Mám novou hru!" in last_message.content:
                return [
                    ("Jasně, přijdu hned!", "positive"),
                    ("Promiň, dneska nemůžu. Co zítra?", "neutral"),
                    ("Nemám zájem, díky.", "negative")
                ]
            elif "Zítra by to šlo." in last_message.content:
                return [
                    ("Perfektní, v 15:00 tam budu!", "positive"),
                    ("15:00 mi nevyhovuje, co později?", "neutral"),
                    ("Promiň, asi to nevyjde ani zítra.", "negative")
                ]
        elif current_conversation == "Petr":
            if "Nechceš se přidat?" in last_message.content:
                return [
                    ("Super nápad! Kdy a kde?", "positive"),
                    ("Možná bych mohl, jaký je plán?", "neutral"),
                    ("Díky za pozvání, ale dneska nemůžu.", "negative")
                ]
        return []

    def add_initial_message(current_date):
        if current_date == datetime.date(2025, 6, 1) and not messages:
            sender = "Honza"
            content = "Ahoj. Mám novou hru! Nechceš se stavit? :)"
            messages.append(Message(sender, content))

init python:
    import datetime

    # Počáteční datum
    current_date = datetime.date(2025, 6, 1)

    def get_date_string(date):
        days = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]
        months = ["ledna", "února", "března", "dubna", "května", "června", 
                  "července", "srpna", "září", "října", "listopadu", "prosince"]
        return f"{days[date.weekday()]} {date.day}. {months[date.month-1]} {date.year}"

    import random
    import math

    def end_day():
        global current_date, show_honza_button, honza_visit_tomorrow, current_round, todays_match_played

        print(f"Debug: Začátek end_day(). Aktuální datum: {current_date}")
        print(f"Debug: Aktuální kolo: {current_round}")

        # Kontrola zápasů pro dnešek a zítřek
        today_str = current_date.strftime("%d.%m.%Y")
        tomorrow = current_date + datetime.timedelta(days=1)
        tomorrow_str = tomorrow.strftime("%d.%m.%Y")

        print(f"Debug: Kontrola zápasů pro dnes ({today_str}) a zítra ({tomorrow_str})")

        if current_round - 1 < len(full_schedule):
            todays_matches = [match for match in full_schedule[current_round - 1] if match[2] == today_str]
            tomorrows_matches = [match for match in full_schedule[current_round - 1] if match[2] == tomorrow_str]

            print(f"Debug: Počet dnešních zápasů: {len(todays_matches)}")
            print(f"Debug: Počet zítřejších zápasů: {len(tomorrows_matches)}")

            # Kontrola, zda je dnes zápas a zda již nebyl odehrán
            if any(vybrany_tym in (match[0], match[1]) for match in todays_matches) and not todays_match_played:
                print("Debug: Nalezen dnešní zápas pro vybraný tým a ještě nebyl odehrán.")
                renpy.notify("Nemůžeš jít spát, Dnes hraješ zápas!")
                return

            # Zakomentováno: Nebudeme kontrolovat zápas zítřejší
            # if any(vybrany_tym in (match[0], match[1]) for match in tomorrows_matches):
            #     print("Debug: Nalezen zítřejší zápas pro vybraný tým.")
            #     renpy.notify("Nemůžeš jít spát, zítra máš naplánovaný zápas!")
            #     return
        else:
            print("Debug: Aktuální kolo je mimo rozsah full_schedule")

        # Pokud prošly všechny kontroly, posuneme datum
        current_date = tomorrow
        todays_match_played = False

        if honza_visit_tomorrow:
            show_honza_button = True
            honza_visit_tomorrow = False

        print(f"Debug: Nové datum: {current_date}")

        # Simulace zápasů pro nový den
        if current_round - 1 < len(full_schedule):
            todays_matches = [match for match in full_schedule[current_round - 1] if match[2] == current_date.strftime("%d.%m.%Y")]
            print(f"Debug: Nalezeno {len(todays_matches)} zápasů pro nový den")

            for match in todays_matches:
                home_team_name, away_team_name, _ = match
                if home_team_name != vybrany_tym and away_team_name != vybrany_tym:
                    home_team = get_team_by_name(home_team_name)
                    away_team = get_team_by_name(away_team_name)
                    if home_team and away_team:
                        print(f"Debug: Simuluji zápas {home_team_name} vs {away_team_name}")
                        simulate_match(home_team, away_team)
                    else:
                        print(f"Chyba: Nelze najít týmy pro zápas {home_team_name} vs {away_team_name}")

        print(f"Debug: Konec end_day()")
        renpy.notify(f"Nový den: {get_date_string(current_date)}")
        renpy.restart_interaction()

    def is_match_tomorrow():
        global current_date, current_round, full_schedule, vybrany_tym

        if todays_match_played:
            return False

        next_day = current_date + datetime.timedelta(days=0)
        next_day_str = next_day.strftime("%d.%m.%Y")
    
        # Přidáme debug výpisy
        print(f"Debug: Kontrola zápasu pro datum {next_day_str}")
        print(f"Debug: Aktuální kolo: {current_round}")
    
        if current_round - 1 < len(full_schedule):
            next_day_matches = [match for match in full_schedule[current_round - 1] if match[2] == next_day_str]
        
            print(f"Debug: Nalezeno {len(next_day_matches)} zápasů pro zítřejší den")
            for match in next_day_matches:
                print(f"Debug: Zápas: {match[0]} vs {match[1]}")
        
            has_match = any(vybrany_tym in (match[0], match[1]) for match in next_day_matches)
            print(f"Debug: Má hráč zítra zápas? {has_match}")
            return has_match
        else:
            print("Debug: Aktuální kolo je mimo rozsah full_schedule")
            return False

    def simulate_match(team1, team2):
        print(f"Debug: Začátek simulate_match pro {team1.name} vs {team2.name}")
     
        score1 = 0
        score2 = 0
        periods = 3
    
        # Bezpečné vytvoření statistik
        team1_stats = {}
        team2_stats = {}

        team1_players = [p for p in all_players if isinstance(p, Player) and p.team == team1.name]
        team2_players = [p for p in all_players if isinstance(p, Player) and p.team == team2.name]

        print(f"Debug: Počet hráčů týmu {team1.name}: {len(team1_players)}")
        print(f"Debug: Počet hráčů týmu {team2.name}: {len(team2_players)}")

        for player in team1_players:
            team1_stats[player.name] = {"goals": 0, "assists": 0, "penalties": 0}

        for player in team2_players:
            team2_stats[player.name] = {"goals": 0, "assists": 0, "penalties": 0}

        print(f"Debug: Vytvořeny statistiky pro {len(team1_stats)} hráčů týmu {team1.name} a {len(team2_stats)} hráčů týmu {team2.name}")

        for _ in range(periods):
            # Použijeme sílu týmů pro ovlivnění pravděpodobnosti skórování
            team1_chance = team1.strength / (team1.strength + team2.strength)
            team2_chance = 1 - team1_chance

            score1 += random.choices([0, 1, 2], weights=[0.5, 0.3, 0.2], k=1)[0] if random.random() < team1_chance else 0
            score2 += random.choices([0, 1, 2], weights=[0.5, 0.3, 0.2], k=1)[0] if random.random() < team2_chance else 0

        # Rozdělení gólů a asistencí mezi hráče
        simulate_goals_and_assists(team1_players, team1_stats, score1)
        simulate_goals_and_assists(team2_players, team2_stats, score2)

        # Simulace trestů
        simulate_penalties(team1_stats)
        simulate_penalties(team2_stats)

        print(f"Debug: Konec simulate_match, skóre: {score1} - {score2}")
        return score1, score2, team1_stats, team2_stats 

    def simulate_goals_and_assists(players, stats, score):
        scorers = random.sample(players, k=min(score, len(players)))
        for player in scorers:
            stats[player.name]["goals"] += 1
            assistants = random.sample([p for p in players if p != player], k=min(2, len(players)-1))
            for assistant in assistants:
                stats[assistant.name]["assists"] += 1

    def simulate_penalties(team_stats):
        penalized = random.sample(list(team_stats.keys()), k=random.randint(0, 2))
        for player in penalized:
            team_stats[player]["penalties"] += 2

    # Aktualizace funkce get_team_by_name
    def get_team_by_name(name):
        print(f"Debug: Hledám tým '{name}'")
        team = next((team for team in teams if team.name == name), None)
        if team is None:
            print(f"Varování: Tým '{name}' nebyl nalezen")
        else:
            print(f"Debug: Nalezen tým {team.name}")
        return team

    def simulate_score():
        score = random.randint(0, 12)
        if score > 4:
            # Aplikujeme logaritmickou křivku pro snížení pravděpodobnosti vysokých skóre
            score = int(4 + math.log(score - 3, 2))
        return score

# Nová funkce pro simulaci jednoho zápasu hráčova týmu
init python:
    def simulate_player_match():
        global full_schedule, current_round
        next_match, round_num = get_next_player_match(vybrany_tym)
    
        if next_match:
            if isinstance(next_match, tuple) and len(next_match) == 3:
                home_team_name, away_team_name, match_date = next_match
            else:
                home_team_name, away_team_name = next_match[0] if isinstance(next_match[0], tuple) else next_match
        
            home_team = get_team_by_name(home_team_name)
            away_team = get_team_by_name(away_team_name)
        
            if home_team and away_team:
                home_score, away_score, home_stats, away_stats = simulate_match(home_team, away_team)
            
                # Aktualizace týmových statistik
                update_team_stats(home_team, away_team, home_score, away_score)
            
                # Aktualizace výsledku v rozpisu zápasů
                for i, match in enumerate(full_schedule[round_num - 1]):
                    if isinstance(match, tuple):
                        if len(match) == 3 and match[0] == home_team_name and match[1] == away_team_name:
                            full_schedule[round_num - 1][i] = (home_team_name, away_team_name, match[2], (home_score, away_score))
                        elif len(match) == 2 and match[0] == (home_team_name, away_team_name):
                            full_schedule[round_num - 1][i] = ((home_team_name, away_team_name), (home_score, away_score))
            
                # Aktualizace statistik hráčů
                update_player_stats(home_team_name, home_stats)
                update_player_stats(away_team_name, away_stats)
            
                # Aktualizace ligové tabulky
                update_league_table()
            
                print(f"Simulovaný zápas: {home_team_name} {home_score} - {away_score} {away_team_name}")
                renpy.notify(f"Zápas odehrán: {home_team_name} {home_score} - {away_score} {away_team_name}")
            
                # Zajistíme, že se změny projeví v UI
                renpy.restart_interaction()
            else:
                print(f"Chyba: Nelze najít týmy pro zápas {home_team_name} vs {away_team_name}")
        else:
            print("Žádný zápas k simulaci")

        todays_match_played = True
        renpy.restart_interaction()

    def update_team_stats(home_team, away_team, home_score, away_score):
        home_team.goals_for += home_score
        home_team.goals_against += away_score
        away_team.goals_for += away_score
        away_team.goals_against += home_score
        
        if home_score > away_score:
            home_team.wins += 1
            away_team.losses += 1
            home_team.points += 3
        elif home_score < away_score:
            away_team.wins += 1
            home_team.losses += 1
            away_team.points += 3
        else:
            home_team.draws += 1
            away_team.draws += 1
            home_team.points += 1
            away_team.points += 1
        
        home_team.games_played += 1
        away_team.games_played += 1

    def update_league_table():
        global teams
        teams.sort(key=lambda x: (x.points, x.goals_for - x.goals_against), reverse=True)

    def update_match_result(round, home_team, away_team, home_score, away_score):
        global full_schedule
        for i, match in enumerate(full_schedule[round - 1]):
            if isinstance(match, tuple):
                if len(match) == 3:  # Základní část: (home, away, date)
                    if (home_team.name, away_team.name) == match[:2] or (away_team.name, home_team.name) == match[:2]:
                        full_schedule[round - 1][i] = (home_team.name, away_team.name, match[2], (home_score, away_score))
                        break
                elif len(match) == 2:  # Play-off: ((home, away), result) nebo (home, away)
                    if isinstance(match[0], tuple):
                        if (home_team.name, away_team.name) == match[0] or (away_team.name, home_team.name) == match[0]:
                            full_schedule[round - 1][i] = ((home_team.name, away_team.name), (home_score, away_score))
                            break
                    else:
                        if (home_team.name, away_team.name) == match or (away_team.name, home_team.name) == match:
                            full_schedule[round - 1][i] = ((home_team.name, away_team.name), (home_score, away_score))
                            break
        print(f"Debug: Match result updated in full_schedule for round {round}")

    def update_player_stats(team_name, stats):
        for player_name, player_stats in stats.items():
            player = next((p for p in all_players if p.name == player_name and p.team == team_name), None)
            if player:
                player.goals += player_stats['goals']
                player.assists += player_stats['assists']
                player.penalty_minutes += player_stats['penalties']
                player.games_played += 1

init python:
    import time

    class GameClock:
        def __init__(self):
            self.time_left = 20 * 60  # 20 minut na třetinu
            self.running = False
            self.last_update = 0
            self.time_scale = 5  # Zrychlíme čas 60x (1 sekunda reálného času = 1 minuta herního času)
            self.current_period = 1

        def start(self):
            self.running = True
            self.last_update = time.time()

        def stop(self):
            self.running = False

        def update(self, elapsed_time=None):
            if self.running:
                if elapsed_time is None:
                    current_time = time.time()
                    elapsed = (current_time - self.last_update) * self.time_scale
                    self.last_update = current_time
                else:
                    elapsed = elapsed_time
                self.time_left = max(0, self.time_left - elapsed)

        def get_time_str(self):
            minutes = int(self.time_left // 60)
            seconds = int(self.time_left % 60)
            return f"{minutes:02d}:{seconds:02d}"

        def get_game_time(self):
            elapsed_time = (self.current_period - 1) * 20 * 60 + (20 * 60 - self.time_left)
            game_minutes = int(elapsed_time // 60)
            game_seconds = int(elapsed_time % 60)
            return f"{game_minutes:02d}:{game_seconds:02d}"

    def calculate_player_level(player):
        if player.position == "Brankář":
            attributes = [
                player.goalie_reflexes, player.catching, player.crease_movement,
                player.goalie_passing, player.mental_toughness, player.puck_handling,
                player.goalie_stick, player.goalie_glove, player.goalie_blocker,
                player.stamina, player.morale, player.experience, player.agility
            ]
        elif player.position == "Obránce":
            attributes = [
                player.defense, player.shot_blocking, player.skating, player.strength,
                player.toughness, player.hockey_iq, player.puck_control, player.passing
            ]
        else:  # Útočník
            attributes = [
                player.speed, player.shooting_accuracy, player.passing, player.puck_control,
                player.agility, player.strength, player.hockey_iq, player.explosiveness
            ]
    
        return sum(attributes) / len(attributes)

init python:
    def calculate_goalie_strength(goalies):
        if not goalies:
            return 0
        return max(calculate_player_level(goalie) for goalie in goalies)

    def calculate_defense_strength(defenders):
        if not defenders:
            return 0
        return sum(calculate_player_level(defender) for defender in defenders) / len(defenders)

    def calculate_offense_strength(forwards):
        if not forwards:
            return 0
        return sum(calculate_player_level(forward) for forward in forwards) / len(forwards)

    def calculate_team_strength(players):
        goalies = [p for p in players if p.position == "Brankář"]
        defenders = [p for p in players if p.position == "Obránce"]
        forwards = [p for p in players if p.position == "Útočník"]

        goalie_strength = calculate_goalie_strength(goalies)
        defense_strength = calculate_defense_strength(defenders)
        offense_strength = calculate_offense_strength(forwards)

        return goalie_strength, defense_strength, offense_strength

    def initial_faceoff(home_team, away_team, player_team):
        # Zde implementujte logiku pro úvodní vhazování
        pass  # Nahraďte toto vlastní implementací

    class TeamPenalties:
        def __init__(self):
            self.penalties = []  # List of (player, remaining_time) tuples

        def add_penalty(self, player, duration):
            self.penalties.append((player, duration))
            self.penalties.sort(key=lambda x: x[1], reverse=True)

        def update(self, elapsed_time):
            self.penalties = [(player, max(0, time - elapsed_time)) for player, time in self.penalties]
            self.penalties = [penalty for penalty in self.penalties if penalty[1] > 0]
            self.penalties.sort(key=lambda x: x[1], reverse=True)

        def active_penalties(self):
            return len(self.penalties)

        def get_active_penalties(self):
            return self.penalties

init python:
    class Player:
        def __init__(self, name, team, position, *args):
            self.name = name
            self.team = team
            self.position = position
            # Zde můžete přidat další atributy z *args, pokud je potřebujete

        def __str__(self):
            return f"{self.name} ({self.position}, {self.team})"

init python:
    def play_match(home_team_name, away_team_name):
        global current_round
        print(f"Debug: Starting play_match with {home_team_name} vs {away_team_name}")
        home_team = get_team_by_name(home_team_name)
        away_team = get_team_by_name(away_team_name)
        home_stats = {}
        away_stats = {}

        if home_team is None or away_team is None:
            print(f"Error: Couldn't find team objects for {home_team_name} or {away_team_name}")
            return 0, 0, [], [], {}, {}

        if home_team_name == "červený" and away_team_name == "modrý":
            red_team_players, blue_team_players = prepare_sranda_match()
            home_players = red_team_players
            away_players = blue_team_players
        else:
            home_players = select_players_for_match(home_team_name)
            away_players = select_players_for_match(away_team_name)

        home_goalie_strength, home_defense_strength, home_offense_strength = calculate_team_strength(home_players)
        away_goalie_strength, away_defense_strength, away_offense_strength = calculate_team_strength(away_players)

        home_strength = (home_goalie_strength + home_defense_strength + home_offense_strength) / 3
        away_strength = (away_goalie_strength + away_defense_strength + away_offense_strength) / 3

        total_strength = home_strength + away_strength
        home_chance = home_strength / total_strength if total_strength > 0 else 0.5

        home_penalties = TeamPenalties()
        away_penalties = TeamPenalties()

        home_score = 0
        away_score = 0
        home_scorers = []
        away_scorers = []

        player = next((p for p in all_players if p.name == player_full_name), None)
        if player is None:
            player = Player(player_full_name, vybrany_tym)
            all_players.append(player)

        is_playoff = current_round > 10

        if is_playoff:
            if current_round == 11:
                renpy.say(None, f"Čtvrtfinálový zápas mezi {home_team.name} a {away_team.name} začíná!")
            elif current_round == 12:
                renpy.say(None, f"Semifinálový zápas mezi {home_team.name} a {away_team.name} začíná!")
            elif current_round == 13:
                renpy.say(None, f"Zápas o 5. místo mezi {home_team.name} a {away_team.name} začíná!")
            elif current_round == 14:
                renpy.say(None, f"Zápas o 3. místo mezi {home_team.name} a {away_team.name} začíná!")
            elif current_round == 15:
                renpy.say(None, f"Finálový zápas mezi {home_team.name} a {away_team.name} začíná!")
        else:
            renpy.say(None, f"Zápas základní části mezi {home_team.name} a {away_team.name} začíná!")

        # Simulace třetin
        for period in range(1, 4):
            home_score, away_score, home_scorers, away_scorers = play_period(
                home_team, away_team, period, home_score, away_score, player,
                home_scorers, away_scorers, home_players, away_players,
                home_chance, home_penalties, away_penalties
            )
            if period == 1:
                renpy.say(None, f"Stav po první třetině: {home_team.name} {home_score} - {away_score} {away_team.name}")
            elif period == 2:
                renpy.say(None, f"Stav po druhé třetině: {home_team.name} {home_score} - {away_score} {away_team.name}")
            elif period == 3:
                renpy.say(None, f"Konečný stav: {home_team.name} {home_score} - {away_score} {away_team.name}")

        renpy.say(None, f"Konečný stav: {home_team.name} {home_score} - {away_score} {away_team.name}")

        winner = home_team if home_score > away_score else away_team
        loser = away_team if home_score > away_score else home_team

        # Aktualizace statistik všech hráčů   
        for player in home_players:
            player.games_played += 1
            if player.name in home_stats:
                stats = home_stats[player.name]
                player.goals += stats['goals']
                player.assists += stats['assists']
                player.penalty_minutes += stats['penalties']

        for player in away_players:
            player.games_played += 1
            if player.name in away_stats:
                stats = away_stats[player.name]
                player.goals += stats['goals']
                player.assists += stats['assists']
                player.penalty_minutes += stats['penalties']

        # Získání statistik hráče ovládaného uživatelem pro zobrazení
        player = next(p for p in all_players if p.name == player_full_name)
        player_stats = home_stats.get(player_full_name) or away_stats.get(player_full_name) or {"goals": 0, "assists": 0, "penalties": 0}

        renpy.say(None, f"V tomto zápase jste vstřelil {player_stats['goals']} gólů, měl {player_stats['assists']} asistencí a strávil {player_stats['penalties']} minut na trestné lavici.")

        if not is_playoff:
            home_team.update_stats(home_score, away_score)
            away_team.update_stats(away_score, home_score)
        else:
            update_playoff_bracket(current_round, winner, loser)

        # Aktualizace výsledku v rozpisu zápasů
        update_match_result(current_round, home_team, away_team, home_score, away_score)

        print(f"Debug: Ending play_match, score: {home_score} - {away_score}")
        return home_score, away_score, home_players, away_players, home_stats, away_stats

init python:
    def prepare_sranda_match():
        print("Debug: Začátek prepare_sranda_match")
        all_sranda_players = [p for p in all_players if p.team in ["modrý", "červený"]]
    
        print(f"Debug: Počet všech hráčů pro sranda mač: {len(all_sranda_players)}")
        for p in all_sranda_players:
            print(f"Debug: Hráč {p.name}, tým {p.team}, pozice {p.position}")

        # Výběr brankářů
        red_goalies = [p for p in all_sranda_players if p.position == "Brankář" and p.team == "červený"]
        blue_goalies = [p for p in all_sranda_players if p.position == "Brankář" and p.team == "modrý"]
   
        print(f"Debug: Nalezeno {len(red_goalies)} červených brankářů a {len(blue_goalies)} modrých brankářů")

        if len(red_goalies) < 1 or len(blue_goalies) < 1:
            print(f"Chyba: Nedostatek brankářů. Červený tým má {len(red_goalies)}, Modrý tým má {len(blue_goalies)}.")
            return [], []
 
        # Výběr ostatních hráčů
        red_field_players = [p for p in all_sranda_players if p.team == "červený" and p.position != "Brankář"]
        blue_field_players = [p for p in all_sranda_players if p.team == "modrý" and p.position != "Brankář"]

        # Sestavení týmů
        red_team = red_goalies[:1] + red_field_players[:5]
        blue_team = blue_goalies[:1] + blue_field_players[:5]

        print(f"Debug: Červený tým má {len(red_team)} hráčů, z toho {len([p for p in red_team if p.position == 'Brankář'])} brankářů")
        print(f"Debug: Modrý tým má {len(blue_team)} hráčů, z toho {len([p for p in blue_team if p.position == 'Brankář'])} brankářů")
 
        return red_team, blue_team

init python:
    def normalize_position(position):
        position = position.capitalize()
        if position == "Brankár":
            return "Brankář"
        return position

init python:
    def hide_scoreboard():
        renpy.hide_screen("game_scoreboard")

        def active_penalties(self):
            return len(self.penalties)

    def shoot_at_goal(shooter, goalkeeper, assistants=[]):
        shot_chance = (shooter.shooting - goalkeeper.goalkeeping + 100) / 200
        if random.random() < shot_chance:
            renpy.say(None, f"{shooter.name} střílí a skóruje! Gól!")
            return 1, shooter.name, assistants
        else:
            renpy.say(None, f"{goalkeeper.name} chytá střelu od {shooter.name}!")
            return 0, None, []

init python:
    PENALTIES = {
        "Podražení": 120,
        "Hrubost": 120,
        "Hákování": 120,
        "Krosček": 120,
        "Vražení na hrazení": 120,
        "Napadení": 240,
        "Vysoká hůl": 240,
        "Bodnutí koncem hole": 300,
        "Bodnutí špičkou hole": 300
    }


init python:
    PLAYER_POSITIONS = {
        "červený": {
            "Brankář": (160, 565),
            "Levý obránce": (726, 626),
            "Pravý obránce": (684, 401),
            "Centr": (865, 543),
            "Levé křídlo": (873, 380),
            "Pravé křídlo": (873, 686)
        },
        "modrý": {
            "Brankář": (1730, 565),
            "Levý obránce": (1173, 626),
            "Pravý obránce": (1173, 401),
            "Centr": (987, 539),
            "Levé křídlo": (987, 380),
            "Pravé křídlo": (996, 686)
        }
    }

    class Player:
        def __init__(self, name, team, position, *args):
            self.name = name
            self.team = team
            self.position = self.normalize_position(position)
            
            # Seznam všech atributů
            attributes = [
                'attendance', 'reliability', 'speed', 'shooting_accuracy', 'passing',
                'puck_control', 'defense', 'shot_blocking', 'strength', 'toughness',
                'balance', 'skating', 'ice_position', 'aggressiveness', 'team_play',
                'hockey_iq', 'experience', 'penalty_shots', 'explosiveness',
                'decision_making', 'agility', 'goalie_reflexes', 'catching',
                'crease_movement', 'goalie_passing', 'mental_toughness',
                'puck_handling', 'wrist_shot', 'slap_shot', 'acceleration',
                'snap_shot', 'saucer_pass', 'clearing', 'faceoffs', 'dekes',
                'goalie_stick', 'goalie_glove', 'goalie_blocker', 'fighting_spirit',
                'morale', 'stamina', 'energy', 'player_relation', 'personality',
                'discipline', 'popularity', 'player_marking', 'charisma'
            ]
            
            # Nastavení atributů z args
            for attr, value in zip(attributes, args):
                setattr(self, attr, value)
            
            # Inicializace statistik
            self.games_played = 0
            self.goals = 0
            self.assists = 0
            self.penalty_minutes = 0

        def normalize_position(self, position):
            position_mapping = {
                "brankár": "Brankář",
                "brankař": "Brankář",
                "golman": "Brankář",
                "levý obránce": "Levý obránce",
                "levy obrance": "Levý obránce",
                "leftdefense": "Levý obránce",
                "pravý obránce": "Pravý obránce",
                "pravy obrance": "Pravý obránce",
                "rightdefense": "Pravý obránce",
                "centr": "Centr",
                "center": "Centr",
                "střední útočník": "Centr",
                "stredni utocnik": "Centr",
                "levé křídlo": "Levé křídlo",
                "leve kridlo": "Levé křídlo",
                "leftwing": "Levé křídlo",
                "pravé křídlo": "Pravé křídlo",
                "prave kridlo": "Pravé křídlo",
                "rightwing": "Pravé křídlo"
            }
            normalized = position_mapping.get(position.lower(), position)
            if normalized not in PLAYER_POSITIONS["červený"]:
                print(f"Varování: Neznámá pozice '{position}', použita původní hodnota")
            return normalized

        def __str__(self):
            return f"{self.name} ({self.position}, {self.team})"

        def __getattr__(self, name):
            print(f"Varování: Snaha o přístup k neexistujícímu atributu '{name}' u hráče {self.name}")
            return 0  # Nebo můžete vyvolat výjimku místo vrácení 0

    all_players = []

    # Červený tým
    all_players.extend([
        Player("Jaroslav Pučmeloun", "červený", "Brankář", 80, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30, 80, 1, 1, 1, 1, 70, 1, 80, 80, 80, 80, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 80, 80, 70, 1, 1, 100, 60, 70, 80, 0, 1, 60),
        Player("Květoslav Chytil", "červený", "Brankář", 20, 95, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 20, 90, 1, 1, 1, 1, 80, 1, 90, 90, 90, 90, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 90, 90, 90, 80, 1, 1, 100, 70, 60, 90, 0, 1, 50),
        Player("Bohuslav Bouchal", "červený", "RightDefense", 100, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 90, 60, 1, 1, 1, 1, 60, 1, 1, 1, 1, 1, 70, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 90, 1, 1, 100, 40, 80, 40, 0, 1, 30),
        Player("Ctibor Čepelník", "červený", "RightDefense", 70, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 40, 90, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 60, 1, 1, 100, 70, 60, 90, 0, 1, 70),
        Player("Drahomír Drtikol", "červený", "LeftDefense", 80, 75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 70, 1, 1, 1, 1, 70, 1, 1, 1, 1, 1, 75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 1, 1, 100, 60, 70, 60, 0, 1, 50),
        Player("Evžen Ťukač", "červený", "LeftDefense", 90, 70, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 60, 80, 1, 1, 1, 1, 75, 1, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 70, 1, 1, 100, 80, 50, 80, 0, 1, 60),
        Player("Ferdinand Finta", "červený", "Center", 50, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 50, 85, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 75, 1, 1, 100, 75, 65, 85, 0, 1, 65),
        Player("Gustav Gólman", "červený", "Center", 70, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 70, 75, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 70, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 85, 1, 1, 100, 65, 75, 70, 0, 1, 55),
        Player("Hugo Hbitý", "červený", "Center", 80, 95, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 60, 80, 1, 1, 1, 1, 90, 1, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 1, 1, 100, 70, 70, 75, 0, 1, 75),
        Player("Igor Střela", "červený", "LeftWing", 80, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 85, 70, 1, 1, 1, 1, 75, 1, 1, 1, 1, 1, 75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 90, 1, 1, 100, 60, 80, 65, 0, 1, 60),
        Player("Jaromír Jezdil", "červený", "LeftWing", 80, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 75, 75, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 85, 1, 1, 100, 75, 65, 80, 0, 1, 70),
        Player("Karel Kotouč", "červený", "RightWing", 80, 75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 85, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 70, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 75, 1, 1, 100, 80, 60, 85, 0, 1, 65),
        Player("Lumír Lítač", "červený", "RightWing", 80, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 65, 90, 1, 1, 1, 1, 90, 1, 1, 1, 1, 1, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 70, 1, 1, 100, 85, 55, 90, 0, 1, 80),
        ])

    # Modrý tým
    all_players.extend([
        Player("Miloš Mrazík", "modrý", "Brankář", 10, 95, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 25, 85, 1, 1, 1, 1, 85, 1, 85, 85, 85, 85, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 85, 85, 85, 75, 1, 1, 100, 65, 65, 85, 0, 1, 55),
        Player("Norbert Nechytil", "modrý", "Brankář", 90, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 35, 75, 1, 1, 1, 1, 75, 1, 75, 75, 75, 75, 75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 75, 75, 75, 85, 1, 1, 100, 75, 55, 75, 0, 1, 65),
        Player("Oldřich Obránce", "modrý", "RightDefense", 30, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 85, 65, 1, 1, 1, 1, 65, 1, 1, 1, 1, 1, 75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 85, 1, 1, 100, 55, 75, 55, 0, 1, 45),
        Player("Přemysl Puk", "modrý", "RightDefense", 100, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 45, 85, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 65, 1, 1, 100, 75, 65, 85, 0, 1, 75),
        Player("Quido Qičera", "modrý", "LeftDefense", 100, 70, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 75, 75, 1, 1, 1, 1, 75, 1, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 75, 1, 1, 100, 65, 75, 65, 0, 1, 55),
        Player("Rudolf Rozehrávač", "modrý", "LeftDefense", 30, 75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 55, 85, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 65, 1, 1, 100, 85, 55, 85, 0, 1, 65),
        Player("Svatopluk Svižný", "modrý", "LeftDefense", 50, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 55, 80, 1, 1, 1, 1, 90, 1, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 70, 1, 1, 100, 80, 70, 80, 0, 1, 70),
        Player("Teodor Tvrdý", "modrý", "Center", 100, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 75, 70, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 1, 1, 100, 70, 80, 75, 0, 1, 60),
        Player("Uršula Útočná", "modrý", "Center", 90, 95, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 65, 75, 1, 1, 1, 1, 95, 1, 1, 1, 1, 1, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 75, 1, 1, 100, 75, 75, 80, 0, 1, 80),
        Player("Václav Vítěz", "modrý", "RightWing", 90, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 75, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 85, 1, 1, 100, 65, 85, 70, 0, 1, 65),
        Player("Zdeněk Závodník", "modrý", "RightWing", 90, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 70, 80, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 1, 1, 100, 80, 70, 85, 0, 1, 75),
        Player("Alois Akční", "modrý", "LeftWing", 90, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 70, 80, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 1, 1, 100, 80, 70, 85, 0, 1, 75),
        Player("Hugo Dřevěný", "modrý", "LeftWing", 90, 80, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 70, 80, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 80, 1, 1, 100, 80, 70, 85, 0, 1, 75),
        ])


init python:
    def update_match_result(round, home_team, away_team, home_score, away_score):
        for i, match in enumerate(full_schedule[round-1]):
            # Zkontrolujeme, zda je match tuple a zda jeho první prvek je tuple
            if isinstance(match, tuple) and isinstance(match[0], tuple):  
                # Pokud match[0] obsahuje týmy jako tuple
                if (home_team.name, away_team.name) == match[0] or (away_team.name, home_team.name) == match[0]:
                    full_schedule[round-1][i] = ((home_team.name, away_team.name), (home_score, away_score))
                    break
            elif isinstance(match, tuple):
                # Pokud match je tuple, ale neobsahuje týmy jako tuple
                if (home_team.name, away_team.name) == match or (away_team.name, home_team.name) == match:
                    full_schedule[round-1][i] = ((home_team.name, away_team.name), (home_score, away_score))
                    break

init python:
    import random

    class Team:
        def __init__(self, name, logo, strength):
            self.name = name
            self.logo = logo
            self.strength = strength
            self.wins = 0
            self.draws = 0
            self.losses = 0
            self.goals_for = 0
            self.goals_against = 0
            self.points = 0
            self.games_played = 0

        def update_stats(self, goals_for, goals_against):
            self.goals_for += goals_for
            self.goals_against += goals_against
            self.games_played += 1

    def display_table():
        table = get_league_table()
        renpy.say(None, "Aktuální tabulka ligy:")
        for i, team in enumerate(table, 1):
            games_played = getattr(team, 'games_played', team.wins + team.draws + team.losses)
            renpy.say(None, f"{i}. {team.name}: Z {games_played}, V {team.wins}, R {team.draws}, P {team.losses}, Skóre {team.goals_for}:{team.goals_against}, Body {team.points}") 

    def simulate_remaining_matches(round, played_home, played_away):
        for match in full_schedule[round - 1]:
            print(f"Debug: Simulating remaining matches for round {round}")
            print(f"Debug: Played match: {played_home} vs {played_away}")
            print(f"Debug: Matches in round: {full_schedule[round - 1]}")
            if len(match) == 3:  # Základní část: (home, away, date)
                home, away, _ = match
            elif isinstance(match[0], tuple):  # Play-off: ((home, away), result)
                (home, away), result = match
            else:  # Play-off: (home, away)
                home, away = match

            if (home != played_home or away != played_away) and (home != played_away or away != played_home):
                home_team = get_team_by_name(home)
                away_team = get_team_by_name(away)
        
                home_players = select_players_for_match(home)
                away_players = select_players_for_match(away)
        
                home_score, away_score, home_stats, away_stats = simulate_match(home_team, away_team)
          
                # Aktualizace týmových statistik
                home_team.update_stats(home_score, away_score)
                away_team.update_stats(away_score, home_score)
        
                # Aktualizace výsledku v rozpisu zápasů
                update_match_result(round, home_team, away_team, home_score, away_score)
        
                # Aktualizace statistik hráčů
                for player in home_players + away_players:
                    player.games_played += 1
                    if player.name in home_stats:
                        stats = home_stats[player.name]
                    elif player.name in away_stats:
                        stats = away_stats[player.name]
                    else:
                        continue
                    player.goals += stats["goals"]
                    player.assists += stats["assists"]
                    player.penalty_minutes += stats["penalties"]

        print(f"Debug: Všechny zbývající zápasy kola {round} byly simulovány.")

    def simulate_remaining_playoff_matches(round, played_home, played_away):
        for match in full_schedule[round - 1]:
            if isinstance(match[0], tuple):
                home, away = match[0]
                result = match[1]
            else:
                home, away = match
                result = None

            if (home != played_home or away != played_away) and (home != played_away or away != played_home) and result is None:
                home_team = get_team_by_name(home)
                away_team = get_team_by_name(away)

                home_players = select_players_for_match(home)
                away_players = select_players_for_match(away)

                if home_team and away_team:
                    home_score, away_score, home_stats, away_stats = simulate_match(home_team, away_team)
                
                    winner = home_team if home_score > away_score else away_team
                    loser = away_team if home_score > away_score else home_team
                
                    # Aktualizace playoff bracketu
                    update_playoff_bracket(round, winner, loser)
                
                    # Aktualizace výsledku v rozpisu zápasů
                    update_match_result(round, home_team, away_team, home_score, away_score)
                
                    # Aktualizace statistik hráčů
                    for player in home_players + away_players:
                        player.games_played += 1
                        if player.name in home_stats:
                            stats = home_stats[player.name]
                        elif player.name in away_stats:
                            stats = away_stats[player.name]
                        else:
                            continue
                        player.goals += stats["goals"]
                        player.assists += stats["assists"]
                        player.penalty_minutes += stats["penalties"]
                        player.games_played += 1
                
                    print(f"Debug: Simulován zápas play-off: {home_team.name} {home_score} - {away_score} {away_team.name}")
                else:
                    print(f"Debug: Nelze simulovat zápas: {home} vs {away}")

        print(f"Debug: Všechny zbývající zápasy play-off kola {round} byly simulovány.")

init python:
    print("Debug: Initializing teams")
    teams = [
        Team("Litvínov Lancers", "logo_litvinov_small", 100),
        Team("Netopýři Černošice", "logo_cernosice_small", 5),
        Team("HC Ducks Klášterec", "logo_klasterec_small", 25),
        Team("HC Lopaty Praha", "logo_praha_small", 10),
        Team("HC Viper Ústí nad Labem", "logo_usti_small", 15),
        Team("HC Kocouři Beroun", "logo_beroun_small", 50),
        Team("červený", "logo_cerveny_tym", 50),  # Přidáno
        Team("modrý", "logo_modry_tym", 50)  # Přidáno
    ]
    print(f"Debug: Teams initialized: {[team.name for team in teams]}")
    
    global teams_dict
    teams_dict = {team.name: team for team in teams}

init python:
    def simulate_ai_matches(current_round):
        for match in full_schedule[current_round - 1]:
            home, away = match[0] if isinstance(match[0], tuple) else match
            if home != vybrany_tym and away != vybrany_tym:
                home_team = get_team_by_name(home)
                away_team = get_team_by_name(away)
            
                home_score, away_score, home_stats, away_stats = simulate_match(home_team, away_team)
            
                # Aktualizace týmových statistik
                home_team.update_stats(home_score, away_score)
                away_team.update_stats(away_score, home_score)
            
                # Aktualizace výsledku v rozpisu zápasů
                update_match_result(current_round, home_team, away_team, home_score, away_score)
            
                # Aktualizace statistik hráčů
                for team_stats in [home_stats, away_stats]:
                    for player_name, stats in team_stats.items():
                        player = next(p for p in all_players if p.name == player_name)
                        player.goals += stats["goals"]
                        player.assists += stats["assists"]
                        player.penalty_minutes += stats["penalties"]
                        player.games_played += 1

    def simulate_round():
        global current_round
        if current_round > len(full_schedule):
            renpy.notify("Všechna kola již byla odehrána.")
            return

        for match in full_schedule[current_round - 1]:
            if len(match) == 3:  # Základní část: (home, away, date)
                home_team_name, away_team_name, _ = match
            elif isinstance(match[0], tuple):  # Play-off: ((home, away), result)
                (home_team_name, away_team_name), _ = match
            else:  # Play-off: (home, away)
                home_team_name, away_team_name = match

            home_team = get_team_by_name(home_team_name)
            away_team = get_team_by_name(away_team_name)

            home_players = select_players_for_match(home_team_name)
            away_players = select_players_for_match(away_team_name)
        
            # Simulace zápasu
            home_score = random.randint(0, 5)
            away_score = random.randint(0, 5)
        
            # Aktualizace statistik týmů
            home_team.update_stats(home_score, away_score)
            away_team.update_stats(away_score, home_score)
        
            # Aktualizace statistik hráčů
            for player in home_players + away_players:
                player.games_played += 1
        
            # Simulace gólů a asistencí
            for _ in range(home_score):
                scorer = random.choice(home_players)
                scorer.goals += 1
                assists = random.sample([p for p in home_players if p != scorer], k=min(2, len(home_players)-1))
                for assist in assists:
                    assist.assists += 1
        
            for _ in range(away_score):
                scorer = random.choice(away_players)
                scorer.goals += 1
                assists = random.sample([p for p in away_players if p != scorer], k=min(2, len(away_players)-1))
                for assist in assists:
                    assist.assists += 1
        
            # Simulace trestných minut
            for player in home_players + away_players:
                if random.random() < 0.2:  # 20% šance na trest
                    player.penalty_minutes += random.choice([2, 5, 10])
        
            # Aktualizace výsledku v rozpisu zápasů
            update_match_result(current_round, home_team, away_team, home_score, away_score)

        # Přechod na další kolo
        current_round += 1
        if current_round > len(full_schedule):
            renpy.notify("Všechna kola byla odehrána. Sezóna skončila.")
        else:
            renpy.notify(f"Kolo {current_round-1} bylo simulováno.")

        # Aktualizace obrazovky přehledu ligy
        renpy.hide_screen("prehled_ligy")
        renpy.show_screen("prehled_ligy")

init python:
    def get_next_player_match(vybrany_tym):
        print(f"Debug: get_next_player_match called for team {vybrany_tym}")
        for round_num, round in enumerate(full_schedule, 1):
            for match in round:
                if isinstance(match, tuple):
                    if len(match) == 3:  # Základní část: (home, away, date)
                        home, away, date = match
                        match_date = datetime.datetime.strptime(date, "%d.%m.%Y").date()
                        if match_date < current_date:
                            continue  # Přeskočíme zápasy v minulosti
                        result = None
                    elif len(match) == 2:  # Play-off: ((home, away), result) nebo (home, away)
                        if isinstance(match[0], tuple):
                            (home, away), result = match
                        else:
                            home, away = match
                        result = None
                    else:
                        continue  # Neznámý formát, přeskočíme
                else:
                    continue  # Neznámý formát, přeskočíme

                if vybrany_tym in (home, away) and result is None:
                    print(f"Debug: Next match found for {vybrany_tym} in round {round_num}: {match}")
                    return match, round_num
        print(f"Debug: No next match found for {vybrany_tym}")
        return None, None

    def get_league_table():
        return sorted(teams, key=lambda t: (t.points, t.goals_for - t.goals_against), reverse=True)
        
    def simulate_match(team1, team2):
        score1 = 0
        score2 = 0
        periods = 3
        team1_stats = {player.name: {"goals": 0, "assists": 0, "penalties": 0} for player in all_players if player.team == team1.name}
        team2_stats = {player.name: {"goals": 0, "assists": 0, "penalties": 0} for player in all_players if player.team == team2.name}

        for _ in range(periods):
        # Použijeme sílu týmů pro ovlivnění pravděpodobnosti skórování
            team1_chance = team1.strength / (team1.strength + team2.strength)
            team2_chance = 1 - team1_chance

            score1 += random.choices([0, 1, 2], weights=[0.5, 0.3, 0.2], k=1)[0] if random.random() < team1_chance else 0
            score2 += random.choices([0, 1, 2], weights=[0.5, 0.3, 0.2], k=1)[0] if random.random() < team2_chance else 0

        # Rozdělení gólů a asistencí mezi hráče
        for _ in range(score1):
            scorer = random.choice(list(team1_stats.keys()))
            team1_stats[scorer]["goals"] += 1
            assists = random.sample([p for p in team1_stats.keys() if p != scorer], k=min(2, len(team1_stats)-1))
            for assist in assists:
                team1_stats[assist]["assists"] += 1

        for _ in range(score2):
            scorer = random.choice(list(team2_stats.keys()))
            team2_stats[scorer]["goals"] += 1
            assists = random.sample([p for p in team2_stats.keys() if p != scorer], k=min(2, len(team2_stats)-1))
            for assist in assists:
                team2_stats[assist]["assists"] += 1

        # Simulace trestů
        for team_stats in [team1_stats, team2_stats]:
            penalized = random.sample(list(team_stats.keys()), k=random.randint(0, 2))
            for player in penalized:
                team_stats[player]["penalties"] += 2

        return score1, score2, team1_stats, team2_stats 

    def update_playoff_bracket(round, winner, loser):
        global full_schedule
        if round == 11:  # Čtvrtfinále
            next_round = 12
            if winner.name == full_schedule[10][0][0][0] or winner.name == full_schedule[10][0][0][1]:
                full_schedule[next_round-1][0] = ((full_schedule[next_round-1][0][0][0], winner.name), None)
            else:
                full_schedule[next_round-1][1] = ((full_schedule[next_round-1][1][0][0], winner.name), None)
 
            # Aktualizujeme zápas o 5. místo
            if full_schedule[12][0][0][0] == "Poražený QF1":
                full_schedule[12][0] = ((loser.name, full_schedule[12][0][0][1]), None)
            else:
                full_schedule[12][0] = ((full_schedule[12][0][0][0], loser.name), None)

        elif round == 12:  # Semifinále
            if winner.name == full_schedule[11][0][0][0] or winner.name == full_schedule[11][0][0][1]:
                full_schedule[14][0] = ((winner.name, full_schedule[14][0][0][1]), None)
                full_schedule[13][0] = ((loser.name, full_schedule[13][0][0][1]), None)
            else:
                full_schedule[14][0] = ((full_schedule[14][0][0][0], winner.name), None)
                full_schedule[13][0] = ((full_schedule[13][0][0][0], loser.name), None)

        print(f"Debug: Updated playoff bracket for round {round}")
        print(f"Debug: Winner: {winner.name}, Loser: {loser.name}")
        print(f"Debug: Updated full_schedule: {full_schedule}")

init python: 
    def simulate_playoff_round():
        global current_round
        all_matches_played = True
        for match in full_schedule[current_round - 1]:
            if isinstance(match[0], tuple):
                team1_name, team2_name = match[0]
                result = match[1]
            else:
                team1_name, team2_name = match
                result = None

            if result is None:
                team1 = get_team_by_name(team1_name)
                team2 = get_team_by_name(team2_name)
        
                if team1 and team2:
                    home_score = random.randint(0, 5)
                    away_score = random.randint(0, 5)
                    winner = team1 if home_score > away_score else team2
                    loser = team2 if home_score > away_score else team1
                    update_playoff_bracket(current_round, winner, loser)
                    update_match_result(current_round, team1, team2, home_score, away_score)
                    print(f"Simulovaný zápas: {team1.name} {home_score} - {away_score} {team2.name}")
                else:
                    all_matches_played = False
                    print(f"Nelze simulovat zápas: {team1_name} vs {team2_name}")

        if all_matches_played:
            if current_round < 15:
                current_round += 1
                renpy.notify(f"Kolo {current_round-1} bylo dokončeno. Přecházím na další kolo.")
            else:
                renpy.notify("Play-off skončilo.")
        else:
            renpy.notify("Některé zápasy v tomto kole ještě nebyly odehrány.")
        renpy.restart_interaction()

init python:  
    def start_playoff():
        global full_schedule, current_round
    
        print(f"Debug: Délka full_schedule před úpravou: {len(full_schedule)}")
    
        sorted_teams = sorted(teams, key=lambda t: (t.points, t.goals_for - t.goals_against), reverse=True)
    
        # Nastavíme čtvrtfinálové zápasy
        full_schedule[10] = [
            ((sorted_teams[2].name, sorted_teams[5].name), None),
            ((sorted_teams[3].name, sorted_teams[4].name), None)
        ]
    
        # Nastavíme semifinálové zápasy
        full_schedule[11] = [
            ((sorted_teams[0].name, "Vítěz 3-6"), None),
            ((sorted_teams[1].name, "Vítěz 4-5"), None)
        ]
    
        # Nastavíme zápasy o umístění
        full_schedule[12] = [(("Poražený QF1", "Poražený QF2"), None)]  # o 5. místo
        full_schedule[13] = [(("Poražený SF1", "Poražený SF2"), None)]  # o 3. místo
        full_schedule[14] = [(("Vítěz SF1", "Vítěz SF2"), None)]  # Finále
    
        current_round = 11  # Nastavíme aktuální kolo na začátek play-off
    
        print("Debug: Play-off schedule after initialization:")
        for round_num, matches in enumerate(full_schedule[10:], 11):
            print(f"Round {round_num}: {matches}")
    
        renpy.notify("Play-off bylo zahájeno!")

    import datetime
    import random

    def generate_schedule():
        start_date = datetime.date(2025, 10, 4)  # První sobota v říjnu
        end_date = datetime.date(2026, 3, 29)  # Poslední neděle v březnu
        num_games = 10  # 10 kol, celkem 30 zápasů

        # Vytvoříme seznam všech víkendů od října do března
        all_weekends = []
        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() in [5, 6]:  # Sobota nebo neděle
                all_weekends.append(current_date)
            current_date += datetime.timedelta(days=1)

        # Vybereme náhodně 10 víkendů pro zápasy
        selected_weekends = random.sample(all_weekends, num_games)
        selected_weekends.sort()

        # Základní část zápasů
        schedule = [
            [("HC Lopaty Praha", "HC Kocouři Beroun"), ("Netopýři Černošice", "HC Viper Ústí nad Labem"), ("Litvínov Lancers", "HC Ducks Klášterec")],
            [("HC Ducks Klášterec", "HC Lopaty Praha"), ("HC Viper Ústí nad Labem", "Litvínov Lancers"), ("HC Kocouři Beroun", "Netopýři Černošice")],
            [("HC Ducks Klášterec", "HC Viper Ústí nad Labem"), ("Netopýři Černošice", "HC Lopaty Praha"), ("Litvínov Lancers", "HC Kocouři Beroun")],
            [("HC Ducks Klášterec", "Netopýři Černošice"), ("HC Kocouři Beroun", "HC Viper Ústí nad Labem"), ("HC Lopaty Praha", "Litvínov Lancers")],
            [("HC Kocouři Beroun", "HC Ducks Klášterec"), ("Litvínov Lancers", "Netopýři Černošice"), ("HC Viper Ústí nad Labem", "HC Lopaty Praha")],
            [("HC Ducks Klášterec", "Litvínov Lancers"), ("HC Kocouři Beroun", "HC Lopaty Praha"), ("HC Viper Ústí nad Labem", "Netopýři Černošice")],
            [("HC Lopaty Praha", "HC Ducks Klášterec"), ("Litvínov Lancers", "HC Viper Ústí nad Labem"), ("Netopýři Černošice", "HC Kocouři Beroun")],
            [("HC Viper Ústí nad Labem", "HC Ducks Klášterec"), ("HC Lopaty Praha", "Netopýři Černošice"), ("HC Kocouři Beroun", "Litvínov Lancers")],
            [("Netopýři Černošice", "HC Ducks Klášterec"), ("HC Viper Ústí nad Labem", "HC Kocouři Beroun"), ("Litvínov Lancers", "HC Lopaty Praha")],
            [("HC Ducks Klášterec", "HC Kocouři Beroun"), ("Netopýři Černošice", "Litvínov Lancers"), ("HC Lopaty Praha", "HC Viper Ústí nad Labem")]
        ]

        # Přidání dat k zápasům základní části
        for i, round_matches in enumerate(schedule):
            weekend = selected_weekends[i]
            if random.choice([True, False]):  # 50% šance na rozdělení zápasů mezi sobotu a neděli
                saturday_matches = random.sample(round_matches, random.randint(1, len(round_matches)))
                sunday_matches = [match for match in round_matches if match not in saturday_matches]
            
                for match in saturday_matches:
                    schedule[i][round_matches.index(match)] = (match[0], match[1], weekend.strftime("%d.%m.%Y"))
            
                for match in sunday_matches:
                    schedule[i][round_matches.index(match)] = (match[0], match[1], (weekend + datetime.timedelta(days=1)).strftime("%d.%m.%Y"))
            else:
                for match in round_matches:
                    schedule[i][round_matches.index(match)] = (match[0], match[1], weekend.strftime("%d.%m.%Y"))

        # Play-off zápasy (všechny v jeden den)
        playoff_date = end_date + datetime.timedelta(days=6)  # První sobota po konci základní části
        playoff_rounds = [
            [("Čtvrtfinále 1", None, playoff_date.strftime("%d.%m.%Y")), ("Čtvrtfinále 2", None, playoff_date.strftime("%d.%m.%Y"))],
            [("Semifinále 1", None, (playoff_date + datetime.timedelta(days=7)).strftime("%d.%m.%Y")), ("Semifinále 2", None, (playoff_date + datetime.timedelta(days=7)).strftime("%d.%m.%Y"))],
            [("O 5. místo", None, (playoff_date + datetime.timedelta(days=14)).strftime("%d.%m.%Y"))],
            [("O 3. místo", None, (playoff_date + datetime.timedelta(days=14)).strftime("%d.%m.%Y"))],
            [("Finále", None, (playoff_date + datetime.timedelta(days=21)).strftime("%d.%m.%Y"))]
        ]

        # Celý rozpis (základní část + play-off)
        full_schedule = schedule + playoff_rounds

        return full_schedule

    # Vygeneruj celý rozpis
    full_schedule = generate_schedule()

    # Výpis celého rozvrhu pro kontrolu
    for round_matches in full_schedule:
        for match in round_matches:
            print(match)

    def get_team_by_name(name):
        print(f"Debug: Searching for team '{name}'")
        print(f"Debug: Available teams: {[team.name for team in teams]}")
        team = next((team for team in teams if team.name == name), None)
        if team is None:
            print(f"Warning: Team '{name}' not found")
        else:
            print(f"Debug: Found team {team.name}")
        return team

# Definice menších verzí log pro použití v menu
image logo_litvinov_small = im.Scale("images/Litvinov_Lancers.png", 100, 100)
image logo_cernosice_small = im.Scale("images/netopyri_cernosice.png", 100, 100)
image logo_klasterec_small = im.Scale("images/hc_ducks_klasterec.png", 100, 100)
image logo_praha_small = im.Scale("images/hc_lopaty_praha.png", 100, 100)
image logo_usti_small = im.Scale("images/hc_viper_usti_nad_labem.png", 100, 100)
image logo_beroun_small = im.Scale("images/hc_kocouri_beroun.png", 100, 100)

# Proměnná pro uložení vybraného týmu
default player_first_name = ""
default player_last_name = ""
default player_name = ""
default vybrany_tym = ""
default player_goals = 0
default player_assists = 0
default player_penalty_minutes = 0
default player_games_played = 0
default current_round = 1
default messages = []
default current_conversation = None
default typing_message = ""
default typing_complete = True
default todays_match_played = False
default chosen_abilities = []
default petrův_led_info = {"date": None, "is_playing": False}
default player_special_ability = None

init python:
    logo_settings = {
        "Litvínov Lancers": {"name": "images/logo_litvinov_lancers_small.png", "xpos": 5, "ypos": 770, "zoom": 0.5},
        "Netopýři Černošice": {"name": "images/logo_netopyri_černošice_small.png", "xpos": -150, "ypos": 690, "zoom": 0.7},
        "HC Ducks Klášterec": {"name": "images/logo_klasterec.small.png", "xpos": 1, "ypos": 710, "zoom": 0.2},
        "HC Lopaty Praha": {"name": "images/HC_Lopaty_Praha.png", "xpos": 25, "ypos": 768, "zoom": 0.3},
        "HC Viper Ústí nad Labem": {"name": "images/hc_Viper_Usti_nad_Labem.png", "xpos": 12, "ypos": 772, "zoom": 0.17},
        "HC Kocouři Beroun": {"name": "images/HC_kKocouri_Beroun.png", "xpos": 7, "ypos": 760, "zoom": 0.98}
    }

init python:
    def play_period(team1, team2, current_period, home_score, away_score, player, home_scorers, away_scorers, home_players, away_players, home_chance, home_penalties, away_penalties):
        game_clock = GameClock()
        game_clock.current_period = current_period
        game_clock.start()
        team1_score = home_score
        team2_score = away_score
        all_players = home_players + away_players

        team1_penalties = home_penalties
        team2_penalties = away_penalties

        goalie_strength, defense_strength, offense_strength = calculate_team_strength(home_players)
        away_goalie_strength, away_defense_strength, away_offense_strength = calculate_team_strength(away_players)

        def update_game_scoreboard():
            update_scoreboard(
                home_team=team1,
                away_team=team2,
                home_score=team1_score,
                away_score=team2_score,
                current_period=current_period,
                home_scorers=home_scorers,
                away_scorers=away_scorers,
                time_left=game_clock.get_time_str(),
                home_players=home_players,
                away_players=away_players,
                home_penalties=team1_penalties.get_active_penalties(),
                away_penalties=team2_penalties.get_active_penalties(),
                home_goalie_strength=goalie_strength,
                home_defense_strength=defense_strength,
                home_offense_strength=offense_strength,
                away_goalie_strength=away_goalie_strength,
                away_defense_strength=away_defense_strength,
                away_offense_strength=away_offense_strength
            )

        update_game_scoreboard()
  
        while game_clock.time_left > 0:
            elapsed_time = 1 * game_clock.time_scale
            game_clock.update(elapsed_time)
            team1_penalties.update(elapsed_time)
            team2_penalties.update(elapsed_time)

            renpy.pause(0.1)
    
            # Simulace trestů
            if random.random() < 0.015:  # 1.5% šance na trest každou minutu
                penalized_team = random.choice([team1, team2])
                penalized_player = random.choice([p for p in all_players if p.team == penalized_team.name and p.position != "Brankář"])
                penalty_type, penalty_duration = random.choice(list(PENALTIES.items()))
                penalty_short = f"{penalty_duration // 60} min"
                penalty_message = f"{penalty_type} [{penalty_short}] {penalized_player.name}"

                if penalized_team == team1:
                    home_scorers.append((game_clock.get_game_time(), penalty_message, []))
                    team1_penalties.add_penalty(penalized_player, penalty_duration)
                else:
                    away_scorers.append((game_clock.get_game_time(), penalty_message, []))
                    team2_penalties.add_penalty(penalized_player, penalty_duration)

                renpy.say(None, f"{penalized_player.name} ({penalized_team.name}) dostal trest za {penalty_type} na {penalty_short}.")

            # Simulace hokejových akcí
            if random.random() < 0.05:  # 5% šance na akci každou minutu
                game_clock.stop()
                action_time = game_clock.get_game_time()
            
                is_home_attack = random.random() < home_chance
                attacking_team = home_players if is_home_attack else away_players
                defending_team = away_players if is_home_attack else home_players
                is_player_team = (is_home_attack and player in home_players) or (not is_home_attack and player in away_players)
            
                result, player_name = offensive_action(attacking_team, defending_team, is_player_team)
            
                if result == "goal":
                    if is_home_attack:
                        team1_score += 1
                        home_scorers.append((action_time, f"Gól: {player_name}", []))
                    else:
                        team2_score += 1
                        away_scorers.append((action_time, f"Gól: {player_name}", []))
                    renpy.say(None, f"{player_name} skóruje!")
                elif result == "save":
                    renpy.say(None, f"{player_name} chytá střelu!")
                elif result == "interception":
                    renpy.say(None, f"{player_name} zachytává přihrávku!")
                elif result == "tackle":
                    renpy.say(None, f"{player_name} úspěšně brání proti kličce!")
        
            game_clock.start()
            update_game_scoreboard()
        
            power_play_advantage = 1.0
            if team1_penalties.active_penalties() > team2_penalties.active_penalties():
                power_play_advantage = 2.8 if team1_penalties.active_penalties() - team2_penalties.active_penalties() == 1 else 5.8
                is_home_attack = random.random() < (home_chance / power_play_advantage)
            elif team2_penalties.active_penalties() > team1_penalties.active_penalties():
                power_play_advantage = 2.8 if team2_penalties.active_penalties() - team1_penalties.active_penalties() == 1 else 5.8
                is_home_attack = random.random() < (home_chance * power_play_advantage)
            else:
                is_home_attack = random.random() < home_chance

            attacking_players = home_players if is_home_attack else away_players
            defending_players = away_players if is_home_attack else home_players

            game_clock.start()

        return team1_score, team2_score, home_scorers, away_scorers

    def offensive_action(attacking_team, defending_team, is_player_team):
        # Vybere útočníka s nejlepší kombinací rychlosti a střelby
        attacker = max(attacking_team, key=lambda p: p.speed + p.shooting_accuracy)
    
        # Vybere obránce s nejlepší obranou
        defender = max(defending_team, key=lambda p: p.defense)
    
        # Vybere brankáře
        goalie = next(p for p in defending_team if p.position == "Brankář")
    
        # Vypočítá šanci na úspěšný útok
        attack_chance = (attacker.speed + attacker.shooting_accuracy - defender.defense) / 200
    
        if is_player_team:
            action = renpy.display_menu([
                ("Střela", "shoot"),
                ("Přihrávka", "pass"),
                ("Kličkování", "deke")
            ])
        else:
            action = random.choice(["shoot", "pass", "deke"])
    
        if action == "shoot":
            shot_power = attacker.shooting_accuracy + attacker.strength
            save_chance = (goalie.goalie_reflexes + goalie.catching) / 200
        
            if random.random() < (shot_power / 100 - save_chance):
                return "goal", attacker.name
            else:
                return "save", goalie.name

        elif action == "pass":
            # Vybere spoluhráče s nejlepší kontrolou puku
            teammate = max([p for p in attacking_team if p != attacker], key=lambda p: p.puck_control)
            pass_success = (attacker.passing + teammate.puck_control) / 200

            if random.random() < pass_success:
                return offensive_action(attacking_team, defending_team, is_player_team)
            else:
                return "interception", defender.name

        else:  # deke
            deke_success = (attacker.puck_control + attacker.agility - defender.defense) / 200
  
            if random.random() < deke_success:
                return offensive_action(attacking_team, defending_team, is_player_team)
            else:
                return "tackle", defender.name

screen choose_special_ability():
    modal True
    
    add "images/background_stars.png" # Hvězdné pozadí

    frame:
        xfill True
        yfill True
        background None

        vbox:
            spacing 30
            xalign 0.5
            yalign 0.5

            text "Vyberte si speciální vlastnost pro vašeho hráče" size 40 color "#FFD700" xalign 0.5 outlines [(2, "#000000", 0, 0)]

            grid 3 4:
                spacing 20
                for ability in special_abilities:
                    button:
                        action Return(ability)
                        xsize 350
                        ysize 200
                        background "#333333AA"
                        hover_background "#555555AA"
                        
                        vbox:
                            spacing 10
                            text ability["name"] size 24 color "#FFD700" xalign 0.5 outlines [(1, "#000000", 0, 0)]
                            text ability["description"] size 16 color "#FFFFFF" text_align 0.5 xalign 0.5
                        
                        at transform:
                            on hover:
                                ease .2 zoom 1.05
                            on idle:
                                ease .2 zoom 1.0

screen prehled_ligy():
    modal True

    default current_match_simulated = False

    on "show" action SetVariable("is_simulating", False)
    on "replace" action SetVariable("is_simulating", False)

    $ print(f"Debug: current_match_simulated: {current_match_simulated}")

    $ print(f"Debug: Délka full_schedule: {len(full_schedule)}")
    $ print(f"Debug: current_round: {current_round}")

    # Definujeme next_match na začátku screenu
    $ next_match, round_num = get_next_player_match(vybrany_tym)
    $ print(f"Debug: next_match: {next_match}, round_num: {round_num}")

    frame:
        xfill True
        yfill True
        background None

        hbox:
            spacing 20

            # Levá část - Rozpis zápasů
            frame:
                xsize 600
                ysize 400
                yalign 0.0
                background "#333333AA"
                padding (15, 15)

                vbox:
                    spacing 10
                    text "Rozpis zápasů" size 28 color "#FFFFFF" xalign 0.5

                    viewport:
                        ysize 340
                        scrollbars "vertical"
                        mousewheel True

                        vbox:
                            spacing 15 
                            for round_num, matches in enumerate(full_schedule, 1):
                                vbox:
                                    spacing 8
                                    if round_num <= 10:
                                        text f"==== {round_num}. Kolo - {matches[0][2]} ====" size 22 color "#FFFF00" xalign 0.5
                                    elif round_num == 11:
                                        text f"==== Čtvrtfinále - {matches[0][2]} ====" size 22 color "#FFFF00" xalign 0.5
                                    elif round_num == 12:
                                        text f"==== Semifinále - {matches[0][2]} ====" size 22 color "#FFFF00" xalign 0.5
                                    elif round_num == 13:
                                        text f"==== O 5. místo - {matches[0][2]} ====" size 22 color "#FFFF00" xalign 0.5
                                    elif round_num == 14:
                                        text f"==== O 3. místo - {matches[0][2]} ====" size 22 color "#FFFF00" xalign 0.5
                                    elif round_num == 15:
                                        text f"==== Finále - {matches[0][2]} ====" size 22 color "#FFFF00" xalign 0.5
        
                                    for match in matches:
                                        $ home, away, date, result = None, None, None, None
                                        if isinstance(match, tuple):
                                            if len(match) == 4:  # (home, away, date, result)
                                                $ home, away, date, result = match
                                            elif len(match) == 3:  # (home, away, date)
                                                $ home, away, date = match
                                            elif len(match) == 2:
                                                if isinstance(match[0], tuple):  # ((home, away), result)
                                                    $ (home, away), result = match
                                                else:  # (home, away)
                                                    $ home, away = match

                                        if home and away:
                                            $ barva_home = "#FF0000" if home == vybrany_tym else "#FFFFFF"
                                            $ barva_away = "#FF0000" if away == vybrany_tym else "#FFFFFF"

                                            hbox: 
                                                spacing 10
                                                xfill True
                                                text "[home]" size 16 color barva_home xalign 0.0
                                                if result:
                                                    text f"{result[0]} - {result[1]}" size 16 color "#00FF00" xalign 0.5
                                                else:
                                                    text "vs" size 16 color "#AAAAAA" xalign 0.5
                                                text "[away]" size 16 color barva_away xalign 1.0
                                                if date:
                                                    text date size 14 color "#AAAAAA" xalign 1.0
                                        else:
                                            text "Neplatný zápas" size 16 color "#FF0000" xalign 0.5
  
                                        if current_round == 11 and not next_match:
                                            vbox:
                                                spacing 15
                                                xsize 300
                                                xalign 0.5
                                                text "Základní část dokončena" size 24 color "#FFFFFF" xalign 0.5 text_align 0.5
                                                textbutton "Zahájit Play-off":
                                                    action [Function(start_playoff), Function(renpy.restart_interaction)]
                                                    style "stylove_tlacitko"
 
            # Pravá část - Tabulka ligy
            frame:
                xalign 1.0
                yalign 0.0
                background "#333333AA"
                
                vbox:
                    spacing 8
                    text "Tabulka ligy" size 28 color "#FFFFFF" xalign 0.5
                    
                    $ headers = ["Pořadí", "Tým", "Z", "V", "R", "P", "Skóre", "Body"]
                    $ league_table = get_league_table()
                    $ col_widths = [50, 250, 40, 40, 40, 40, 80, 60]
                    
                    hbox:
                        for header, width in zip(headers, col_widths):
                            frame:
                                xsize width
                                background None
                                text header size 18 color "#FFFF00" xalign 0.5

                    for i, team in enumerate(league_table, 1):
                        hbox:
                            frame:
                                xsize col_widths[0]
                                background None
                                text str(i) size 18 color "#FFFFFF" xalign 0.5
                            frame:
                                xsize col_widths[1]
                                background None
                                hbox:
                                    spacing 5
                                    add team.logo size (25, 25) yalign 0.5
                                    text team.name size 18 color "#FFFFFF" yalign 0.5
                            for j, attr in enumerate(['games_played', 'wins', 'draws', 'losses']):
                                frame:
                                    xsize col_widths[j+2]
                                    background None
                                    text str(getattr(team, attr)) size 18 color "#FFFFFF" xalign 0.5
                            frame:
                                xsize col_widths[6]
                                background None
                                text f"{team.goals_for}:{team.goals_against}" size 18 color "#FFFFFF" xalign 0.5
                            frame:
                                xsize col_widths[7]
                                background None
                                text str(team.points) size 18 color "#FFFFFF" xalign 0.5

# Nový frame v levém dolním rohu
    frame:
        xalign 0.0
        yalign 1.0
        xsize 800
        ysize 400
        background "#000000"  # Černé pozadí
        padding (20, 20)
        vbox:
            spacing 15
            text get_date_string(current_date) size 24 color "#FFFFFF" xalign 0.5
            textbutton "Denní aktivity":
                action Jump("denni_aktivity_screen")
                xfill True
                ysize 100  # Zvětšená výška tlačítka
                text_size 30
                text_xalign 0.5
                text_yalign 0.5
                style "green_button"

 # Play-off bracket (nová část)
            if current_round > 10:
                frame:
                    background "#333333AA"
                    xsize 600
                    padding (15, 15)
                    vbox:
                            spacing 10
                            text "Play-off bracket" size 24 color "#FFFFFF" xalign 0.5
            
                            for round_num, matches in enumerate(full_schedule[10:], 11):
                                text f"Kolo {round_num}:" size 20 color "#FFFF00"
                
                                for match in matches:
                                    python:
                                        if isinstance(match[0], tuple):
                                            team1, team2 = match[0]
                                            result = match[1]
                                        else:
                                            team1, team2 = match
                                            result = None
                    
                                    if result:
                                        text f"{team1} {result[0]} - {result[1]} {team2}" size 18 color "#FFFFFF"
                                    else:
                                        text f"{team1} vs {team2}" size 18 color "#FFFFFF"

# Pravá část - Statistiky hráčů
    frame:
        xsize 600
        ysize 700
        xalign 1.0
        yalign 0.0
        background "#333333AA"
        padding (15, 15)
    
        vbox:
            spacing 8
            text "Statistiky hráčů" size 28 color "#FFFFFF" xalign 0.5
        
            viewport:
                scrollbars "vertical"
                mousewheel True
                ysize 650
            
                vbox:
                    spacing 5
                    hbox:
                        frame:
                            xsize 40
                            text "Poř" size 16 color "#000000" xalign 0.5
                        frame:
                            xsize 150
                            text "Jméno" size 16 color "#000000" xalign 0.0
                        frame:
                            xsize 100
                            text "Tým" size 16 color "#000000" xalign 0.0
                        frame:
                            xsize 50
                            text "Z" size 16 color "#000000" xalign 0.5
                        frame:
                            xsize 50
                            text "G" size 16 color "#000000" xalign 0.5
                        frame:
                            xsize 50
                            text "A" size 16 color "#000000" xalign 0.5
                        frame:
                            xsize 50
                            text "B" size 16 color "#000000" xalign 0.5
                        frame:
                            xsize 50
                            text "TM" size 16 color "#000000" xalign 0.5
                
                    $ sorted_players = sorted([p for p in all_players if isinstance(p, Player)], 
                                              key=lambda p: (getattr(p, 'goals', 0) + getattr(p, 'assists', 0), getattr(p, 'goals', 0)),
                                              reverse=True)
                    
                    for i, player in enumerate(sorted_players, 1):
                        $ team_short = next((key for key in team_colors if key in player.team), player.team[:7])
                        $ team_color = team_colors.get(team_short, "#FFFFFF")

                        hbox:
                            frame:
                                xsize 40
                                text "{:2d}.".format(i) size 16 color "#000000" xalign 0.5
                            frame:
                                xsize 150
                                text "{}".format(player.name[:15]) size 16 color "#000000" xalign 0.0
                            frame:
                                xsize 100
                                text "{}".format(team_short) size 16 color team_color xalign 0.0
                            frame:
                                xsize 50
                                text "{}".format(getattr(player, 'games_played', 0)) size 16 color "#000000" xalign 0.5
                            frame:
                                xsize 50
                                text "{}".format(getattr(player, 'goals', 0)) size 16 color "#000000" xalign 0.5
                            frame:
                                xsize 50
                                text "{}".format(getattr(player, 'assists', 0)) size 16 color "#000000" xalign 0.5
                            frame:
                                xsize 50
                                text "{}".format(getattr(player, 'goals', 0) + getattr(player, 'assists', 0)) size 16 color "#000000" xalign 0.5
                            frame:
                                xsize 50
                                text "{}".format(getattr(player, 'penalty_minutes', 0)) size 16 color "#FF0000" xalign 0.5

# Nový element pro informace o příštím zápasu a tlačítka pro pokračování
    frame:
        xalign 1.0
        yalign 1.0
        xoffset -20
        yoffset -20
        background "#222222EE"
        padding (20, 20)
        $ next_match, round_num = get_next_player_match(vybrany_tym)
        $ print("Debug: full_schedule length:", len(full_schedule))
        $ print("Debug: current_date:", current_date)

        if next_match:
            vbox:
                spacing 15
                xsize 300
                xalign 0.5
                if round_num <= 10:
                    text "Následující zápas" size 26 color "#FFFFFF" xalign 0.5 text_align 0.5
                    $ home, away, date = next_match
                    hbox:
                        spacing 20
                        xalign 0.5
                        $ home_team = get_team_by_name(home)
                        $ away_team = get_team_by_name(away)
                        add home_team.logo size (60, 60)
                        vbox:
                            yalign 0.5
                            text "VS" size 32 color "#FFFF00" xalign 0.5
                            text f"{round_num}. kolo" size 18 color "#AAAAAA" xalign 0.5
                            text date size 18 color "#AAAAAA" xalign 0.5
                        add away_team.logo size (60, 60)
                    text f"{home}\nvs\n{away}" size 22 color "#FFFFFF" xalign 0.5 text_align 0.5
                else:
                    if round_num == 11:
                        text "Čtvrtfinále" size 26 color "#FFFFFF" xalign 0.5 text_align 0.5
                    elif round_num == 12:
                        text "Semifinále" size 26 color "#FFFFFF" xalign 0.5 text_align 0.5
                    elif round_num == 13:
                        text "O 5. místo" size 26 color "#FFFFFF" xalign 0.5 text_align 0.5
                    elif round_num == 14:
                        text "O 3. místo" size 26 color "#FFFFFF" xalign 0.5 text_align 0.5
                    elif round_num == 15:
                        text "Finále" size 26 color "#FFFFFF" xalign 0.5 text_align 0.5
                    
                    hbox:
                        spacing 20
                        xalign 0.5
                        $ team1 = get_team_by_name(next_match[0][0])
                        $ team2 = get_team_by_name(next_match[0][1])
                        if team1:
                            add team1.logo size (60, 60)
                        else:
                            text "?" size 60 color "#FFFFFF" xalign 0.5 yalign 0.5
                        vbox:
                            yalign 0.5
                            text "VS" size 32 color "#FFFF00" xalign 0.5
                        if team2:
                            add team2.logo size (60, 60)
                        else:
                            text "?" size 60 color "#FFFFFF" xalign 0.5 yalign 0.5
                    
                    text f"{next_match[0][0]}\nvs\n{next_match[0][1]}" size 22 color "#FFFFFF" xalign 0.5 text_align 0.5

                null height 10
                hbox:
                    spacing 10
                    xalign 0.5
                    $ is_player_team_match = vybrany_tym in (next_match[0][0], next_match[0][1]) if isinstance(next_match[0], tuple) else vybrany_tym in next_match
                    $ is_match_day = datetime.datetime.strptime(next_match[2], "%d.%m.%Y").date() == current_date if len(next_match) == 3 else True
                    if is_player_team_match:
                       textbutton "Odehrát zápas":
                            action [
                                Function(lambda home=next_match[0][0], away=next_match[0][1]: renpy.call_in_new_context("play_game", home, away)),
                                SetScreenVariable("current_match_simulated", True),
                                SetVariable("todays_match_played", True),
                                Function(renpy.restart_interaction)
                            ]
                            style "stylove_tlacitko"
                            sensitive (is_match_day and not current_match_simulated)
                    textbutton "Simulovat zápas":
                        action [
                            Function(simulate_player_match),
                            SetScreenVariable("current_match_simulated", True),
                            SetVariable("todays_match_played", True),
                            Function(renpy.restart_interaction)
                        ]
                        style "stylove_tlacitko"
                        sensitive (is_match_day and not current_match_simulated)
                    if current_match_simulated: 
                        text "Zápas byl již odehrán" size 18 color "#FFFF00" xalign 0.5

                    # Tlačítko pro odehrání Sranda mače (nová část)
                    if petrův_led_info["date"] and petrův_led_info["is_playing"] and current_date.strftime("%d.%m.%Y") == petrův_led_info["date"]:
                        vbox:
                            spacing 15
                            xsize 300
                            xalign 0.5
                            text "Sranda mač s Petrovou partou" size 26 color "#FFFFFF" xalign 0.5 text_align 0.5
                            textbutton "Odehrát Sranda mač":
                                action [
                                    Function(lambda: renpy.call_in_new_context("play_game", "Petrův tým", vybrany_tym)),
                                    SetScreenVariable("current_match_simulated", True),
                                    SetVariable("todays_match_played", True),
                                    Function(renpy.restart_interaction)
                                ]
                                style "stylove_tlacitko"
                                sensitive not current_match_simulated

        elif current_round <= 10:
            vbox:
                spacing 15
                xsize 300
                xalign 0.5
                text "Základní část dokončena" size 24 color "#FFFFFF" xalign 0.5 text_align 0.5
                textbutton "Zahájit Play-off":
                    action [
                        SetScreenVariable("is_simulating", True),
                        Function(start_playoff),
                        Function(renpy.restart_interaction),
                        SetScreenVariable("is_simulating", False)
                    ]
                    style "stylove_tlacitko"
                    sensitive (not is_simulating)
        else:
            text "Sezóna skončila" size 24 color "#FFFFFF" xalign 0.5 text_align 0.5

style stylove_tlacitko:
    background "#4CAF50"
    hover_background "#45a049"
    insensitive_background "#CCCCCC"  # Barva pozadí neaktivního tlačítka
    padding (10, 5)
    xalign 0.5
    yalign 0.5
    xsize 140

style stylove_tlacitko_text:
    color "#FFFFFF"
    hover_color "#FFFFFF"
    size 18  # Menší velikost textu
    outlines [ (absolute(1), "#000000", absolute(0), absolute(0)) ]

screen team_logo_display():
    if vybrany_tym in logo_settings:
        $ settings = logo_settings[vybrany_tym]
        add settings["name"]:
            xpos settings["xpos"]
            ypos settings["ypos"]
            zoom settings["zoom"]

screen playoff_results(champion, runner_up, third, fourth, fifth, sixth):
    frame:
        xfill True
        yfill True
        vbox:
            spacing 20
            text "Konečné výsledky turnaje" size 40 xalign 0.5
            text f"1. místo: {champion.name}" size 30
            text f"2. místo: {runner_up.name}" size 30
            text f"3. místo: {third.name}" size 30
            text f"4. místo: {fourth.name}" size 30
            text f"5. místo: {fifth.name}" size 30
            text f"6. místo: {sixth.name}" size 30
            
        textbutton "Zpět do hlavního menu":
            action Return()
            xalign 0.5
            yalign 0.9
            
screen prehled_tymu():
    vbox:
        xalign 0.5
        yalign 0.5
        spacing 20

        text "1. kolo" size 40 xalign 0.5

        for tym, logo in [
            ("Litvínov Lancers", "logo_litvinov_small"),
            ("Netopýři Černošice", "logo_cernosice_small"),
            ("HC Ducks Klášterec", "logo_klasterec_small"),
            ("HC Lopaty Praha", "logo_praha_small"),
            ("HC Viper Ústí nad Labem", "logo_usti_small"),
            ("HC Kocouři Beroun", "logo_beroun_small")
        ]:
            $ barva = "#FF0000" if tym == vybrany_tym else "#FFFFFF"
            hbox:
                spacing 10
                add logo
                text tym color barva   

screen countdown_screen(countdown):
    add countdown:
        xpos 932
        ypos 243

init python:
    # Definice stylu pro jména hráčů
    style.player_name = Style(style.default)
    style.player_name.color = "#FFFFFF"
    style.player_name.outlines = [(1, "#000000", 0, 0)]
    style.player_name.drop_shadow = (2, 2)
    style.player_name.drop_shadow_color = "#000000"
    style.player_name.font = "DejaVuSans.ttf"  # Použijte font, který máte k dispozici
    style.player_name.size = 14  # Menší velikost písma
    style.player_name.bold = True

screen hockey_simulation():
    add "hockey_rink.png" xpos 0 ypos 0 zoom 1.7 xzoom 1.1 yzoom 1.0

    for oblouk, pozice in zip(oblouky, pozice_oblouku):  
        add oblouk pos pozice

    for player in all_players:
        add PlayerDisplayable(player)
        text player.name:
            xpos player.x
            ypos player.y - 20
            xanchor 0.5
            style "player_name"
    
    # Vykreslení mantinelů
    for mantinel in mantinely:
        add Solid("#8B4513", xysize=(mantinel.rect.width, mantinel.rect.height)) pos (mantinel.rect.x, mantinel.rect.y)
    
    # Vykreslení branek
    add Solid("#FF0000", xysize=(left_goal.rect.width, left_goal.rect.height)) pos (left_goal.rect.x, left_goal.rect.y)
    add Solid("#0000FF", xysize=(right_goal.rect.width, right_goal.rect.height)) pos (right_goal.rect.x, right_goal.rect.y)
    
    # Vykreslení hráče pomocí PlayerDisplayable
    add PlayerDisplayable(square)
    text square.name:
        xpos square.x
        ypos square.y - 20
        xanchor 0.5
        style "player_name"
    
    # Vykreslení puku pomocí PuckDisplayable (pouze pokud puk existuje)
    if puck is not None:
        add PuckDisplayable(puck)

    # Vykreslení brankářů
    if 'left_goalie' in globals():
        add GoalieDisplayable(left_goalie)
        if hasattr(left_goalie, 'name'):
            text left_goalie.name:
                xpos left_goalie.x
                ypos left_goalie.y - 20
                xanchor 0.5
                style "player_name"

    if 'right_goalie' in globals():
        add GoalieDisplayable(right_goalie)
        if hasattr(right_goalie, 'name'):
            text right_goalie.name:
                xpos right_goalie.x
                ypos right_goalie.y - 20
                xanchor 0.5
                style "player_name"

    # Vykreslení měřiče síly střely
    if square.charge_time > 0:
        $ shot_power = square.get_shot_power_percentage()
        bar value shot_power range 100 xalign 0.5 yalign 0.95 xmaximum 300 ymaximum 20 style "vbar"
        text "{:.0f}%".format(shot_power) xalign 0.5 yalign 0.92 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]

    # Skóre a časomíra
    text "[left_goal.score] - [right_goal.score]" xalign 0.5 ypos 10 size 40 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]
    text "[game_timer.get_time_string()]" xalign 0.5 ypos 60 size 30 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]

    # Debug texty
    if puck is not None:
        text "Puck: ([puck.x], [puck.y])" xpos 10 ypos 10 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]
    else:
        text "Puck: Not yet created" xpos 10 ypos 10 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]
    text "Player: ([square.x], [square.y])" xpos 10 ypos 40 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]
    text "Has puck: [square.has_puck]" xpos 10 ypos 70 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]
    text "Charge: [square.charge_time:.2f]s" xpos 10 ypos 100 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]

    timer 1.0 / 120 repeat True action [
        Function(square.update, mantinely, arc_barriers, puck, 1/120, all_players),
        Function(update_all_ai_players, red_team + blue_team, puck, left_goal, right_goal, mantinely, arc_barriers, square, left_goalie, right_goalie),
        If(puck is not None, true=[
            Function(puck.update, mantinely, arc_barriers, left_goal, right_goal, left_goalie, right_goalie, red_team, blue_team),
            Function(puck_trail.update, puck)
        ]),
        Function(left_goalie.update, puck, 1/120),
        Function(right_goalie.update, puck, 1/120),
        Function(game_timer.update, 1/120)
    ]

screen hockey_simulation_static():
    add "hockey_rink.png" xpos 0 ypos 0 zoom 1.7 xzoom 1.1 yzoom 1.0

    for oblouk, pozice in zip(oblouky, pozice_oblouku):  
        add oblouk pos pozice

    for player in all_players:
        $ position = PLAYER_POSITIONS.get(player.team, {}).get(player.position, (0, 0))
        $ x, y = position
        add PlayerDisplayable(player) pos (x, y)
        text player.name:
            xpos x
            ypos y - 20
            xanchor 0.5
            style "player_name"
    
    # Vykreslení mantinelů
    for mantinel in mantinely:
        add Solid("#8B4513", xysize=(mantinel.rect.width, mantinel.rect.height)) pos (mantinel.rect.x, mantinel.rect.y)
    
    # Vykreslení branek
    add Solid("#FF0000", xysize=(left_goal.rect.width, left_goal.rect.height)) pos (left_goal.rect.x, left_goal.rect.y)
    add Solid("#0000FF", xysize=(right_goal.rect.width, right_goal.rect.height)) pos (right_goal.rect.x, right_goal.rect.y)
    
    # Vykreslení brankářů pomocí GoalieDisplayable
    add GoalieDisplayable(left_goalie)
    if hasattr(left_goalie, 'name'):
        text left_goalie.name:
            xpos left_goalie.x
            ypos left_goalie.y - 20
            xanchor 0.5
            style "player_name"

    add GoalieDisplayable(right_goalie)
    if hasattr(right_goalie, 'name'):
        text right_goalie.name:
            xpos right_goalie.x
            ypos right_goalie.y - 20
            xanchor 0.5
            style "player_name"

    # Skóre a časomíra
    text "0 - 0" xalign 0.5 ypos 10 size 40 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]
    text "[game_timer.get_time_string()]" xalign 0.5 ypos 60 size 30 color "#FFFFFF" outlines [(2, "#000000", 0, 0)]

# Screen pro výběr týmu
screen vyber_tymu():
    on "show" action Function(hide_scoreboard)    
    modal True
    
    frame:
        background "#000000AA"
        xfill True
        yfill True
        
        vbox:
            xalign 0.5
            yalign 0.5
            spacing 30
            
            text "Vyberte si tým" size 40 color "#FFFFFF" outlines [ (2, "#000000", 0, 0) ] xalign 0.5
            
            grid 2 3:
                spacing 30
                for tym, logo in [
                    ("Litvínov Lancers", "logo_litvinov_small"),
                    ("Netopýři Černošice", "logo_cernosice_small"),
                    ("HC Ducks Klášterec", "logo_klasterec_small"),
                    ("HC Lopaty Praha", "logo_praha_small"),
                    ("HC Viper Ústí nad Labem", "logo_usti_small"),
                    ("HC Kocouři Beroun", "logo_beroun_small"),
                ]:
                    frame:
                        background None
                        xysize (300, 250)
                        
                        button:
                            action [SetVariable("vybrany_tym", tym), Return()]
                            
                            frame:
                                background "#333333CC"
                                padding (10, 10)
                                
                                vbox:
                                    xalign 0.5
                                    yalign 0.5
                                    spacing 20
                                    
                                    add logo:
                                        zoom 2.0
                                        xalign 0.5
                                        yalign 0.5
                                    
                                    text tym:
                                        size 20
                                        color "#FFFFFF"
                                        xalign 0.5
                                        text_align 0.5
                                        layout "subtitle"
                            
                            at transform:
                                on hover:
                                    ease 0.2 zoom 1.1
                                on idle:
                                    ease 0.2 zoom 1.0
                 
screen team_logo_display():
    if vybrany_tym:
        $ logo_name = "logo_" + vybrany_tym.lower().replace(" ", "_").replace("ý", "y").replace("í", "i").replace("ř", "r").replace("hc_", "") + "_small"
        add logo_name:
            xalign 0.0
            yalign 1.0
            xoffset 10
            yoffset -10    

# Obecný screen pro zadávání oslovení nebo příjmení
screen zadej_pad(otazka, priklad, je_prijmeni=False):
    modal True
    default odpoved = ""
    frame:
        background "#000000AA"
        xfill True
        yfill True
        vbox:
            xalign 0.5
            yalign 0.5
            spacing 30
            text otazka size 40 color "#FFFFFF" outlines [ (2, "#000000", 0, 0) ] xalign 0.5
            text "Například: [priklad]" size 24 color "#AAAAAA" xalign 0.5
            input:
                value ScreenVariableInputValue("odpoved")
                length 20
                color "#FFFFFF"
                size 24
                xalign 0.5
            textbutton "Pokračovat":
                action Return(odpoved)
                xalign 0.5

screen denni_aktivity():
    $ print(f"Debug: Počet zpráv v seznamu messages: {len(messages)}")
    $ print(f"Debug: Odesílatelé zpráv: {set(msg.sender for msg in messages)}")
    $ print(f"Debug: Obsah zpráv: {[(msg.sender, msg.content) for msg in messages]}")
    $ print(f"Debug: show_honza_button in denni_aktivity screen: {show_honza_button}")
    $ print(f"Debug: show_honza_button v denni_aktivity screenu: {show_honza_button}")
    $ match_tomorrow = is_match_tomorrow()
    $ print(f"Debug: Je zítra zápas? {match_tomorrow}")
    $ can_sleep = not has_unplayed_future_match()

    frame:
        xfill True
        yfill True
        background "#222222EE"

        hbox:
            spacing 20

            # Mobilní telefon
            frame:
                xsize 400
                yfill True
                background None

                image "images/mobile_phone.png":
                    xalign 0.5
                    yalign 0.5
                    zoom 1.1

                frame:
                    xalign 0.5
                    yalign 0.5
                    xsize 350
                    ysize 600
                    background "#FFFFFF11"

                    vbox:
                        spacing 10
                        xfill True
                        ysize 580

                        # Hlavička mobilu
                        frame:
                            background "#333333"
                            ysize 40
                            xfill True
                            text "18:30" xalign 0.5 yalign 0.5 color "#FFFFFF" size 16

                        # Obsah mobilu
                        viewport:
                            ysize 500
                            mousewheel True
                            scrollbars "vertical"
                            vbox:
                                spacing 10
                                xfill True

                                if not current_conversation:
                                    button:
                                        xalign 0.5
                                        yalign 0.5
                                        action SetVariable("current_conversation", "inbox")

                                        frame:
                                            background None
                                            xsize 100
                                            ysize 100

                                            image "images/zprava.png":
                                                zoom 0.4
                                                align (0.5, 0.5)

                                            $ unread_count = get_unread_messages_count()
                                            if unread_count > 0:
                                                frame:
                                                    xalign 1.0
                                                    yalign 0.0
                                                    xoffset 10
                                                    yoffset 0
                                                    background "#FF0000"
                                                    xysize (40, 40)
                                                    text str(unread_count):
                                                        size 18
                                                        color "#FFFFFF"
                                                        align (0.5, 0.5)

                                elif current_conversation == "inbox":
                                    for sender in set(msg.sender for msg in messages if msg.sender != "Player"):
                                        $ unread = sum(1 for msg in messages if msg.sender == sender and not msg.read)
                                        textbutton "[sender] ([unread] nepřečtených)":
                                            action [SetVariable("current_conversation", sender), Function(mark_messages_read, sender)]
                                            style "mobile_conversation_button"
                                            xfill True
                                else:
                                    # Zobrazení zpráv v konkrétní konverzaci
                                    for msg in messages:
                                        if msg.sender == current_conversation or msg.sender == "Player":
                                            $ msg_align = 0.0 if msg.sender != "Player" else 1.0
                                            $ msg_background = "#333333" if msg.sender != "Player" else "#555555"
                                            frame:
                                                xalign msg_align
                                                background msg_background
                                                padding (10, 5)
                                                xmaximum 250
                                                text msg.content size 14 color "#FFFFFF" justify True

                        if current_conversation and current_conversation != "inbox":
                            frame:
                                ysize 80
                                xfill True
                                background "#222222"
                                vbox:
                                    xfill True
                                    $ options = get_conversation_options()
                                    if options:
                                        for option, mood in options:
                                            textbutton option:
                                                action Function(add_message, "Player", option)
                                                style "mobile_button"
                                                xfill True
                                                text_size 14
                                    else:
                                        text "Konec konverzace" size 14 color "#FFFFFF" xalign 0.5

                        if current_conversation and current_conversation != "inbox":
                            textbutton "Zavřít konverzaci":
                                action [Function(mark_conversation_as_read, current_conversation), SetVariable("current_conversation", None)]
                                style "mobile_button"
                                xalign 0.5

                        if current_conversation == "inbox":
                            textbutton "Zpět":
                                action SetVariable("current_conversation", None)
                                style "mobile_button"
                                xalign 0.5

# Pravá část - denní aktivity
        frame:
            xalign 1.0
            yalign 0.5
            xsize 640  # Přibližně třetina 1920x1080 obrazovky
            ysize 1080
            background "#1E2A3A"  # Tmavě modrá barva pozadí
        
            vbox:
                spacing 20
                xfill True
                yalign 0.5
            
                text player.name size 40 color "#FFD700" xalign 0.5 outlines [(2, "#000000", 0, 0)]
                text f"Tým: {player.team}" size 24 color "#FFFFFF" xalign 0.5
            
                null height 20
            
                frame:
                    background "#2C3E50"
                    padding (20, 20)
                    vbox:
                        spacing 15
                        hbox:
                            spacing 30
                            vbox:
                                spacing 5
                                text "Fyzické atributy" size 20 color "#3498DB" xalign 0.5
                                text f"Rychlost: {player.speed}" size 16 color "#FFFFFF"
                                text f"Střelba: {player.shooting_accuracy}" size 16 color "#FFFFFF"
                                text f"Přihrávky: {player.passing}" size 16 color "#FFFFFF"
                                text f"Kontrola puku: {player.puck_control}" size 16 color "#FFFFFF"
                                text f"Obrana: {player.defense}" size 16 color "#FFFFFF"
                                text f"Blokování střel: {player.shot_blocking}" size 16 color "#FFFFFF"
                            vbox:
                                spacing 5
                                text "Mentální atributy" size 20 color "#2ECC71" xalign 0.5
                                text f"Hokejové IQ: {player.hockey_iq}" size 16 color "#FFFFFF"
                                text f"Agresivita: {player.aggressiveness}" size 16 color "#FFFFFF"
                                text f"Týmová hra: {player.team_play}" size 16 color "#FFFFFF"
                                text f"Rozhodování: {player.decision_making}" size 16 color "#FFFFFF"
                                text f"Mentální odolnost: {player.mental_toughness}" size 16 color "#FFFFFF"
                                text f"Disciplína: {player.discipline}" size 16 color "#FFFFFF"
            
                frame:
                    background "#2C3E50"
                    padding (20, 20)
                    vbox:
                        spacing 15
                        hbox:
                            spacing 30
                            vbox:
                                spacing 5
                                text "Technické dovednosti" size 20 color "#E74C3C" xalign 0.5
                                text f"Střela zápěstím: {player.wrist_shot}" size 16 color "#FFFFFF"
                                text f"Golfák: {player.slap_shot}" size 16 color "#FFFFFF"
                                text f"Blafák: {player.dekes}" size 16 color "#FFFFFF"
                                text f"Buly: {player.faceoffs}" size 16 color "#FFFFFF"
                                text f"Vyhazování: {player.clearing}" size 16 color "#FFFFFF"
                            vbox:
                                spacing 5
                                text "Osobní vlastnosti" size 20 color "#F39C12" xalign 0.5
                                text f"Bojovnost: {player.fighting_spirit}" size 16 color "#FFFFFF"
                                text f"Energie: {player.energy}" size 16 color "#FFFFFF"
                                text f"Morálka: {player.morale}" size 16 color "#FFFFFF"
                                text f"Vytrvalost: {player.stamina}" size 16 color "#FFFFFF"
                                text f"Charisma: {player.charisma}" size 16 color "#FFFFFF"
            
                null height 20
            
                text f"Zkušenosti: {player.experience}" size 18 color "#BDC3C7" xalign 0.5
                text f"Popularita: {player.popularity}" size 18 color "#BDC3C7" xalign 0.5

  # Pravá část - denní aktivity
              
        frame:
            xalign 0.4
            yalign 0.5
            xsize 640  # Přibližně třetina 1920x1080 obrazovky
            ysize 1080
            background "#2C3E50"  # Tmavě modré pozadí
        
            vbox:
                spacing 30
                xalign 0.5
                yalign 0.5
            
                text "Co dnes budeš dělat?" size 40 color "#FFD700" xalign 0.5 outlines [(2, "#000000", 0, 0)]
            
                vbox:
                    spacing 20
                    xalign 0.4
                
                    textbutton "Jít spát":
                        action [Function(end_day), Function(renpy.restart_interaction)]
                        xsize 400
                        ysize 80
                        text_size 30
                        style "big_button"
                        sensitive (not match_tomorrow or todays_match_played) and can_sleep

                    textbutton "Jít na stadion":
                        action [
                            Function(lambda: print("Debug: Tlačítko 'Jít na stadion' bylo stisknuto")),
                            Hide("denni_aktivity"),
                            Show("prehled_ligy")
                        ]
                        xsize 400
                        ysize 80
                        text_size 30
                        style "big_button"

                    if show_honza_button:
                        $ print("Debug: Zobrazuji tlačítko 'Jít k Honzovi'")
                        textbutton "Jít k Honzovi":
                            action [SetVariable("show_honza_button", False), Jump("navsteva_honzy")]
                            xsize 400
                            ysize 80
                            text_size 30
                            style "big_button"
            
                vbox:
                    spacing 10
                    xalign 0.5
                
                    if match_tomorrow:
                        text "Dnes máš zápas! Nemůžeš jít spát." size 20 color "#FF6B6B" xalign 0.5
                
                    if not can_sleep:
                        text "Máš naplánovaný zápas! Musíš jít na stadion." size 20 color "#FF6B6B" xalign 0.5

style big_button:
    background "#3498DB"
    hover_background "#2980B9"
    padding (20, 10)
    xalign 0.5

style big_button_text:
    color "#FFFFFF"
    hover_color "#F0F0F0"
    size 30
    outlines [(1, "#000000", 0, 0)]


screen mobile_messages():
    modal True
    frame:
        xfill True
        yfill True
        background "#000000AA"
        vbox:
            spacing 10
            text "Zprávy" size 30 color "#FFFFFF" xalign 0.5
            
            viewport:
                ysize 500
                mousewheel True
                scrollbars "vertical"
                vbox:
                    spacing 10
                    for msg in messages:
                        frame:
                            background "#333333"
                            padding (10, 10)
                            vbox:
                                text msg.sender color "#FFFF00" size 20
                                text msg.content color "#FFFFFF" size 16
                                if not msg.read:
                                    text "Nová zpráva" color "#00FF00" size 14
                                    $ msg.read = True

            textbutton "Zpět":
                action Hide("mobile_messages")
                xalign 0.5

screen mobile_social():
    modal True
    frame:
        xfill True
        yfill True
        background "#000000AA"
        vbox:
            text "Sociální sítě" size 30 color "#FFFFFF" xalign 0.5
            # Zde přidejte obsah sociálních sítí
            textbutton "Zpět":
                action Hide("mobile_social")
                xalign 0.5

screen mobile_news():
    modal True
    frame:
        xfill True
        yfill True
        background "#000000AA"
        vbox:
            text "Novinky" size 30 color "#FFFFFF" xalign 0.5
            # Zde přidejte seznam novinek
            textbutton "Zpět":
                action Hide("mobile_news")
                xalign 0.5

screen typing_indicator(sender):
    frame:
        xalign 0.0
        background "#333333"
        padding (10, 5)
        text f"{sender} píše..." size 14 color "#AAAAAA"

# Definice obrazovky s hvězdičkami
screen star_background():
    for i in range(20):  # Vytvoří 20 hvězdiček
        $ x = renpy.random.randint(0, 1920)
        $ y = renpy.random.randint(0, 1080)
        text "*" xpos x ypos y style "golden_text" at star_twinkle

# Definice transformace pro blikání hvězdiček
transform star_twinkle:
    alpha 0.5
    linear 1.0 alpha 1.0
    linear 1.0 alpha 0.5
    repeat

# Upravená obrazovka výběru s hvězdičkami
screen choice_with_stars(items):
    style_prefix "choice"

    vbox:
        for label, value in items:
            textbutton label:
                action Return(value)
                text_style "golden_text"
                xalign 0.5

screen star_background():
    for i in range(20):  # Vytvoří 20 hvězdiček
        $ x = renpy.random.randint(0, 1920)
        $ y = renpy.random.randint(0, 1080)
        text "*" xpos x ypos y style "golden_text" at star_twinkle

screen choice_with_stars(items):
    style_prefix "choice"

    vbox:
        for label, value in items:
            textbutton label:
                action Return(value)
                text_style "golden_text"
                xalign 0.5

# Definice transformace pro blikání hvězdiček
transform star_twinkle:
    alpha 0.5
    linear 1.0 alpha 1.0
    linear 1.0 alpha 0.5
    repeat

# Definice animace "shake"
define shake = "shake"  # Odkaz na vestavěnou animaci

init python:
    # Definice animace "shake"
    def shake():
        return [
            (0.1, {"xanchor": 0.0, "yanchor": 0.0}),
            (0.1, {"xanchor": 1.0, "yanchor": 0.0}),
            (0.1, {"xanchor": 0.0, "yanchor": 0.0}),
        ]

screen position_select():
    default selected_position = None

    frame:
        background "#000000"  # Černé pozadí
        xfill True
        yfill True
        xpadding 50
        ypadding 50
        
        vbox:
            xalign 0.5
            yalign 0.5
            spacing 40
            
            hbox:
                xalign 0.5
                spacing 60
                for position in ['Levé Křídlo', 'Centr', 'Pravé Křídlo']:
                    textbutton position:
                        if selected_position == position:
                            background "#00FF00"  # Zelené pozadí, pokud vybráno
                            text_color "#000000"  # Černé písmo
                        else:
                            background "#00FF00"  # Zelené pozadí
                            text_color "#FFFFFF"  # Bílé písmo
                        hover_background "#008000"  # Tmavší zelená při najetí
                        hover_foreground "#FFFFFF"  # Bílé písmo při najetí
                        xpadding 60
                        ypadding 30
                        action [SetScreenVariable("selected_position", position), Return(position)]

            hbox:
                xalign 0.5    
                spacing 80
                for position in ['Levý Obránce', 'Pravý Obránce']:  
                    textbutton position:
                        if selected_position == position:
                            background "#00FF00"  # Zelené pozadí, pokud vybráno
                            text_color "#000000"  # Černé písmo
                        else:
                            background "#00FF00"  # Zelené pozadí
                            text_color "#FFFFFF"  # Bílé písmo
                        hover_background "#008000"  # Tmavší zelená při najetí
                        hover_foreground "#FFFFFF"  # Bílé písmo při najetí
                        xpadding 80 
                        ypadding 40
                        action [SetScreenVariable("selected_position", position), Return(position)]

            textbutton 'Brankář':
                xalign 0.5
                if selected_position == 'Brankář':
                    background "#00FF00"  # Zelené pozadí, pokud vybráno
                    text_color "#000000"  # Černé písmo
                else:
                    background "#00FF00"  # Zelené pozadí
                    text_color "#FFFFFF"  # Bílé písmo
                hover_background "#008000"  # Tmavší zelená při najetí
                hover_foreground "#FFFFFF"  # Bílé písmo při najetí
                xpadding 100
                ypadding 50 
                action [SetScreenVariable("selected_position", 'Brankář'), Return('Brankář')]

label start:
    $ current_date = datetime.date(2025, 6, 1)
    $ add_initial_messages(current_date)
    $ print(f"Debug: Po volání add_initial_messages, počet zpráv: {len(messages)}")
    $ print(f"Debug: Hra začíná. Počáteční datum: {current_date}")
    $ print(f"Debug: Vybraný tým: {vybrany_tym}")
    $ print(f"Debug: Počet kol v full_schedule: {len(full_schedule)}")
    $ print(f"Debug: Aktuální kolo (current_round): {current_round}")

    # Přehraj hudbu
    play music "audio/Pohar001.mp3" fadein 1.0

    "Vítejte v naší hokejové hře!"
    "Nejprve si vyberte tým, za který chcete hrát."

    call screen vyber_tymu

    "Skvělá volba! Vybrali jste si tým [vybrany_tym]."

    $ selected_position = renpy.call_screen("position_select")
    "Vybrali jste si pozici [selected_position]."

    "Nyní vyberte speciální vlastnost"

    call choose_special_ability

    "Nyní zadejte své křestní jméno."

    $ player_first_name = renpy.call_screen("zadej_pad", "Zadejte své křestní jméno", "Tomáš")

    $ prijmeni_1 = renpy.call_screen("zadej_pad", "Příjmení - 1. pád (kdo, co?)", "Novák", True)

    $ player_full_name = player_first_name + " " + prijmeni_1
    $ player = Player(player_full_name, vybrany_tym, selected_position,
                    100,   # Attendance
                    100,   # Reliability
                      1,   # Rychlost
                      1,   # Přesnost střely
                      1,   # Přihrávka
                      1,   # Kontrola puku
                      1,   # Obrana
                      1,   # Blokování střel
                      1,   # Síla
                      1,   # Tvrdost
                      1,   # Rovnováha
                      1,   # Bruslení
                      1,   # Pozice na ledě
                     50,   # Agresivita
                     50,   # Týmová hra
                      1,   # Hokejové IQ
                      1,   # Zkušenost
                      1,   # Trestná střílení
                      1,   # Výbušnost
                     50,   # Rozhodování
                      1,   # Hbitost
                      1,   # Brankářské reflexy (nízké, protože není brankář)
                      1,   # Chytání (nízké, protože není brankář)
                      1,   # Pohyb v brankovišti (nízké, protože není brankář)
                      1,   # Rozehrávka brankáře (nízké, protože není brankář)
                     50,   # Mentální odolnost
                      1,   # Zpracování puku
                      1,   # Střela zápěstím
                      1,   # Střela golfákem
                      1,   # Zrychlení
                      1,   # Střela s příklepem
                      1,   # Přihrávka vzduchem
                      1,   # Vyhazování
                      1,   # Buly
                      1,   # Kličky
                      1,   # Hokejka (nízké, protože není brankář)
                      1,   # Vyrážečka (nízké, protože není brankář)
                      1,   # Lapačka (nízké, protože není brankář)
                     50,   # Bojovnost
                      1,   # Morálka
                      1,   # Fyzička
                    100,   # Energie
                     50,   # Vztah k hráčovi
                     50,   # Povaha
                     50,   # Disciplína
                      0,   # Popularita
                      1,   # Hlídání hráče
                     50,   # Charisma
                )

    $ all_players = [p for p in all_players if p.name != player_full_name]
    $ all_players.append(player)

    $ temp_debug_info = "Typy objektů v all_players:\n" + "\n".join(f"{p.name}: {type(p)}" for p in all_players)
    $ print(temp_debug_info)
    $ print(f"Hráč {player_full_name} byl přidán do týmu {vybrany_tym} jako {selected_position}.")
    $ print(f"Celkový počet hráčů: {len(all_players)}")
    
    # Zde pokračujte s dalším obsahem hry...
    call screen prehled_ligy
  
label play_game(home_team_name, away_team_name):
    python:
        print(f"Debug: Starting play_game with {home_team_name} vs {away_team_name}")
    
    # Kontrola, zda jde o Sranda mač
    if current_date.strftime("%d.%m.%Y") == petrův_led_info["date"] and petrův_led_info["is_playing"]:
        "Sranda mač začíná!"
        $ red_team_players, blue_team_players = prepare_sranda_match()
        python:
            print(f"Debug: červený: {[p.name for p in red_team_players]}")
            print(f"Debug: modrý: {[p.name for p in blue_team_players]}")
        
        # Uložení seznamů hráčů do proměnných, které pak použiješ v jiném labelu
        $ persistent.red_team_players = red_team_players
        $ persistent.blue_team_players = blue_team_players
        
        $ red_team_players = [p for p in all_players if p.team == "červený"]
        $ blue_team_players = [p for p in all_players if p.team == "modrý"]
        call hockey_match_start
        
    else:
        $ home_score, away_score, home_players, away_players, home_stats, away_stats = play_match(home_team_name, away_team_name)
    
    if left_goal.score > right_goal.score:
        "[home_team_name] vyhrál zápas!"
    elif right_goal.score > left_goal.score:
        "[away_team_name] vyhrál zápas!"
    else:
        "Zápas skončil remízou!"
    
    # Reset informací o zápase
    $ hide_scoreboard()
    call screen prehled_ligy
    return

    $ print(f"Debug: Starting play_game with {home_team_name} vs {away_team_name}")
    $ home_score, away_score, home_players, away_players, home_stats, away_stats = play_match(home_team_name, away_team_name)
    $ print(f"Debug: Match result: {home_score} - {away_score}")
    $ is_playoff = current_round > 10
    $ home_team = get_team_by_name(home_team_name)
    $ away_team = get_team_by_name(away_team_name)

    $ print(f"Debug: home_team: {home_team}, away_team: {away_team}")
    
    if home_team is None or away_team is None:
        $ print("Error: One of the teams is None")
        "Chyba: Nelze najít tým."
        return
    
    if home_score > away_score:
        $ winner = home_team
        $ loser = away_team
    elif away_score > home_score:
        $ winner = away_team
        $ loser = home_team
    else:
        $ winner = home_team  # V případě remízy považujeme domácí tým za vítěze
        $ loser = away_team

    $ print(f"Debug: winner: {winner.name if winner else 'None'}, loser: {loser.name if loser else 'None'}")

    if not is_playoff:
        if winner.name == vybrany_tym:
            "Gratulujeme! Váš tým vyhrál zápas základní části!"
        elif loser.name == vybrany_tym:
            "Bohužel, váš tým prohrál zápas základní části."
        else:
            "Zápas základní části skončil."
        
        # Simulace zbývajících zápasů kola základní části
        $ simulate_remaining_matches(current_round, home_team_name, away_team_name)
    else:
        if winner.name == vybrany_tym:
            if current_round == 11:
                "Gratulujeme! Váš tým postoupil do semifinále!"
            elif current_round == 12:
                "Gratulujeme! Váš tým postoupil do finále!"
            elif current_round == 13:
                "Váš tým se umístil na 5. místě!"
            elif current_round == 14:
                "Váš tým se umístil na 3. místě a získává bronzovou medaili!"
            elif current_round == 15:
                "Gratulujeme! Váš tým vyhrál celou soutěž a získává zlatou medaili!"
        elif loser.name == vybrany_tym:
            if current_round == 11:
                "Bohužel, váš tým byl vyřazen v čtvrtfinále. Budete hrát o 5. místo."
            elif current_round == 12:
                "Bohužel, váš tým byl vyřazen v semifinále. Budete hrát o 3. místo."
            elif current_round == 13:
                "Váš tým se umístil na 6. místě."
            elif current_round == 14:
                "Váš tým se umístil na 4. místě."
            elif current_round == 15:
                "Váš tým se umístil na 2. místě. Gratulujeme k stříbrné medaili!"
        
        # Aktualizace playoff bracketu
        $ update_playoff_bracket(current_round, winner, loser)
        
        # Simulace zbývajících zápasů kola play-off
        $ simulate_remaining_playoff_matches(current_round, home_team_name, away_team_name)

    $ current_round = min(current_round + 1, 15)
    $ hide_scoreboard()
    call screen prehled_ligy

label play_playoff_match(team1_name, team2_name):
    $ print(f"Debug: Starting playoff match between {team1_name} and {team2_name}")
    $ print(f"Debug: Current round before match: {current_round}")
    $ team1 = get_team_by_name(team1_name)
    $ team2 = get_team_by_name(team2_name)
    
    if team1 is None or team2 is None:
        "Chyba: Jeden z týmů nebyl nalezen."
        return

    $ player_team = team1 if team1.name == vybrany_tym else team2
    $ opponent = team2 if player_team == team1 else team1
    $ is_player_home = player_team == team1

    # Definujeme player
    $ player = next((p for p in all_players if p.name == player_full_name), None)
    if player is None:
        $ player = Player(player_full_name, vybrany_tym)
        $ all_players.append(player)

    if current_round == 11:
        "Čtvrtfinálový zápas mezi [team1.name] a [team2.name] začíná!"
    elif current_round == 12:
        "Semifinálový zápas mezi [team1.name] a [team2.name] začíná!"
    elif current_round == 13:
        "Zápas o 5. místo mezi [team1.name] a [team2.name] začíná!"
    elif current_round == 14:
        "Zápas o 3. místo mezi [team1.name] a [team2.name] začíná!"
    elif current_round == 15:
        "Finálový zápas mezi [team1.name] a [team2.name] začíná!"

    $ home_score, away_score, _, _ = play_period(team1, team2, 1, 0, 0, player, [], [])
    $ home_score, away_score, _, _ = play_period(team1, team2, 2, home_score, away_score, player, [], [])
    $ home_score, away_score, _, _ = play_period(team1, team2, 3, home_score, away_score, player, [], [])

    "Konečný stav: [team1.name] [home_score] - [away_score] [team2.name]"

    $ winner = team1 if home_score > away_score else team2
    $ loser = team2 if home_score > away_score else team1

    if winner.name == vybrany_tym:
        if current_round == 11:
            "Gratulujeme! Váš tým postoupil do semifinále!"
        elif current_round == 12:
            "Gratulujeme! Váš tým postoupil do finále!"
        elif current_round == 13:
            "Váš tým se umístil na 5. místě!"
        elif current_round == 14:
            "Váš tým se umístil na 3. místě a získává bronzovou medaili!"
        elif current_round == 15:
            "Gratulujeme! Váš tým vyhrál celou soutěž a získává zlatou medaili!"
    elif loser.name == vybrany_tym:
        if current_round == 11:
            "Bohužel, váš tým byl vyřazen v čtvrtfinále. Budete hrát o 5. místo."
        elif current_round == 12:
            "Bohužel, váš tým byl vyřazen v semifinále. Budete hrát o 3. místo."
        elif current_round == 13:
            "Váš tým se umístil na 6. místě."
        elif current_round == 14:
            "Váš tým se umístil na 4. místě."
        elif current_round == 15:
            "Váš tým se umístil na 2. místě. Gratulujeme k stříbrné medaili!"
    else:
        if current_round == 11:
            "Tým [winner.name] postupuje do semifinále."
        elif current_round == 12:
            "Tým [winner.name] postupuje do finále."
        elif current_round == 13:
            "Tým [winner.name] se umístil na 5. místě."
        elif current_round == 14:
            "Tým [winner.name] se umístil na 3. místě a získává bronzovou medaili."
        elif current_round == 15:
            "Tým [winner.name] vyhrál celou soutěž a získává zlatou medaili!"

    $ update_playoff_bracket(current_round, winner, loser)
    $ update_match_result(current_round, team1, team2, home_score, away_score)

    $ print(f"Debug: Playoff match completed. Winner: {winner.name}")
    $ print(f"Debug: Current round after match: {current_round}")

    $ hide_scoreboard()  # Skryjeme scoreboard, pokud je zobrazen
    
    $ current_round = min(current_round + 1, 15)  # Posuneme se na další kolo
    $ renpy.restart_interaction()  # Aktualizujeme obrazovku
    call screen prehled_ligy

label trenink:
    "Trénujete tvrdě. Vaše dovednosti se zlepšují!"
    $ player.speed += 1j
    $ player.shooting += 1
    jump denni_aktivity_screen

label odpocinek:
    "Odpočíváte a regenerujete síly."
    $ player.energy = min(player.energy + 20, 100)
    jump denni_aktivity_screen

label studium_taktiky:
    "Studujete taktiku. Vaše herní inteligence roste!"
    $ player.hockey_iq += 1
    jump denni_aktivity_screen

label tymova_aktivita:
    "Účastníte se týmové aktivity. Zlepšuje se chemie týmu!"
    $ team_chemistry += 5
    jump denni_aktivity_screen

label denni_aktivity_screen:
    scene bg_denni_aktivity  # Předpokládáme, že máte pozadí pro denní aktivity
    call screen denni_aktivity

label navsteva_honzy:
    $ print("Debug: Vstup do labelu navsteva_honzy")
    "Jdeš na návštěvu k Honzovi."
    
    "Honza: 'Ahoj! Rád tě vidím. Chceš si zahrát novou hru, kterou jsem dostal?'"
    menu:
        "Ano, rád si zahraju!":
            "Honza: 'Super! Tady je, pojď si to vyzkoušet.'"
            $ run_external_game()
            "Počkej, až dohraješ hru a pak se vrať sem."
            # Tady můžete přidat nějakou formu čekání nebo kontroly, jestli hráč dokončil hru
            "Honza: 'Tak co, jak se ti to líbilo?'"
        "Ne, díky, možná jindy.":
            "Honza: 'V pohodě, možná příště.'"
    
    # Pokračování návštěvy
    "Strávil jsi příjemný čas s Honzou."
    $ show_honza_button = False
    $ print("Debug: Konec návštěvy u Honzy, show_honza_button nastaveno na False")
    jump denni_aktivity_screen

label choose_special_ability:
    $ special_abilities = [
        {"name": "Ledový stín", "description": "Soupeři tě lehce přehlídnou."},
        {"name": "Rakety na bruslích", "description": "Neuvěřitelné zrychlení"},
        {"name": "Mistr pohybu", "description": "Dokážeš změnit směr jako nikdo jiný."},
        {"name": "Zdičkář", "description": "Mistr osobních soubojů"},
        {"name": "Blokovací mistr", "description": "Puk přes tebe neprojde."},
        {"name": "Hákový lovec", "description": "Hráč s neuvěřitelným citem pro hokejku."},
        {"name": "Mozek týmu", "description": "Hráč s neuvěřitelným přehledem o hře."},
        {"name": "Duch týmu", "description": "Emocionální srdce týmu."},
        {"name": "Nezištný tvůrce", "description": "Hráč vyniká v tvorbě šancí a přihrávkách."},
        {"name": "Střelecký mág", "description": "Přesná muška a neuvěřitelná síla střelby."},
        {"name": "Silák", "description": "Fyzicky dominující hráč."},
        {"name": "Dítě štěsteny", "description": "Puky se odrážejí k hráči."}
    ]

    call screen choose_special_ability
    $ player_special_ability = _return

    "Vybrali jste si speciální vlastnost: [player_special_ability['name']]"
    "Tato vlastnost vám poskytne speciální bonus během zápasů."

    return

label after_hockey_match:
    $ home_score = left_goal.score
    $ away_score = right_goal.score
    
    if home_score > away_score:
        "[home_team_name] vyhrál zápas!"
    elif away_score > home_score:
        "[away_team_name] vyhrál zápas!"
    else:
        "Zápas skončil remízou!"
    
    $ hide_scoreboard()
    call screen prehled_ligy
    return

label hockey_match_start():
    $ red_team_players, blue_team_players = prepare_sranda_match()
    $ print(f"Debug: Červený tým má {len(red_team_players)} hráčů, Modrý tým má {len(blue_team_players)} hráčů")

    if not red_team_players or not blue_team_players:
        "Nedostatek hráčů pro zahájení zápasu. Zkontrolujte sestavy týmů."
        return

    $ red_goalie = next((p for p in red_team_players if p.position.lower() == "brankář"), None)
    $ blue_goalie = next((p for p in blue_team_players if p.position.lower() == "brankář"), None)

    if not red_goalie:
        "Chybí brankář v červeném týmu. Zápas nemůže začít."
        return
    if not blue_goalie:
        "Chybí brankář v modrém týmu. Zápas nemůže začít."
        return

    if len(red_team_players) < 6 or len(blue_team_players) < 6:
        "Není dostatek hráčů pro zahájení zápasu. Zkontrolujte sestavy týmů."
        return

    $ renpy.log("Starting hockey simulation")
    
    $ all_players = red_team_players + blue_team_players

    # Inicializace AI hráčů s jejich jmény
    $ ai_opponent = next((p for p in red_team_players if p.position == "Center"), red_team_players[0])
    $ blue_center = next((p for p in blue_team_players if p.position == "Center"), blue_team_players[0])
    $ red_right_wing = next((p for p in red_team_players if p.position == "RightWing"), None)
    $ blue_right_wing = next((p for p in blue_team_players if p.position == "RightWing"), None)
    $ red_left_wing = next((p for p in red_team_players if p.position == "LeftWing"), None)
    $ blue_left_wing = next((p for p in blue_team_players if p.position == "LeftWing"), None)
    $ red_right_defense = next((p for p in red_team_players if p.position == "RightDefense"), None)
    $ blue_right_defense = next((p for p in blue_team_players if p.position == "RightDefense"), None)
    $ red_left_defense = next((p for p in red_team_players if p.position == "LeftDefense"), None)
    $ blue_left_defense = next((p for p in blue_team_players if p.position == "LeftDefense"), None)

    # Sestavení týmů
    $ red_team = [p for p in [ai_opponent, red_left_wing, red_right_wing, red_left_defense, red_right_defense] if p is not None]
    $ blue_team = [p for p in [blue_center, blue_left_wing, blue_right_wing, blue_left_defense, blue_right_defense] if p is not None]

    $ left_goalie = red_goalie
    $ right_goalie = blue_goalie

    python:
        # Inicializace square v Python bloku
        if 'player' in globals():
            square = MovingSquare(player.name)
        else:
            square = MovingSquare(None)

    $ square = MovingSquare(player.name if 'player' in globals() else None, player.team if 'player' in globals() else None)

    # Nastavení počátečních pozic
    $ set_initial_positions(red_team, blue_team)

    # Zobrazení herní obrazovky bez puku a bez spuštění hry
    show screen hockey_simulation_static

    # Přidání odpočítávání
    $ add_countdown_to_screen()

    # Vytvoření puku po dokončení odpočítávání
    $ puck = Puck(940, 550, 20)

    # Skrytí statické obrazovky a zobrazení aktivní herní obrazovky
    hide screen hockey_simulation_static
    show screen hockey_simulation

    # Hlavní herní smyčka
    while not game_timer.is_time_up():
        $ renpy.pause(1.0 / 120.0, hard=True)

    "Konec hry! Konečné skóre: [left_goal.score] - [right_goal.score]"
    return