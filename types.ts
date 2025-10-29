// Fix: Added type definitions for GearItem, TagNode, TagHierarchy, View, and ModalState
export interface GearItem {
  id: string;
  name: string;
  brand: string;
  weight: number;
  notes: string;
  tt: string; // Top Tag
  mt: string; // Middle Tag
  bt: string; // Base Tag
}

export interface TagNode {
  name: string;
  color: string;
  emoji: string;
  children: { [key: string]: TagNode };
}

export interface TagHierarchy {
  [key: string]: TagNode;
}

export type View = 'edit' | 'view' | 'pack';

export type ModalType = 'editItem' | 'editTag' | 'delete';

export interface ModalState {
  type: ModalType | null;
  data: any;
}

export type TagPath = [string] | [string, string] | [string, string, string];

export interface BrandInfo {
    name: string;
    domain: string;
    logoFilename?: string;
}

export interface DistributionNode {
  tag: string;
  weight: number;
  percentage: number;
  children?: DistributionNode[];
}

export interface PackAnalysis {
  totalWeight: number;
  distribution: DistributionNode[];
}