import {ComponentRef, ElementRef, Injectable, Injector, Renderer2} from '@angular/core';
import {Edge, Graph, Markup, Model, Node, Timing} from '@antv/x6';
import {ComponentType} from '@angular/cdk/portal';
import {ComponentCreatorService} from './component-creator.service';
import {register} from '@antv/x6-angular-shape';
import {Content} from '@antv/x6-angular-shape/src/registry';
import {Layout} from '../models/layout';

export interface CustomEdgeMetadata extends Edge.Metadata {
    labelShape: string;
    source: Node;
    target: Node;
    ngArguments?: {[key: string]: any};
}

export class CustomEdge extends Edge<Edge.Properties> {
    componentRef!: ComponentRef<any>;
    initialization!: Promise<any>;
    initializationResolver!: (value: any | PromiseLike<any>) => void;
    ngArguments!: {[key: string]: any};
    labelShape!: string;
    initLabelData!: () => void;
    setLabelData!: (ngArguments: {[key: string]: any}) => void;
}

export interface DynamicNodeView {
    dynamicNodeView: ElementRef;
}

export interface InterconnectedNode {
    nodeId: string;
}

type DynamicNodeViewComponent = DynamicNodeViewComponentRef & Content;
type DynamicNodeViewComponentRef = InterconnectedNode & DynamicNodeView;

@Injectable({
    providedIn: 'root',
})
export class CustomGraphService {
    private renderer!: Renderer2;

    private graph!: Graph;
    private nodeMap: Map<string, Node> = new Map<string, Node>();
    private nodeComponentMap: Map<string, InterconnectedNode> = new Map<string, InterconnectedNode>();
    private nodeDynamicViewMap: Map<Element, string> = new Map<Element, string>();
    private edgeLabelMap: Map<string, ComponentType<any>> = new Map<string, ComponentType<any>>();
    private edgeMap: Map<string, CustomEdge> = new Map<string, CustomEdge>();
    private resizeObserver: ResizeObserver;

    constructor(
        private componentCreatorService: ComponentCreatorService,
        private injector: Injector
    ) {
        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const nodeId = this.nodeDynamicViewMap.get(entry.target);
                if (!!nodeId) {
                    const node = this.nodeMap.get(nodeId);

                    if (!!node) node.resize(entry.target.clientWidth, entry.target.clientHeight);
                }
            }
        });
    }

    public init(graph: Graph, renderer: Renderer2) {
        this.graph = graph;
        this.renderer = renderer;
        this.graph.options.onEdgeLabelRendered = (args) => {
            const element = args.selectors['foContent'] as HTMLDivElement;
            const foreignObject = args.selectors['fo'] as HTMLDivElement;

            this.renderer.setStyle(foreignObject, 'overflow', 'visible');
            this.renderer.setStyle(element, 'display', 'flex');
            this.renderer.setStyle(element, 'flex-direction', 'row');
            this.renderer.setStyle(element, 'justify-content', 'center');
            this.renderer.setStyle(element, 'align-items', 'center');

            const edge = this.edgeMap.get(args.edge.id);
            if (!!edge) {
                const edgeLabelShape = this.edgeLabelMap.get(edge.labelShape);

                if (!!edgeLabelShape) {
                    const componentRef = this.componentCreatorService.createComponent(element, edgeLabelShape);
                    edge.componentRef = componentRef;
                    edge.initLabelData();
                }
            }

            return () => {};
        };
    }

    public interConnectNode(component: InterconnectedNode) {
        this.nodeComponentMap.set(component.nodeId, component);
    }

    public setUpDynamicResize(component: DynamicNodeViewComponentRef) {
        this.nodeDynamicViewMap.set(component.dynamicNodeView.nativeElement, component.nodeId);
        this.resizeObserver.observe(component.dynamicNodeView.nativeElement);
    }

    public registerCustomLabel<T>(labelName: string, component: ComponentType<T>): void {
        this.edgeLabelMap.set(labelName, component);
    }

    public registerCustomNode<T>(shapeName: string, component: DynamicNodeViewComponent): void {
        register({
            shape: shapeName,
            content: component,
            injector: this.injector,
        });
    }

    public addCustomNode(metadata: Node.Metadata, options?: Model.AddOptions): Node {
        const uuid = crypto.randomUUID();
        metadata.data.ngArguments.nodeId = uuid;
        metadata.id = uuid;
        const newNode = this.graph.addNode(metadata);
        this.nodeMap.set(newNode.id, newNode);
        return newNode;
    }

    public addCustomEdge(metadata: CustomEdgeMetadata, options?: Model.AddOptions): CustomEdge {
        const newEdge = this.graph.createEdge({
            ...metadata,
            defaultLabel: {
                markup: Markup.getForeignObjectMarkup(),
                attrs: {
                    fo: {
                        width: 1,
                        height: 1,
                        x: 0,
                        y: 0,
                    },
                },
            },
        });
        const newCustomEdge = this.convertEdge(newEdge, metadata);
        this.edgeMap.set(newEdge.id, newCustomEdge);
        this.graph.addEdge(newEdge, options);
        return newCustomEdge;
    }

    private convertEdge(Edge: Edge, metadata: CustomEdgeMetadata): CustomEdge {
        const customEdge = Edge as CustomEdge;
        customEdge.ngArguments = metadata.ngArguments || {};
        customEdge.labelShape = metadata.labelShape;
        customEdge.initialization = new Promise((resolve, reject) => {
            customEdge.initializationResolver = resolve;
        });
        customEdge.setLabelData = async function (ngArguments: {[key: string]: any}) {
            await this.initialization;
            for (const value of Object.entries(ngArguments)) {
                this.componentRef.instance[value[0]] = value[1];
            }
        };
        customEdge.initLabelData = function () {
            for (const value of Object.entries(this.ngArguments)) {
                this.componentRef.instance[value[0]] = value[1];
            }
            this.initializationResolver(null);
        };
        return customEdge;
    }

    public animateMove(node: Node, x: number, y: number) {
        node.translate(x - node.position().x, y - node.position().y, {
            transition: {
                duration: 1000,
                timing: Timing.easeOutCubic,
            },
        });
    }

    public getEdge(id: string) {
        return this.edgeMap.get(id);
    }

    public layout(
        nodeWidth: number,
        nodeHeight: number,
        cellPadding: number,
        targetNodes: Node<Node.Properties>[] = this.graph.getNodes(),
        animated: boolean = false,
        randomOffset: number = 0
    ) {
        const customLayout: Layout = new Layout(this.graph, this, nodeWidth, nodeHeight, cellPadding, randomOffset);
        customLayout.apply(targetNodes, animated);

        // randomOffset = Math.min(randomOffset, padding);
        //
        // const gridWidth = this.graph.container.clientWidth;
        // const gridHeight = this.graph.container.clientHeight;
        // const gridCellWidth = nodeWidth + 2 * padding;
        // const gridCellHeight = nodeHeight + 2 * padding;
        // const gridColCount = Math.floor(gridWidth / gridCellWidth);
        // const gridRowCount = Math.floor(gridHeight / gridCellHeight);
        // const gridCellCount = gridColCount * gridRowCount;
        //
        // const nodeGridCellOccupation: Array<[Node<Node.Properties>, number]> = [];
        // const gridCells: Array<Array<Array<Node<Node.Properties>>>> = Array(gridRowCount);
        // for (let i = 0; i < gridRowCount; i++) {
        //     gridCells[i] = Array(gridColCount);
        //
        //     for (let j = 0; j < gridColCount; j++) {
        //         gridCells[i][j] = [];
        //     }
        // }
        //
        // const allNodes = this.graph.getNodes();
        // const staticNodes = allNodes.filter((node) => !targetNodes.includes(node));
        //
        // let occupiedCellCount = 0;
        // for (let node of staticNodes) {
        //     const topLeft = {
        //         x: node.getPosition().x,
        //         y: node.getPosition().y,
        //     };
        //     const topRight = {
        //         x: node.getPosition().x + node.size().width,
        //         y: node.getPosition().y,
        //     };
        //     const bottomLeft = {
        //         x: node.getPosition().x,
        //         y: node.getPosition().y + node.size().height,
        //     };
        //     const bottomRight = {
        //         x: node.getPosition().x + node.size().width,
        //         y: node.getPosition().y + node.size().height,
        //     };
        //
        //     const cellTopLeft = {
        //         col: clamp(Math.floor(topLeft.x / gridCellWidth), 0, gridColCount - 1),
        //         row: clamp(Math.floor(topLeft.y / gridCellHeight), 0, gridRowCount - 1),
        //     };
        //     const cellTopRight = {
        //         col: clamp(Math.floor(topRight.x / gridCellWidth), 0, gridColCount - 1),
        //         row: clamp(Math.floor(topRight.y / gridCellHeight), 0, gridRowCount - 1),
        //     };
        //     const cellBottomLeft = {
        //         col: clamp(Math.floor(bottomLeft.x / gridCellWidth), 0, gridColCount - 1),
        //         row: clamp(Math.floor(bottomLeft.y / gridCellHeight), 0, gridRowCount - 1),
        //     };
        //     const cellBottomRight = {
        //         col: clamp(Math.floor(bottomRight.x / gridCellWidth), 0, gridColCount - 1),
        //         row: clamp(Math.floor(bottomRight.y / gridCellHeight), 0, gridRowCount - 1),
        //     };
        //
        //     const uniqueCells: {row: number; col: number}[] = [];
        //     [cellTopLeft, cellTopRight, cellBottomLeft, cellBottomRight].forEach((cell) => {
        //         if (!uniqueCells.find((c) => cell.col == c.col && cell.row == c.row)) {
        //             uniqueCells.push(cell);
        //         }
        //     });
        //
        //     nodeGridCellOccupation.push([node, uniqueCells.length]);
        //     uniqueCells.forEach((uc) => {
        //         if (gridCells[uc.row][uc.col].length == 0) occupiedCellCount++;
        //     });
        //
        //     gridCells[cellTopLeft.row][cellTopLeft.col].push(node);
        //     gridCells[cellTopRight.row][cellTopRight.col].push(node);
        //     gridCells[cellBottomLeft.row][cellBottomLeft.col].push(node);
        //     gridCells[cellBottomRight.row][cellBottomRight.col].push(node);
        // }
        //
        // console.log(occupiedCellCount);
        //
        // nodeGridCellOccupation.sort((n) => n[1]);
        // while (gridCellCount - occupiedCellCount < targetNodes.length) {
        //     const nodeCell = nodeGridCellOccupation.shift();
        //     if (!nodeCell) break;
        //
        //     const node = nodeCell[0];
        //     const topLeft = {
        //         x: node.getPosition().x,
        //         y: node.getPosition().y,
        //     };
        //     const topRight = {
        //         x: node.getPosition().x + node.size().width,
        //         y: node.getPosition().y,
        //     };
        //     const bottomLeft = {
        //         x: node.getPosition().x,
        //         y: node.getPosition().y + node.size().height,
        //     };
        //     const bottomRight = {
        //         x: node.getPosition().x + node.size().width,
        //         y: node.getPosition().y + node.size().height,
        //     };
        //
        //     const cellTopLeft = {
        //         col: clamp(Math.floor(topLeft.x / gridCellWidth), 0, gridColCount - 1),
        //         row: clamp(Math.floor(topLeft.y / gridCellHeight), 0, gridRowCount - 1),
        //     };
        //     const cellTopRight = {
        //         col: clamp(Math.floor(topRight.x / gridCellWidth), 0, gridColCount - 1),
        //         row: clamp(Math.floor(topRight.y / gridCellHeight), 0, gridRowCount - 1),
        //     };
        //     const cellBottomLeft = {
        //         col: clamp(Math.floor(bottomLeft.x / gridCellWidth), 0, gridColCount - 1),
        //         row: clamp(Math.floor(bottomLeft.y / gridCellHeight), 0, gridRowCount - 1),
        //     };
        //     const cellBottomRight = {
        //         col: clamp(Math.floor(bottomRight.x / gridCellWidth), 0, gridColCount - 1),
        //         row: clamp(Math.floor(bottomRight.y / gridCellHeight), 0, gridRowCount - 1),
        //     };
        //
        //     const cellTopLeftPos = {
        //         x: cellTopLeft.col * gridCellWidth + padding,
        //         y: cellTopLeft.row * gridCellHeight + padding,
        //     };
        //     const cellTopRightPos = {
        //         x: cellTopRight.col * gridCellWidth + padding,
        //         y: cellTopRight.row * gridCellHeight + padding,
        //     };
        //     const cellBottomLeftPos = {
        //         x: cellBottomLeft.col * gridCellWidth + padding,
        //         y: cellBottomLeft.row * gridCellHeight + padding,
        //     };
        //     const cellBottomRightPos = {
        //         x: cellBottomRight.col * gridCellWidth + padding,
        //         y: cellBottomRight.row * gridCellHeight + padding,
        //     };
        //
        //     const dist2TopLeft = dist2(topLeft.x, topLeft.y, cellTopLeftPos.x, cellTopLeftPos.y);
        //     const dist2TopRight = dist2(topLeft.x, topLeft.y, cellTopRightPos.x, cellTopRightPos.y);
        //     const dist2BottomLeft = dist2(topLeft.x, topLeft.y, cellBottomLeftPos.x, cellBottomLeftPos.y);
        //     const dist2BottomRight = dist2(topLeft.x, topLeft.y, cellBottomRightPos.x, cellBottomRightPos.y);
        //
        //     const minDist2 = Math.min(dist2TopLeft, dist2TopRight, dist2BottomLeft, dist2BottomRight);
        //
        //     if (minDist2 == dist2TopLeft) {
        //         const pos = applyRandomOffset(cellTopLeftPos, randomOffset);
        //         if (animated) this.animateMove(node, pos.x, pos.y);
        //         else node.setPosition(pos.x, pos.y);
        //         gridCells[cellTopRight.row][cellTopRight.col].splice(
        //             gridCells[cellTopRight.row][cellTopRight.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellTopRight.row][cellTopRight.col].length == 0) occupiedCellCount--;
        //         gridCells[cellBottomLeft.row][cellBottomLeft.col].splice(
        //             gridCells[cellBottomLeft.row][cellBottomLeft.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellBottomLeft.row][cellBottomLeft.col].length == 0) occupiedCellCount--;
        //         gridCells[cellBottomRight.row][cellBottomRight.col].splice(
        //             gridCells[cellBottomRight.row][cellBottomRight.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellBottomRight.row][cellBottomRight.col].length == 0) occupiedCellCount--;
        //     } else if (minDist2 == dist2TopRight) {
        //         const pos = applyRandomOffset(cellTopRightPos, randomOffset);
        //         if (animated) this.animateMove(node, pos.x, pos.y);
        //         else node.setPosition(pos.x, pos.y);
        //         gridCells[cellTopLeft.row][cellTopLeft.col].splice(
        //             gridCells[cellTopLeft.row][cellTopLeft.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellTopLeft.row][cellTopLeft.col].length == 0) occupiedCellCount--;
        //         gridCells[cellBottomLeft.row][cellBottomLeft.col].splice(
        //             gridCells[cellBottomLeft.row][cellBottomLeft.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellBottomLeft.row][cellBottomLeft.col].length == 0) occupiedCellCount--;
        //         gridCells[cellBottomRight.row][cellBottomRight.col].splice(
        //             gridCells[cellBottomRight.row][cellBottomRight.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellBottomRight.row][cellBottomRight.col].length == 0) occupiedCellCount--;
        //     } else if (minDist2 == dist2BottomLeft) {
        //         const pos = applyRandomOffset(cellBottomLeftPos, randomOffset);
        //         if (animated) this.animateMove(node, pos.x, pos.y);
        //         else node.setPosition(pos.x, pos.y);
        //         gridCells[cellTopLeft.row][cellTopLeft.col].splice(
        //             gridCells[cellTopLeft.row][cellTopLeft.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellTopLeft.row][cellTopLeft.col].length == 0) occupiedCellCount--;
        //         gridCells[cellTopRight.row][cellTopRight.col].splice(
        //             gridCells[cellTopRight.row][cellTopRight.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellTopRight.row][cellTopRight.col].length == 0) occupiedCellCount--;
        //         gridCells[cellBottomRight.row][cellBottomRight.col].splice(
        //             gridCells[cellBottomRight.row][cellBottomRight.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellBottomRight.row][cellBottomRight.col].length == 0) occupiedCellCount--;
        //     } else {
        //         const pos = applyRandomOffset(cellBottomRightPos, randomOffset);
        //         if (animated) this.animateMove(node, pos.x, pos.y);
        //         else node.setPosition(pos.x, pos.y);
        //         gridCells[cellTopLeft.row][cellTopLeft.col].splice(
        //             gridCells[cellTopLeft.row][cellTopLeft.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellTopLeft.row][cellTopLeft.col].length == 0) occupiedCellCount--;
        //         gridCells[cellTopRight.row][cellTopRight.col].splice(
        //             gridCells[cellTopRight.row][cellTopRight.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellTopRight.row][cellTopRight.col].length == 0) occupiedCellCount--;
        //         gridCells[cellBottomLeft.row][cellBottomLeft.col].splice(
        //             gridCells[cellBottomLeft.row][cellBottomLeft.col].indexOf(node),
        //             1
        //         );
        //         if (gridCells[cellBottomLeft.row][cellBottomLeft.col].length == 0) occupiedCellCount--;
        //     }
        // }
        //
        // let targetNodeIndex = 0;
        // let nodeExist = true;
        // for (let row = 0; row < gridRowCount; row++) {
        //     for (let col = 0; col < gridColCount; col++) {
        //         if (gridCells[row][col].length == 0) {
        //             const x =
        //                 col * gridCellWidth +
        //                 padding +
        //                 Math.floor(Math.random() * (randomOffset * 2 + 1)) -
        //                 randomOffset;
        //             const y =
        //                 row * gridCellHeight +
        //                 padding +
        //                 Math.floor(Math.random() * (randomOffset * 2 + 1)) -
        //                 randomOffset;
        //             if (animated) this.animateMove(targetNodes[targetNodeIndex++], x, y);
        //             else targetNodes[targetNodeIndex++].setPosition(x, y);
        //             if (targetNodeIndex == targetNodes.length) {
        //                 nodeExist = false;
        //                 break;
        //             }
        //         }
        //     }
        //     if (!nodeExist) break;
        // }
        //
        // function dist2(x1: number, y1: number, x2: number, y2: number) {
        //     return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
        // }
        //
        // function clamp(n: number, minValue: number, maxValue: number) {
        //     return Math.max(minValue, Math.min(maxValue, n));
        // }
        //
        // function applyRandomOffset(pos: {x: number; y: number}, randomOffset: number) {
        //     const x = pos.x + Math.floor(Math.random() * (randomOffset * 2 + 1)) - randomOffset;
        //     const y = pos.y + Math.floor(Math.random() * (randomOffset * 2 + 1)) - randomOffset;
        //     return {x, y};
        // }
    }

    public getNode(id: string) {
        return this.nodeMap.get(id);
    }
}
