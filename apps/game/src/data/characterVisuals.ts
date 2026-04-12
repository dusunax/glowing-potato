import type { AnimalSpriteSource } from '../types/animal';

// GIF-driven monster assets
import skeletonSprite from '../assets/characters/animations/Decrepit Bones/DecrepitBones.gif';
import bloodSkeletonSprite from '../assets/characters/animations/Grave Revenant/GraveRevenant.gif';
import stoneCrawlerSprite from '../assets/characters/animations/Unraveling Crawler/UnravelingCrawler.gif';
import rockCrawlerSprite from '../assets/characters/animations/Dismembered Crawler/DismemberedCrawler.gif';
import wolfSprite from '../assets/characters/animations/Stinky Skunk/StinkySkunk.gif';
import boarSprite from '../assets/characters/animations/Mad Boar/MadBoar.gif';
import deerSprite from '../assets/characters/animations/Leaping Frog/LeapingFrog.gif';
import rabbitSprite from '../assets/characters/animations/Clucking Chicken/CluckingChicken.gif';
import foxSprite from '../assets/characters/animations/Slow Turtle/SlowTurtle.gif';
import owlSprite from '../assets/characters/animations/Coral Crab/CoralCrab.gif';
import bearSprite from '../assets/characters/animations/Toxic Hound/ToxicHound.gif';

export const ANIMAL_VISUALS = {
  deer: { kind: 'gif', src: deerSprite },
  rabbit: { kind: 'gif', src: rabbitSprite },
  fox: { kind: 'gif', src: foxSprite },
  owl: { kind: 'gif', src: owlSprite },
  wildBoar: { kind: 'gif', src: boarSprite },
  wolf: { kind: 'gif', src: wolfSprite },
  bear: { kind: 'gif', src: bearSprite },
  stoneCrawler: { kind: 'gif', src: stoneCrawlerSprite },
  rockCrawler: { kind: 'gif', src: rockCrawlerSprite },
  skeleton: { kind: 'gif', src: skeletonSprite },
  bloodSkeleton: { kind: 'gif', src: bloodSkeletonSprite },
} satisfies Record<string, AnimalSpriteSource>;
