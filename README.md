# leet-type

*Master code syntax at terminal speed. A Monkeytype + LeetCode Hybrid Prototype.*

`leet-type` is a web-based coding typing application designed for developers who want to improve their typing accuracy, speed, and muscle memory for structured programming syntax. Instead of typing plain text or random sentences, users type pre-written code solutions to algorithmic and software engineering problems (inspired by LeetCode).

---

## Concept

Traditional typing tests don't reflect real-world programming habits such as typing brackets, indentation, symbols, and operators. This website aims to help train both your hands and your brain by making you type coding solutions to programming problems.

With this platform, you can improve your code typing speed, build familiarity with common coding patterns, and become more comfortable writing code under pressure :). And who knows, maybe it'll help you impress your interviewer and land your dream job in tech (I hope).

---

## Key Features

1. **Challenge Library & Filter Board**:
   * Browse a list of classic algorithmic tasks.
   * Search through challenges in real time or filter them by difficulty level (`Easy`, `Medium`, `Hard`).
2. **Interactive Code Editor Terminal**:
   * Real-time custom syntax tokenizer matching keywords, strings, built-ins, and operators.
   * Live cursor/caret position tracking with dynamic scroll adjustment.
   * Focus tracking overlay to pause and resume the typing session seamlessly.
3. **Typing Engine & Metrics**:
   * **Net WPM (Words Per Minute)**: Calculates speed based on correct non-indent characters.
   * **Accuracy (%)**: Real-time accuracy calculated against total keystrokes.
   * **Live Timer**: Tracks elapsed time in seconds.
   * **Mistake Counter**: Tallies total incorrect keystrokes.

---

## Project Structure

```text
leet-type/
├── index.html            # Main markup and UI grid structure
├── package.json          # Node configuration & scripts (Vite-based)
├── package-lock.json     # Package lockfile
└── src/
    ├── main.js           # Core state management, typing logic, and event routing
    ├── problems.js       # Predefined LeetCode problem dataset and solutions
    ├── style.css         # Custom Cyber-Dark Design System & theme styling
    └── assets/           # Client-side static assets
```

---

## Technology Stack

* **Frontend Build Tool**: [Vite](https://vite.dev) (v8.x)
* **Logic & Engine**: Vanilla JavaScript (ES6 Modules)
* **Styling**: Vanilla CSS3

---

## Development Setup

Ensure you have [Node.js](https://nodejs.org) installed on your system.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Once run, click on the local link provided by Vite (e.g., `http://localhost:5173`) to view the application in your browser.

### 3. Build for Production
To generate a production-ready package:
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

---

## Problem Schema

Each problem in `src/problems.js` follows a structured format, enabling seamless parsing by the editor engine:

```javascript
{
  id: "two-sum",
  title: "Two Sum",
  difficulty: "easy",
  language: "javascript",
  description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
  code: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`
}
```

---


## Future updates planned for `leet-type`
- [ ] **Multi-language selection**: Python, C++, Java, Rust, and Go support.
- [ ] **Multi-step Typing Mode**: Typable code blocks chunked into incremental functions or classes.
- [ ] **Accounts & Statistics**: Session logs, long-term metric monitoring (WPM evolution, key mistake heatmaps).
- [ ] **Code Runner integration**: Executing the completed code block against a test suite to prove correctness.
- [ ] **Competitive Play**: Real-time multiplayer typing duels.
