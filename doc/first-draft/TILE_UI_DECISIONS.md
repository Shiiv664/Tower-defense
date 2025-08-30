# Tile UI System - First Draft Decisions

## Overview

Designing the tile interaction system for hover, selection, and detail display across PC and mobile platforms.

## Core Interaction Design

### Hover System
- **PC**: Standard mouse hover with immediate feedback
- **Mobile**: Prolonged touch (500ms) triggers hover mode
- **Visual Feedback**: Intensity gradient highlighting - strongest on hovered tile, decreasing intensity on adjacent tiles
- **Cancellation**: Two-finger touch on mobile cancels hover without selection

### Selection System
- **PC**: Left mouse click on hovered tile
- **Mobile**: Release single finger after hover mode
- **Result**: Opens detail panel showing tile information (terrain, base, tower, enemies)
- **Panel Closing**: Click/tap outside panel to close

## Technology Stack

### Tile Detection
- **Three.js Raycasting**: Cast rays from camera through pointer position to detect tile intersections
- **Simple Approach**: Raycast against all tile meshes directly (no spatial partitioning initially)
- **Individual Meshes**: Each tile as separate mesh (not instanced) for easier hover state management

### UI Framework
- **HTML/CSS Overlay**: Detail panel as HTML positioned over Three.js canvas
- **Single Responsive View**: One UI that adapts across all devices rather than separate mobile/desktop versions
- **Fixed Positioning**: Panel uses consistent fixed positioning on all platforms for uniform experience
- **Layout Flexibility**: CSS-only changes enable easy repositioning adjustments based on user testing
- **Framework**: Standard web technologies (HTML/CSS/JS) for maximum compatibility with PWA

### Cross-Platform Handling
- **Event System**: Unified pointer event handling for mouse and touch
- **Consistent Layout**: Fixed panel positioning maintains same visual experience across devices
- **Touch Optimization**: Proper touch target sizes and gesture recognition

## Architectural Integration

### ECS Components
- **TileRaycastComponent**: Mesh references for raycasting
- **HoverComponent**: Track hover state and intensity values
- **SelectionComponent**: Manage selected tile and panel state
- **TouchInteractionComponent**: Handle touch timing and gesture state

### Systems
- **TileSelectionSystem**: Handle raycasting and coordinate conversion
- **GameUISystem**: Manage HTML overlay positioning and visibility
- **HighlightRenderingSystem**: Update tile visual effects in Three.js

## Key Design Decisions

1. **Start Simple**: Individual meshes and basic raycasting - optimize later if needed
2. **Hybrid UI**: Three.js for 3D rendering, HTML/CSS for UI panels - best of both worlds
3. **Mobile-First**: Touch interactions designed first, mouse as enhancement
4. **PWA Compatible**: All technologies chosen support PWA deployment and app store distribution

## Future Extensions

- Action buttons in detail panel (buy/upgrade/sell)
- Performance optimizations if needed (spatial partitioning, instancing)