
import { GearItem, TagHierarchy } from '../types';

export const INITIAL_TAG_HIERARCHY: TagHierarchy = {
  "Shelter": {
    name: "Shelter",
    color: "#2980b9",
    emoji: "⛺️",
    children: {
      "Tent": { name: "Tent", color: '', emoji: '', children: { "2-Person Tent": { name: "2-Person Tent", color: '', emoji: '', children: {} } } },
      "Sleeping Bag": { name: "Sleeping Bag", color: '', emoji: '', children: { "3-Season Synthetic": { name: "3-Season Synthetic", color: '', emoji: '', children: {} } } },
    }
  },
  "Cookware": {
    name: "Cookware",
    color: "#e67e22",
    emoji: "🍳",
    children: {
      "Stove": { name: "Stove", color: '', emoji: '', children: { "Canister Stove": { name: "Canister Stove", color: '', emoji: '', children: {} } } },
    }
  },
  "Tools": {
    name: "Tools",
    color: "#c0392b",
    emoji: "🛠️",
    children: {
      "Knife": { name: "Knife", color: '', emoji: '', children: { "Multi-tool": { name: "Multi-tool", color: '', emoji: '', children: {} } } },
    }
  },
  "Tech": {
      name: "Tech",
      color: "#8e44ad",
      emoji: "🔋",
      children: {
        "Power": { name: "Power", color: '', emoji: '', children: { "Power Bank": { name: "Power Bank", color: '', emoji: '', children: {} } } },
      }
  }
};

export const INITIAL_GEAR_ITEMS: GearItem[] = [
  { id: "1", name: "Hubba Hubba NX", brand: "MSR", weight: 1720, notes: "Reliable 2-person tent.", tt: "Shelter", mt: "Tent", bt: "2-Person Tent" },
  { id: "2", name: "Cosmic 20", brand: "Kelty", weight: 1162, notes: "Good for 3-season use.", tt: "Shelter", mt: "Sleeping Bag", bt: "3-Season Synthetic" },
  { id: "3", name: "PocketRocket 2", brand: "MSR", weight: 73, notes: "Fast and lightweight stove.", tt: "Cookware", mt: "Stove", bt: "Canister Stove" },
  { id: "4", name: "Leatherman Signal", brand: "Leatherman", weight: 212, notes: "Contains all essential tools.", tt: "Tools", mt: "Knife", bt: "Multi-tool" },
  { id: "5", name: "PowerCore 10000", brand: "Anker", weight: 180, notes: "About 2-3 phone charges.", tt: "Tech", mt: "Power", bt: "Power Bank" },
];
