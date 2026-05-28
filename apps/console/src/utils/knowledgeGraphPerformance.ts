export interface KnowledgeGraphPerformanceInput {
  nodes: number;
  edges: number;
}

export type KnowledgeGraphLabelVisibility = "always" | "interaction-hidden";
export type KnowledgeGraphLayoutQuality = "full" | "balanced" | "fast";

export interface KnowledgeGraphRenderBudget {
  labelVisibility: KnowledgeGraphLabelVisibility;
  edgeOpacityOnMove: number;
  layoutQuality: KnowledgeGraphLayoutQuality;
  maxRenderedNodes: number;
}

export interface KnowledgeGraphPerformanceMode {
  large: boolean;
  dense: boolean;
  hideLabelsOnMove: boolean;
  softenEdgesOnMove: boolean;
  renderBudget: KnowledgeGraphRenderBudget;
}

export function getKnowledgeGraphPerformanceMode(input: KnowledgeGraphPerformanceInput): KnowledgeGraphPerformanceMode {
  const large = input.nodes >= 80;
  const dense = input.edges >= 150 || input.edges / Math.max(input.nodes, 1) >= 2.8;
  const veryHeavy = input.nodes >= 500 || input.edges >= 1000;
  const constrained = large || dense;

  const renderBudget: KnowledgeGraphRenderBudget = veryHeavy
    ? {
        labelVisibility: "interaction-hidden",
        edgeOpacityOnMove: 0.05,
        layoutQuality: "fast",
        maxRenderedNodes: 320,
      }
    : constrained
      ? {
          labelVisibility: "interaction-hidden",
          edgeOpacityOnMove: 0.08,
          layoutQuality: "balanced",
          maxRenderedNodes: 420,
        }
      : {
          labelVisibility: "always",
          edgeOpacityOnMove: 0.5,
          layoutQuality: "full",
          maxRenderedNodes: 500,
        };

  return {
    large,
    dense,
    hideLabelsOnMove: renderBudget.labelVisibility === "interaction-hidden",
    softenEdgesOnMove: constrained,
    renderBudget,
  };
}
