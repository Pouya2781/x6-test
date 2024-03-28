import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {NodeState} from '../custom-node/custom-node.component';

@Injectable({
    providedIn: 'root',
})
export class CustomNodeService {
    public nodeListener: Subject<{nodeId: string; width: number; height: number}> = new Subject<{
        nodeId: string;
        width: number;
        height: number;
    }>();

    public notify(nodeId: string, width: number, height: number) {
        this.nodeListener.next({nodeId, width, height});
    }
}
