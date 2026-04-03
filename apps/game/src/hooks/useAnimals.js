// Hook managing wild animals: state, AI movement, and combat.
import { useState, useCallback, useRef } from 'react';
import { createInitialAnimals, spawnNewWave } from '../data/animals';
import { getMazeNeighbors, MAP_COLS, MAP_ROWS } from '../data/map';
import { tileKey } from './useMap';
const PLAYER_ATTACK_DAMAGE = 3;
/** BFS shortest path from `from` to `to` through the maze. Returns next step or null. */
function nextStepToward(from, to) {
    if (from.x === to.x && from.y === to.y)
        return null;
    const queue = [
        { pos: from, path: [] },
    ];
    const seen = new Set([tileKey(from.x, from.y)]);
    while (queue.length > 0) {
        const { pos, path } = queue.shift();
        for (const nb of getMazeNeighbors(pos.x, pos.y)) {
            const k = tileKey(nb.x, nb.y);
            if (seen.has(k))
                continue;
            seen.add(k);
            const newPath = [...path, nb];
            if (nb.x === to.x && nb.y === to.y) {
                return newPath[0] ?? null; // first step toward target
            }
            queue.push({ pos: nb, path: newPath });
        }
    }
    return null; // unreachable
}
/** Returns a random adjacent tile (via maze passages). Falls back to current if no exits. */
function randomStep(pos) {
    const neighbors = getMazeNeighbors(pos.x, pos.y);
    if (neighbors.length === 0)
        return pos;
    return neighbors[Math.floor(Math.random() * neighbors.length)];
}
/** Move one step away from the player. */
function stepAwayFrom(pos, player) {
    const neighbors = getMazeNeighbors(pos.x, pos.y);
    if (neighbors.length === 0)
        return pos;
    const farthest = neighbors.reduce((best, nb) => {
        const bestDist = Math.abs(best.x - player.x) + Math.abs(best.y - player.y);
        const nbDist = Math.abs(nb.x - player.x) + Math.abs(nb.y - player.y);
        return nbDist > bestDist ? nb : best;
    });
    return farthest;
}
export function useAnimals() {
    const animalsRef = useRef([]);
    const [animals, setAnimals] = useState(() => {
        const initial = createInitialAnimals();
        animalsRef.current = initial;
        return initial;
    });
    /** Move all alive animals one step (called when the player moves). */
    const moveAnimals = useCallback((playerPosition) => {
        const current = animalsRef.current;
        const moved = current.map((a) => {
            if (!a.alive)
                return a;
            let next;
            if (a.behavior === 'hostile') {
                const step = nextStepToward(a.position, playerPosition);
                next = step ?? a.position;
            }
            else {
                const px = Math.abs(a.position.x - playerPosition.x);
                const py = Math.abs(a.position.y - playerPosition.y);
                if (px + py <= 1) {
                    next = stepAwayFrom(a.position, playerPosition);
                }
                else {
                    next = Math.random() < 0.4 ? randomStep(a.position) : a.position;
                }
            }
            if (next.x === playerPosition.x && next.y === playerPosition.y) {
                next = a.position;
            }
            return { ...a, position: next };
        });
        const nextAnimals = moved.every((a) => !a.alive) ? spawnNewWave() : moved;
        animalsRef.current = nextAnimals;
        setAnimals(nextAnimals);
        return nextAnimals;
    }, []);
    /** Spawn a cave wave on schedule (1–2 new animals in cave tiles). */
    const spawnCaveWave = useCallback(() => {
        const current = animalsRef.current;
        const spawnFromCave = spawnNewWave();
        const nextAnimals = current.every((a) => !a.alive)
            ? spawnFromCave
            : [...current.filter((a) => a.alive), ...spawnFromCave];
        animalsRef.current = nextAnimals;
        setAnimals(nextAnimals);
        return nextAnimals;
    }, []);
    /** Player attacks an animal by id. Returns event message. */
    const attackAnimal = useCallback((animalId) => {
        const target = animalsRef.current.find((a) => a.id === animalId && a.alive);
        if (!target) {
            return {
                message: '',
                defeated: false,
                hit: false,
                animalId,
                animalName: '',
                animalEmoji: '',
                experience: 0,
            };
        }
        const nextHp = target.hp - PLAYER_ATTACK_DAMAGE;
        const nextAlive = nextHp > 0;
        const message = nextAlive
            ? `You hit ${target.name} ${target.emoji} for ${PLAYER_ATTACK_DAMAGE} damage! (${nextHp}/${target.maxHp} HP)`
            : `You defeated the ${target.name} ${target.emoji}!`;
        const updated = animalsRef.current.map((a) => {
            if (a.id !== animalId || !a.alive)
                return a;
            return { ...a, hp: Math.max(nextHp, 0), alive: nextAlive };
        });
        const nextAnimals = updated.every((a) => !a.alive) ? spawnNewWave() : updated;
        animalsRef.current = nextAnimals;
        setAnimals(nextAnimals);
        return {
            message,
            defeated: !nextAlive,
            hit: true,
            animalId,
            animalName: target.name,
            animalEmoji: target.emoji,
            experience: Math.max(1, target.maxHp),
        };
    }, []);
    /** Returns all alive animals at the given tile. */
    const getAnimalsAt = useCallback((x, y) => animalsRef.current.filter((a) => a.alive && a.position.x === x && a.position.y === y), []);
    /** Returns alive hostile animals that are directly adjacent to the player (maze neighbours). */
    const getAdjacentHostile = useCallback((playerPos) => {
        return animalsRef.current.filter((a) => {
            if (!a.alive || a.behavior !== 'hostile')
                return false;
            const px = Math.abs(a.position.x - playerPos.x);
            const py = Math.abs(a.position.y - playerPos.y);
            return px + py === 1; // Orthogonal only (cardinal direction)
        });
    }, []);
    /** Returns ALL alive animals directly around the player (orthogonal + diagonal). */
    const getAdjacentAnimals = useCallback((playerPos) => {
        return animalsRef.current.filter((a) => {
            if (!a.alive)
                return false;
            const px = Math.abs(a.position.x - playerPos.x);
            const py = Math.abs(a.position.y - playerPos.y);
            return px <= 1 && py <= 1 && (px + py > 0);
        });
    }, []);
    return {
        animals,
        moveAnimals,
        spawnCaveWave,
        attackAnimal,
        getAnimalsAt,
        getAdjacentHostile,
        getAdjacentAnimals,
    };
}
// Re-export to avoid importing from useMap in consumers
export { MAP_COLS, MAP_ROWS };
