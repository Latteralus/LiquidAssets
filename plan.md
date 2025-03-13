Prompt: “Liquid Assets” Game Remake
Project Overview

Working Title: Liquid Assets
Inspiration: White Dolphin Bar (2005) by Maxima Games
Goal: Faithfully recreate the core simulation and spirit of the original game while adding minor modernizations.
Development Target: PC desktop application built with Electron.
Art/Interface: Top-down, 2D visuals reminiscent of early 2000s simulations, with primary interactions via text box input (menu-driven or typed commands).
Tone: Realistic, business-focused simulation.
Core Features & Requirements
Establishment Management

Players manage bars, nightclubs, fast-food joints, and restaurants across multiple European cities (London, Berlin, Paris, etc.).
Layout: Top-down floor plans displaying tables, counters, décor, etc., but kept minimal to allow for text-based navigation (e.g., clickable elements or text commands).
Minor Regional Differences: Slightly different regulations and tastes per city, but keep it manageable.
Staff & Customer AI

Staff: Each worker has unique skills, stats, and personalities (friendliness, efficiency, reliability, etc.).
Customer Behavior: Customers have preferences (food, drinks, music) and moods; they respond to venue atmosphere, pricing, marketing, and staff performance.
Minimal “drama” events or emergent narratives can occur, triggered by staff/customer interactions and random events.
Simulation Depth

Financials: Detailed tracking of income/expenses (rent, salaries, supplies, advertising, etc.).
Random Events: Economic shifts, local competition, staff emergencies—maintain variety and replayability.
Marketing: Advertising campaigns, special events, loyalty programs, and online ads.
Main Goal: Achieve profitability and survive market fluctuations without extensive story missions.
Interactions & Text-Driven UI

Primary Interaction Method: A text box for issuing commands or selecting options (e.g., type “Hire Bartender,” “Set Drink Price,” “View Staff,” etc.).
Additional UI elements can display summarized data (e.g., lists of staff, finance charts), but the user’s main input is through the text box.
Ensure text-based logs record significant events: staff changes, financial updates, customer feedback, and random events.
Single-Player Only

Solo gameplay focusing on strategy, resource management, and incremental growth.
Performance & Assets

Zero Budget: Only free-to-use images, sounds, and public-domain assets.
Favor minimal file size to reflect the original’s small footprint (3.1 MB), though some overhead is acceptable for modern functionality.
Language & Localization

English-only at launch; minimal text beyond essential menus, events, and tooltips.
Release Scope

Comprehensive Design: Deliver a fully playable simulation with staff hiring, budget management, marketing campaigns, and random events.
No partial prototypes; aim for a complete single-player experience that feels like a modern homage to the original.
Instructions to the AI
Design Documents & GDD

Outline all simulation systems in detail, focusing on text-based interactions.
Provide logic flowcharts or pseudo-code for text commands (e.g., input parsing, event triggers, data storage).
Technical Architecture

Propose an approach for an Electron-based application using a text-driven UI.
Suggest how to efficiently simulate complex events in JavaScript or TypeScript (e.g., game loop scheduling, data structures).
Asset & Resource Plan

Identify or recommend public-domain 2D assets (for minimal top-down visuals) and any ambient sound/music (royalty-free) for subtle atmosphere.
Summarize best practices for compressing and loading these assets in Electron.
Feature Roadmap

Outline essential features for an MVP (staff hiring/firing, customer flow, basic financials, random events).
Suggest possible expansions or polish features (decor customization, scenario-based modes, additional European cities).
Text-Box Interaction Examples

Provide sample command sets (e.g., hire staff, set drink price, view reports) and illustrate how the player receives feedback in a text log.
Show how random events or staff issues pop up in the text box for the player to address.
Modernization Touches

Include quality-of-life features like auto-complete or suggestion lists in the text box, tutorials, or tooltips.
Keep the retro-sim feel but ensure players have enough guidance to learn the system quickly.
Performance & File Size Strategy

Use SQLite with node and express where it makes sense.

Offer approaches to minimize overhead (e.g., modular code, lazy loading, minimal asset use).
Provide recommended compression formats or bundling strategies to maintain small file size for final distribution.
Example Prompt to Provide an AI
*“You are an AI game developer tasked with recreating Liquid Assets, a text-driven PC business simulation inspired by the 2005 game White Dolphin Bar. Build it in Electron with a top-down perspective and text box as the primary interaction method.

Focus on hiring staff, attracting customers, managing budgets, and running marketing campaigns, all while handling random events. Deliver a complete design document covering logic flows, data structures, UI mock-ups, and performance considerations, ensuring minimal file size and zero-budget asset usage.

Emphasize realistic financial management, staff personalities, and varied customer preferences. Incorporate mild modernization such as tutorials or auto-complete for the text-based commands, but keep the core simulation faithful to the original’s retro style.

End with a plan for distributing the game as a small Electron package. Provide steps for testing and ensuring stable performance, and highlight how to maintain a coherent user experience in a text-driven interface.*”

Note to AI !Important!: 
1. ALWAYS PRINT THE FULL FILE, NO SNIPPETS.
2. All code files must be UNDER 700 lines (If more, break into several files)