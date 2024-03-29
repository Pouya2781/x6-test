import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, TemplateRef, ViewChild} from '@angular/core';
import {CustomNodeService} from '../services/custom-node.service';

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
export class CustomNodeComponent implements AfterViewInit {
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

    public nodeState: NodeState = NodeState.TINY;
    public popoverVisibility: boolean = false;

    constructor(
        private customNodeService: CustomNodeService,
        private changeDetector: ChangeDetectorRef
    ) {}

    ngAfterViewInit() {
        const bounding = this.templateRef.nativeElement.getBoundingClientRect();
        this.customNodeService.notify(this.nodeId, bounding.width, bounding.height);
    }

    showDetail() {
        if (this.nodeState == NodeState.EXPANDED) this.nodeState = NodeState.NORMAL;
        else this.nodeState = NodeState.EXPANDED;
        this.changeDetector.detectChanges();
        const bounding = this.templateRef.nativeElement.getBoundingClientRect();
        this.customNodeService.notify(this.nodeId, bounding.width, bounding.height);
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
}
