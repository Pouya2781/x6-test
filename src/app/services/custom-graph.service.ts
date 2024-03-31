import {ComponentRef, Injectable, Renderer2} from '@angular/core';
import {Edge, Graph, Markup, Model, Node} from '@antv/x6';
import {ComponentType} from '@angular/cdk/portal';
import {ComponentCreatorService} from './component-creator.service';

export interface CustomEdgeMetadata extends Edge.Metadata {
    labelShape: string;
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

@Injectable({
    providedIn: 'root',
})
export class CustomGraphService {
    private renderer!: Renderer2;

    private graph!: Graph;
    private nodeMap: Map<string, Node> = new Map<string, Node>();
    private edgeLabelMap: Map<string, ComponentType<any>> = new Map<string, ComponentType<any>>();
    private edgeMap: Map<string, CustomEdge> = new Map<string, CustomEdge>();

    constructor(private componentCreatorService: ComponentCreatorService) {}

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

    public registerCustomLabel<T>(labelName: string, component: ComponentType<T>): void {
        this.edgeLabelMap.set(labelName, component);
    }

    public addCustomNode(metadata: Node.Metadata, options?: Model.AddOptions): Node {
        const newNode = this.graph.addNode(metadata, options);
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

    public getEdge(id: string) {
        return this.edgeMap.get(id);
    }

    public getNode(id: string) {
        return this.nodeMap.get(id);
    }
}
