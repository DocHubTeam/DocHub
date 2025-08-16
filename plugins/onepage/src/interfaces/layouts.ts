import { Node, Edge, XYPosition } from '@xyflow/react';

export interface LayoutNodeData {
    [id: string]: any;
}

export interface LayoutNode {
    id: string;
    data: LayoutNodeData;
    position?: XYPosition;
}

export interface LayoutGraph {
    nodes: Node[];
    edges: Edge[];
}

export interface Layout {
    // Строит макет диаграммы
    build(nodes: LayoutNode[], edges: Edge[], config?: any): Promise<LayoutGraph>;
}

