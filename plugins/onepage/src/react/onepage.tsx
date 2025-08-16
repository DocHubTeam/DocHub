/**************************************************************************************
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/
                            Author: Roman Piontik 
                            E-mail: R.Piontik@mail.ru
                            Project: https://dochub.info
**************************************************************************************/

import React from 'react';
import { SmartAntsNodeCollection } from '../interfaces/smartants';
import { useCallback, useLayoutEffect, useState } from 'react';

import {
  Node,
  ReactFlow,
  useReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { LayoutELK } from '../layouts/elk';
import { Layout, LayoutNode } from '../interfaces/layouts';

const layout: Layout  = new LayoutELK();

// КОнвертирование SmartAnts описаний нод в Reactflow
function convertNodes(nodes: SmartAntsNodeCollection[]): LayoutNode[] {
  return Object.entries(nodes).map(([id, data]) => (
    {
      id,
      data: {
        ...data,
        label: data.title
      }
    }
  ));
}

const Diagram = (props) => {
  const draftNodes: Node[] = convertNodes(props.data.nodes).map((node) => ({
    ...node,
    position: node.position || { x: 0, y: 0}, 
    hidden: true  // Прячем ноды для пользователя на время построения layout
  }));
  const [nodes, setNodes, onNodesChange] = useNodesState(draftNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { getNodes, fitView } = useReactFlow();
  // Признак готового layout
  const [layouted, setLayouted] = useState(false);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onLayout = useCallback(() => {
      if (layouted) return; // Если layout уже готов, повторно не перестраиваем
      const ready = getNodes().every((n) => n.width && n.height);
      if (!ready) return; // размеры ещё не готовы → ждём следующего рендера
      layout.build(nodes, []).then((result) => {
        setNodes((nds) =>
          nds.map((n) => {
            const node = result.nodes.find((item) => item.id === n.id);
            return node 
              ? {
                ...n,
                position: node.position,
                hidden: false
              }: node;
          })
        );
        setLayouted(true);
      });
    }
    , [ edges, getNodes, setNodes ]
  );

  useLayoutEffect(() => onLayout(), []);

  return (
    <ReactFlowProvider
      children={
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      }
    />
  );
};


export const Onepage = (props) => {
  return (
    <ReactFlowProvider children={
      <Diagram {...props} />
    }/>
  );
};

