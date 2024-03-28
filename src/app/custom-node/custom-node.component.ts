import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {NgxPopperjsPlacements, NgxPopperjsTriggers} from 'ngx-popperjs';
import {Element} from '@angular/compiler';

export enum AccountType {
    DEPOSIT = 'red',
    CURRENT = 'green',
    SAVINGS = 'blue',
}
@Component({
    selector: 'app-custom-node',
    templateUrl: './custom-node.component.html',
    styleUrls: ['./custom-node.component.scss'],
})
export class CustomNodeComponent {
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
    protected readonly NgxPopperjsPlacements = NgxPopperjsPlacements;
    protected readonly NgxPopperjsTriggers = NgxPopperjsTriggers;
    protected readonly AccountType = AccountType;
}
