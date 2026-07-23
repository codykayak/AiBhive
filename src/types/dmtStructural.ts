/** Typed models for DMT structural decoder API responses. */

export interface StructuralFeatures {
  symmetry_score: number;
  junction_count: number;
  stroke_complexity: number;
  path_count: number;
  total_path_length: number;
  bbox_aspect: number;
  radial_variance: number;
}

export interface TokenAssignment {
  symbol_id: string;
  token_id: string;
  cluster_id: number;
  cluster_label: string;
  umap_x: number;
  umap_y: number;
}

export interface SyntaxAnalysis {
  tokenSequence: string[];
  shannonEntropy: number;
  bigramMatrix: Record<string, Record<string, number>>;
  trigramCounts: Record<string, number>;
  spatialGraph: {
    nodes: Array<{ id: string; tokenId: string; x: number; y: number }>;
    edges: Array<{ source: string; target: string; relation: string; distance: number }>;
    layoutType: string;
    nodeCount: number;
    edgeCount: number;
  };
}

export interface StructuralMatch {
  symbolId: string;
  tokenId: string;
  confidence: number;
  chamferDistance: number;
  featureDistance: number;
  attributions: StructuralFeatures & Record<string, unknown>;
  method: 'structural';
}

export interface StructuralCatalog {
  version: string;
  pipeline: 'structural';
  glyphCount: number;
  tokens: TokenAssignment[];
  tokenIndex: Record<string, string>;
  clustering: { method: string; clusterCount: number };
}
