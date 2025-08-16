import { Layout, LayoutGraph } from '../interfaces/layouts';
import { ELK, ElkNode } from 'elkjs/lib/elk.bundled.js';
import ELKConstructor from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';


export const OptionsDefault = {
    'elk.algorithm': 'layered',
    'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    'elk.spacing.nodeNode': '80'
};



export class LayoutELK implements Layout {
    private elk: ELK;
    constructor() {
        this.elk = new ELKConstructor();
    }
    async build(nodes: Node[], edges: Edge[], config?: any): Promise<LayoutGraph> {
        const options = {
            ...OptionsDefault,
            ...(config || {})
        };
        const isHorizontal = options['elk.direction'] === 'RIGHT';
        const graph: ElkNode = {
            id: 'root',
            layoutOptions: OptionsDefault,
            children: nodes.map((node) => ({
                ...node,
                targetPosition: isHorizontal ? 'left' : 'top',
                sourcePosition: isHorizontal ? 'right' : 'bottom',
          
                // Тут нужно поменять на реальные размеры ноды
                width: 150,
                height: 50
            })),
            edges: edges as any
        };
        const layout = await this.elk.layout(graph);
        console.info('>>>>>>>>>>>> layout', graph);
        return {
            nodes: (layout.children || []).map((node) => ({
                ...node,
                data: node['data'] || {},
                position: { x: node.x, y: node.y}
            })),
            edges: []
        };
    }

}
