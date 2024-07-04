"use client";
import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    Controls,
    Background,
    applyEdgeChanges,
    applyNodeChanges,
    getBezierPath,
    EdgeText
} from 'reactflow';
import 'reactflow/dist/style.css';

const CustomNode = ({ data }) => (
    <div className={`p-4 rounded-lg border-2 ${data.active ? 'border-orange-500 bg-orange-100' : 'border-gray-300 bg-white'}`}>
        <h3 className="font-bold">{data.label}</h3>
    </div>
);

const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data
}) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <path
                id={id}
                className="react-flow__edge-path"
                d={edgePath}
                strokeWidth={2}
                stroke={data.active ? "#ff9900" : "#b1b1b7"}
            />
            {data.active && data.label && (
                <EdgeText
                    x={labelX}
                    y={labelY}
                    label={data.label}
                    labelStyle={{ fill: 'black', fontWeight: 700 }}
                    labelBgStyle={{ fill: 'rgba(255, 255, 255, 0.75)' }}
                    labelBgPadding={[2, 4]}
                    labelBgBorderRadius={4}
                />
            )}
        </>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

const edgeTypes = {
    custom: CustomEdge,
};

const AnimatedFlowChart = () => {
    const [currentStep, setCurrentStep] = useState(0);

    const initialNodes = [
        { id: 'user', type: 'custom', position: { x: 0, y: 100 }, data: { label: 'User Browser', active: false } },
        { id: 'nextjs', type: 'custom', position: { x: 250, y: 100 }, data: { label: 'NextJS API Route', active: false } },
        { id: 'anthropic', type: 'custom', position: { x: 500, y: 0 }, data: { label: 'Anthropic API', active: false } },
        { id: 'external', type: 'custom', position: { x: 500, y: 200 }, data: { label: 'External API', active: false } },
    ];

    const initialEdges = [
        { id: 'user-nextjs', source: 'user', target: 'nextjs', type: 'custom', animated: false, data: { active: false, label: '' } },
        { id: 'nextjs-anthropic', source: 'nextjs', target: 'anthropic', type: 'custom', animated: false, data: { active: false, label: '' } },
        { id: 'nextjs-external', source: 'nextjs', target: 'external', type: 'custom', animated: false, data: { active: false, label: '' } },
    ];

    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const steps = [
        { name: "User sends message", active: ["user"], animated: ["user-nextjs"] },
        { name: "NextJS receives POST request", active: ["user", "nextjs"], animated: ["user-nextjs"] },
        { name: "NextJS sends request to Anthropic", active: ["nextjs", "anthropic"], animated: ["nextjs-anthropic"] },
        { name: "Anthropic generates response", active: ["anthropic"], animated: ["nextjs-anthropic"] },
        { name: "NextJS streams content to frontend", active: ["nextjs", "user"], animated: ["user-nextjs"] },
        { name: "NextJS checks stop reason", active: ["nextjs"], animated: [] },
        { name: "NextJS extracts tool and input", active: ["nextjs"], animated: [] },
        { name: "NextJS gets tool output", active: ["nextjs"], animated: [] },
        { name: "NextJS makes external API request", active: ["nextjs", "external"], animated: ["nextjs-external"] },
        { name: "External API processes request", active: ["external"], animated: ["nextjs-external"] },
        { name: "External API returns data", active: ["external", "nextjs"], animated: ["nextjs-external"] },
        { name: "NextJS updates message list", active: ["nextjs"], animated: [] },
        { name: "NextJS sends updated messages to Anthropic", active: ["nextjs", "anthropic"], animated: ["nextjs-anthropic"] },
    ];

    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    active: steps[currentStep].active.includes(node.id),
                },
            }))
        );

        setEdges((eds) =>
            eds.map((edge) => ({
                ...edge,
                animated: steps[currentStep].animated.includes(edge.id),
                data: {
                    ...edge.data,
                    active: steps[currentStep].animated.includes(edge.id),
                    label: steps[currentStep].animated.includes(edge.id) ? steps[currentStep].name : '',
                },
            }))
        );
    }, [currentStep]);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        []
    );

    return (
        <div className="h-[600px]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
            <div className="mt-4">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                    >
                        Previous
                    </button>
                    <div className="text-center">
                        <p className="font-bold">Step {currentStep + 1} of {steps.length}</p>
                    </div>
                    <button
                        onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                        disabled={currentStep === steps.length - 1}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnimatedFlowChart;
