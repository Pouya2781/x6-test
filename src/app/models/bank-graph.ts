import {Graph, Model, Node} from '@antv/x6';

export interface CustomNodeMetadata extends Node.Metadata {
    id: string;
}
export class BankGraph extends Graph {
    public nodeMap: Map<string, Node> = new Map<string, Node>();

    public addCustomNode(metadata: CustomNodeMetadata, options?: Model.AddOptions): Node {
        const newNode = super.addNode(metadata, options);
        this.nodeMap.set(metadata.id, newNode);
        return newNode;
    }

    public getNode(id: string) {
        return this.nodeMap.get(id);
    }
}
