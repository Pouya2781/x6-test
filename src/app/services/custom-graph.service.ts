import {ComponentRef, ElementRef, Injectable, Injector, OnInit, Renderer2, Type} from '@angular/core';
import {Edge, Model, Graph, Markup, Node, Timing} from '@antv/x6';
import {ComponentType} from '@angular/cdk/portal';
import {ComponentCreatorService} from './component-creator.service';
import {register} from '@antv/x6-angular-shape';
import {Content} from '@antv/x6-angular-shape/src/registry';
import {transition} from '@angular/animations';
import {AccountType} from '../custom-node/custom-node.component';
import {CustomEdgeLabelComponent} from '../custom-edge-label/custom-edge-label.component';

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
        padding: number,
        animated: boolean = false,
        randomOffset: number = 0
    ) {
        const gridWidth = this.graph.container.clientWidth;
        const gridHeight = this.graph.container.clientHeight;
        const gridCellWidth = nodeWidth + 2 * padding;
        const gridCellHeight = nodeHeight + 2 * padding;
        const gridRowCount = Math.floor(gridWidth / gridCellWidth);
        const gridColCount = Math.floor(gridHeight / gridCellHeight);
        const nodes = this.graph.getNodes();

        for (let i = 0; i < nodes.length; i++) {
            const row = Math.floor(i / gridRowCount);
            const col = i % gridRowCount;
            const x =
                col * gridCellWidth +
                padding +
                Math.floor(Math.random() * (Math.min(randomOffset, padding) * 2 + 1)) -
                Math.min(randomOffset, padding);
            const y =
                row * gridCellHeight +
                padding +
                Math.floor(Math.random() * (Math.min(randomOffset, padding) * 2 + 1)) -
                Math.min(randomOffset, padding);
            if (animated) this.animateMove(nodes[i], x, y);
            else nodes[i].setPosition(x, y);
        }
    }

    public getNode(id: string) {
        return this.nodeMap.get(id);
    }
}
