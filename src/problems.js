export const problems = [
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
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "easy",
    language: "javascript",
    description: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.",
    code: `function isValid(s) {
    const stack = [];
    const map = {
        ")": "(",
        "}": "{",
        "]": "["
    };
    for (let char of s) {
        if (char in map) {
            if (stack.pop() !== map[char]) {
                return false;
            }
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}`
  },
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "easy",
    language: "javascript",
    description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.",
    code: `function search(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2);
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    language: "javascript",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    code: `function lengthOfLongestSubstring(s) {
    let maxLength = 0;
    let start = 0;
    const seen = new Map();
    for (let end = 0; end < s.length; end++) {
        const char = s[end];
        if (seen.has(char) && seen.get(char) >= start) {
            start = seen.get(char) + 1;
        }
        seen.set(char, end);
        maxLength = Math.max(maxLength, end - start + 1);
    }
    return maxLength;
}`
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "medium",
    language: "javascript",
    description: "You are given an integer array `height` of length `n`. Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    code: `function maxArea(height) {
    let maxWater = 0;
    let left = 0;
    let right = height.length - 1;
    while (left < right) {
        const width = right - left;
        const currentHeight = Math.min(height[left], height[right]);
        maxWater = Math.max(maxWater, width * currentHeight);
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
}`
  },
  {
    id: "lru-cache",
    title: "LRU Cache",
    difficulty: "hard",
    language: "javascript",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    code: `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }
    get(key) {
        if (!this.cache.has(key)) return -1;
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }
    put(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        this.cache.set(key, value);
        if (this.cache.size > this.capacity) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
}`
  }
];
