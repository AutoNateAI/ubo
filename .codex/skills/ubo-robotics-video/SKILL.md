# UBO Robotics Video Skill

Use this skill when creating UBO robotics lessons, electronics tutorials, simulator walkthroughs, firmware explanations, or video-ready learning packages for the UBO portal.

This skill is adapted from the sibling `electro-lab` skill and tuned for the UBO robotics simulator flow.

## Workflow

1. Start from a tutorial folder under `tutorials/NNN-name`.
2. Keep the lesson package self-contained:
   - `README.md` for the learner-facing tutorial
   - `outline.md` for lesson beats
   - `voiceover.md` for narration
   - `take-notes.md` for recording notes, mistakes, retakes, and timestamps
   - optional `firmware/`, `assets/`, `exports/`, or `screenshots/` folders
3. For every electronics/simulator lesson, capture:
   - learning goal
   - parts list
   - wiring table
   - pin map
   - expected behavior
   - test procedure
   - debugging notes
   - simulation/game-logic connection
   - recording outline
4. Prefer simple, observable tests first:
   - LED state
   - motor direction
   - PWM speed change
   - serial output
   - sensor threshold
   - simulated car movement
5. When generating firmware, include pin mappings and serial diagnostics.
6. When creating simulator lessons, explain the bridge from hardware signal to game state.
7. When preparing recording material, write voice-over notes that explain decisions, not just steps.

## Video Package Standard

A tutorial should be reusable as:

- a markdown lesson
- a live simulator walkthrough
- a short YouTube-style teaching video
- a future scripted render or recorded screen capture

Every package should answer:

- What are we building?
- Why does the circuit need to be wired this way?
- What does the code control?
- What should the simulator do?
- How do we debug it when it does not work?
- What did this teach us about robotics or game simulation logic?

## Recording Workflow

Use each tutorial as a lesson package:

1. Define the question: what robot behavior are we trying to understand?
2. Show the wiring or schematic before running anything.
3. Add code and narrate how it maps to pins.
4. Run the simulation and narrate expected vs actual behavior.
5. Pause on failures and explain the debugging path.
6. Save final code, simulator evidence, and voice-over notes in the tutorial folder.

Suggested recording assets:

- `outline.md`: lesson beats
- `voiceover.md`: final narration script
- `take-notes.md`: mistakes, retakes, and timestamps
- `screenshots/`: still frames for thumbnails or overlays
- `exports/`: simulator exports

## YouTube/External Publishing Rule

Prepare scripts, descriptions, titles, chapters, thumbnails, and upload metadata in the repo. Do not publish, upload, send, or modify external YouTube content unless the user explicitly approves the exact action and destination immediately before the tool/API call.

## Output Standard

Each tutorial should be understandable after a month away from the project. A future reader should be able to open the folder, know what to run, know what should happen, know how it connects to real electronics, and know what was learned.
