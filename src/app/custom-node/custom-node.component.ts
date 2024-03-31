import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, TemplateRef, ViewChild} from '@angular/core';
import {CustomNodeService} from '../services/custom-node.service';
import {NzContextMenuService, NzDropdownMenuComponent} from 'ng-zorro-antd/dropdown';
import {CustomGraphService, DynamicNodeView, InterconnectedNode} from '../services/custom-graph.service';

export enum AccountType {
    DEPOSIT = 'سپرده',
    CURRENT = 'جاری',
    SAVINGS = 'پس انداز',
}

export enum NodeState {
    NORMAL,
    EXPANDED,
    TINY,
}
@Component({
    selector: 'app-custom-node',
    templateUrl: './custom-node.component.html',
    styleUrls: ['./custom-node.component.scss'],
})
export class CustomNodeComponent implements AfterViewInit, DynamicNodeView, InterconnectedNode {
    @ViewChild('dynamicNodeView') dynamicNodeView!: ElementRef;
    @Input() public nodeId!: string;

    @Input() public transactionCount!: number;
    @Input() public ownerName!: string;
    @Input() public ownerFamilyName!: string;
    @Input() public branchName!: string;
    @Input() public branchAddress!: string;
    @Input() public branchTelephone!: string;
    @Input() public accountType!: AccountType;
    @Input() public sheba!: string;
    @Input() public cardID!: string;
    @Input() public accountID!: string;
    protected readonly AccountType = AccountType;
    protected readonly NodeState = NodeState;

    @ViewChild('templateRef') templateRef!: ElementRef<HTMLDivElement>;

    public nodeState: NodeState = NodeState.NORMAL;
    public popoverVisibility: boolean = false;

    constructor(
        private customNodeService: CustomNodeService,
        private changeDetector: ChangeDetectorRef,
        private nzContextMenuService: NzContextMenuService,
        private customGraphService: CustomGraphService
    ) {}

    ngAfterViewInit() {
        this.customGraphService.interConnectNode(this);
        this.customGraphService.setUpDynamicResize(this);
        // const bounding = this.templateRef.nativeElement.getBoundingClientRect();
        // this.customNodeService.notify(this.nodeId, bounding.width, bounding.height);
        //
        // const resizeObserver = new ResizeObserver((entries) => {
        //     console.log(this.templateRef.nativeElement.getBoundingClientRect());
        //     const bounding = this.templateRef.nativeElement.getBoundingClientRect();
        //     this.customNodeService.notify(this.nodeId, bounding.width, bounding.height);
        // });
        //
        // resizeObserver.observe(this.templateRef.nativeElement);
    }

    showDetail() {
        if (this.nodeState == NodeState.EXPANDED) this.nodeState = NodeState.NORMAL;
        else this.nodeState = NodeState.EXPANDED;
        this.changeDetector.detectChanges();
        // setTimeout(()=>{
        // const bounding = this.templateRef.nativeElement.getBoundingClientRect();
        // this.customNodeService.notify(this.nodeId, bounding.width, bounding.height);
        // },500)
    }

    getBorderColor() {
        if (this.accountType == AccountType.CURRENT) return 'red';
        if (this.accountType == AccountType.DEPOSIT) return 'green';
        return 'blue';
    }

    showPopover() {
        // this.popoverVisibility = false;
        // this.changeDetector.detectChanges();
        this.popoverVisibility = true;
        this.changeDetector.detectChanges();
    }

    hidePopover(event: MouseEvent) {
        if (event.button == 0) {
            this.popoverVisibility = false;
            this.changeDetector.detectChanges();
        }
    }

    popoverVisibilityChanged(visible: boolean) {
        if (visible && !this.popoverVisibility) {
            this.popoverVisibility = true;
            this.changeDetector.detectChanges();
            this.popoverVisibility = false;
            this.changeDetector.detectChanges();
        }
        if (!visible) {
            this.popoverVisibility = false;
        }
    }

    contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
        this.nzContextMenuService.create($event, menu);
    }

    closeMenu(): void {
        this.nzContextMenuService.close();
    }
}
