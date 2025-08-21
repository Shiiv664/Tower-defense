# Deterministic Architecture for Tower Defense

## Overview
This document outlines the deterministic systems that enable replay functionality, spectating, and score validation for the tower defense game. All randomization is seed-based to ensure reproducible gameplay across different platforms and sessions.

## Core Principles

### 1. Deterministic Randomization
- All random events use seeded pseudo-random number generators (PRNG)
- No use of `Math.random()`, `Date.now()`, or other non-deterministic sources
- Game seed determines all random outcomes for the entire session

### 2. Frame-Based Timing
- Game logic operates on fixed frame steps, not real-time
- All timing calculations use frame counters instead of timestamps
- Consistent behavior regardless of actual frame rate or device performance

### 3. Ordered Processing
- Systems execute in deterministic order every frame
- Entity processing follows consistent iteration patterns
- Event handling maintains strict ordering

## Seeded Random Number Generation

### SeededRNG Class
```typescript
class SeededRNG {
  private seed: number;
  private state: number;
  
  constructor(seed: number) {
    this.seed = seed;
    this.state = seed;
  }
  
  // Linear Congruential Generator (LCG) for deterministic randomization
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.state / Math.pow(2, 32);
  }
  
  // Generate random integer in range [min, max)
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
  
  // Generate random boolean with given probability
  boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
  
  // Get current seed for save/restore
  getSeed(): number {
    return this.seed;
  }
  
  // Get current state for debugging
  getState(): number {
    return this.state;
  }
}
```

### Global RNG Management
```typescript
class GameRNG {
  private static rng: SeededRNG;
  
  static initialize(gameSeed: number) {
    this.rng = new SeededRNG(gameSeed);
  }
  
  static next(): number {
    return this.rng.next();
  }
  
  static range(min: number, max: number): number {
    return this.rng.range(min, max);
  }
  
  static boolean(probability: number = 0.5): boolean {
    return this.rng.boolean(probability);
  }
  
  static getSeed(): number {
    return this.rng.getSeed();
  }
}
```

## Frame-Based Timing System

### GameClock Class
```typescript
class GameClock {
  private frameCount: number = 0;
  private targetFPS: number = 60;
  private msPerFrame: number = 1000 / 60;
  
  // Advance game time by one frame
  tick(): void {
    this.frameCount++;
  }
  
  // Get current game time in frames
  getFrames(): number {
    return this.frameCount;
  }
  
  // Convert frames to milliseconds for compatibility
  getTimeMs(): number {
    return this.frameCount * this.msPerFrame;
  }
  
  // Get delta time for current frame (always consistent)
  getDeltaTime(): number {
    return this.msPerFrame / 1000; // Convert to seconds
  }
  
  // Check if enough frames have passed for an event
  hasElapsed(startFrame: number, durationFrames: number): boolean {
    return this.frameCount >= startFrame + durationFrames;
  }
}
```

## Replay System Architecture

### Game State Recording
```typescript
interface GameStateSnapshot {
  frame: number;
  entities: EntitySnapshot[];
  gameEvents: GameEvent[];
  checksum: string;
}

interface EntitySnapshot {
  id: string;
  components: Record<string, any>;
}

interface GameEvent {
  type: string;
  frame: number;
  data: any;
  entityId?: string;
}

class ReplayRecorder {
  private events: GameEvent[] = [];
  private snapshots: GameStateSnapshot[] = [];
  private snapshotInterval: number = 300; // Every 5 seconds at 60fps
  
  recordEvent(event: GameEvent): void {
    event.frame = GameClock.instance.getFrames();
    this.events.push(event);
  }
  
  shouldTakeSnapshot(): boolean {
    const currentFrame = GameClock.instance.getFrames();
    return currentFrame % this.snapshotInterval === 0;
  }
  
  takeSnapshot(entityManager: EntityManager): void {
    const snapshot: GameStateSnapshot = {
      frame: GameClock.instance.getFrames(),
      entities: this.captureEntityState(entityManager),
      gameEvents: [...this.events],
      checksum: this.generateChecksum()
    };
    this.snapshots.push(snapshot);
  }
}
```

### Replay Playback
```typescript
class ReplayPlayer {
  private replayData: ReplayData;
  private currentFrame: number = 0;
  private eventIndex: number = 0;
  
  constructor(replayData: ReplayData) {
    this.replayData = replayData;
    this.validateReplay();
  }
  
  step(entityManager: EntityManager): void {
    // Process events for current frame
    while (this.eventIndex < this.replayData.events.length) {
      const event = this.replayData.events[this.eventIndex];
      if (event.frame > this.currentFrame) break;
      
      this.processEvent(event, entityManager);
      this.eventIndex++;
    }
    
    this.currentFrame++;
  }
  
  validateReplay(): boolean {
    // Verify checksums and data integrity
    for (const snapshot of this.replayData.snapshots) {
      const expectedChecksum = this.calculateChecksum(snapshot);
      if (snapshot.checksum !== expectedChecksum) {
        throw new Error(`Replay validation failed at frame ${snapshot.frame}`);
      }
    }
    return true;
  }
}
```

## Score Validation System

### Cryptographic Verification
```typescript
class ScoreValidator {
  private static readonly SALT = "tower_defense_2024";
  
  static generateGameHash(
    seed: number,
    finalScore: number,
    completionFrame: number,
    keyEvents: GameEvent[]
  ): string {
    const data = {
      seed,
      finalScore,
      completionFrame,
      eventHashes: keyEvents.map(e => this.hashEvent(e))
    };
    
    return this.sha256(JSON.stringify(data) + this.SALT);
  }
  
  static validateScore(
    replayData: ReplayData,
    claimedScore: number
  ): ValidationResult {
    try {
      // Replay the game with deterministic systems
      const simulator = new GameSimulator(replayData.seed);
      const result = simulator.simulate(replayData.events);
      
      return {
        isValid: result.finalScore === claimedScore,
        actualScore: result.finalScore,
        claimedScore,
        confidence: this.calculateConfidence(replayData)
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        confidence: 0
      };
    }
  }
}
```

## ECS Integration

### Deterministic Components
```typescript
interface DeterministicTimingComponent {
  startFrame: number;
  durationFrames: number;
  lastTriggerFrame: number;
}

interface ReplayComponent {
  recordEvents: boolean;
  criticalForValidation: boolean;
  eventTypes: string[];
}

interface ValidationComponent {
  checkpointInterval: number;
  lastCheckpointFrame: number;
  stateHash: string;
}
```

### Modified Systems for Determinism

#### Deterministic Attack System
```typescript
class DeterministicAttackSystem implements System {
  update(entities: EntityManager, deltaTime: number): void {
    const attackers = entities.withComponents(['Position', 'Attack', 'DeterministicTiming']);
    
    for (const attacker of attackers) {
      const attack = attacker.Attack;
      const timing = attacker.DeterministicTiming;
      const currentFrame = GameClock.instance.getFrames();
      
      // Use frame-based timing instead of Date.now()
      const framesSinceLastAttack = currentFrame - timing.lastTriggerFrame;
      const cooldownFrames = Math.floor(attack.cooldown / GameClock.instance.getDeltaTime() / 1000 * 60);
      
      if (framesSinceLastAttack >= cooldownFrames) {
        const target = this.findTarget(attacker, entities);
        if (target) {
          this.createProjectile(attacker, target);
          timing.lastTriggerFrame = currentFrame;
          
          // Record event for replay
          ReplayRecorder.instance.recordEvent({
            type: 'tower_attack',
            entityId: attacker.id,
            data: { targetId: target.id, frame: currentFrame }
          });
        }
      }
    }
  }
}
```

## Data Storage Format

### Compact Replay Format
```typescript
interface ReplayData {
  version: string;
  seed: number;
  playerInfo: PlayerInfo;
  gameSettings: GameSettings;
  events: GameEvent[];
  snapshots: GameStateSnapshot[];
  metadata: ReplayMetadata;
  signature: string;
}

interface ReplayMetadata {
  duration: number;
  finalScore: number;
  completionStatus: 'victory' | 'defeat' | 'abandoned';
  gameVersion: string;
  recordedAt: string;
  platform: string;
}
```

### Cloud Storage Schema
```typescript
interface LeaderboardEntry {
  playerId: string;
  score: number;
  seed: number;
  gameHash: string;
  replayDataUrl: string;
  validationStatus: 'pending' | 'verified' | 'invalid';
  submittedAt: Date;
  gameMode: string;
  difficulty: number;
}
```

## Performance Considerations

### Efficient State Capture
- Only record entity changes, not full state every frame
- Use delta compression for snapshots
- Limit snapshot frequency to balance accuracy vs. size
- Compress replay data before cloud storage

### Memory Management
```typescript
class ReplayBuffer {
  private maxEvents: number = 10000;
  private events: GameEvent[] = [];
  
  addEvent(event: GameEvent): void {
    this.events.push(event);
    
    // Prevent memory bloat during long games
    if (this.events.length > this.maxEvents) {
      // Remove oldest non-critical events
      this.events = this.events.filter(e => 
        e.frame > GameClock.instance.getFrames() - 1800 || // Keep last 30 seconds
        this.isCriticalEvent(e) // Always keep critical events
      );
    }
  }
}
```

## Anti-Cheat Measures

### Input Validation
- All player inputs are validated before processing
- Impossible inputs (e.g., placing towers too fast) are rejected
- Input timing must follow human-possible patterns

### State Verification
- Periodic checksum validation during gameplay
- Cross-reference with expected game state progressions
- Flag suspicious score improvements

### Replay Analysis
```typescript
class AntiCheat {
  static analyzeReplay(replayData: ReplayData): CheatDetectionResult {
    const flags: string[] = [];
    
    // Check for impossible reaction times
    if (this.hasSuperhuman Reactions(replayData.events)) {
      flags.push('impossible_reaction_time');
    }
    
    // Check for perfect decision making
    if (this.hasPerfectStrategy(replayData.events)) {
      flags.push('too_perfect_strategy');
    }
    
    // Check for score/performance inconsistencies
    if (this.hasScoreInconsistencies(replayData)) {
      flags.push('score_inconsistency');
    }
    
    return {
      suspiciousActivity: flags.length > 0,
      flags,
      confidence: this.calculateSuspicionLevel(flags)
    };
  }
}
```

## Benefits

### For Players
- **Replay System**: Learn from mistakes and share epic moments
- **Spectating**: Watch how top players achieve high scores
- **Tournament Mode**: Fair competition with validated results

### For Developers
- **Bug Reproduction**: Exact reproduction of reported issues
- **Balance Testing**: Analyze successful strategies from replays
- **Cheat Detection**: Automated validation of suspicious scores

### For Community
- **Educational Content**: Strategy guides with replay demonstrations
- **Competitive Scene**: Tournaments with verified results
- **Content Creation**: Streamers can showcase interesting replays

This deterministic architecture ensures that every game can be perfectly reproduced, enabling rich replay features while maintaining competitive integrity through robust validation systems.